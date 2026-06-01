<?php

namespace Tests\Feature;

use App\Models\ChatConversation;
use App\Models\ChatMessage;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Plot;
use App\Models\Task;
use App\Models\User;
use App\Models\WeatherForecast;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AssistantModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_assistant_chat_uses_groq_context_and_saves_messages(): void
    {
        config([
            'services.groq.api_key' => 'test-groq-key',
            'services.groq.model' => 'meta-llama/llama-4-scout-17b-16e-instruct',
        ]);

        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => 'Main Farm',
            'location' => 'General Luna',
            'latitude' => 15,
            'longitude' => 120,
        ]);
        $plot = Plot::create(['farm_id' => $farm->id, 'name' => 'North Plot']);
        $crop = Crop::create([
            'plot_id' => $plot->id,
            'name' => 'Rice',
            'status' => 'growing',
            'growth_stage' => 'maturing',
            'expected_harvest_on' => now()->addDays(7)->toDateString(),
        ]);
        Task::create([
            'farm_id' => $farm->id,
            'plot_id' => $plot->id,
            'crop_id' => $crop->id,
            'title' => 'Check irrigation',
            'task_type' => 'irrigation_check',
            'priority' => 'high',
            'status' => 'pending',
            'source' => 'manual',
            'due_on' => now()->toDateString(),
        ]);
        WeatherForecast::create([
            'farm_id' => $farm->id,
            'forecast_date' => now()->addDay()->toDateString(),
            'summary' => 'Rain',
            'rain_mm' => 8,
            'rain_probability' => 80,
        ]);

        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [
                    [
                        'message' => [
                            'role' => 'assistant',
                            'content' => 'Prioritize irrigation checks for Rice today and delay watering if rain arrives tomorrow.',
                        ],
                    ],
                ],
            ]),
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/assistant/chat', [
                'message' => 'What should I do today?',
            ])
            ->assertOk()
            ->assertJsonPath('reply', 'Prioritize irrigation checks for Rice today and delay watering if rain arrives tomorrow.')
            ->assertJsonPath('provider', 'groq')
            ->assertJsonPath('model', 'meta-llama/llama-4-scout-17b-16e-instruct')
            ->assertJsonPath('context_used.farm_id', $farm->id)
            ->assertJsonPath('context_used.crop_count', 1)
            ->assertJsonPath('context_used.open_task_count', 1)
            ->assertJsonPath('actions.0.type', 'create_task');

        $this->assertSame(1, ChatConversation::where('farm_id', $farm->id)->count());
        $this->assertDatabaseHas('chat_messages', [
            'role' => 'user',
            'content' => 'What should I do today?',
        ]);
        $this->assertDatabaseHas('chat_messages', [
            'role' => 'assistant',
            'content' => 'Prioritize irrigation checks for Rice today and delay watering if rain arrives tomorrow.',
        ]);

        Http::assertSent(function ($request) {
            $payload = $request->data();
            $contextMessage = collect($payload['messages'])
                ->first(fn (array $message) => str_contains($message['content'], 'Current authenticated farm context JSON'));

            return $request->url() === 'https://api.groq.com/openai/v1/chat/completions'
                && $payload['model'] === 'meta-llama/llama-4-scout-17b-16e-instruct'
                && str_contains($contextMessage['content'] ?? '', 'Rice')
                && str_contains($contextMessage['content'] ?? '', 'Check irrigation');
        });
    }

    public function test_assistant_conversations_are_farm_scoped(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $otherFarm = Farm::create(['user_id' => $otherUser->id, 'name' => 'Other Farm']);

        $conversation = ChatConversation::create([
            'farm_id' => $farm->id,
            'title' => 'Main conversation',
        ]);
        $otherConversation = ChatConversation::create([
            'farm_id' => $otherFarm->id,
            'title' => 'Other conversation',
        ]);
        ChatMessage::create([
            'chat_conversation_id' => $conversation->id,
            'role' => 'assistant',
            'content' => 'Main farm answer',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/assistant/conversations')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $conversation->id);

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/assistant/conversations/{$conversation->id}")
            ->assertOk()
            ->assertJsonPath('messages.0.content', 'Main farm answer');

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/assistant/conversations/{$otherConversation->id}")
            ->assertNotFound();
    }

    public function test_assistant_can_create_task_from_safe_action(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => 'Main Farm',
            'latitude' => 15,
            'longitude' => 120,
        ]);
        $plot = Plot::create(['farm_id' => $farm->id, 'name' => 'North Plot']);
        $crop = Crop::create([
            'plot_id' => $plot->id,
            'name' => 'Rice',
            'status' => 'growing',
            'growth_stage' => 'maturing',
            'expected_harvest_on' => now()->addDays(7)->toDateString(),
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/assistant/chat', [
                'message' => 'What action should I take?',
            ])
            ->assertOk();

        $taskAction = collect($response->json('actions'))
            ->firstWhere('type', 'create_task');

        $this->assertNotNull($taskAction);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/assistant/tasks', [
                'action_key' => $taskAction['key'],
                'conversation_id' => $response->json('conversation_id'),
            ])
            ->assertOk()
            ->assertJsonPath('created', true)
            ->assertJsonPath('task.source', 'ai')
            ->assertJsonPath('task.crop_id', $crop->id);

        $this->assertDatabaseHas('tasks', [
            'farm_id' => $farm->id,
            'crop_id' => $crop->id,
            'source' => 'ai',
            'status' => 'pending',
        ]);
    }

    public function test_assistant_conversation_can_be_created_renamed_searched_and_deleted(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);

        $conversationId = $this->actingAs($user, 'sanctum')
            ->postJson('/api/assistant/conversations', [
                'title' => 'Harvest planning',
            ])
            ->assertCreated()
            ->assertJsonPath('farm_id', $farm->id)
            ->assertJsonPath('title', 'Harvest planning')
            ->json('id');

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/assistant/conversations/{$conversationId}", [
                'title' => 'Rice harvest planning',
            ])
            ->assertOk()
            ->assertJsonPath('title', 'Rice harvest planning');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/assistant/conversations?q=Rice')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $conversationId);

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/assistant/conversations/{$conversationId}")
            ->assertNoContent();

        $this->assertDatabaseMissing('chat_conversations', [
            'id' => $conversationId,
        ]);
    }
}
