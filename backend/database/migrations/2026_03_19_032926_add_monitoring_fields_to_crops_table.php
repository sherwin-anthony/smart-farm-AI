<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Purpose: add plot linkage and monitoring fields that turn crops into trackable farm records.
return new class extends Migration
{
    public function up(): void
    {
        // Keep the schema default aligned with the locked crop workflow used by the app.
        Schema::table('crops', function (Blueprint $table) {
            $table->foreignId('plot_id')->after('id')->constrained()->restrictOnDelete();
            $table->string('variety')->nullable()->after('name');
            $table->string('growth_stage')->default('seed')->after('status');
            $table->date('expected_harvest_on')->nullable()->after('planted_on');
            $table->date('actual_harvest_on')->nullable()->after('expected_harvest_on');
        });
    }

    public function down(): void
    {
        // Roll back only the monitoring fields introduced by this crop enhancement step.
        Schema::table('crops', function (Blueprint $table) {
            $table->dropConstrainedForeignId('plot_id');
            $table->dropColumn([
                'variety',
                'growth_stage',
                'expected_harvest_on',
                'actual_harvest_on',
            ]);
        });
    }
};
