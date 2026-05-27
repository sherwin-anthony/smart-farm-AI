<?php

namespace App\Services\Weather;

use App\Models\Farm;
use App\Models\Task;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class WeatherTaskService
{
    /**
     * @param  Collection<int, \App\Models\WeatherForecast>  $forecasts
     * @return array{created_count: int, skipped_count: int, tasks: Collection<int, Task>}
     */
    public function createImpactTasks(
        Farm $farm,
        Collection $forecasts,
        WeatherImpactService $weatherImpactService
    ): array {
        $createdTasks = collect();
        $skippedCount = 0;

        $impacts = collect($weatherImpactService->build($farm, $forecasts))
            ->filter(fn (array $impact) => in_array($impact['severity'], ['medium', 'high'], true));

        foreach ($impacts as $impact) {
            $dueOn = $impact['forecast_date'] ?? CarbonImmutable::now()->toDateString();
            $title = $this->taskTitle($impact);

            if ($this->existingTask($farm, $title, $dueOn)) {
                $skippedCount++;
                continue;
            }

            $createdTasks->push(Task::create([
                'farm_id' => $farm->id,
                'plot_id' => $impact['plot_id'] ?? null,
                'crop_id' => $impact['crop_id'] ?? null,
                'title' => $title,
                'description' => $impact['message'],
                'task_type' => $this->taskType($impact),
                'priority' => $this->priority($impact),
                'due_on' => $dueOn,
                'status' => 'pending',
                'source' => 'weather',
                'notes' => 'Recommended action: '.$impact['action'],
            ])->load(['plot', 'crop.plot']));
        }

        return [
            'created_count' => $createdTasks->count(),
            'skipped_count' => $skippedCount,
            'tasks' => $createdTasks->values(),
        ];
    }

    private function existingTask(Farm $farm, string $title, string $dueOn): bool
    {
        return Task::where('farm_id', $farm->id)
            ->where('source', 'weather')
            ->where('title', $title)
            ->whereDate('due_on', $dueOn)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->exists();
    }

    private function taskTitle(array $impact): string
    {
        return str($impact['title'])
            ->prepend('Weather: ')
            ->limit(255, '')
            ->toString();
    }

    private function taskType(array $impact): string
    {
        $text = strtolower($impact['title'].' '.$impact['message'].' '.$impact['action']);

        if (str_contains($text, 'harvest')) {
            return 'harvest';
        }

        if (str_contains($text, 'spray') || str_contains($text, 'wind')) {
            return 'spraying';
        }

        if (str_contains($text, 'rain') || str_contains($text, 'drainage') || str_contains($text, 'irrigat')) {
            return 'irrigation_check';
        }

        return 'monitoring';
    }

    private function priority(array $impact): string
    {
        return $impact['severity'] === 'high' ? 'urgent' : 'high';
    }
}
