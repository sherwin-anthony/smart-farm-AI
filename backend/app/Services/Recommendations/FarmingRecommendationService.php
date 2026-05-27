<?php

namespace App\Services\Recommendations;

use App\Models\Farm;
use App\Models\Task;
use App\Models\WeatherForecast;
use App\Services\Weather\WeatherImpactService;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class FarmingRecommendationService
{
    public function __construct(private WeatherImpactService $weatherImpactService)
    {
    }

    /**
     * @param  Collection<int, WeatherForecast>|null  $forecasts
     * @return array<int, array<string, mixed>>
     */
    public function buildItems(Farm $farm, ?Collection $forecasts = null): array
    {
        $items = [];
        $crops = $farm->crops()->with(['tasks', 'plot'])->get();
        $plots = $farm->plots()->with('crops')->get();
        $overdueTasks = Task::where('farm_id', $farm->id)
            ->whereDate('due_on', '<', now()->toDateString())
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with(['crop', 'plot'])
            ->get();
        $forecasts ??= WeatherForecast::where('farm_id', $farm->id)
            ->orderBy('forecast_date')
            ->get();

        if ($farm->latitude === null || $farm->longitude === null) {
            $items[] = $this->item(
                key: 'profile.missing_coordinates',
                title: 'Farm location is incomplete',
                message: 'Pin your farm on the map so weather and recommendations can target the exact field location.',
                source: 'profile',
                priority: 'high',
                category: 'profile_completeness',
                relatedType: 'farm',
                relatedId: $farm->id,
                relatedLabel: $farm->name,
                actionLabel: 'Open Farm Profile',
                actionHref: '/farm-profile'
            );
        }

        collect($this->weatherImpactService->build($farm, $forecasts))
            ->filter(fn (array $impact) => in_array($impact['severity'], ['medium', 'high'], true))
            ->each(function (array $impact) use (&$items): void {
                $items[] = $this->item(
                    key: 'weather.'.$impact['key'],
                    title: $impact['title'],
                    message: $impact['action'],
                    source: $impact['source'] === 'crop' ? 'crop' : 'weather',
                    priority: $impact['severity'] === 'high' ? 'urgent' : 'high',
                    category: $impact['source'] === 'crop' ? 'harvest_weather' : 'weather_risk',
                    relatedType: $impact['crop_id'] ? 'crop' : ($impact['plot_id'] ? 'plot' : 'farm'),
                    relatedId: $impact['crop_id'] ?? $impact['plot_id'] ?? null,
                    relatedLabel: $impact['source'] === 'crop' ? 'Crop harvest window' : 'Farm forecast',
                    actionLabel: $impact['crop_id'] ? 'Open Crop' : 'Open Weather',
                    actionHref: $impact['crop_id'] ? "/crops/{$impact['crop_id']}" : '/weather'
                );
            });

        foreach ($crops as $crop) {
            if ($crop->expected_harvest_on && $crop->status !== 'harvested') {
                $daysUntilHarvest = now()
                    ->startOfDay()
                    ->diffInDays(Carbon::parse($crop->expected_harvest_on)->startOfDay(), false);

                if ($daysUntilHarvest >= 0 && $daysUntilHarvest <= 14) {
                    $items[] = $this->item(
                        key: "crop.{$crop->id}.near_harvest",
                        title: "{$crop->name} near harvest",
                        message: 'Inspect maturity and prepare harvest tasks.',
                        source: 'crop',
                        priority: 'high',
                        category: 'harvest_timing',
                        relatedType: 'crop',
                        relatedId: $crop->id,
                        relatedLabel: $crop->name,
                        actionLabel: 'Open Crop',
                        actionHref: "/crops/{$crop->id}"
                    );
                }

                if ($daysUntilHarvest < 0) {
                    $items[] = $this->item(
                        key: "crop.{$crop->id}.overdue_harvest",
                        title: "{$crop->name} is past expected harvest",
                        message: 'Review crop condition and update its status.',
                        source: 'crop',
                        priority: 'urgent',
                        category: 'harvest_timing',
                        relatedType: 'crop',
                        relatedId: $crop->id,
                        relatedLabel: $crop->name,
                        actionLabel: 'Open Crop',
                        actionHref: "/crops/{$crop->id}"
                    );
                }
            }

            $pendingTasks = $crop->tasks->where('status', 'pending')->count();

            if ($pendingTasks > 0) {
                $items[] = $this->item(
                    key: "task.crop.{$crop->id}.pending",
                    title: "{$crop->name} has pending tasks",
                    message: "Review {$pendingTasks} pending task".($pendingTasks === 1 ? '' : 's').' before adding new field work.',
                    source: 'task',
                    priority: $pendingTasks >= 3 ? 'high' : 'medium',
                    category: 'task_pressure',
                    relatedType: 'crop',
                    relatedId: $crop->id,
                    relatedLabel: $crop->name,
                    actionLabel: 'Open Tasks',
                    actionHref: '/tasks'
                );
            }

            $openTasks = $crop->tasks
                ->whereIn('status', ['pending', 'in_progress'])
                ->count();

            if (in_array($crop->status, ['growing', 'ready'], true) && $openTasks === 0) {
                $items[] = $this->item(
                    key: "task.crop.{$crop->id}.none_open",
                    title: "{$crop->name} has no open tasks",
                    message: 'Schedule a monitoring task so this active crop stays in the field workflow.',
                    source: 'task',
                    priority: 'medium',
                    category: 'task_planning',
                    relatedType: 'crop',
                    relatedId: $crop->id,
                    relatedLabel: $crop->name,
                    actionLabel: 'Open Tasks',
                    actionHref: '/tasks'
                );
            }
        }

        foreach ($overdueTasks as $task) {
            $relatedLabel = $task->crop?->name ?? $task->plot?->name ?? 'Farm-wide task';

            $items[] = $this->item(
                key: "task.{$task->id}.overdue",
                title: "Overdue task: {$task->title}",
                message: 'Review or reschedule this task before adding more field work.',
                source: 'task',
                priority: 'urgent',
                category: 'overdue_task',
                relatedType: 'task',
                relatedId: $task->id,
                relatedLabel: $relatedLabel,
                actionLabel: 'Open Tasks',
                actionHref: '/tasks'
            );
        }

        foreach ($plots as $plot) {
            $activeCropCount = $plot->crops
                ->whereNotIn('status', ['harvested', 'failed'])
                ->count();

            if ($plot->status === 'vacant' || $activeCropCount === 0) {
                $items[] = $this->item(
                    key: "plot.{$plot->id}.available",
                    title: "{$plot->name} is available",
                    message: 'Consider planning the next crop cycle or updating the plot status if it is resting.',
                    source: 'plot',
                    priority: $plot->status === 'vacant' ? 'medium' : 'low',
                    category: 'plot_planning',
                    relatedType: 'plot',
                    relatedId: $plot->id,
                    relatedLabel: $plot->name,
                    actionLabel: 'Open Plots',
                    actionHref: '/plots'
                );
            }
        }

        if ($items === []) {
            $items[] = $this->item(
                key: 'system.normal_monitoring',
                title: 'No major alerts',
                message: 'Continue normal farm monitoring.',
                source: 'system',
                priority: 'low',
                category: 'general',
                relatedType: 'farm',
                relatedId: $farm->id,
                relatedLabel: $farm->name,
                actionLabel: 'Open Dashboard',
                actionHref: '/dashboard'
            );
        }

        return collect($items)
            ->unique('key')
            ->sort(function (array $first, array $second): int {
                $priorityDifference = $this->priorityRank($second['priority'])
                    <=> $this->priorityRank($first['priority']);

                return $priorityDifference !== 0
                    ? $priorityDifference
                    : strcmp($first['title'], $second['title']);
            })
            ->values()
            ->all();
    }

    /**
     * @param  Collection<int, WeatherForecast>|null  $forecasts
     * @return array<int, string>
     */
    public function build(Farm $farm, ?Collection $forecasts = null): array
    {
        return $this->messagesFromItems($this->buildItems($farm, $forecasts));
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, string>
     */
    public function messagesFromItems(array $items): array
    {
        return collect($items)
            ->map(fn (array $item) => "{$item['title']}. {$item['message']}")
            ->values()
            ->all();
    }

    private function item(
        string $key,
        string $title,
        string $message,
        string $source,
        string $priority,
        string $category,
        string $relatedType,
        ?int $relatedId,
        ?string $relatedLabel,
        ?string $actionLabel,
        ?string $actionHref
    ): array {
        return [
            'key' => $key,
            'title' => $title,
            'message' => $message,
            'source' => $source,
            'priority' => $priority,
            'category' => $category,
            'related_type' => $relatedType,
            'related_id' => $relatedId,
            'related_label' => $relatedLabel,
            'action_label' => $actionLabel,
            'action_href' => $actionHref,
            'can_create_task' => $this->canCreateTask($category),
        ];
    }

    private function canCreateTask(string $category): bool
    {
        return in_array($category, [
            'weather_risk',
            'harvest_weather',
            'harvest_timing',
            'task_planning',
            'plot_planning',
            'profile_completeness',
        ], true);
    }

    private function priorityRank(string $priority): int
    {
        return match ($priority) {
            'urgent' => 4,
            'high' => 3,
            'medium' => 2,
            'low' => 1,
            default => 0,
        };
    }
}
