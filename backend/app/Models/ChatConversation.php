<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ChatConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'farm_id',
        'title',
    ];

    public function farm()
    {
        return $this->belongsTo(Farm::class);
    }

    public function messages()
    {
        return $this->hasMany(ChatMessage::class);
    }
}
