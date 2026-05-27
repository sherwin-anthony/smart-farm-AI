<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Farm;
use App\Models\Plot;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_farm_wide_task_can_be_created_without_plot_or_crop(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/tasks', [
            'title' => 'Inspect irrigation pump',
            'task_type' => 'monitoring',
            'priority' => 'high',
            'status' => 'pending',
            'source' => 'manual',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('farm_id', $farm->id)
            ->assertJsonPath('plot_id', null)
            ->assertJsonPath('crop_id', null)
            ->assertJsonPath('priority', 'high');

        $this->assertDatabaseHas('tasks', [
            'farm_id' => $farm->id,
            'plot_id' => null,
            'crop_id' => null,
            'title' => 'Inspect irrigation pump',
        ]);
    }

    public function test_plot_task_must_use_a_plot_from_the_current_farm(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $plot = Plot::create(['farm_id' => $farm->id, 'name' => 'North Plot']);
        $otherFarm = Farm::create(['user_id' => $otherUser->id, 'name' => 'Other Farm']);
        $otherPlot = Plot::create(['farm_id' => $otherFarm->id, 'name' => 'Other Plot']);

        $this->actingAs($user, 'sanctum')->postJson('/api/tasks', [
            'plot_id' => $plot->id,
            'title' => 'Prepare bed',
            'task_type' => 'weeding',
            'priority' => 'medium',
        ])->assertCreated();

        $this->actingAs($user, 'sanctum')->postJson('/api/tasks', [
            'plot_id' => $otherPlot->id,
            'title' => 'Wrong farm plot',
            'task_type' => 'weeding',
            'priority' => 'medium',
        ])->assertStatus(422);

        $this->assertDatabaseMissing('tasks', ['title' => 'Wrong farm plot']);
    }

    public function test_crop_task_infers_plot_and_rejects_mismatched_plot(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $cropPlot = Plot::create(['farm_id' => $farm->id, 'name' => 'Crop Plot']);
        $otherPlot = Plot::create(['farm_id' => $farm->id, 'name' => 'Other Plot']);
        $crop = Crop::create(['plot_id' => $cropPlot->id, 'name' => 'Rice']);

        $this->actingAs($user, 'sanctum')->postJson('/api/tasks', [
            'crop_id' => $crop->id,
            'title' => 'Check rice growth',
            'task_type' => 'monitoring',
            'priority' => 'medium',
        ])
            ->assertCreated()
            ->assertJsonPath('plot_id', $cropPlot->id)
            ->assertJsonPath('crop_id', $crop->id);

        $this->actingAs($user, 'sanctum')->postJson('/api/tasks', [
            'plot_id' => $otherPlot->id,
            'crop_id' => $crop->id,
            'title' => 'Mismatched crop plot',
            'task_type' => 'monitoring',
            'priority' => 'medium',
        ])->assertStatus(422);

        $this->assertDatabaseMissing('tasks', ['title' => 'Mismatched crop plot']);
    }

    public function test_task_index_is_farm_scoped_and_can_filter_overdue_tasks(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $otherFarm = Farm::create(['user_id' => $otherUser->id, 'name' => 'Other Farm']);

        Task::create([
            'farm_id' => $farm->id,
            'title' => 'Overdue task',
            'task_type' => 'monitoring',
            'priority' => 'urgent',
            'status' => 'pending',
            'source' => 'manual',
            'due_on' => now()->subDay()->toDateString(),
        ]);

        Task::create([
            'farm_id' => $farm->id,
            'title' => 'Completed old task',
            'task_type' => 'monitoring',
            'priority' => 'low',
            'status' => 'completed',
            'source' => 'manual',
            'due_on' => now()->subDay()->toDateString(),
            'completed_at' => now(),
        ]);

        Task::create([
            'farm_id' => $otherFarm->id,
            'title' => 'Other farm task',
            'task_type' => 'monitoring',
            'priority' => 'urgent',
            'status' => 'pending',
            'source' => 'manual',
            'due_on' => now()->subDay()->toDateString(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/tasks?overdue=1')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'Overdue task');
    }

    public function test_marking_task_complete_sets_completed_timestamp(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $task = Task::create([
            'farm_id' => $farm->id,
            'title' => 'Finish scouting',
            'task_type' => 'monitoring',
            'priority' => 'medium',
            'status' => 'pending',
            'source' => 'manual',
        ]);

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/tasks/{$task->id}", ['status' => 'completed'])
            ->assertOk()
            ->assertJsonPath('status', 'completed');

        $this->assertNotNull($task->fresh()->completed_at);
    }
}
