<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Purpose: align older local crop tables with the active crop contract by ensuring notes exists.
return new class extends Migration
{
    public function up(): void
    {
        // Guard for fresh installs where notes is already created by the restored base migration.
        if (! Schema::hasTable('crops') || Schema::hasColumn('crops', 'notes')) {
            return;
        }

        Schema::table('crops', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('actual_harvest_on');
        });
    }

    public function down(): void
    {
        // Guard rollback so older or fresh databases do not fail when the column is absent.
        if (! Schema::hasTable('crops') || ! Schema::hasColumn('crops', 'notes')) {
            return;
        }

        Schema::table('crops', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }
};
