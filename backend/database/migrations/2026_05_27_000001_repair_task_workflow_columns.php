<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tasks')) {
            return;
        }

        Schema::table('tasks', function (Blueprint $table) {
            if (! Schema::hasColumn('tasks', 'task_type')) {
                // Task type powers task grouping such as watering, monitoring, and harvest.
                $table->string('task_type')->default('monitoring')->after('title');
            }

            if (! Schema::hasColumn('tasks', 'due_on')) {
                // Due dates let the dashboard and crop timeline surface urgent work.
                $table->date('due_on')->nullable()->after('task_type');
            }

            if (! Schema::hasColumn('tasks', 'status')) {
                // Status is required by dashboard pending counts and task completion.
                $table->string('status')->default('pending')->after('due_on');
            }

            if (! Schema::hasColumn('tasks', 'source')) {
                // Source distinguishes manual tasks from crop-generated tasks.
                $table->string('source')->default('manual')->after('status');
            }

            if (! Schema::hasColumn('tasks', 'notes')) {
                // Notes explain why an auto-generated or manual task exists.
                $table->text('notes')->nullable()->after('source');
            }

            if (! Schema::hasColumn('tasks', 'completed_at')) {
                // Completion timestamp supports task history and later analytics.
                $table->timestamp('completed_at')->nullable()->after('notes');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('tasks')) {
            return;
        }

        $columns = array_filter([
            Schema::hasColumn('tasks', 'completed_at') ? 'completed_at' : null,
            Schema::hasColumn('tasks', 'notes') ? 'notes' : null,
            Schema::hasColumn('tasks', 'source') ? 'source' : null,
            Schema::hasColumn('tasks', 'status') ? 'status' : null,
            Schema::hasColumn('tasks', 'due_on') ? 'due_on' : null,
            Schema::hasColumn('tasks', 'task_type') ? 'task_type' : null,
        ]);

        if (empty($columns)) {
            return;
        }

        Schema::table('tasks', function (Blueprint $table) use ($columns) {
            $table->dropColumn($columns);
        });
    }
};
