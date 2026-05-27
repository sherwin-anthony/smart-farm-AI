<?php

namespace App\Services\Crops;

use App\Models\Crop;
use App\Models\Task;
use Carbon\Carbon;

class CropTaskGenerator
{
    public function generateForNewCrop(Crop $crop): void
    {
        $plot = $crop->plot;
        $anchorDate = $crop->planted_on
            ? Carbon::parse($crop->planted_on)
            : now();

        $tasks = [
            [
                'title' => 'Initial crop check',
                'task_type' => 'monitoring',
                'due_on' => $anchorDate->copy(),
                'notes' => 'Confirm the crop was planted correctly and the plot is ready for monitoring.',
            ],
            [
                'title' => 'Irrigation check',
                'task_type' => 'watering',
                'due_on' => $anchorDate->copy()->addDays(3),
                'notes' => 'Check soil moisture and confirm the crop is receiving enough water.',
            ],
            [
                'title' => 'Growth monitoring',
                'task_type' => 'monitoring',
                'due_on' => $anchorDate->copy()->addDays(7),
                'notes' => 'Review crop progress and update the growth stage if needed.',
            ],
            [
                'title' => 'Fertilizer schedule review',
                'task_type' => 'fertilizing',
                'due_on' => $anchorDate->copy()->addDays(14),
                'notes' => 'Review whether the crop needs fertilizer based on its growth stage.',
            ],
        ];

        if ($crop->expected_harvest_on) {
            $harvestDate = Carbon::parse($crop->expected_harvest_on);

            // Harvest-based tasks use the expected harvest date so the work appears before it matters.
            $tasks[] = [
                'title' => 'Harvest preparation',
                'task_type' => 'harvest',
                'due_on' => $harvestDate->copy()->subDays(14),
                'notes' => 'Prepare tools, labor, and storage before the expected harvest window.',
            ];

            $tasks[] = [
                'title' => 'Harvest readiness check',
                'task_type' => 'harvest',
                'due_on' => $harvestDate->copy(),
                'notes' => 'Inspect the crop and decide whether it is ready to harvest.',
            ];
        }

        foreach ($tasks as $task) {
            // firstOrCreate keeps auto-generated tasks idempotent if this service is called again later.
            Task::firstOrCreate(
                [
                    'farm_id' => $plot?->farm_id,
                    'plot_id' => $crop->plot_id,
                    'crop_id' => $crop->id,
                    'source' => 'auto_crop',
                    'title' => $task['title'],
                ],
                [
                    'priority' => 'medium',
                    'task_type' => $task['task_type'],
                    'due_on' => $task['due_on']->toDateString(),
                    'status' => 'pending',
                    'notes' => $task['notes'],
                ]
            );
        }
    }
}
