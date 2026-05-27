<?php

namespace App\Services\Weather;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Http;

class WeatherService
{
    public function fetchDailyForecast(float $latitude, float $longitude): array
    {
        $response = Http::baseUrl(config('services.weather.base_url'))
            ->get('/forecast', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'current' => implode(',', [
                    'temperature_2m',
                    'relative_humidity_2m',
                    'precipitation',
                    'wind_speed_10m',
                    'weather_code',
                ]),
                'daily' => implode(',', [
                    'weather_code',
                    'temperature_2m_max',
                    'temperature_2m_min',
                    'precipitation_sum',
                    'precipitation_probability_max',
                    'wind_speed_10m_max',
                ]),
                'forecast_days' => 7,
                'timezone' => 'auto',
            ])
            ->throw();

        return $this->normalizeForecast($response->json());
    }

    private function normalizeForecast(array $payload): array
    {
        $daily = $payload['daily'] ?? [];
        $dates = $daily['time'] ?? [];
        $current = $payload['current'] ?? [];
        $today = CarbonImmutable::now()->toDateString();
        $fetchedAt = CarbonImmutable::now();

        return collect($dates)
            ->map(function (string $date, int $index) use ($daily, $current, $today, $payload, $fetchedAt): array {
                $weatherCode = $this->valueAt($daily, 'weather_code', $index);
                $isToday = $date === $today;

                return [
                    'forecast_date' => $date,
                    'summary' => $this->summaryForCode($weatherCode),
                    'temperature_c' => $isToday
                        ? $this->nullableFloat($current['temperature_2m'] ?? null)
                        : $this->averageTemperature(
                            $this->valueAt($daily, 'temperature_2m_min', $index),
                            $this->valueAt($daily, 'temperature_2m_max', $index)
                        ),
                    'temperature_min_c' => $this->nullableFloat($this->valueAt($daily, 'temperature_2m_min', $index)),
                    'temperature_max_c' => $this->nullableFloat($this->valueAt($daily, 'temperature_2m_max', $index)),
                    'rain_mm' => $this->nullableFloat($this->valueAt($daily, 'precipitation_sum', $index)),
                    'rain_probability' => $this->nullableInt($this->valueAt($daily, 'precipitation_probability_max', $index)),
                    'humidity' => $isToday ? $this->nullableInt($current['relative_humidity_2m'] ?? null) : null,
                    'wind_kph' => $isToday
                        ? $this->nullableFloat($current['wind_speed_10m'] ?? null)
                        : $this->nullableFloat($this->valueAt($daily, 'wind_speed_10m_max', $index)),
                    'weather_code' => $this->nullableInt($weatherCode),
                    'raw_payload' => [
                        'current' => $isToday ? $current : null,
                        'daily' => collect($daily)->mapWithKeys(fn ($values, $key) => [
                            $key => is_array($values) ? ($values[$index] ?? null) : $values,
                        ])->all(),
                        'timezone' => $payload['timezone'] ?? null,
                    ],
                    'fetched_at' => $fetchedAt,
                ];
            })
            ->all();
    }

    private function valueAt(array $data, string $key, int $index): mixed
    {
        return $data[$key][$index] ?? null;
    }

    private function averageTemperature(mixed $min, mixed $max): ?float
    {
        if ($min === null || $max === null) {
            return null;
        }

        return round(((float) $min + (float) $max) / 2, 2);
    }

    private function nullableFloat(mixed $value): ?float
    {
        return $value === null ? null : (float) $value;
    }

    private function nullableInt(mixed $value): ?int
    {
        return $value === null ? null : (int) $value;
    }

    private function summaryForCode(mixed $code): string
    {
        if ($code === null) {
            return 'Forecast available';
        }

        return match ((int) $code) {
            0 => 'Clear sky',
            1, 2, 3 => 'Partly cloudy',
            45, 48 => 'Fog',
            51, 53, 55, 56, 57 => 'Drizzle',
            61, 63, 65, 66, 67 => 'Rain',
            71, 73, 75, 77 => 'Snow',
            80, 81, 82 => 'Rain showers',
            85, 86 => 'Snow showers',
            95, 96, 99 => 'Thunderstorm',
            default => 'Forecast available',
        };
    }
}
