<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Task;
use App\Models\YieldPrediction;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    private function currentFarm(Request $request): Farm
    {
        $farm = $request->user()?->farms()->latest()->first();

        if (!$farm) {
            abort(422, 'No farm found. Complete your farm profile first.');
        }

        return $farm;
    }

    public function overview(Request $request)
    {
        $farm = $this->currentFarm($request);
        $cropQuery = Crop::query()->forFarm($farm);

        // Dashboard totals use the locked crop statuses and only count records inside the current farm.
        return response()->json([
            'total_crops' => (clone $cropQuery)->count(),
            'active_crops' => (clone $cropQuery)->where('status', 'growing')->count(),
            'ready_to_harvest' => (clone $cropQuery)->where('status', 'ready')->count(),
            'pending_tasks' => Task::where('farm_id', $farm->id)->where('status', 'pending')->count(),
            'latest_prediction' => YieldPrediction::where('farm_id', $farm->id)->latest()->first(),
        ]);
    }
}
