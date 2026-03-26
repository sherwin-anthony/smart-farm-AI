<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('plots', 'farm_id')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->foreignId('farm_id')->nullable()->constrained()->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('plots', 'name')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->string('name')->nullable();
            });
        }

        if (! Schema::hasColumn('plots', 'area_hectares')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->decimal('area_hectares', 10, 2)->nullable();
            });
        }

        if (! Schema::hasColumn('plots', 'soil_type')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->string('soil_type')->nullable();
            });
        }

        if (! Schema::hasColumn('plots', 'status')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->string('status')->default('active');
            });
        }

        if (! Schema::hasColumn('plots', 'notes')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->text('notes')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('plots', 'farm_id')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->dropConstrainedForeignId('farm_id');
            });
        }

        if (Schema::hasColumn('plots', 'notes')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->dropColumn('notes');
            });
        }

        if (Schema::hasColumn('plots', 'status')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->dropColumn('status');
            });
        }

        if (Schema::hasColumn('plots', 'soil_type')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->dropColumn('soil_type');
            });
        }

        if (Schema::hasColumn('plots', 'area_hectares')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->dropColumn('area_hectares');
            });
        }

        if (Schema::hasColumn('plots', 'name')) {
            Schema::table('plots', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }
    }
};
