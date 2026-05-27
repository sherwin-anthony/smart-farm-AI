<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Farm;
use App\Models\WeatherForecast;
use App\Services\Weather\WeatherImpactService;
use App\Services\Weather\WeatherService;
use App\Services\Weather\WeatherTaskService;
use Illuminate\Http\Request;

class WeatherController extends Controller
{
    private function currentFarm(Request $request): Farm
    {
        $farm = $request->user()?->farms()->latest()->first();

        if (! $farm) {
            abort(422, 'No farm found. Complete your farm profile first.');
        }

        return $farm;
    }

    public function index(Request $request, WeatherImpactService $weatherImpactService)
    {
        $farm = $this->currentFarm($request);

        return response()->json($this->weatherPayload($farm, $weatherImpactService));
    }

    public function sync(
        Request $request,
        WeatherService $weatherService,
        WeatherImpactService $weatherImpactService
    ) {
        $farm = $this->currentFarm($request);

        if ($farm->latitude === null || $farm->longitude === null) {
            return response()->json([
                'message' => 'Farm latitude and longitude are required. Pin your farm location first.',
            ], 422);
        }

        $forecasts = $weatherService->fetchDailyForecast((float) $farm->latitude, (float) $farm->longitude);

        foreach ($forecasts as $forecast) {
            WeatherForecast::updateOrCreate(
                [
                    'farm_id' => $farm->id,
                    'forecast_date' => $forecast['forecast_date'],
                ],
                [
                    'summary' => $forecast['summary'],
                    'temperature_c' => $forecast['temperature_c'],
                    'temperature_min_c' => $forecast['temperature_min_c'],
                    'temperature_max_c' => $forecast['temperature_max_c'],
                    'rain_mm' => $forecast['rain_mm'],
                    'rain_probability' => $forecast['rain_probability'],
                    'humidity' => $forecast['humidity'],
                    'wind_kph' => $forecast['wind_kph'],
                    'weather_code' => $forecast['weather_code'],
                    'raw_payload' => $forecast['raw_payload'],
                    'fetched_at' => $forecast['fetched_at'],
                ]
            );
        }

        return response()->json($this->weatherPayload($farm, $weatherImpactService));
    }

    public function createTasks(
        Request $request,
        WeatherImpactService $weatherImpactService,
        WeatherTaskService $weatherTaskService
    ) {
        $farm = $this->currentFarm($request);
        $forecasts = $this->forecastQuery($farm)->get();

        if ($forecasts->isEmpty()) {
            return response()->json([
                'message' => 'Sync weather before creating weather tasks.',
            ], 422);
        }

        return response()->json(
            $weatherTaskService->createImpactTasks($farm, $forecasts, $weatherImpactService)
        );
    }

    private function weatherPayload(Farm $farm, WeatherImpactService $weatherImpactService): array
    {
        $forecasts = $this->forecastQuery($farm)->get();

        return [
            'forecasts' => $forecasts,
            'impacts' => $weatherImpactService->build($farm, $forecasts),
        ];
    }

    private function forecastQuery(Farm $farm)
    {
        return WeatherForecast::where('farm_id', $farm->id)
            ->orderBy('forecast_date');
    }
}
