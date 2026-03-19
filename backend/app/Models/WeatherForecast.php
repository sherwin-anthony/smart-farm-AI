<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WeatherForecast extends Model
{
    use HasFactory;

    protected $fillable = [
        'farm_id',
        'forecast_date',
        'summary',
        'rain_mm',
        'temperature_c',
        'humidity',
        'wind_kph',
        'raw_payload',
    ];

    protected $casts = [
        'forecast_date' => 'date',
        'raw_payload' => 'array',
    ];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }
}
