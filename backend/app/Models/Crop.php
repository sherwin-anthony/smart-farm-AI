<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Crop extends Model
{
    use HasFactory;

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
    ];

    protected $casts = [
        'planted_on' => 'date',
        'expected_harvest_on' => 'date',
        'actual_harvest_on' => 'date',
    ];

    public function plot()
    {
        return $this->belongsTo(Plot::class);
    }

    public function tasks()
    {
        return $this->hasMany(Task::class);
    }

    public function yieldPredictions()
    {
        return $this->hasMany(YieldPrediction::class);
    }
}
