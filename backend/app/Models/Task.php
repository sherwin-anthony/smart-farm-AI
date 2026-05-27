<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasFactory;

    public const TYPE_OPTIONS = [
        'watering',
        'fertilizing',
        'spraying',
        'weeding',
        'harvesting',
        'harvest',
        'monitoring',
        'irrigation_check',
        'soil_check',
        'pest_control',
        'scouting',
        'maintenance',
        'custom',
    ];

    public const PRIORITY_OPTIONS = [
        'low',
        'medium',
        'high',
        'urgent',
    ];

    public const STATUS_OPTIONS = [
        'pending',
        'in_progress',
        'completed',
        'cancelled',
    ];

    public const SOURCE_OPTIONS = [
        'manual',
        'system',
        'weather',
        'ai',
        'auto_crop',
    ];

    protected $fillable = [
        'farm_id',
        'plot_id',
        'crop_id',
        'title',
        'description',
        'task_type',
        'priority',
        'due_on',
        'status',
        'source',
        'notes',
        'completed_at',
    ];

    protected $casts = [
        'due_on' => 'date',
        'completed_at' => 'datetime',
    ];

    public function farm(): BelongsTo
    {
        return $this->belongsTo(Farm::class);
    }

    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }

    public function crop(): BelongsTo
    {
        return $this->belongsTo(Crop::class);
    }
}
