<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Task;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;

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
        // Tasks are crop-owned, so scope them through the crop's farm-aware plot relationship.
        return Task::with('crop.plot')
            ->whereHas('crop', fn (Builder $query) => $query->forFarm($farm));
    }

    private function resolveFarmCrop(Farm $farm, int $cropId): Crop
    {
        // Prevent tasks from being attached to crops outside the authenticated farm.
        return Crop::query()->forFarm($farm)->findOrFail($cropId);
    }

    public function index(Request $request)
    {
        $farm = $this->currentFarm($request);

        return response()->json($this->taskQuery($farm)->latest()->get());
    }

    public function store(Request $request)
    {
        $farm = $this->currentFarm($request);

        $data = $request->validate([
            'crop_id' => ['required', 'integer', 'exists:crops,id'],
            'title' => ['required', 'string', 'max:255'],
            'task_type' => ['required', 'string', 'max:255'],
            'due_on' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'completed_at' => ['nullable', 'date'],
        ]);

        $this->resolveFarmCrop($farm, (int) $data['crop_id']);

        $task = Task::create([
            'crop_id' => $data['crop_id'],
            'title' => $data['title'],
            'task_type' => $data['task_type'],
            'due_on' => $data['due_on'] ?? null,
            'status' => $data['status'] ?? 'pending',
            'source' => $data['source'] ?? 'manual',
            'notes' => $data['notes'] ?? null,
            'completed_at' => $data['completed_at'] ?? null,
        ])->load('crop.plot');

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

        $data = $request->validate([
            'crop_id' => ['sometimes', 'required', 'integer', 'exists:crops,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'task_type' => ['sometimes', 'required', 'string', 'max:255'],
            'due_on' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'nullable', 'string', 'max:255'],
            'source' => ['sometimes', 'nullable', 'string', 'max:255'],
            'notes' => ['sometimes', 'nullable', 'string'],
            'completed_at' => ['sometimes', 'nullable', 'date'],
        ]);

        if (array_key_exists('crop_id', $data)) {
            $this->resolveFarmCrop($farm, (int) $data['crop_id']);
        }

        $task->update($data);

        return response()->json($task->load('crop.plot'));
    }

    public function destroy(Request $request, string $id)
    {
        $farm = $this->currentFarm($request);
        $task = $this->taskQuery($farm)->findOrFail($id);
        $task->delete();

        return response()->json(null, 204);
    }
}
