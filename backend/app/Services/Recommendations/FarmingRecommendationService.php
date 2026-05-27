<?php

namespace App\Services\Recommendations;

use App\Models\Farm;
use App\Models\WeatherForecast;
use Carbon\Carbon;

class FarmingRecommendationService
{
    public function build(Farm $farm, ?WeatherForecast $forecast = null): array
    {
        $messages = [];
        $crops = $farm->crops()->with('tasks')->get();

        if ($forecast && $forecast->rain_mm !== null && $forecast->rain_mm > 5) {
            $messages[] = 'Rain expected soon, skip watering for now.';
        }

        if ($forecast && $forecast->temperature_c !== null && $forecast->temperature_c >= 35) {
            $messages[] = 'High heat expected, increase irrigation monitoring.';
        }

        foreach ($crops as $crop) {
            if ($crop->expected_harvest_on && $crop->status !== 'harvested') {
                $daysUntilHarvest = now()
                    ->startOfDay()
                    ->diffInDays(Carbon::parse($crop->expected_harvest_on)->startOfDay(), false);

                // Positive values mean the crop is still approaching harvest.
                if ($daysUntilHarvest >= 0 && $daysUntilHarvest <= 14) {
                    $messages[] = "{$crop->name} is within 14 days of expected harvest. Inspect maturity and prepare harvest tasks.";
                }

                if ($daysUntilHarvest < 0) {
                    $messages[] = "{$crop->name} is past the expected harvest date. Review crop condition and update its status.";
                }
            }

            $pendingTasks = $crop->tasks->where('status', 'pending')->count();

            if ($pendingTasks > 0) {
                $messages[] = "{$crop->name} has {$pendingTasks} pending task" . ($pendingTasks === 1 ? '' : 's') . '. Check the task board before adding new field work.';
            }
        }

        if (empty($messages)) {
            $messages[] = 'No major weather alerts. Continue normal farm monitoring.';
        }

        return $messages;
    }
}
