<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Farm;
use App\Models\Plot;
use App\Models\User;
use App\Models\YieldPrediction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class YieldModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_prediction_can_be_created_for_current_farm_crop(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $plot = Plot::create(['farm_id' => $farm->id, 'name' => 'North Plot', 'area_hectares' => 2]);
        $crop = Crop::create([
            'plot_id' => $plot->id,
            'name' => 'Rice',
            'type' => 'rice',
            'status' => 'growing',
            'growth_stage' => 'maturing',
            'planted_on' => now()->subDays(80)->toDateString(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/yield-predictions', [
                'crop_id' => $crop->id,
            ])
            ->assertCreated()
            ->assertJsonPath('farm_id', $farm->id)
            ->assertJsonPath('plot_id', $plot->id)
            ->assertJsonPath('crop_id', $crop->id)
            ->assertJsonPath('prediction_status', 'predicted');

        $this->assertDatabaseHas('yield_predictions', [
            'farm_id' => $farm->id,
            'plot_id' => $plot->id,
            'crop_id' => $crop->id,
        ]);
    }

    public function test_prediction_rejects_crop_from_another_farm(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $otherFarm = Farm::create(['user_id' => $otherUser->id, 'name' => 'Other Farm']);
        $otherPlot = Plot::create(['farm_id' => $otherFarm->id, 'name' => 'Other Plot']);
        $otherCrop = Crop::create(['plot_id' => $otherPlot->id, 'name' => 'Other Rice']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/yield-predictions', [
                'crop_id' => $otherCrop->id,
            ])
            ->assertStatus(422);
    }

    public function test_actual_yield_can_be_recorded_and_is_farm_scoped(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $plot = Plot::create(['farm_id' => $farm->id, 'name' => 'North Plot']);
        $crop = Crop::create(['plot_id' => $plot->id, 'name' => 'Corn']);
        $prediction = YieldPrediction::create([
            'farm_id' => $farm->id,
            'plot_id' => $plot->id,
            'crop_id' => $crop->id,
            'farm_size_hectares' => 1,
            'days_planted' => 90,
            'predicted_yield_kg' => 5000,
            'prediction_status' => 'predicted',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/yield-predictions/{$prediction->id}/record-actual", [
                'actual_yield_kg' => 5400,
                'harvested_on' => '2026-05-27',
            ])
            ->assertOk()
            ->assertJsonPath('actual_yield_kg', 5400)
            ->assertJsonPath('prediction_status', 'harvested')
            ->assertJsonPath('harvested_on', '2026-05-27T00:00:00.000000Z');

        $this->assertDatabaseHas('yield_predictions', [
            'id' => $prediction->id,
            'actual_yield_kg' => 5400,
            'prediction_status' => 'harvested',
        ]);
    }

    public function test_index_update_and_delete_are_farm_scoped(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $otherFarm = Farm::create(['user_id' => $otherUser->id, 'name' => 'Other Farm']);

        $prediction = YieldPrediction::create([
            'farm_id' => $farm->id,
            'farm_size_hectares' => 1,
            'days_planted' => 90,
            'predicted_yield_kg' => 5000,
            'prediction_status' => 'predicted',
        ]);

        YieldPrediction::create([
            'farm_id' => $otherFarm->id,
            'farm_size_hectares' => 1,
            'days_planted' => 90,
            'predicted_yield_kg' => 6000,
            'prediction_status' => 'predicted',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/yield-predictions')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $prediction->id);

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/yield-predictions/{$prediction->id}", [
                'predicted_yield_kg' => 5200,
                'notes' => 'Adjusted after field check.',
            ])
            ->assertOk()
            ->assertJsonPath('predicted_yield_kg', 5200)
            ->assertJsonPath('prediction_status', 'updated');

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/yield-predictions/{$prediction->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('yield_predictions', [
            'id' => $prediction->id,
        ]);
        $this->assertSame(1, YieldPrediction::where('farm_id', $otherFarm->id)->count());
    }
}
