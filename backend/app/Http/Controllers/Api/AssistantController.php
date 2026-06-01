<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Farm;
use App\Services\AI\AssistantActionService;
use App\Services\AI\AssistantContextService;
use App\Services\AI\FarmingAssistantService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AssistantController extends Controller
{
    private function currentFarm(Request $request): Farm
    {
        $farm = $request->user()?->farms()->latest()->first();

        if (! $farm) {
            abort(422, 'No farm found. Complete your farm profile first.');
        }

        return $farm;
    }

    public function index(Request $request)
    {
        $farm = $this->currentFarm($request);
        $search = trim((string) $request->query('q', ''));

        $conversations = ChatConversation::where('farm_id', $farm->id)
            ->when($search !== '', function ($query) use ($search): void {
                $query->where(function ($nested) use ($search): void {
                    $nested->where('title', 'like', "%{$search}%")
                        ->orWhereHas('messages', fn ($messageQuery) => $messageQuery
                            ->where('content', 'like', "%{$search}%"));
                });
            })
            ->latest('updated_at')
            ->take(25)
            ->get()
            ->map(fn (ChatConversation $conversation) => [
                'id' => $conversation->id,
                'farm_id' => $conversation->farm_id,
                'title' => $conversation->title,
                'created_at' => $conversation->created_at,
                'updated_at' => $conversation->updated_at,
            ]);

        return response()->json($conversations);
    }

    public function store(Request $request)
    {
        $farm = $this->currentFarm($request);
        $data = $request->validate([
            'title' => ['nullable', 'string', 'max:255'],
        ]);

        $conversation = ChatConversation::create([
            'farm_id' => $farm->id,
            'title' => $data['title'] ?? 'New farm chat',
        ]);
        $conversation->setRelation('messages', collect());

        return response()->json($this->formatConversation($conversation), 201);
    }

    public function show(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $conversation = ChatConversation::with(['messages' => fn ($query) => $query->oldest()])
            ->where('farm_id', $farm->id)
            ->findOrFail($id);

        return response()->json($this->formatConversation($conversation));
    }

    public function chat(
        Request $request,
        AssistantContextService $contextService,
        AssistantActionService $actionService,
        FarmingAssistantService $assistant
    ) {
        $farm = $this->currentFarm($request);
        $data = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
            'conversation_id' => ['nullable', 'integer'],
        ]);

        $conversation = $this->resolveConversation(
            $farm,
            isset($data['conversation_id']) ? (int) $data['conversation_id'] : null,
            $data['message']
        );
        $history = $this->recentHistory($conversation);
        $context = $contextService->build($farm);
        $actions = $actionService->build($context);

        $conversation->messages()->create([
            'role' => 'user',
            'content' => $data['message'],
        ]);

        // Assistant context is derived from the authenticated farm, never from a request farm_id.
        $response = $assistant->reply($data['message'], $context, $history);

        $assistantMessage = $conversation->messages()->create([
            'role' => 'assistant',
            'content' => $response['reply'],
            'context_payload' => [
                'provider' => $response['provider'] ?? null,
                'model' => $response['model'] ?? null,
                'fallback_reason' => $response['fallback_reason'] ?? null,
                'context_used' => $response['context_used'] ?? [],
                'actions' => $actions,
            ],
        ]);

        $conversation->touch();

        return response()->json([
            'reply' => $response['reply'],
            'conversation_id' => $conversation->id,
            'context_used' => $response['context_used'] ?? [],
            'provider' => $response['provider'] ?? null,
            'model' => $response['model'] ?? null,
            'actions' => $actions,
            'message' => $this->formatMessage($assistantMessage),
        ]);
    }

    public function update(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $conversation = ChatConversation::where('farm_id', $farm->id)->findOrFail($id);
        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
        ]);

        $conversation->update([
            'title' => $data['title'],
        ]);

        return response()->json($conversation->fresh());
    }

    public function destroy(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $conversation = ChatConversation::where('farm_id', $farm->id)->findOrFail($id);
        $conversation->delete();

        return response()->json(null, 204);
    }

    public function createTask(
        Request $request,
        AssistantContextService $contextService,
        AssistantActionService $actionService
    ) {
        $farm = $this->currentFarm($request);
        $data = $request->validate([
            'action_key' => ['required', 'string', 'max:255'],
            'conversation_id' => ['nullable', 'integer'],
        ]);
        $conversation = isset($data['conversation_id'])
            ? ChatConversation::where('farm_id', $farm->id)->find($data['conversation_id'])
            : null;
        $context = $contextService->build($farm);
        $result = $actionService->createTaskFromAction($farm, $context, $data['action_key']);

        if ($conversation) {
            $conversation->messages()->create([
                'role' => 'assistant',
                'content' => $result['message'].' '.$result['task']->title,
                'context_payload' => [
                    'assistant_action' => $result['action'],
                    'task_id' => $result['task']->id,
                    'created' => $result['created'],
                ],
            ]);
            $conversation->touch();
        }

        return response()->json($result);
    }

    private function resolveConversation(Farm $farm, ?int $conversationId, string $message): ChatConversation
    {
        if ($conversationId) {
            return ChatConversation::where('farm_id', $farm->id)->findOrFail($conversationId);
        }

        return ChatConversation::create([
            'farm_id' => $farm->id,
            'title' => Str::limit($message, 64),
        ]);
    }

    /**
     * @return array<int, array{role: string, content: string}>
     */
    private function recentHistory(ChatConversation $conversation): array
    {
        return $conversation->messages()
            ->latest()
            ->take(8)
            ->get()
            ->reverse()
            ->map(fn (ChatMessage $message) => [
                'role' => $message->role,
                'content' => $message->content,
            ])
            ->values()
            ->all();
    }

    private function formatConversation(ChatConversation $conversation): array
    {
        return [
            'id' => $conversation->id,
            'farm_id' => $conversation->farm_id,
            'title' => $conversation->title,
            'created_at' => $conversation->created_at,
            'updated_at' => $conversation->updated_at,
            'messages' => $conversation->messages
                ->map(fn (ChatMessage $message) => $this->formatMessage($message))
                ->values(),
        ];
    }

    private function formatMessage(ChatMessage $message): array
    {
        return [
            'id' => $message->id,
            'role' => $message->role,
            'content' => $message->content,
            'context_payload' => $message->context_payload,
            'created_at' => $message->created_at,
            'updated_at' => $message->updated_at,
        ];
    }
}
