<?php

namespace App\Services\Yield;

class YieldPredictionService
{
    public function predict(string $cropType, float $farmSizeHectares, int $daysPlanted): array
    {
        // MVP rule-based formula. Replace with ML later.
        $baseYieldPerHectare = match (strtolower($cropType)) {
            'rice', 'palay' => 4200,
            'corn' => 5000,
            'tomato' => 25000,
            default => 3000,
        };

        $growthFactor = min(max($daysPlanted / 90, 0.3), 1.0);
        $predictedYieldKg = $baseYieldPerHectare * $farmSizeHectares * $growthFactor;

        return [
            'predicted_yield_kg' => round($predictedYieldKg, 2),
            'confidence_score' => 65.00,
            'model_name' => 'rule-based-v1',
            'notes' => 'Basic rule-based estimate. Upgrade later with historical farm data.',
        ];
    }
}
