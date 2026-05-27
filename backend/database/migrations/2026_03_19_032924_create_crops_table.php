<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Purpose: restore the missing base crops table so fresh databases can build crop monitoring safely.
return new class extends Migration
{
    public function up(): void
    {
        // Guard older local databases that already have a crops table outside this repository history.
        if (Schema::hasTable('crops')) {
            return;
        }

        Schema::create('crops', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('type')->nullable();
            $table->string('status')->default('planned');
            $table->date('planted_on')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Guard rollback on databases where the table was managed before this file existed.
        if (Schema::hasTable('crops')) {
            Schema::drop('crops');
        }
    }
};
