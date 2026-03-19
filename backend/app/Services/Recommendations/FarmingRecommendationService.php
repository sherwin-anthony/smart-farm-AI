<?php

namespace App\Services\Recommendations;

use App\Models\Farm;
use App\Models\WeatherForecast;

class FarmingRecommendationService
{
    public function build(Farm $farm, ?WeatherForecast $forecast = null): array
    {
        $messages = [];

        if ($forecast && $forecast->rain_mm !== null && $forecast->rain_mm > 5) {
            $messages[] = 'Rain expected soon, skip watering for now.';
        }

        if ($forecast && $forecast->temperature_c !== null && $forecast->temperature_c >= 35) {
            $messages[] = 'High heat expected, increase irrigation monitoring.';
        }

        if (empty($messages)) {
            $messages[] = 'No major weather alerts. Continue normal farm monitoring.';
        }

        return $messages;
    }
}
