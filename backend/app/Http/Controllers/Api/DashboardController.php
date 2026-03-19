<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use App\Models\Task;
use App\Models\YieldPrediction;

class DashboardController extends Controller
{
    public function overview()
    {
        return response()->json([
            'total_crops' => Crop::count(),
            'active_crops' => Crop::where('status', 'growing')->count(),
            'ready_to_harvest' => Crop::where('status', 'ready')->count(),
            'pending_tasks' => Task::where('status', 'pending')->count(),
            'latest_prediction' => YieldPrediction::latest()->first(),
        ]);
    }
}
