<?php

namespace App\Services\Recommendations;

use App\Models\Crop;
use App\Models\Farm;
use App\Models\Plot;
use App\Models\Task;
use Carbon\CarbonImmutable;

class RecommendationTaskService
{
    public function existingTaskForKey(Farm $farm, string $key): ?Task
    {
        return Task::where('farm_id', $farm->id)
            ->where('notes', "Created from recommendation: {$key}")
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->first()
            ?->load(['plot', 'crop.plot']);
    }

    public function createTask(Farm $farm, array $item): array
    {
        if (! ($item['can_create_task'] ?? false)) {
            return [
                'created' => false,
                'message' => 'This recommendation is informational and cannot create a new task.',
                'task' => null,
            ];
        }

        $payload = $this->taskPayload($farm, $item);

        $existingTask = $this->existingTaskForKey($farm, $item['key'])
            ?? Task::where('farm_id', $farm->id)
                ->where('source', $payload['source'])
                ->where('title', $payload['title'])
                ->whereDate('due_on', $payload['due_on'])
                ->whereNotIn('status', ['completed', 'cancelled'])
                ->first();

        if ($existingTask) {
            return [
                'created' => false,
                'message' => 'A matching recommendation task already exists.',
                'task' => $existingTask->load(['plot', 'crop.plot']),
            ];
        }

        $task = Task::create($payload)->load(['plot', 'crop.plot']);

        return [
            'created' => true,
            'message' => 'Recommendation task created.',
            'task' => $task,
        ];
    }

    private function taskPayload(Farm $farm, array $item): array
    {
        [$plotId, $cropId] = $this->relatedOwnership($farm, $item);

        return [
            'farm_id' => $farm->id,
            'plot_id' => $plotId,
            'crop_id' => $cropId,
            'title' => $this->taskTitle($item),
            'description' => $item['message'],
            'task_type' => $this->taskType($item),
            'priority' => $this->priority($item),
            'due_on' => $this->dueOn($item),
            'status' => 'pending',
            'source' => $this->source($item),
            'notes' => "Created from recommendation: {$item['key']}",
        ];
    }

    private function relatedOwnership(Farm $farm, array $item): array
    {
        if (($item['related_type'] ?? null) === 'crop' && $item['related_id']) {
            $crop = Crop::query()->forFarm($farm)->find($item['related_id']);

            return [$crop?->plot_id, $crop?->id];
        }

        if (($item['related_type'] ?? null) === 'plot' && $item['related_id']) {
            $plot = Plot::where('farm_id', $farm->id)->find($item['related_id']);

            return [$plot?->id, null];
        }

        return [null, null];
    }

    private function taskTitle(array $item): string
    {
        return str($item['title'])
            ->prepend('Recommendation: ')
            ->limit(255, '')
            ->toString();
    }

    private function taskType(array $item): string
    {
        $category = $item['category'] ?? '';
        $text = strtolower($item['title'].' '.$item['message']);

        if (str_contains($category, 'harvest') || str_contains($text, 'harvest')) {
            return 'harvest';
        }

        if (str_contains($text, 'wind') || str_contains($text, 'spray')) {
            return 'spraying';
        }

        if (str_contains($text, 'rain') || str_contains($text, 'heat') || str_contains($text, 'irrigation')) {
            return 'irrigation_check';
        }

        return 'monitoring';
    }

    private function priority(array $item): string
    {
        return match ($item['priority'] ?? 'medium') {
            'urgent' => 'urgent',
            'high' => 'high',
            'low' => 'low',
            default => 'medium',
        };
    }

    private function dueOn(array $item): string
    {
        return match ($item['priority'] ?? 'medium') {
            'urgent' => CarbonImmutable::now()->toDateString(),
            'high' => CarbonImmutable::now()->addDay()->toDateString(),
            default => CarbonImmutable::now()->addDays(2)->toDateString(),
        };
    }

    private function source(array $item): string
    {
        return match ($item['source'] ?? 'system') {
            'weather' => 'weather',
            'crop' => 'auto_crop',
            default => 'system',
        };
    }
}
