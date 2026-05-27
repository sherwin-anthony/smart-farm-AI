<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Task;
use App\Models\WeatherForecast;
use App\Models\YieldPrediction;
use App\Services\Weather\WeatherImpactService;
use Illuminate\Support\Collection;
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

    public function overview(Request $request, WeatherImpactService $weatherImpactService)
    {
        $farm = $this->currentFarm($request);
        $cropQuery = Crop::query()->forFarm($farm);
        $weatherForecasts = WeatherForecast::where('farm_id', $farm->id)
            ->orderBy('forecast_date')
            ->get();

        // Dashboard totals use the locked crop statuses and only count records inside the current farm.
        return response()->json([
            'total_crops' => (clone $cropQuery)->count(),
            'active_crops' => (clone $cropQuery)->where('status', 'growing')->count(),
            'ready_to_harvest' => (clone $cropQuery)->where('status', 'ready')->count(),
            'pending_tasks' => Task::where('farm_id', $farm->id)->where('status', 'pending')->count(),
            'latest_prediction' => YieldPrediction::where('farm_id', $farm->id)->latest()->first(),
            'weather' => $this->weatherSummary(
                $weatherForecasts,
                $weatherImpactService->build($farm, $weatherForecasts)
            ),
        ]);
    }

    private function weatherSummary(Collection $forecasts, array $impacts): array
    {
        $currentForecast = $forecasts->first();
        $actionableImpacts = collect($impacts)
            ->filter(fn (array $impact) => in_array($impact['severity'], ['medium', 'high'], true))
            ->values();
        $topImpact = $actionableImpacts->first() ?? collect($impacts)->first();
        $lastUpdated = $forecasts
            ->map(fn (WeatherForecast $forecast) => $forecast->fetched_at ?? $forecast->updated_at)
            ->filter()
            ->sort()
            ->last();

        return [
            'current_summary' => $currentForecast?->summary,
            'current_temperature_c' => $currentForecast?->temperature_c,
            'impact_count' => $actionableImpacts->count(),
            'highest_severity' => $topImpact['severity'] ?? null,
            'headline' => $topImpact['title'] ?? 'No forecast saved',
            'action' => $topImpact['action'] ?? 'Sync weather to add farm-aware forecast signals.',
            'last_updated' => $lastUpdated?->toISOString(),
        ];
    }
}
