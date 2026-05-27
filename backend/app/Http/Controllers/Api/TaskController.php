<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Plot;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    private function currentFarm(Request $request): Farm
    {
        $farm = $request->user()?->farms()->latest()->first();

        if (!$farm) {
            abort(422, 'No farm found. Complete your farm profile first.');
        }

        return $farm;
    }

    private function taskQuery(Farm $farm): Builder
    {
        // Tasks belong directly to the authenticated farm, with optional plot and crop links.
        return Task::with(['plot', 'crop.plot'])
            ->where('farm_id', $farm->id);
    }

    private function resolveFarmPlot(Farm $farm, int $plotId): Plot
    {
        $plot = Plot::where('farm_id', $farm->id)->find($plotId);

        if (! $plot) {
            abort(422, 'Selected plot does not belong to your farm.');
        }

        return $plot;
    }

    private function resolveFarmCrop(Farm $farm, int $cropId): Crop
    {
        $crop = Crop::query()->forFarm($farm)->find($cropId);

        if (! $crop) {
            abort(422, 'Selected crop does not belong to your farm.');
        }

        return $crop;
    }

    private function applyTaskOwnership(Farm $farm, array $data, ?Task $task = null): array
    {
        $data['farm_id'] = $farm->id;

        $cropWasSent = array_key_exists('crop_id', $data);
        $plotWasSent = array_key_exists('plot_id', $data);
        $cropId = $cropWasSent ? $data['crop_id'] : $task?->crop_id;
        $plotId = $plotWasSent ? $data['plot_id'] : $task?->plot_id;

        if ($cropId !== null) {
            $crop = $this->resolveFarmCrop($farm, (int) $cropId);
            $data['crop_id'] = $crop->id;

            if ($plotWasSent && $plotId !== null) {
                $plot = $this->resolveFarmPlot($farm, (int) $plotId);

                if ((int) $plot->id !== (int) $crop->plot_id) {
                    abort(422, 'Selected crop does not belong to the selected plot.');
                }

                $data['plot_id'] = $plot->id;
            } else {
                $data['plot_id'] = $crop->plot_id;
            }

            return $data;
        }

        if ($cropWasSent) {
            $data['crop_id'] = null;
        }

        if ($plotId !== null) {
            $plot = $this->resolveFarmPlot($farm, (int) $plotId);
            $data['plot_id'] = $plot->id;
        } elseif ($plotWasSent || $task === null) {
            $data['plot_id'] = null;
        }

        return $data;
    }

    private function normalizeCompletion(array $data): array
    {
        if (($data['status'] ?? null) === 'completed' && ($data['completed_at'] ?? null) === null) {
            $data['completed_at'] = now();
        }

        if (
            array_key_exists('status', $data)
            && $data['status'] !== 'completed'
            && ! array_key_exists('completed_at', $data)
        ) {
            $data['completed_at'] = null;
        }

        return $data;
    }

    private function storeRules(): array
    {
        return [
            'plot_id' => ['nullable', 'integer', 'exists:plots,id'],
            'crop_id' => ['nullable', 'integer', 'exists:crops,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'task_type' => ['required', Rule::in(Task::TYPE_OPTIONS)],
            'priority' => ['nullable', Rule::in(Task::PRIORITY_OPTIONS)],
            'due_on' => ['nullable', 'date'],
            'status' => ['nullable', Rule::in(Task::STATUS_OPTIONS)],
            'source' => ['nullable', Rule::in(Task::SOURCE_OPTIONS)],
            'notes' => ['nullable', 'string'],
            'completed_at' => ['nullable', 'date'],
        ];
    }

    private function updateRules(): array
    {
        return [
            'plot_id' => ['sometimes', 'nullable', 'integer', 'exists:plots,id'],
            'crop_id' => ['sometimes', 'nullable', 'integer', 'exists:crops,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'task_type' => ['sometimes', 'required', Rule::in(Task::TYPE_OPTIONS)],
            'priority' => ['sometimes', 'nullable', Rule::in(Task::PRIORITY_OPTIONS)],
            'due_on' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'nullable', Rule::in(Task::STATUS_OPTIONS)],
            'source' => ['sometimes', 'nullable', Rule::in(Task::SOURCE_OPTIONS)],
            'notes' => ['sometimes', 'nullable', 'string'],
            'completed_at' => ['sometimes', 'nullable', 'date'],
        ];
    }

    public function index(Request $request)
    {
        $farm = $this->currentFarm($request);
        $query = $this->taskQuery($farm);

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority')->toString());
        }

        if ($request->filled('source')) {
            $query->where('source', $request->string('source')->toString());
        }

        if ($request->filled('plot_id')) {
            $plot = $this->resolveFarmPlot($farm, (int) $request->integer('plot_id'));
            $query->where('plot_id', $plot->id);
        }

        if ($request->filled('crop_id')) {
            $crop = $this->resolveFarmCrop($farm, (int) $request->integer('crop_id'));
            $query->where('crop_id', $crop->id);
        }

        if ($request->boolean('due_today') || $request->string('due')->toString() === 'today') {
            $query->whereDate('due_on', now()->toDateString());
        }

        if ($request->boolean('overdue') || $request->string('due')->toString() === 'overdue') {
            $query->whereDate('due_on', '<', now()->toDateString())
                ->whereNotIn('status', ['completed', 'cancelled']);
        }

        return response()->json($query->latest()->get());
    }

    public function store(Request $request)
    {
        $farm = $this->currentFarm($request);

        $data = $request->validate($this->storeRules());

        $payload = $this->applyTaskOwnership($farm, [
            'plot_id' => $data['plot_id'] ?? null,
            'crop_id' => $data['crop_id'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'task_type' => $data['task_type'],
            'priority' => $data['priority'] ?? 'medium',
            'due_on' => $data['due_on'] ?? null,
            'status' => $data['status'] ?? 'pending',
            'source' => $data['source'] ?? 'manual',
            'notes' => $data['notes'] ?? null,
            'completed_at' => $data['completed_at'] ?? null,
        ]);

        $task = Task::create($this->normalizeCompletion($payload))->load(['plot', 'crop.plot']);

        return response()->json($task, 201);
    }

    public function show(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);

        return response()->json($this->taskQuery($farm)->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $task = $this->taskQuery($farm)->findOrFail($id);

        $data = $request->validate($this->updateRules());
        $data = $this->normalizeCompletion($this->applyTaskOwnership($farm, $data, $task));

        $task->update($data);

        return response()->json($task->load(['plot', 'crop.plot']));
    }

    public function destroy(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $task = $this->taskQuery($farm)->findOrFail($id);
        $task->delete();

        return response()->json(null, 204);
    }
}
