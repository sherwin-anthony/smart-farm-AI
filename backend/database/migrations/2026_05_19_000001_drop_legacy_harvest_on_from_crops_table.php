<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Purpose: remove the legacy harvest_on column after safely preserving its meaning in the newer harvest fields.
return new class extends Migration
{
    public function up(): void
    {
        // Guard local databases that never had the old column or do not yet have the crops table.
        if (! Schema::hasTable('crops') || ! Schema::hasColumn('crops', 'harvest_on')) {
            return;
        }

        // Preserve old harvest targets by copying them into expected_harvest_on when that field is still empty.
        if (Schema::hasColumn('crops', 'expected_harvest_on')) {
            DB::table('crops')
                ->whereNull('expected_harvest_on')
                ->whereNotNull('harvest_on')
                ->update([
                    'expected_harvest_on' => DB::raw('harvest_on'),
                ]);
        }

        Schema::table('crops', function (Blueprint $table) {
            $table->dropColumn('harvest_on');
        });
    }

    public function down(): void
    {
        // Guard rollback so databases without the old column shape do not fail.
        if (! Schema::hasTable('crops') || Schema::hasColumn('crops', 'harvest_on')) {
            return;
        }

        Schema::table('crops', function (Blueprint $table) {
            // Restore the legacy field only for rollback compatibility with older local schemas.
            $table->date('harvest_on')->nullable()->after('planted_on');
        });
    }
};
