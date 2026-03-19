<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('yield_predictions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('farm_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('crop_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('farm_size_hectares', 10, 2);
            $table->integer('days_planted');
            $table->decimal('predicted_yield_kg', 12, 2);
            $table->decimal('confidence_score', 5, 2)->nullable();
            $table->string('model_name')->default('rule-based-v1');
            $table->json('input_payload')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('yield_predictions');
    }
};
