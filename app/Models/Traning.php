<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Training extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'start_date',
        'end_date',
        'location',
        'trainer',
        'department',
        'status',
        'max_participants',
        'training_type',
        'materials_link',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    public function participants()
    {
        return $this->belongsToMany(Employee::class, 'training_participants')
            ->withPivot('attendance_status')
            ->withTimestamps();
    }
}