<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weather_forecasts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->constrained()->cascadeOnDelete();
            $table->date('forecast_date');
            $table->string('summary')->nullable();
            $table->decimal('rain_mm', 8, 2)->nullable();
            $table->decimal('temperature_c', 8, 2)->nullable();
            $table->integer('humidity')->nullable();
            $table->decimal('wind_kph', 8, 2)->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weather_forecasts');
    }
};
