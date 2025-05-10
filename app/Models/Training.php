<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Training extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'training_type_id',
        'department',
        'start_date',
        'end_date',
        'location',
        'trainer_id',  // This is the foreign key to trainers table
        'max_participants',
        'materials_link',
        'status'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'max_participants' => 'integer',
        'training_type_id' => 'integer',
        'trainer_id' => 'integer'
    ];

    /**
     * Get the trainer for this training.
     */
    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }

    /**
     * Get the training type.
     */
    public function type()
    {
        return $this->belongsTo(TrainingType::class, 'training_type_id');
    }

    /**
     * Get the participants in this training.
     */
    public function participants()
    {
        return $this->hasMany(TrainingParticipant::class);
    }

    /**
     * Get the employees participating in this training (through pivot).
     */
    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'training_participants')
                    ->withPivot(['attendance_status', 'completion_status', 'score'])
                    ->withTimestamps();
    }

    /**
     * Get the count of participants.
     */
    public function getParticipantsCountAttribute()
    {
        return $this->participants()->count();
    }

    /**
     * Scopes
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeUpcoming($query)
    {
        return $query->where('start_date', '>', now())
                    ->where('status', 'Scheduled')
                    ->orderBy('start_date');
    }

    public function scopeOngoing($query)
    {
        return $query->where('status', 'Ongoing');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'Completed');
    }
}