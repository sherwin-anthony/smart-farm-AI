<?php

namespace App\Services\AI;

use App\Models\Farm;
use App\Models\Task;
use App\Models\WeatherForecast;
use App\Services\Recommendations\FarmingRecommendationService;
use Carbon\CarbonImmutable;

class AssistantContextService
{
    public function __construct(private FarmingRecommendationService $recommendationService)
    {
    }

    public function build(Farm $farm): array
    {
        $plots = $farm->plots()->withCount('crops')->orderBy('name')->get();
        $crops = $farm->crops()->with('plot')->latest()->get();
        $tasks = Task::with(['crop', 'plot'])
            ->where('farm_id', $farm->id)
            ->latest()
            ->get();
        $forecasts = WeatherForecast::where('farm_id', $farm->id)
            ->orderBy('forecast_date')
            ->take(7)
            ->get();
        $yieldPredictions = $farm->yieldPredictions()
            ->with(['crop', 'plot'])
            ->latest()
            ->take(8)
            ->get();
        $recommendations = $this->recommendationService->buildItems($farm, $forecasts);

        $today = CarbonImmutable::now()->startOfDay();
        $openTasks = $tasks->whereNotIn('status', ['completed', 'cancelled']);
        $overdueTasks = $openTasks->filter(fn (Task $task) => $task->due_on
            && $task->due_on->startOfDay()->lt($today));
        $dueTodayTasks = $openTasks->filter(fn (Task $task) => $task->due_on
            && $task->due_on->startOfDay()->equalTo($today));
        $nearHarvestCrops = $crops->filter(function ($crop) use ($today): bool {
            if (! $crop->expected_harvest_on || in_array($crop->status, ['harvested', 'failed'], true)) {
                return false;
            }

            $days = $today->diffInDays($crop->expected_harvest_on->startOfDay(), false);

            return $days >= 0 && $days <= 14;
        });

        return [
            'farm' => [
                'id' => $farm->id,
                'name' => $farm->name,
                'owner_name' => $farm->owner_name,
                'location' => $farm->location,
                'size_hectares' => $farm->size_hectares,
                'has_coordinates' => $farm->latitude !== null && $farm->longitude !== null,
                'notes' => $this->shortText($farm->notes),
            ],
            'plots' => [
                'total' => $plots->count(),
                'active' => $plots->where('status', 'active')->count(),
                'vacant' => $plots->where('status', 'vacant')->count(),
                'items' => $plots->take(8)->map(fn ($plot) => [
                    'id' => $plot->id,
                    'name' => $plot->name,
                    'status' => $plot->status,
                    'area_hectares' => $plot->area_hectares,
                    'soil_type' => $plot->soil_type,
                    'crop_count' => $plot->crops_count,
                ])->values()->all(),
            ],
            'crops' => [
                'total' => $crops->count(),
                'growing' => $crops->where('status', 'growing')->count(),
                'ready' => $crops->where('status', 'ready')->count(),
                'near_harvest' => $nearHarvestCrops->count(),
                'items' => $crops->take(10)->map(fn ($crop) => [
                    'id' => $crop->id,
                    'name' => $crop->name,
                    'type' => $crop->type,
                    'status' => $crop->status,
                    'growth_stage' => $crop->growth_stage,
                    'plot' => $crop->plot?->name,
                    'planted_on' => $crop->planted_on?->toDateString(),
                    'expected_harvest_on' => $crop->expected_harvest_on?->toDateString(),
                    'notes' => $this->shortText($crop->notes),
                ])->values()->all(),
            ],
            'tasks' => [
                'total' => $tasks->count(),
                'open' => $openTasks->count(),
                'overdue' => $overdueTasks->count(),
                'due_today' => $dueTodayTasks->count(),
                'items' => $openTasks
                    ->sortBy(fn (Task $task) => $task->due_on?->toDateString() ?? '9999-12-31')
                    ->take(10)
                    ->map(fn (Task $task) => [
                        'id' => $task->id,
                        'title' => $task->title,
                        'type' => $task->task_type,
                        'priority' => $task->priority,
                        'status' => $task->status,
                        'due_on' => $task->due_on?->toDateString(),
                        'crop' => $task->crop?->name,
                        'plot' => $task->plot?->name,
                        'source' => $task->source,
                    ])
                    ->values()
                    ->all(),
            ],
            'weather' => [
                'loaded' => $forecasts->isNotEmpty(),
                'items' => $forecasts->take(5)->map(fn (WeatherForecast $forecast) => [
                    'date' => $forecast->forecast_date?->toDateString(),
                    'summary' => $forecast->summary,
                    'rain_mm' => $forecast->rain_mm,
                    'rain_probability' => $forecast->rain_probability,
                    'temperature_c' => $forecast->temperature_c,
                    'temperature_max_c' => $forecast->temperature_max_c,
                    'wind_kph' => $forecast->wind_kph,
                ])->values()->all(),
            ],
            'recommendations' => collect($recommendations)->take(6)->map(fn (array $item) => [
                'key' => $item['key'],
                'title' => $item['title'],
                'message' => $item['message'],
                'source' => $item['source'],
                'priority' => $item['priority'],
                'category' => $item['category'],
                'related_type' => $item['related_type'],
                'related_id' => $item['related_id'],
                'related_label' => $item['related_label'],
                'action_href' => $item['action_href'],
                'can_create_task' => $item['can_create_task'],
            ])->values()->all(),
            'yield' => [
                'records' => $yieldPredictions->count(),
                'harvested' => $yieldPredictions
                    ->filter(fn ($prediction) => $prediction->actual_yield_kg !== null)
                    ->count(),
                'items' => $yieldPredictions->take(5)->map(fn ($prediction) => [
                    'crop' => $prediction->crop?->name,
                    'plot' => $prediction->plot?->name,
                    'predicted_yield_kg' => $prediction->predicted_yield_kg,
                    'actual_yield_kg' => $prediction->actual_yield_kg,
                    'status' => $prediction->prediction_status,
                    'predicted_on' => $prediction->predicted_on?->toDateString(),
                    'harvested_on' => $prediction->harvested_on?->toDateString(),
                ])->values()->all(),
            ],
            'summary' => [
                'farm_id' => $farm->id,
                'crop_count' => $crops->count(),
                'open_task_count' => $openTasks->count(),
                'overdue_task_count' => $overdueTasks->count(),
                'weather_loaded' => $forecasts->isNotEmpty(),
                'recommendation_count' => count($recommendations),
                'yield_record_count' => $yieldPredictions->count(),
            ],
        ];
    }

    private function shortText(?string $text): ?string
    {
        if (! $text) {
            return null;
        }

        return mb_substr($text, 0, 240);
    }
}
