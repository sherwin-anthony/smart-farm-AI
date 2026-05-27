<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use App\Models\WeatherForecast;
use App\Services\Recommendations\FarmingRecommendationService;
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
        $forecast = WeatherForecast::where('farm_id', $farm->id)->latest('forecast_date')->first();

        // Recommendations now use the authenticated farm context instead of trusting a request farm_id.
        return response()->json([
            'recommendations' => $service->build($farm, $forecast),
        ]);
    }
}
