<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Farm extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'owner_name',
        'location',
        'latitude',
        'longitude',
        'size_hectares',
        'notes',
    ];

    public function plots()
    {
        return $this->hasMany(Plot::class);
    }

    public function weatherForecasts()
    {
        return $this->hasMany(WeatherForecast::class);
    }
}
