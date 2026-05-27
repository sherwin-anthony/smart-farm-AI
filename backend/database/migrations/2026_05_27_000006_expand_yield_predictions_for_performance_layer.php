<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('yield_predictions')) {
            Schema::create('yield_predictions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('farm_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('plot_id')->nullable()->constrained()->nullOnDelete();
                $table->foreignId('crop_id')->nullable()->constrained()->nullOnDelete();
                $table->decimal('farm_size_hectares', 10, 2)->nullable();
                $table->integer('days_planted')->nullable();
                $table->decimal('predicted_yield_kg', 12, 2)->nullable();
                $table->decimal('actual_yield_kg', 12, 2)->nullable();
                $table->decimal('confidence_score', 5, 2)->nullable();
                $table->string('model_name')->nullable();
                $table->string('prediction_status')->default('predicted');
                $table->date('predicted_on')->nullable();
                $table->date('harvested_on')->nullable();
                $table->json('input_payload')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });

            return;
        }

        Schema::table('yield_predictions', function (Blueprint $table) {
            if (! Schema::hasColumn('yield_predictions', 'farm_id')) {
                $table->foreignId('farm_id')->nullable()->after('id')->constrained()->nullOnDelete();
            }

            if (! Schema::hasColumn('yield_predictions', 'plot_id')) {
                $table->foreignId('plot_id')->nullable()->after('farm_id')->constrained()->nullOnDelete();
            }

            if (! Schema::hasColumn('yield_predictions', 'crop_id')) {
                $table->foreignId('crop_id')->nullable()->after('plot_id')->constrained()->nullOnDelete();
            }

            if (! Schema::hasColumn('yield_predictions', 'farm_size_hectares')) {
                $table->decimal('farm_size_hectares', 10, 2)->nullable()->after('crop_id');
            }

            if (! Schema::hasColumn('yield_predictions', 'days_planted')) {
                $table->integer('days_planted')->nullable()->after('farm_size_hectares');
            }

            if (! Schema::hasColumn('yield_predictions', 'predicted_yield_kg')) {
                $table->decimal('predicted_yield_kg', 12, 2)->nullable()->after('days_planted');
            }

            if (! Schema::hasColumn('yield_predictions', 'actual_yield_kg')) {
                $table->decimal('actual_yield_kg', 12, 2)->nullable()->after('predicted_yield_kg');
            }

            if (! Schema::hasColumn('yield_predictions', 'confidence_score')) {
                $table->decimal('confidence_score', 5, 2)->nullable()->after('actual_yield_kg');
            }

            if (! Schema::hasColumn('yield_predictions', 'model_name')) {
                $table->string('model_name')->nullable()->after('confidence_score');
            }

            if (! Schema::hasColumn('yield_predictions', 'prediction_status')) {
                $table->string('prediction_status')->default('predicted')->after('model_name');
            }

            if (! Schema::hasColumn('yield_predictions', 'predicted_on')) {
                $table->date('predicted_on')->nullable()->after('prediction_status');
            }

            if (! Schema::hasColumn('yield_predictions', 'harvested_on')) {
                $table->date('harvested_on')->nullable()->after('predicted_on');
            }

            if (! Schema::hasColumn('yield_predictions', 'input_payload')) {
                $table->json('input_payload')->nullable()->after('harvested_on');
            }

            if (! Schema::hasColumn('yield_predictions', 'notes')) {
                $table->text('notes')->nullable()->after('input_payload');
            }
        });
    }

    public function down(): void
    {
        // This expansion is intentionally non-destructive for live farm records.
    }
};
