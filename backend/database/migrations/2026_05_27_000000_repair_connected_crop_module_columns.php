<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tasks') && ! Schema::hasColumn('tasks', 'crop_id')) {
            Schema::table('tasks', function (Blueprint $table) {
                // Repair older task tables so crop-scoped task queries can join through crops.
                $table->foreignId('crop_id')->nullable()->after('id')->constrained()->nullOnDelete();
            });
        }

        if (Schema::hasTable('weather_forecasts') && ! Schema::hasColumn('weather_forecasts', 'farm_id')) {
            Schema::table('weather_forecasts', function (Blueprint $table) {
                // Weather recommendations are farm-scoped, so forecasts need a farm owner.
                $table->foreignId('farm_id')->nullable()->after('id')->constrained()->nullOnDelete();
            });
        }

        if (Schema::hasTable('yield_predictions')) {
            Schema::table('yield_predictions', function (Blueprint $table) {
                if (! Schema::hasColumn('yield_predictions', 'farm_id')) {
                    // Yield predictions are now saved to the authenticated farm.
                    $table->foreignId('farm_id')->nullable()->after('id')->constrained()->nullOnDelete();
                }

                if (! Schema::hasColumn('yield_predictions', 'crop_id')) {
                    // Crop-linked predictions let the crop workspace show yield history.
                    $table->foreignId('crop_id')->nullable()->after('farm_id')->constrained()->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('yield_predictions')) {
            Schema::table('yield_predictions', function (Blueprint $table) {
                if (Schema::hasColumn('yield_predictions', 'crop_id')) {
                    $table->dropConstrainedForeignId('crop_id');
                }

                if (Schema::hasColumn('yield_predictions', 'farm_id')) {
                    $table->dropConstrainedForeignId('farm_id');
                }
            });
        }

        if (Schema::hasTable('weather_forecasts') && Schema::hasColumn('weather_forecasts', 'farm_id')) {
            Schema::table('weather_forecasts', function (Blueprint $table) {
                $table->dropConstrainedForeignId('farm_id');
            });
        }

        if (Schema::hasTable('tasks') && Schema::hasColumn('tasks', 'crop_id')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->dropConstrainedForeignId('crop_id');
            });
        }
    }
};
