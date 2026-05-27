<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

// Purpose: crop entity representing one planting cycle inside a farm plot.
class Crop extends Model
{
    use HasFactory;

    // Locked status values keep the backend aligned with the crop module workflow.
    public const STATUS_OPTIONS = [
        'planned',
        'planted',
        'growing',
        'ready',
        'harvested',
        'failed',
    ];

    // Locked stage values keep crop progress updates consistent across features.
    public const GROWTH_STAGE_OPTIONS = [
        'seed',
        'seedling',
        'vegetative',
        'flowering',
        'fruiting',
        'maturing',
        'harvest',
    ];

    protected $fillable = [
        'plot_id',
        'name',
        'variety',
        'type',
        'status',
        'growth_stage',
        'planted_on',
        'expected_harvest_on',
        'actual_harvest_on',
        'notes',
    ];

    // Keep model-level defaults aligned with the locked crop workflow even outside controller usage.
    protected $attributes = [
        'status' => 'planned',
        'growth_stage' => 'seed',
    ];

    protected $casts = [
        'planted_on' => 'date',
        'expected_harvest_on' => 'date',
        'actual_harvest_on' => 'date',
    ];

    public function scopeForFarm(Builder $query, Farm $farm): Builder
    {
        // Scope crops through plots so every connected module respects the authenticated farm boundary.
        return $query->whereHas('plot', function (Builder $plotQuery) use ($farm) {
            $plotQuery->where('farm_id', $farm->id);
        });
    }

    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    public function yieldPredictions(): HasMany
    {
        return $this->hasMany(YieldPrediction::class);
    }
}
