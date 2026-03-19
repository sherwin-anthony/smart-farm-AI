<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crops', function (Blueprint $table) {
            $table->foreignId('plot_id')->nullable()->after('id')->constrained()->nullOnDelete();
            $table->string('variety')->nullable()->after('name');
            $table->string('growth_stage')->default('seedling')->after('status');
            $table->date('expected_harvest_on')->nullable()->after('planted_on');
            $table->date('actual_harvest_on')->nullable()->after('expected_harvest_on');
        });
    }

    public function down(): void
    {
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
