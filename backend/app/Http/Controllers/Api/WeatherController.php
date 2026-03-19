<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use App\Models\WeatherForecast;
use App\Services\Weather\WeatherService;
use Illuminate\Http\Request;

class WeatherController extends Controller
{
    public function index(Request $request)
    {
        return WeatherForecast::query()
            ->when($request->farm_id, fn ($query) => $query->where('farm_id', $request->farm_id))
            ->orderBy('forecast_date')
            ->get();
    }

    public function sync(Request $request, WeatherService $weatherService)
    {
        $request->validate([
            'farm_id' => ['required', 'exists:farms,id'],
        ]);

        $farm = Farm::findOrFail($request->farm_id);

        if (!$farm->latitude || !$farm->longitude) {
            return response()->json(['message' => 'Farm latitude and longitude are required.'], 422);
        }

        $payload = $weatherService->fetchDailyForecast((float) $farm->latitude, (float) $farm->longitude);

        // Save parsed forecast rows here next.
        return response()->json([
            'message' => 'Weather sync placeholder complete.',
            'payload' => $payload,
        ]);
    }
}
