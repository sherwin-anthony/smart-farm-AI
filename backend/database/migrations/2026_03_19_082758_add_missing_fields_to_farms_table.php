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
        Schema::table('farms', function (Blueprint $table) {
            $table->string('name')->after('id');
            $table->string('owner_name')->nullable()->after('name');
            $table->string('location')->nullable()->after('owner_name');
            $table->decimal('latitude', 10, 7)->nullable()->after('location');
            $table->decimal('longitude', 10, 7)->nullable()->after('latitude');
            $table->decimal('size_hectares', 10, 2)->nullable()->after('longitude');
            $table->text('notes')->nullable()->after('size_hectares');
        });
    }

    public function down(): void
    {
        Schema::table('farms', function (Blueprint $table) {
            $table->dropColumn([
                'name',
                'owner_name',
                'location',
                'latitude',
                'longitude',
                'size_hectares',
                'notes',
            ]);
        });
    }
};
