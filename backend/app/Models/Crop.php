<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Crop extends Model
{
   use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'status',
        'planted_on',
        'harvest_on',
    ];
}
