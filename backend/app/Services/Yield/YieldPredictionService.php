<?php

namespace App\Services\Yield;

use App\Models\Crop;
use Carbon\CarbonImmutable;

class YieldPredictionService
{
    public function predictForCrop(Crop $crop, ?float $areaHectares = null, ?int $daysPlanted = null): array
    {
        $crop->loadMissing('plot');

        $area = $areaHectares ?: (float) ($crop->plot?->area_hectares ?: 1);
        $days = $daysPlanted ?? $this->daysPlanted($crop);
        $baseYieldPerHectare = $this->baseYieldPerHectare($crop);
        $growthFactor = $this->growthFactor($crop, $days);
        $predictedYieldKg = $baseYieldPerHectare * $area * $growthFactor;
        $confidence = $this->confidenceScore($crop, $areaHectares, $daysPlanted);

        return [
            'predicted_yield_kg' => round($predictedYieldKg, 2),
            'confidence_score' => $confidence,
            'model_name' => 'rule-based-yield-v1',
            'farm_size_hectares' => round($area, 2),
            'days_planted' => $days,
            'notes' => $this->notes($crop, $baseYieldPerHectare, $growthFactor),
            'input_payload' => [
                'crop_name' => $crop->name,
                'crop_type' => $crop->type,
                'growth_stage' => $crop->growth_stage,
                'plot_area_hectares' => $crop->plot?->area_hectares,
                'used_area_hectares' => round($area, 2),
                'days_planted' => $days,
                'base_yield_per_hectare' => $baseYieldPerHectare,
                'growth_factor' => $growthFactor,
            ],
        ];
    }

    public function predict(string $cropType, float $farmSizeHectares, int $daysPlanted): array
    {
        $baseYieldPerHectare = $this->baseYieldForName($cropType);
        $growthFactor = min(max($daysPlanted / 90, 0.3), 1.0);
        $predictedYieldKg = $baseYieldPerHectare * $farmSizeHectares * $growthFactor;

        return [
            'predicted_yield_kg' => round($predictedYieldKg, 2),
            'confidence_score' => 55.00,
            'model_name' => 'rule-based-yield-v1',
            'farm_size_hectares' => round($farmSizeHectares, 2),
            'days_planted' => $daysPlanted,
            'notes' => 'Basic rule-based estimate from crop type, area, and days planted.',
            'input_payload' => [
                'crop_type' => $cropType,
                'used_area_hectares' => round($farmSizeHectares, 2),
                'days_planted' => $daysPlanted,
                'base_yield_per_hectare' => $baseYieldPerHectare,
                'growth_factor' => $growthFactor,
            ],
        ];
    }

    private function baseYieldPerHectare(Crop $crop): float
    {
        return $this->baseYieldForName($crop->type ?: $crop->name);
    }

    private function baseYieldForName(string $name): float
    {
        $normalized = strtolower($name);

        return match (true) {
            str_contains($normalized, 'rice'), str_contains($normalized, 'palay') => 4200,
            str_contains($normalized, 'corn'), str_contains($normalized, 'maize') => 5000,
            str_contains($normalized, 'tomato') => 25000,
            str_contains($normalized, 'eggplant') => 18000,
            str_contains($normalized, 'pepper') => 12000,
            str_contains($normalized, 'onion') => 10000,
            default => 3000,
        };
    }

    private function growthFactor(Crop $crop, int $daysPlanted): float
    {
        $stageFactor = match ($crop->growth_stage) {
            'seed' => 0.35,
            'seedling' => 0.45,
            'vegetative' => 0.65,
            'flowering' => 0.78,
            'fruiting' => 0.88,
            'maturing' => 0.96,
            'harvest' => 1.0,
            default => null,
        };

        return $stageFactor ?? min(max($daysPlanted / 90, 0.3), 1.0);
    }

    private function confidenceScore(Crop $crop, ?float $areaHectares, ?int $daysPlanted): float
    {
        $score = 45;

        if ($crop->type || $crop->name) {
            $score += 15;
        }

        if ($areaHectares || $crop->plot?->area_hectares) {
            $score += 15;
        }

        if ($crop->growth_stage) {
            $score += 10;
        }

        if ($daysPlanted !== null || $crop->planted_on) {
            $score += 10;
        }

        if ($crop->expected_harvest_on) {
            $score += 5;
        }

        return min(95, $score);
    }

    private function daysPlanted(Crop $crop): int
    {
        if (! $crop->planted_on) {
            return 0;
        }

        return max(
            0,
            CarbonImmutable::parse($crop->planted_on)->startOfDay()
                ->diffInDays(CarbonImmutable::now()->startOfDay())
        );
    }

    private function notes(Crop $crop, float $baseYieldPerHectare, float $growthFactor): string
    {
        return "Rule-based estimate using {$crop->growth_stage} stage, "
            .number_format($baseYieldPerHectare).' kg/ha baseline, and '
            .round($growthFactor * 100).'% maturity factor.';
    }
}
