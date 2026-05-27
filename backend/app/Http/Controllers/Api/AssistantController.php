<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use App\Services\AI\FarmingAssistantService;
use Illuminate\Http\Request;

class AssistantController extends Controller
{
    private function currentFarm(Request $request): Farm
    {
        $farm = $request->user()?->farms()->latest()->first();

        if (!$farm) {
            abort(422, 'No farm found. Complete your farm profile first.');
        }

        return $farm;
    }

    public function chat(Request $request, FarmingAssistantService $assistant)
    {
        $farm = $this->currentFarm($request);
        $data = $request->validate([
            'message' => ['required', 'string'],
        ]);

        $crops = $farm->crops()
            ->with('plot')
            ->latest()
            ->take(8)
            ->get()
            ->map(fn ($crop) => [
                'name' => $crop->name,
                'status' => $crop->status,
                'growth_stage' => $crop->growth_stage,
                'plot' => $crop->plot?->name,
                'expected_harvest_on' => $crop->expected_harvest_on,
            ])
            ->values();

        $pendingTasks = $farm->crops()
            ->with(['tasks' => fn ($query) => $query->where('status', 'pending')->orderBy('due_on')])
            ->get()
            ->flatMap(fn ($crop) => $crop->tasks->map(fn ($task) => [
                'crop' => $crop->name,
                'title' => $task->title,
                'due_on' => $task->due_on,
            ]))
            ->take(8)
            ->values();

        // Assistant context is derived from the authenticated farm, never from a request farm_id.
        $response = $assistant->reply($data['message'], [
            'farm_id' => $farm->id,
            'crops' => $crops,
            'pending_tasks' => $pendingTasks,
        ]);

        return response()->json($response);
    }
}
