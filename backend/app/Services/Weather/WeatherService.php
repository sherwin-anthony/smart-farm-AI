<?php

namespace App\Services\Weather;

use Illuminate\Support\Facades\Http;

class WeatherService
{
    public function fetchDailyForecast(float $latitude, float $longitude): array
    {
        // Replace this query shape if you pick another weather provider.
        $response = Http::baseUrl(config('services.weather.base_url'))
            ->get('/forecast', [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'daily' => 'temperature_2m_max,precipitation_sum,windspeed_10m_max',
                'timezone' => 'auto',
            ])
            ->throw();

        return $response->json();
    }
}
