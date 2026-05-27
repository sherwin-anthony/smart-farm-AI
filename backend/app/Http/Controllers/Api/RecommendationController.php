<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use App\Models\WeatherForecast;
use App\Services\Recommendations\FarmingRecommendationService;
use App\Services\Recommendations\RecommendationTaskService;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    private function currentFarm(Request $request): Farm
    {
        $farm = $request->user()?->farms()->latest()->first();

        if (!$farm) {
            abort(422, 'No farm found. Complete your farm profile first.');
        }

        return $farm;
    }

    public function index(Request $request, FarmingRecommendationService $service)
    {
        $farm = $this->currentFarm($request);
        $forecasts = WeatherForecast::where('farm_id', $farm->id)
            ->orderBy('forecast_date')
            ->get();
        $items = $service->buildItems($farm, $forecasts);

        // Recommendations now use the authenticated farm context instead of trusting a request farm_id.
        return response()->json([
            'recommendations' => $service->messagesFromItems($items),
            'items' => $items,
        ]);
    }

    public function createTask(
        Request $request,
        FarmingRecommendationService $service,
        RecommendationTaskService $recommendationTaskService
    ) {
        $data = $request->validate([
            'key' => ['required', 'string'],
        ]);
        $farm = $this->currentFarm($request);
        $forecasts = WeatherForecast::where('farm_id', $farm->id)
            ->orderBy('forecast_date')
            ->get();
        $item = collect($service->buildItems($farm, $forecasts))
            ->firstWhere('key', $data['key']);

        if (! $item) {
            $existingTask = $recommendationTaskService->existingTaskForKey($farm, $data['key']);

            if ($existingTask) {
                return response()->json([
                    'created' => false,
                    'message' => 'A matching recommendation task already exists.',
                    'task' => $existingTask,
                ]);
            }

            return response()->json([
                'message' => 'Recommendation is no longer available.',
            ], 404);
        }

        $result = $recommendationTaskService->createTask($farm, $item);

        return response()->json($result, $result['task'] ? 200 : 422);
    }
}
