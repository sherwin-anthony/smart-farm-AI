<?php

namespace Tests\Feature;

use App\Models\Crop;
use App\Models\Farm;
use App\Models\Plot;
use App\Models\Task;
use App\Models\User;
use App\Models\WeatherForecast;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class WeatherModuleTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        CarbonImmutable::setTestNow();

        parent::tearDown();
    }

    public function test_weather_sync_requires_farm_coordinates(): void
    {
        $user = User::factory()->create();
        Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/weather/sync')
            ->assertStatus(422)
            ->assertJsonPath('message', 'Farm latitude and longitude are required. Pin your farm location first.');
    }

    public function test_weather_sync_saves_open_meteo_forecasts_for_current_farm(): void
    {
        CarbonImmutable::setTestNow('2026-05-27 10:00:00');

        $user = User::factory()->create();
        $farm = Farm::create([
            'user_id' => $user->id,
            'name' => 'Main Farm',
            'latitude' => 15.1234567,
            'longitude' => 120.7654321,
        ]);

        Http::fake([
            'api.open-meteo.com/*' => Http::response([
                'timezone' => 'Asia/Shanghai',
                'current' => [
                    'time' => '2026-05-27T10:00',
                    'temperature_2m' => 31.2,
                    'relative_humidity_2m' => 74,
                    'precipitation' => 0.4,
                    'wind_speed_10m' => 12.8,
                    'weather_code' => 2,
                ],
                'daily' => [
                    'time' => ['2026-05-27', '2026-05-28'],
                    'weather_code' => [2, 63],
                    'temperature_2m_max' => [34.5, 33.0],
                    'temperature_2m_min' => [24.5, 26.0],
                    'precipitation_sum' => [1.2, 8.4],
                    'precipitation_probability_max' => [35, 80],
                    'wind_speed_10m_max' => [14.0, 31.0],
                ],
            ]),
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/weather/sync')
            ->assertOk()
            ->assertJsonCount(2, 'forecasts')
            ->assertJsonPath('forecasts.0.farm_id', $farm->id)
            ->assertJsonPath('forecasts.0.summary', 'Partly cloudy')
            ->assertJsonPath('forecasts.1.summary', 'Rain')
            ->assertJsonFragment([
                'title' => 'Rain likely',
            ])
            ->assertJsonFragment([
                'title' => 'Strong wind expected',
            ]);

        $todayForecast = WeatherForecast::where('farm_id', $farm->id)
            ->whereDate('forecast_date', '2026-05-27')
            ->firstOrFail();

        $this->assertSame(31.2, (float) $todayForecast->temperature_c);
        $this->assertSame(74, $todayForecast->humidity);
        $this->assertSame(2, WeatherForecast::where('farm_id', $farm->id)->count());
    }

    public function test_weather_index_returns_only_current_farm_forecasts(): void
    {
        $user = User::factory()->create();
        $otherUser = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $otherFarm = Farm::create(['user_id' => $otherUser->id, 'name' => 'Other Farm']);

        WeatherForecast::create([
            'farm_id' => $farm->id,
            'forecast_date' => '2026-05-27',
            'summary' => 'Clear sky',
        ]);

        WeatherForecast::create([
            'farm_id' => $otherFarm->id,
            'forecast_date' => '2026-05-27',
            'summary' => 'Rain',
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/weather/forecast')
            ->assertOk()
            ->assertJsonCount(1, 'forecasts')
            ->assertJsonPath('forecasts.0.summary', 'Clear sky')
            ->assertJsonPath('impacts.0.title', 'No major weather risks');
    }

    public function test_weather_impacts_warn_when_rain_is_near_crop_harvest(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $plot = Plot::create([
            'farm_id' => $farm->id,
            'name' => 'North Plot',
            'area_hectares' => 2,
            'status' => 'active',
        ]);

        Crop::create([
            'plot_id' => $plot->id,
            'name' => 'Rice',
            'status' => 'growing',
            'growth_stage' => 'maturing',
            'expected_harvest_on' => '2026-05-29',
        ]);

        WeatherForecast::create([
            'farm_id' => $farm->id,
            'forecast_date' => '2026-05-28',
            'summary' => 'Rain',
            'rain_mm' => 8,
            'rain_probability' => 75,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/weather/forecast')
            ->assertOk()
            ->assertJsonFragment([
                'title' => 'Rain near Rice harvest',
                'source' => 'crop',
            ]);
    }

    public function test_weather_impact_tasks_are_created_once_for_current_farm(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);

        WeatherForecast::create([
            'farm_id' => $farm->id,
            'forecast_date' => '2026-05-28',
            'summary' => 'Rain',
            'rain_mm' => 18,
            'rain_probability' => 90,
            'wind_kph' => 35,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/weather/tasks')
            ->assertOk()
            ->assertJsonPath('created_count', 2)
            ->assertJsonPath('skipped_count', 0)
            ->assertJsonPath('tasks.0.source', 'weather');

        $this->assertDatabaseHas('tasks', [
            'farm_id' => $farm->id,
            'title' => 'Weather: Heavy rain expected',
            'task_type' => 'irrigation_check',
            'priority' => 'urgent',
            'source' => 'weather',
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/weather/tasks')
            ->assertOk()
            ->assertJsonPath('created_count', 0)
            ->assertJsonPath('skipped_count', 2);

        $this->assertSame(2, Task::where('farm_id', $farm->id)->where('source', 'weather')->count());
    }

    public function test_weather_harvest_tasks_are_linked_to_crop_and_plot(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $plot = Plot::create(['farm_id' => $farm->id, 'name' => 'North Plot']);
        $crop = Crop::create([
            'plot_id' => $plot->id,
            'name' => 'Rice',
            'status' => 'growing',
            'growth_stage' => 'maturing',
            'expected_harvest_on' => '2026-05-29',
        ]);

        WeatherForecast::create([
            'farm_id' => $farm->id,
            'forecast_date' => '2026-05-28',
            'summary' => 'Rain',
            'rain_mm' => 8,
            'rain_probability' => 75,
        ]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/weather/tasks')
            ->assertOk()
            ->assertJsonFragment([
                'title' => 'Weather: Rain near Rice harvest',
                'crop_id' => $crop->id,
                'plot_id' => $plot->id,
            ]);
    }

    public function test_dashboard_overview_includes_weather_summary(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);

        WeatherForecast::create([
            'farm_id' => $farm->id,
            'forecast_date' => '2026-05-28',
            'summary' => 'Rain',
            'rain_mm' => 18,
            'rain_probability' => 90,
            'wind_kph' => 35,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/dashboard/overview')
            ->assertOk()
            ->assertJsonPath('weather.impact_count', 2)
            ->assertJsonPath('weather.highest_severity', 'high')
            ->assertJsonPath('weather.headline', 'Heavy rain expected');
    }

    public function test_recommendations_reuse_weather_impact_rules(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);

        WeatherForecast::create([
            'farm_id' => $farm->id,
            'forecast_date' => '2026-05-28',
            'summary' => 'Rain',
            'rain_mm' => 18,
            'rain_probability' => 90,
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/recommendations')
            ->assertOk()
            ->assertJsonPath('items.0.title', 'Heavy rain expected')
            ->assertJsonPath('items.0.source', 'weather')
            ->assertJsonPath('items.0.priority', 'urgent')
            ->assertJsonPath('items.0.action_href', '/weather');

        $this->assertContains(
            'Heavy rain expected. Prepare drainage paths and postpone non-urgent watering.',
            $response->json('recommendations')
        );
    }

    public function test_recommendations_include_structured_crop_items(): void
    {
        $user = User::factory()->create();
        $farm = Farm::create(['user_id' => $user->id, 'name' => 'Main Farm']);
        $plot = Plot::create(['farm_id' => $farm->id, 'name' => 'North Plot']);
        $crop = Crop::create([
            'plot_id' => $plot->id,
            'name' => 'Rice',
            'status' => 'growing',
            'growth_stage' => 'maturing',
            'expected_harvest_on' => now()->addDays(7)->toDateString(),
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/recommendations')
            ->assertOk()
            ->assertJsonFragment([
                'key' => "crop.{$crop->id}.near_harvest",
                'title' => 'Rice near harvest',
                'source' => 'crop',
                'priority' => 'high',
                'action_href' => "/crops/{$crop->id}",
            ]);
    }
}
