<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('weather_forecasts')) {
            return;
        }

        Schema::table('weather_forecasts', function (Blueprint $table) {
            if (! Schema::hasColumn('weather_forecasts', 'temperature_min_c')) {
                $table->decimal('temperature_min_c', 8, 2)->nullable()->after('temperature_c');
            }

            if (! Schema::hasColumn('weather_forecasts', 'temperature_max_c')) {
                $table->decimal('temperature_max_c', 8, 2)->nullable()->after('temperature_min_c');
            }

            if (! Schema::hasColumn('weather_forecasts', 'rain_probability')) {
                $table->unsignedTinyInteger('rain_probability')->nullable()->after('rain_mm');
            }

            if (! Schema::hasColumn('weather_forecasts', 'weather_code')) {
                $table->integer('weather_code')->nullable()->after('wind_kph');
            }

            if (! Schema::hasColumn('weather_forecasts', 'fetched_at')) {
                $table->timestamp('fetched_at')->nullable()->after('raw_payload');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('weather_forecasts')) {
            return;
        }

        $columns = array_filter([
            Schema::hasColumn('weather_forecasts', 'fetched_at') ? 'fetched_at' : null,
            Schema::hasColumn('weather_forecasts', 'weather_code') ? 'weather_code' : null,
            Schema::hasColumn('weather_forecasts', 'rain_probability') ? 'rain_probability' : null,
            Schema::hasColumn('weather_forecasts', 'temperature_max_c') ? 'temperature_max_c' : null,
            Schema::hasColumn('weather_forecasts', 'temperature_min_c') ? 'temperature_min_c' : null,
        ]);

        if ($columns === []) {
            return;
        }

        Schema::table('weather_forecasts', function (Blueprint $table) use ($columns) {
            $table->dropColumn($columns);
        });
    }
};
