<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Farm;
use App\Models\Plot;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CropModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_crop_generates_starter_tasks(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Test Farm']);
        $plot = Plot::create(['farm_id' => $farm->id, 'name' => 'North Plot']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/crops', [
            'plot_id' => $plot->id,
            'name' => 'Tomato',
            'type' => 'tomato',
            'planted_on' => '2026-05-01',
            'expected_harvest_on' => '2026-06-30',
        ]);

        $response->assertCreated();

        $crop = Crop::firstOrFail();

        // The crop module should immediately create operational tasks for the new crop.
        $this->assertSame(6, Task::where('crop_id', $crop->id)->count());
        $this->assertDatabaseHas('tasks', [
            'crop_id' => $crop->id,
            'title' => 'Harvest readiness check',
            'source' => 'auto_crop',
        ]);
    }

    public function test_crop_cannot_be_created_on_another_users_plot(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Farm::create(['user_id' => $user->id, 'name' => 'User Farm']);
        $otherFarm = Farm::create(['user_id' => $otherUser->id, 'name' => 'Other Farm']);
        $otherPlot = Plot::create(['farm_id' => $otherFarm->id, 'name' => 'Other Plot']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/crops', [
            'plot_id' => $otherPlot->id,
            'name' => 'Corn',
        ]);

        // Farm scoping must block crops from attaching to plots outside the logged-in farm.
        $response->assertStatus(422);
        $this->assertDatabaseMissing('crops', ['name' => 'Corn']);
    }
}
