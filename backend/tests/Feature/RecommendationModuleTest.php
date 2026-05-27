<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Farm;
use App\Models\Plot;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecommendationModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_recommendations_include_profile_plot_and_missing_task_rules(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $vacantPlot = Plot::create([
            'farm_id' => $farm->id,
            'name' => 'South Plot',
            'status' => 'vacant',
        ]);
        $cropPlot = Plot::create([
            'farm_id' => $farm->id,
            'name' => 'North Plot',
            'status' => 'active',
        ]);
        $crop = Crop::create([
            'plot_id' => $cropPlot->id,
            'name' => 'Corn',
            'status' => 'growing',
            'growth_stage' => 'vegetative',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/recommendations')
            ->assertOk()
            ->assertJsonFragment([
                'key' => 'profile.missing_coordinates',
                'source' => 'profile',
                'priority' => 'high',
                'action_href' => '/farm-profile',
            ])
            ->assertJsonFragment([
                'key' => "plot.{$vacantPlot->id}.available",
                'source' => 'plot',
                'category' => 'plot_planning',
                'action_href' => '/plots',
            ])
            ->assertJsonFragment([
                'key' => "task.crop.{$crop->id}.none_open",
                'source' => 'task',
                'category' => 'task_planning',
                'action_href' => '/tasks',
            ]);
    }

    public function test_recommendations_include_overdue_task_rules(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => 'Main Farm',
            'latitude' => 15,
            'longitude' => 120,
        ]);

        $task = Task::create([
            'farm_id' => $farm->id,
            'title' => 'Apply fertilizer',
            'task_type' => 'fertilizing',
            'priority' => 'high',
            'status' => 'pending',
            'source' => 'manual',
            'due_on' => now()->subDay()->toDateString(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/recommendations')
            ->assertOk()
            ->assertJsonFragment([
                'key' => "task.{$task->id}.overdue",
                'title' => 'Overdue task: Apply fertilizer',
                'source' => 'task',
                'priority' => 'urgent',
                'category' => 'overdue_task',
            ]);
    }

    public function test_task_can_be_created_from_taskable_recommendation(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => 'Main Farm',
            'latitude' => 15,
            'longitude' => 120,
        ]);
        $plot = Plot::create(['farm_id' => $farm->id, 'name' => 'North Plot']);
        $crop = Crop::create([
            'plot_id' => $plot->id,
            'name' => 'Corn',
            'status' => 'growing',
            'growth_stage' => 'vegetative',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/recommendations/tasks', [
                'key' => "task.crop.{$crop->id}.none_open",
            ])
            ->assertOk()
            ->assertJsonPath('created', true)
            ->assertJsonPath('task.title', 'Recommendation: Corn has no open tasks')
            ->assertJsonPath('task.source', 'system')
            ->assertJsonPath('task.crop_id', $crop->id)
            ->assertJsonPath('task.plot_id', $plot->id);

        $this->assertDatabaseHas('tasks', [
            'farm_id' => $farm->id,
            'crop_id' => $crop->id,
            'plot_id' => $plot->id,
            'title' => 'Recommendation: Corn has no open tasks',
            'task_type' => 'monitoring',
            'status' => 'pending',
        ]);
    }

    public function test_recommendation_task_creation_skips_duplicates(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => 'Main Farm',
            'latitude' => 15,
            'longitude' => 120,
        ]);
        $plot = Plot::create(['farm_id' => $farm->id, 'name' => 'North Plot']);
        $crop = Crop::create([
            'plot_id' => $plot->id,
            'name' => 'Corn',
            'status' => 'growing',
            'growth_stage' => 'vegetative',
        ]);

        $payload = ['key' => "task.crop.{$crop->id}.none_open"];

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/recommendations/tasks', $payload)
            ->assertOk()
            ->assertJsonPath('created', true);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/recommendations/tasks', $payload)
            ->assertOk()
            ->assertJsonPath('created', false)
            ->assertJsonPath('message', 'A matching recommendation task already exists.');

        $this->assertSame(
            1,
            Task::where('farm_id', $farm->id)
                ->where('title', 'Recommendation: Corn has no open tasks')
                ->count()
        );
    }

    public function test_non_taskable_recommendation_cannot_create_task(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => 'Main Farm',
            'latitude' => 15,
            'longitude' => 120,
        ]);
        $task = Task::create([
            'farm_id' => $farm->id,
            'title' => 'Apply fertilizer',
            'task_type' => 'fertilizing',
            'priority' => 'high',
            'status' => 'pending',
            'source' => 'manual',
            'due_on' => now()->subDay()->toDateString(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/recommendations/tasks', [
                'key' => "task.{$task->id}.overdue",
            ])
            ->assertStatus(422)
            ->assertJsonPath('created', false);
    }
}
