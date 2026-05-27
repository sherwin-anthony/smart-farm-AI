<?php

namespace App\Services\AI;

class FarmingAssistantService
{
    public function reply(string $message, array $context = []): array
    {
        $cropCount = count($context['crops'] ?? []);
        $pendingTaskCount = count($context['pending_tasks'] ?? []);

        // This local reply keeps the assistant crop-aware before the external OpenAI call is wired.
        return [
            'reply' => "I can see {$cropCount} crop" . ($cropCount === 1 ? '' : 's') . " and {$pendingTaskCount} pending task" . ($pendingTaskCount === 1 ? '' : 's') . ". Based on your message: {$message}",
            'context_used' => $context,
        ];
    }
}
