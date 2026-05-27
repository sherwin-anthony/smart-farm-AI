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
        'rain_probability',
        'temperature_c',
        'temperature_min_c',
        'temperature_max_c',
        'humidity',
        'wind_kph',
        'weather_code',
        'raw_payload',
        'fetched_at',
    ];

    protected $casts = [
        'forecast_date' => 'date',
        'rain_mm' => 'float',
        'rain_probability' => 'integer',
        'temperature_c' => 'float',
        'temperature_min_c' => 'float',
        'temperature_max_c' => 'float',
        'humidity' => 'integer',
        'wind_kph' => 'float',
        'weather_code' => 'integer',
        'raw_payload' => 'array',
        'fetched_at' => 'datetime',
    ];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }
}
