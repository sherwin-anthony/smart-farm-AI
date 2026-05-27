<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class YieldPrediction extends Model
{
    use HasFactory;

    protected $fillable = [
        'farm_id',
        'plot_id',
        'crop_id',
        'farm_size_hectares',
        'days_planted',
        'predicted_yield_kg',
        'actual_yield_kg',
        'confidence_score',
        'model_name',
        'prediction_status',
        'predicted_on',
        'harvested_on',
        'input_payload',
        'notes',
    ];

    protected $casts = [
        'farm_size_hectares' => 'float',
        'days_planted' => 'integer',
        'predicted_yield_kg' => 'float',
        'actual_yield_kg' => 'float',
        'confidence_score' => 'float',
        'predicted_on' => 'date',
        'harvested_on' => 'date',
        'input_payload' => 'array',
    ];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function crop()
    {
        return $this->belongsTo(Crop::class);
    }

    public function plot()
    {
        return $this->belongsTo(Plot::class);
    }
}
