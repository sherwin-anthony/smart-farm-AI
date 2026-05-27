<?php

namespace Tests\Feature;

use App\Models\Farm;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FarmProfileLocationTest extends TestCase
{
    use RefreshDatabase;

    public function test_current_farm_profile_can_save_coordinates(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);

        $this->actingAs($user, 'sanctum')->putJson('/api/farm', [
            'location' => 'North Field',
            'latitude' => 15.1234567,
            'longitude' => 120.7654321,
            'size_hectares' => 2.5,
            'notes' => 'Pinned from map.',
        ])
            ->assertOk()
            ->assertJsonPath('id', $farm->id)
            ->assertJsonPath('location', 'North Field');

        $this->assertDatabaseHas('farms', [
            'id' => $farm->id,
            'location' => 'North Field',
            'latitude' => 15.1234567,
            'longitude' => 120.7654321,
        ]);
    }

    public function test_current_farm_profile_rejects_invalid_coordinates(): void
    {
        $user = User::factory()->create();
        Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);

        $this->actingAs($user, 'sanctum')->putJson('/api/farm', [
            'latitude' => 91,
            'longitude' => 181,
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['latitude', 'longitude']);
    }
}
