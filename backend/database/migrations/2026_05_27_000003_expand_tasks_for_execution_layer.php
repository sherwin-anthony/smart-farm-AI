<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('tasks')) {
            return;
        }

        if (! Schema::hasColumn('tasks', 'farm_id')) {
            Schema::table('tasks', function (Blueprint $table) {
                // Tasks now belong to the farm first, then optionally to a plot or crop.
                $table->foreignId('farm_id')->nullable()->after('id')->constrained()->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('tasks', 'plot_id')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->foreignId('plot_id')->nullable()->after('farm_id')->constrained()->nullOnDelete();
            });
        }

        if (! Schema::hasColumn('tasks', 'description')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->text('description')->nullable()->after('title');
            });
        }

        if (! Schema::hasColumn('tasks', 'priority')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->string('priority')->default('medium')->after('task_type');
            });
        }

        $this->backfillTaskOwnership();
        $this->makeCropOptional();
    }

    public function down(): void
    {
        if (! Schema::hasTable('tasks')) {
            return;
        }

        $columns = array_filter([
            Schema::hasColumn('tasks', 'priority') ? 'priority' : null,
            Schema::hasColumn('tasks', 'description') ? 'description' : null,
        ]);

        if ($columns !== []) {
            Schema::table('tasks', function (Blueprint $table) use ($columns) {
                $table->dropColumn($columns);
            });
        }

        if (Schema::hasColumn('tasks', 'plot_id')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->dropConstrainedForeignId('plot_id');
            });
        }

        if (Schema::hasColumn('tasks', 'farm_id')) {
            Schema::table('tasks', function (Blueprint $table) {
                $table->dropConstrainedForeignId('farm_id');
            });
        }
    }

    private function backfillTaskOwnership(): void
    {
        if (
            ! Schema::hasColumn('tasks', 'crop_id')
            || ! Schema::hasTable('crops')
            || ! Schema::hasTable('plots')
        ) {
            return;
        }

        DB::table('tasks')
            ->join('crops', 'tasks.crop_id', '=', 'crops.id')
            ->join('plots', 'crops.plot_id', '=', 'plots.id')
            ->select('tasks.id', 'crops.plot_id', 'plots.farm_id')
            ->orderBy('tasks.id')
            ->each(function (object $task): void {
                DB::table('tasks')
                    ->where('id', $task->id)
                    ->update([
                        'farm_id' => $task->farm_id,
                        'plot_id' => $task->plot_id,
                    ]);
            });
    }

    private function makeCropOptional(): void
    {
        if (! Schema::hasColumn('tasks', 'crop_id')) {
            return;
        }

        Schema::table('tasks', function (Blueprint $table) {
            // Farm-wide and plot-specific work can exist without a crop.
            $table->foreignId('crop_id')->nullable()->change();
        });
    }
};
