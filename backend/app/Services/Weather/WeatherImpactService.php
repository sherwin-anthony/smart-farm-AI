<?php

namespace App\Services\Weather;

use App\Models\Farm;
use Carbon\CarbonImmutable;
use Illuminate\Support\Collection;

class WeatherImpactService
{
    private const RAIN_RISK_MM = 5;
    private const HEAVY_RAIN_MM = 15;
    private const RAIN_RISK_PROBABILITY = 60;
    private const HEAT_RISK_C = 35;
    private const WIND_RISK_KPH = 30;

    /**
     * @param  Collection<int, \App\Models\WeatherForecast>  $forecasts
     * @return array<int, array<string, mixed>>
     */
    public function build(Farm $farm, Collection $forecasts): array
    {
        if ($forecasts->isEmpty()) {
            return [];
        }

        $impacts = [];

        foreach ($forecasts as $forecast) {
            $date = $forecast->forecast_date?->toDateString() ?? (string) $forecast->forecast_date;
            $rainMm = (float) ($forecast->rain_mm ?? 0);
            $rainProbability = (int) ($forecast->rain_probability ?? 0);
            $temperature = (float) ($forecast->temperature_max_c ?? $forecast->temperature_c ?? 0);
            $windKph = (float) ($forecast->wind_kph ?? 0);

            if ($rainMm >= self::HEAVY_RAIN_MM) {
                $impacts[] = $this->impact(
                    'heavy-rain-'.$date,
                    'high',
                    'Heavy rain expected',
                    'Inspect drainage and avoid scheduling field work that depends on dry soil.',
                    'Prepare drainage paths and postpone non-urgent watering.',
                    $date
                );
            } elseif ($rainMm >= self::RAIN_RISK_MM || $rainProbability >= self::RAIN_RISK_PROBABILITY) {
                $impacts[] = $this->impact(
                    'rain-'.$date,
                    'medium',
                    'Rain likely',
                    'Watering may not be needed if rainfall arrives as forecast.',
                    'Check soil moisture before irrigating.',
                    $date
                );
            }

            if ($temperature >= self::HEAT_RISK_C) {
                $impacts[] = $this->impact(
                    'heat-'.$date,
                    'high',
                    'High heat forecast',
                    'Crops may need closer moisture monitoring during the hottest part of the day.',
                    'Increase irrigation checks and watch for wilting.',
                    $date
                );
            }

            if ($windKph >= self::WIND_RISK_KPH) {
                $impacts[] = $this->impact(
                    'wind-'.$date,
                    $windKph >= 40 ? 'high' : 'medium',
                    'Strong wind expected',
                    'Spraying can drift and become less effective in windy conditions.',
                    'Avoid spraying and secure lightweight equipment.',
                    $date
                );
            }
        }

        $impacts = array_merge($impacts, $this->buildHarvestRainImpacts($farm, $forecasts));

        if ($impacts === []) {
            return [
                $this->impact(
                    'stable-forecast',
                    'low',
                    'No major weather risks',
                    'The saved forecast does not show rain, heat, or wind risks that require immediate changes.',
                    'Continue with planned farm tasks.',
                    null
                ),
            ];
        }

        return collect($impacts)
            ->unique('key')
            ->sortBy([
                fn (array $impact) => -$this->severityRank($impact['severity']),
                fn (array $impact) => $impact['forecast_date'] ?? '9999-12-31',
            ])
            ->values()
            ->take(8)
            ->all();
    }

    /**
     * @param  Collection<int, \App\Models\WeatherForecast>  $forecasts
     * @return array<int, array<string, mixed>>
     */
    private function buildHarvestRainImpacts(Farm $farm, Collection $forecasts): array
    {
        $rainyDates = $forecasts
            ->filter(fn ($forecast) => (float) ($forecast->rain_mm ?? 0) >= self::RAIN_RISK_MM
                || (int) ($forecast->rain_probability ?? 0) >= self::RAIN_RISK_PROBABILITY)
            ->map(fn ($forecast) => CarbonImmutable::parse($forecast->forecast_date)->startOfDay());

        if ($rainyDates->isEmpty()) {
            return [];
        }

        return $farm->crops()
            ->whereNotIn('crops.status', ['harvested', 'failed'])
            ->whereNotNull('crops.expected_harvest_on')
            ->get()
            ->flatMap(function ($crop) use ($rainyDates) {
                $harvestDate = CarbonImmutable::parse($crop->expected_harvest_on)->startOfDay();

                return $rainyDates
                    ->filter(fn (CarbonImmutable $rainDate) => abs($harvestDate->diffInDays($rainDate, false)) <= 3)
                    ->map(fn (CarbonImmutable $rainDate) => $this->impact(
                        'harvest-rain-'.$crop->id.'-'.$rainDate->toDateString(),
                        'medium',
                        'Rain near '.$crop->name.' harvest',
                        'Rain is forecast close to this crop harvest window.',
                        'Inspect maturity and prepare drying, storage, or schedule changes.',
                        $rainDate->toDateString(),
                        'crop',
                        $crop->id,
                        $crop->plot_id
                    ));
            })
            ->all();
    }

    private function impact(
        string $key,
        string $severity,
        string $title,
        string $message,
        string $action,
        ?string $forecastDate,
        string $source = 'weather',
        ?int $cropId = null,
        ?int $plotId = null
    ): array {
        return [
            'key' => $key,
            'severity' => $severity,
            'title' => $title,
            'message' => $message,
            'action' => $action,
            'forecast_date' => $forecastDate,
            'source' => $source,
            'crop_id' => $cropId,
            'plot_id' => $plotId,
        ];
    }

    private function severityRank(string $severity): int
    {
        return match ($severity) {
            'high' => 3,
            'medium' => 2,
            'low' => 1,
            default => 0,
        };
    }
}
