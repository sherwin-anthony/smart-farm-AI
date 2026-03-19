<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class YieldPrediction extends Model
{
    use HasFactory;

    protected $fillable = [
        'farm_id',
        'crop_id',
        'farm_size_hectares',
        'days_planted',
        'predicted_yield_kg',
        'confidence_score',
        'model_name',
        'input_payload',
        'notes',
    ];

    protected $casts = [
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
}
