<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainingType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'is_active',
        'image_url'
    ];
    protected $casts = [
        'is_active' => 'boolean'
    ];

    public function trainings()
    {
        return $this->hasMany(Training::class);
    }
}