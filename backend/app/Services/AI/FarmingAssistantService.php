<?php

namespace App\Services\AI;

use Illuminate\Support\Facades\Http;
use Throwable;

class FarmingAssistantService
{
    /**
     * @param  array<string, mixed>  $context
     * @param  array<int, array{role: string, content: string}>  $history
     * @return array<string, mixed>
     */
    public function reply(string $message, array $context = [], array $history = []): array
    {
        $apiKey = config('services.groq.api_key');

        if (! $apiKey) {
            return $this->localReply($message, $context, 'groq_not_configured');
        }

        try {
            $response = Http::baseUrl(config('services.groq.base_url'))
                ->withToken($apiKey)
                ->acceptJson()
                ->timeout(25)
                ->post('/chat/completions', [
                    'model' => config('services.groq.model'),
                    'messages' => $this->messages($message, $context, $history),
                    'temperature' => 0.35,
                    'max_completion_tokens' => 700,
                    'top_p' => 1,
                    'stream' => false,
                ])
                ->throw();

            $reply = data_get($response->json(), 'choices.0.message.content');

            if (! is_string($reply) || trim($reply) === '') {
                return $this->localReply($message, $context, 'empty_groq_response');
            }

            return [
                'reply' => trim($reply),
                'provider' => 'groq',
                'model' => config('services.groq.model'),
                'context_used' => $context['summary'] ?? [],
            ];
        } catch (Throwable) {
            return $this->localReply($message, $context, 'groq_unavailable');
        }
    }

    /**
     * @param  array<string, mixed>  $context
     * @param  array<int, array{role: string, content: string}>  $history
     * @return array<int, array{role: string, content: string}>
     */
    private function messages(string $message, array $context, array $history): array
    {
        $messages = [
            [
                'role' => 'system',
                'content' => implode("\n", [
                    'You are the SmartFarm AI Assistant.',
                    'Use only the provided farm context. Do not invent crops, tasks, weather, or yield data.',
                    'Give short, practical, action-focused farming guidance.',
                    'Mention exact crop, plot, task, weather, or yield names when the context includes them.',
                    'If data is missing, say what is missing and what the farmer should update.',
                    'Avoid generic agriculture lectures. Answer like a concise farm operations teammate.',
                    'For pesticide/chemical dosage, avoid exact unsafe instructions and advise checking product labels or local experts.',
                ]),
            ],
            [
                'role' => 'system',
                'content' => 'Current authenticated farm context JSON: '
                    .json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
            ],
        ];

        foreach (array_slice($history, -8) as $item) {
            if (! in_array($item['role'], ['user', 'assistant'], true)) {
                continue;
            }

            $messages[] = [
                'role' => $item['role'],
                'content' => mb_substr($item['content'], 0, 1200),
            ];
        }

        $messages[] = [
            'role' => 'user',
            'content' => $message,
        ];

        return $messages;
    }

    /**
     * @param  array<string, mixed>  $context
     * @return array<string, mixed>
     */
    private function localReply(string $message, array $context, string $reason): array
    {
        $summary = $context['summary'] ?? [];
        $farm = $context['farm']['name'] ?? 'your farm';
        $openTasks = (int) ($summary['open_task_count'] ?? 0);
        $overdueTasks = (int) ($summary['overdue_task_count'] ?? 0);
        $cropCount = (int) ($summary['crop_count'] ?? 0);
        $weatherLoaded = (bool) ($summary['weather_loaded'] ?? false);
        $recommendations = collect($context['recommendations'] ?? [])->take(3);

        $lines = [
            "I checked {$farm}'s saved data for: {$message}",
            "{$cropCount} crop".($cropCount === 1 ? '' : 's')." are on record, with {$openTasks} open task".($openTasks === 1 ? '' : 's').'.',
        ];

        if ($overdueTasks > 0) {
            $lines[] = "Prioritize {$overdueTasks} overdue task".($overdueTasks === 1 ? '' : 's').' first.';
        }

        if (! $weatherLoaded) {
            $lines[] = 'Weather is not loaded yet, so sync weather before making watering or spraying decisions.';
        }

        foreach ($recommendations as $item) {
            $lines[] = "{$item['title']}: {$item['message']}";
        }

        return [
            'reply' => implode("\n", $lines),
            'provider' => 'local_fallback',
            'model' => null,
            'fallback_reason' => $reason,
            'context_used' => $summary,
        ];
    }
}
