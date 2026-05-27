<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Purpose: add the missing SmartFarm fields to the existing farms table.
// Routing: supports FarmController CRUD routes like POST /api/farms.
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('farms')) {
            return;
        }

        Schema::table('farms', function (Blueprint $table) {
            // Guard each column so fresh databases and older repaired databases both migrate safely.
            if (! Schema::hasColumn('farms', 'name')) {
                $table->string('name')->after('id');
            }

            if (! Schema::hasColumn('farms', 'owner_name')) {
                $table->string('owner_name')->nullable()->after('name');
            }

            if (! Schema::hasColumn('farms', 'location')) {
                $table->string('location')->nullable()->after('owner_name');
            }

            if (! Schema::hasColumn('farms', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable()->after('location');
            }

            if (! Schema::hasColumn('farms', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            }

            if (! Schema::hasColumn('farms', 'size_hectares')) {
                $table->decimal('size_hectares', 10, 2)->nullable()->after('longitude');
            }

            if (! Schema::hasColumn('farms', 'notes')) {
                $table->text('notes')->nullable()->after('size_hectares');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('farms')) {
            return;
        }

        $columns = array_filter([
            Schema::hasColumn('farms', 'name') ? 'name' : null,
            Schema::hasColumn('farms', 'owner_name') ? 'owner_name' : null,
            Schema::hasColumn('farms', 'location') ? 'location' : null,
            Schema::hasColumn('farms', 'latitude') ? 'latitude' : null,
            Schema::hasColumn('farms', 'longitude') ? 'longitude' : null,
            Schema::hasColumn('farms', 'size_hectares') ? 'size_hectares' : null,
            Schema::hasColumn('farms', 'notes') ? 'notes' : null,
        ]);

        if (empty($columns)) {
            return;
        }

        Schema::table('farms', function (Blueprint $table) use ($columns) {
            $table->dropColumn($columns);
        });
    }
};
