<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('weather_forecasts')) {
            Schema::create('weather_forecasts', function (Blueprint $table) {
                $table->id();
                $table->foreignId('farm_id')->nullable()->constrained()->nullOnDelete();
                $table->date('forecast_date')->nullable();
                $table->string('summary')->nullable();
                $table->decimal('rain_mm', 8, 2)->nullable();
                $table->unsignedTinyInteger('rain_probability')->nullable();
                $table->decimal('temperature_c', 8, 2)->nullable();
                $table->decimal('temperature_min_c', 8, 2)->nullable();
                $table->decimal('temperature_max_c', 8, 2)->nullable();
                $table->integer('humidity')->nullable();
                $table->decimal('wind_kph', 8, 2)->nullable();
                $table->integer('weather_code')->nullable();
                $table->json('raw_payload')->nullable();
                $table->timestamp('fetched_at')->nullable();
                $table->timestamps();
            });

            return;
        }

        Schema::table('weather_forecasts', function (Blueprint $table) {
            if (! Schema::hasColumn('weather_forecasts', 'farm_id')) {
                $table->foreignId('farm_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }

            if (! Schema::hasColumn('weather_forecasts', 'forecast_date')) {
                $table->date('forecast_date')->nullable()->after('farm_id');
            }

            if (! Schema::hasColumn('weather_forecasts', 'summary')) {
                $table->string('summary')->nullable()->after('forecast_date');
            }

            if (! Schema::hasColumn('weather_forecasts', 'rain_mm')) {
                $table->decimal('rain_mm', 8, 2)->nullable()->after('summary');
            }

            if (! Schema::hasColumn('weather_forecasts', 'rain_probability')) {
                $table->unsignedTinyInteger('rain_probability')->nullable()->after('rain_mm');
            }

            if (! Schema::hasColumn('weather_forecasts', 'temperature_c')) {
                $table->decimal('temperature_c', 8, 2)->nullable()->after('rain_probability');
            }

            if (! Schema::hasColumn('weather_forecasts', 'temperature_min_c')) {
                $table->decimal('temperature_min_c', 8, 2)->nullable()->after('temperature_c');
            }

            if (! Schema::hasColumn('weather_forecasts', 'temperature_max_c')) {
                $table->decimal('temperature_max_c', 8, 2)->nullable()->after('temperature_min_c');
            }

            if (! Schema::hasColumn('weather_forecasts', 'humidity')) {
                $table->integer('humidity')->nullable()->after('temperature_max_c');
            }

            if (! Schema::hasColumn('weather_forecasts', 'wind_kph')) {
                $table->decimal('wind_kph', 8, 2)->nullable()->after('humidity');
            }

            if (! Schema::hasColumn('weather_forecasts', 'weather_code')) {
                $table->integer('weather_code')->nullable()->after('wind_kph');
            }

            if (! Schema::hasColumn('weather_forecasts', 'raw_payload')) {
                $table->json('raw_payload')->nullable()->after('weather_code');
            }

            if (! Schema::hasColumn('weather_forecasts', 'fetched_at')) {
                $table->timestamp('fetched_at')->nullable()->after('raw_payload');
            }

            if (! Schema::hasColumn('weather_forecasts', 'created_at')) {
                $table->timestamp('created_at')->nullable();
            }

            if (! Schema::hasColumn('weather_forecasts', 'updated_at')) {
                $table->timestamp('updated_at')->nullable();
            }
        });

        $this->backfillForecastDates();
    }

    public function down(): void
    {
        // This repair migration is intentionally non-destructive.
    }

    private function backfillForecastDates(): void
    {
        if (! Schema::hasColumn('weather_forecasts', 'forecast_date')) {
            return;
        }

        if (Schema::hasColumn('weather_forecasts', 'date')) {
            $dateColumn = DB::connection()->getQueryGrammar()->wrap('date');

            DB::table('weather_forecasts')
                ->whereNull('forecast_date')
                ->whereNotNull('date')
                ->update(['forecast_date' => DB::raw($dateColumn)]);
        }

        if (Schema::hasColumn('weather_forecasts', 'created_at')) {
            $createdAtColumn = DB::connection()->getQueryGrammar()->wrap('created_at');

            DB::table('weather_forecasts')
                ->whereNull('forecast_date')
                ->whereNotNull('created_at')
                ->update(['forecast_date' => DB::raw('DATE('.$createdAtColumn.')')]);
        }
    }
};
