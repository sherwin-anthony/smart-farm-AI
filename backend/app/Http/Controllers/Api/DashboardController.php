<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Crop;
use App\Models\Farm;
use App\Models\Task;
use App\Models\WeatherForecast;
use App\Models\YieldPrediction;
use App\Services\Recommendations\FarmingRecommendationService;
use App\Services\Weather\WeatherImpactService;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DashboardController extends Controller
{
    private function currentFarm(Request $request): Farm
    {
        $farm = $request->user()?->farms()->latest()->first();

        if (! $farm) {
            abort(422, 'No farm found. Complete your farm profile first.');
        }

        return $farm;
    }

    public function overview(
        Request $request,
        WeatherImpactService $weatherImpactService,
        FarmingRecommendationService $recommendationService
    ) {
        $farm = $this->currentFarm($request);
        $today = CarbonImmutable::now()->startOfDay();
        $crops = Crop::query()
            ->forFarm($farm)
            ->with('plot')
            ->latest()
            ->get();
        $tasks = Task::with(['crop', 'plot'])
            ->where('farm_id', $farm->id)
            ->get();
        $weatherForecasts = WeatherForecast::where('farm_id', $farm->id)
            ->orderBy('forecast_date')
            ->get();
        $weatherImpacts = $weatherImpactService->build($farm, $weatherForecasts);
        $recommendations = $recommendationService->buildItems($farm, $weatherForecasts);
        $yieldPredictions = YieldPrediction::with(['crop', 'plot'])
            ->where('farm_id', $farm->id)
            ->latest()
            ->get();
        $openTasks = $tasks->whereNotIn('status', ['completed', 'cancelled']);
        $pendingTasks = $tasks->where('status', 'pending');
        $dueTodayTasks = $openTasks->filter(fn (Task $task) => $task->due_on
            && $task->due_on->startOfDay()->equalTo($today));
        $overdueTasks = $openTasks->filter(fn (Task $task) => $task->due_on
            && $task->due_on->startOfDay()->lt($today));
        $readyCrops = $crops->where('status', 'ready');
        $nearHarvestCrops = $crops->filter(function (Crop $crop) use ($today): bool {
            if (! $crop->expected_harvest_on || in_array($crop->status, ['harvested', 'failed'], true)) {
                return false;
            }

            $days = $today->diffInDays($crop->expected_harvest_on->startOfDay(), false);

            return $days >= 0 && $days <= 14;
        });

        // Dashboard totals use locked workflow statuses and stay inside the authenticated farm boundary.
        return response()->json([
            'farm' => [
                'id' => $farm->id,
                'name' => $farm->name,
                'location' => $farm->location,
                'has_coordinates' => $farm->latitude !== null && $farm->longitude !== null,
            ],
            'priority' => $this->prioritySignal(
                $overdueTasks,
                $dueTodayTasks,
                $readyCrops,
                $weatherImpacts,
                $recommendations
            ),
            'total_crops' => $crops->count(),
            'active_crops' => $crops->where('status', 'growing')->count(),
            'ready_to_harvest' => $readyCrops->count(),
            'pending_tasks' => $pendingTasks->count(),
            'due_today_tasks' => $dueTodayTasks->count(),
            'overdue_tasks' => $overdueTasks->count(),
            'latest_prediction' => $yieldPredictions->first(),
            'task_summary' => [
                'open' => $openTasks->count(),
                'pending' => $pendingTasks->count(),
                'in_progress' => $tasks->where('status', 'in_progress')->count(),
                'due_today' => $dueTodayTasks->count(),
                'overdue' => $overdueTasks->count(),
                'due_today_items' => $dueTodayTasks
                    ->sortBy(fn (Task $task) => $task->priority)
                    ->take(4)
                    ->map(fn (Task $task) => $this->taskItem($task))
                    ->values(),
                'overdue_items' => $overdueTasks
                    ->sortBy(fn (Task $task) => $task->due_on?->toDateString() ?? '9999-12-31')
                    ->take(4)
                    ->map(fn (Task $task) => $this->taskItem($task))
                    ->values(),
                'next_items' => $openTasks
                    ->sortBy(fn (Task $task) => $task->due_on?->toDateString() ?? '9999-12-31')
                    ->take(5)
                    ->map(fn (Task $task) => $this->taskItem($task))
                    ->values(),
            ],
            'crop_summary' => [
                'growing' => $crops->where('status', 'growing')->count(),
                'ready' => $readyCrops->count(),
                'near_harvest' => $nearHarvestCrops->count(),
                'ready_items' => $readyCrops
                    ->take(4)
                    ->map(fn (Crop $crop) => $this->cropItem($crop))
                    ->values(),
                'near_harvest_items' => $nearHarvestCrops
                    ->sortBy(fn (Crop $crop) => $crop->expected_harvest_on?->toDateString() ?? '9999-12-31')
                    ->take(4)
                    ->map(fn (Crop $crop) => $this->cropItem($crop))
                    ->values(),
            ],
            'weather' => $this->weatherSummary($weatherForecasts, $weatherImpacts),
            'recommendations' => collect($recommendations)
                ->take(3)
                ->map(fn (array $item) => $this->recommendationItem($item))
                ->values(),
            'yield' => $this->yieldSummary($yieldPredictions),
        ]);
    }

    private function prioritySignal(
        Collection $overdueTasks,
        Collection $dueTodayTasks,
        Collection $readyCrops,
        array $weatherImpacts,
        array $recommendations
    ): array {
        $overdueTask = $overdueTasks
            ->sortBy(fn (Task $task) => $task->due_on?->toDateString() ?? '9999-12-31')
            ->first();

        if ($overdueTask) {
            return [
                'title' => 'Overdue task needs action',
                'message' => "{$overdueTask->title} is overdue. Clear overdue work before adding more field activity.",
                'tone' => 'danger',
                'source' => 'task',
                'action_label' => 'Open Overdue Tasks',
                'action_href' => '/tasks?due=overdue',
            ];
        }

        $weatherImpact = collect($weatherImpacts)
            ->filter(fn (array $impact) => in_array($impact['severity'], ['high', 'medium'], true))
            ->first();

        if ($weatherImpact) {
            return [
                'title' => $weatherImpact['title'],
                'message' => $weatherImpact['action'],
                'tone' => $weatherImpact['severity'] === 'high' ? 'danger' : 'warning',
                'source' => $weatherImpact['source'],
                'action_label' => $weatherImpact['crop_id'] ? 'Open Crop' : 'Open Weather',
                'action_href' => $weatherImpact['crop_id'] ? "/crops/{$weatherImpact['crop_id']}" : '/weather',
            ];
        }

        $readyCrop = $readyCrops->first();

        if ($readyCrop) {
            return [
                'title' => 'Crop ready for harvest',
                'message' => "{$readyCrop->name} is marked ready. Review harvest tasks and yield records.",
                'tone' => 'success',
                'source' => 'crop',
                'action_label' => 'Open Crop',
                'action_href' => "/crops/{$readyCrop->id}",
            ];
        }

        $dueTodayTask = $dueTodayTasks->first();

        if ($dueTodayTask) {
            return [
                'title' => 'Task due today',
                'message' => "{$dueTodayTask->title} is due today. Keep today's work queue moving.",
                'tone' => 'info',
                'source' => 'task',
                'action_label' => 'Open Today Tasks',
                'action_href' => '/tasks?due=today',
            ];
        }

        $recommendation = collect($recommendations)
            ->first(fn (array $item) => in_array($item['priority'], ['urgent', 'high', 'medium'], true));

        if ($recommendation) {
            return [
                'title' => $recommendation['title'],
                'message' => $recommendation['message'],
                'tone' => $recommendation['priority'] === 'urgent' ? 'danger' : 'warning',
                'source' => $recommendation['source'],
                'action_label' => $recommendation['action_label'],
                'action_href' => $recommendation['action_href'],
            ];
        }

        return [
            'title' => 'Farm signals look steady',
            'message' => 'No urgent task, crop, or weather pressure is showing right now.',
            'tone' => 'success',
            'source' => 'system',
            'action_label' => 'View Recommendations',
            'action_href' => '/recommendations',
        ];
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
            'action_href' => '/weather',
        ];
    }

    private function taskItem(Task $task): array
    {
        return [
            'id' => $task->id,
            'title' => $task->title,
            'priority' => $task->priority,
            'status' => $task->status,
            'due_on' => $task->due_on?->toDateString(),
            'task_type' => $task->task_type,
            'source' => $task->source,
            'crop_name' => $task->crop?->name,
            'plot_name' => $task->plot?->name,
        ];
    }

    private function cropItem(Crop $crop): array
    {
        return [
            'id' => $crop->id,
            'name' => $crop->name,
            'status' => $crop->status,
            'growth_stage' => $crop->growth_stage,
            'expected_harvest_on' => $crop->expected_harvest_on?->toDateString(),
            'plot_name' => $crop->plot?->name,
            'href' => "/crops/{$crop->id}",
        ];
    }

    private function recommendationItem(array $item): array
    {
        return [
            'key' => $item['key'],
            'title' => $item['title'],
            'message' => $item['message'],
            'source' => $item['source'],
            'priority' => $item['priority'],
            'action_label' => $item['action_label'],
            'action_href' => $item['action_href'],
            'can_create_task' => $item['can_create_task'],
        ];
    }

    private function yieldSummary(Collection $yieldPredictions): array
    {
        $latest = $yieldPredictions->first();
        $predictedTotal = round((float) $yieldPredictions->sum('predicted_yield_kg'), 2);
        $actualTotal = round((float) $yieldPredictions->sum('actual_yield_kg'), 2);
        $harvestedCount = $yieldPredictions
            ->filter(fn (YieldPrediction $prediction) => $prediction->actual_yield_kg !== null)
            ->count();
        $performanceLabel = 'Waiting for actual harvests';

        if ($harvestedCount > 0 && $predictedTotal > 0) {
            $performanceLabel = $actualTotal >= $predictedTotal
                ? 'Actual yield is meeting or beating predictions'
                : 'Actual yield is below predictions';
        }

        return [
            'record_count' => $yieldPredictions->count(),
            'harvested_count' => $harvestedCount,
            'predicted_total_kg' => $predictedTotal,
            'actual_total_kg' => $actualTotal,
            'performance_label' => $performanceLabel,
            'latest' => $latest ? [
                'id' => $latest->id,
                'crop_name' => $latest->crop?->name,
                'plot_name' => $latest->plot?->name,
                'predicted_yield_kg' => $latest->predicted_yield_kg,
                'actual_yield_kg' => $latest->actual_yield_kg,
                'prediction_status' => $latest->prediction_status,
                'predicted_on' => $latest->predicted_on?->toDateString(),
                'harvested_on' => $latest->harvested_on?->toDateString(),
            ] : null,
        ];
    }
}
