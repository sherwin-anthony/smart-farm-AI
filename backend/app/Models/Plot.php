<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

// Purpose: plot entity representing a physical subdivision of a farm.
class Plot extends Model
{
    use HasFactory;

    protected $fillable = [
        'farm_id',
        'name',
        'area_hectares',
        'soil_type',
        'status',
        'notes',
    ];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function crops()
    {
        return $this->hasMany(Crop::class);
    }
}
