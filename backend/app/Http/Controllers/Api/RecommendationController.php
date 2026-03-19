<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use App\Models\WeatherForecast;
use App\Services\Recommendations\FarmingRecommendationService;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function index(Request $request, FarmingRecommendationService $service)
    {
        $request->validate([
            'farm_id' => ['required', 'exists:farms,id'],
        ]);

        $farm = Farm::findOrFail($request->farm_id);
        $forecast = WeatherForecast::where('farm_id', $farm->id)->latest('forecast_date')->first();

        return response()->json([
            'recommendations' => $service->build($farm, $forecast),
        ]);
    }
}
