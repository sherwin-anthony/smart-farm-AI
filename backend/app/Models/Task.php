<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'crop_id',
        'title',
        'task_type',
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

    public function crop()
    {
        return $this->belongsTo(Crop::class);
    }
}
