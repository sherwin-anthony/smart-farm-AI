<?php

namespace App\Services\Recommendations;

use App\Models\Crop;
use Carbon\Carbon;

class TaskSuggestionService
{
    public function suggestForCrop(Crop $crop): array
    {
        $daysPlanted = $crop->planted_on
            ? Carbon::parse($crop->planted_on)->diffInDays(now())
            : 0;

        $tasks = [];

        if ($daysPlanted >= 3 && $daysPlanted <= 7) {
            $tasks[] = [
                'title' => 'Check irrigation',
                'task_type' => 'watering',
                'source' => 'system',
            ];
        }

        if ($daysPlanted >= 14) {
            $tasks[] = [
                'title' => 'Review fertilization schedule',
                'task_type' => 'fertilizing',
                'source' => 'system',
            ];
        }

        return $tasks;
    }
}
