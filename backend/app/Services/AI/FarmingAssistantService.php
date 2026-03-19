<?php

namespace App\Services\AI;

class FarmingAssistantService
{
    public function reply(string $message, array $context = []): array
    {
        // Start with a placeholder so the structure exists before OpenAI wiring.
        // Later this method can call OpenAI with farm, crop, weather, and task context.
        return [
            'reply' => 'Assistant service placeholder. Wire OpenAI here next.',
            'context_used' => $context,
        ];
    }
}
