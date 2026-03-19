<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index()
    {
        return response()->json(Task::with('crop')->latest()->get());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'crop_id' => ['required', 'exists:crops,id'],
            'title' => ['required', 'string', 'max:255'],
            'task_type' => ['required', 'string', 'max:255'],
            'due_on' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'completed_at' => ['nullable', 'date'],
        ]);

        $task = Task::create($data);

        return response()->json($task, 201);
    }

    public function show(string $id)
    {
        return response()->json(Task::with('crop')->findOrFail($id));
    }

    public function update(Request $request, string $id)
    {
        $task = Task::findOrFail($id);

        $data = $request->validate([
            'crop_id' => ['sometimes', 'required', 'exists:crops,id'],
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'task_type' => ['sometimes', 'required', 'string', 'max:255'],
            'due_on' => ['nullable', 'date'],
            'status' => ['nullable', 'string', 'max:255'],
            'source' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'completed_at' => ['nullable', 'date'],
        ]);

        $task->update($data);

        return response()->json($task);
    }

    public function destroy(string $id)
    {
        $task = Task::findOrFail($id);
        $task->delete();

        return response()->json(null, 204);
    }
}
