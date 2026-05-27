<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Purpose: repair remote databases whose migration history says crop monitoring ran but columns are missing.
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('crops')) {
            return;
        }

        if (! Schema::hasColumn('crops', 'plot_id')) {
            Schema::table('crops', function (Blueprint $table) {
                // Add plot ownership after id so crop queries can be scoped through the authenticated farm.
                $table->foreignId('plot_id')->nullable()->after('id')->constrained()->restrictOnDelete();
            });
        }

        if (! Schema::hasColumn('crops', 'variety')) {
            Schema::table('crops', function (Blueprint $table) {
                $table->string('variety')->nullable()->after('name');
            });
        }

        if (! Schema::hasColumn('crops', 'growth_stage')) {
            Schema::table('crops', function (Blueprint $table) {
                // Use nullable during repair so existing legacy rows can be reviewed before enforcing required data.
                $table->string('growth_stage')->nullable()->default('seed')->after('status');
            });
        }

        if (! Schema::hasColumn('crops', 'expected_harvest_on')) {
            Schema::table('crops', function (Blueprint $table) {
                $table->date('expected_harvest_on')->nullable()->after('planted_on');
            });
        }

        if (! Schema::hasColumn('crops', 'actual_harvest_on')) {
            Schema::table('crops', function (Blueprint $table) {
                $table->date('actual_harvest_on')->nullable()->after('expected_harvest_on');
            });
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('crops')) {
            return;
        }

        Schema::table('crops', function (Blueprint $table) {
            // Drop only columns that exist so rollback stays safe across repaired and fresh databases.
            if (Schema::hasColumn('crops', 'plot_id')) {
                $table->dropConstrainedForeignId('plot_id');
            }

            $columns = array_filter([
                Schema::hasColumn('crops', 'variety') ? 'variety' : null,
                Schema::hasColumn('crops', 'growth_stage') ? 'growth_stage' : null,
                Schema::hasColumn('crops', 'expected_harvest_on') ? 'expected_harvest_on' : null,
                Schema::hasColumn('crops', 'actual_harvest_on') ? 'actual_harvest_on' : null,
            ]);

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};
