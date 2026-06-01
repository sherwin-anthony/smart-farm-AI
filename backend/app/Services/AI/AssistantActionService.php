<?php

namespace App\Services\AI;

use App\Models\Farm;
use App\Models\Task;
use Carbon\CarbonImmutable;

class AssistantActionService
{
    /**
     * @param  array<string, mixed>  $context
     * @return array<int, array<string, mixed>>
     */
    public function build(array $context): array
    {
        $actions = [];
        $summary = $context['summary'] ?? [];

        if ((int) ($summary['overdue_task_count'] ?? 0) > 0) {
            $actions[] = $this->linkAction(
                'link.tasks.overdue',
                'Review Overdue Tasks',
                '/tasks?due=overdue',
                'Open the task queue filtered to overdue work.'
            );
        }

        if (($summary['weather_loaded'] ?? false) !== true) {
            $actions[] = $this->linkAction(
                'link.weather.sync',
                'Open Weather',
                '/weather',
                'Sync weather before watering or spraying decisions.'
            );
        }

        foreach (($context['recommendations'] ?? []) as $recommendation) {
            if (! ($recommendation['can_create_task'] ?? false)) {
                continue;
            }

            if (($recommendation['category'] ?? null) === 'profile_completeness') {
                continue;
            }

            $actions[] = $this->taskAction($recommendation);
        }

        if ((int) ($summary['yield_record_count'] ?? 0) > 0) {
            $actions[] = $this->linkAction(
                'link.yield.review',
                'Review Yield',
                '/yield-predictions',
                'Compare predicted and actual harvest records.'
            );
        }

        return collect($actions)
            ->unique('key')
            ->take(5)
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    public function createTaskFromAction(Farm $farm, array $context, string $actionKey): array
    {
        $action = collect($this->build($context))
            ->first(fn (array $item) => $item['key'] === $actionKey);

        if (! $action || ($action['type'] ?? null) !== 'create_task') {
            abort(422, 'This assistant action cannot create a task.');
        }

        $payload = $action['task_payload'];
        $existing = Task::where('farm_id', $farm->id)
            ->where('source', 'ai')
            ->where('title', $payload['title'])
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->first();

        if ($existing) {
            return [
                'created' => false,
                'message' => 'A matching AI task already exists.',
                'task' => $existing->load(['plot', 'crop.plot']),
                'action' => $action,
            ];
        }

        $task = Task::create([
            'farm_id' => $farm->id,
            'plot_id' => $payload['plot_id'] ?? null,
            'crop_id' => $payload['crop_id'] ?? null,
            'title' => $payload['title'],
            'description' => $payload['description'],
            'task_type' => $payload['task_type'],
            'priority' => $payload['priority'],
            'due_on' => $payload['due_on'],
            'status' => 'pending',
            'source' => 'ai',
            'notes' => $payload['notes'],
        ])->load(['plot', 'crop.plot']);

        return [
            'created' => true,
            'message' => 'AI task created.',
            'task' => $task,
            'action' => $action,
        ];
    }

    /**
     * @param  array<string, mixed>  $recommendation
     * @return array<string, mixed>
     */
    private function taskAction(array $recommendation): array
    {
        $title = 'AI: '.$recommendation['title'];
        $category = (string) $recommendation['category'];
        $priority = $this->taskPriority((string) $recommendation['priority']);
        $relatedType = $recommendation['related_type'] ?? null;

        return [
            'key' => 'task.'.$recommendation['key'],
            'type' => 'create_task',
            'label' => 'Create Task',
            'title' => $recommendation['title'],
            'description' => $recommendation['message'],
            'href' => null,
            'task_payload' => [
                'title' => $title,
                'description' => $recommendation['message'],
                'task_type' => $this->taskType($category, (string) $recommendation['title']),
                'priority' => $priority,
                'due_on' => $priority === 'urgent'
                    ? CarbonImmutable::now()->toDateString()
                    : CarbonImmutable::now()->addDay()->toDateString(),
                'crop_id' => $relatedType === 'crop' ? $recommendation['related_id'] : null,
                'plot_id' => $relatedType === 'plot' ? $recommendation['related_id'] : null,
                'notes' => 'Created from SmartFarm AI Assistant action.',
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function linkAction(string $key, string $label, string $href, string $description): array
    {
        return [
            'key' => $key,
            'type' => 'link',
            'label' => $label,
            'title' => $label,
            'description' => $description,
            'href' => $href,
            'task_payload' => null,
        ];
    }

    private function taskPriority(string $priority): string
    {
        return match ($priority) {
            'urgent' => 'urgent',
            'high' => 'high',
            'medium' => 'medium',
            default => 'low',
        };
    }

    private function taskType(string $category, string $title): string
    {
        $title = strtolower($title);

        if (str_contains($title, 'rain') || str_contains($category, 'weather')) {
            return 'irrigation_check';
        }

        if (str_contains($title, 'harvest') || str_contains($category, 'harvest')) {
            return 'harvesting';
        }

        if (str_contains($category, 'plot')) {
            return 'monitoring';
        }

        return 'monitoring';
    }
}
