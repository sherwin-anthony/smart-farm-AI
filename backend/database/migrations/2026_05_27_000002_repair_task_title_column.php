<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tasks') || Schema::hasColumn('tasks', 'title')) {
            return;
        }

        Schema::table('tasks', function (Blueprint $table) {
            // Title is required by the auto-task generator and the task board display.
            $table->string('title')->default('Untitled task')->after('crop_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('tasks') || ! Schema::hasColumn('tasks', 'title')) {
            return;
        }

        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('title');
        });
    }
};
