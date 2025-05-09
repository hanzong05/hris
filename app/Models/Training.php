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
        'training_type_id',
        'start_date',
        'end_date',
        'location',
        'trainer',
        'department',
        'status',
        'max_participants',
        'materials_link',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'max_participants' => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (auth()->check()) {
                $model->created_by = auth()->id();
                $model->updated_by = auth()->id();
            }
        });
        
        static::updating(function ($model) {
            if (auth()->check()) {
                $model->updated_by = auth()->id();
            }
        });
    }

    public function type()
    {
        return $this->belongsTo(TrainingType::class, 'training_type_id');
    }

    public function participants()
    {
        return $this->belongsToMany(Employee::class, 'training_participants')
                    ->withPivot('attendance_status')
                    ->withTimestamps();
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    public function getDurationAttribute()
    {
        if (!$this->start_date || !$this->end_date) {
            return 0;
        }
        
        return $this->start_date->diffInDays($this->end_date);
    }

    public function getIsUpcomingAttribute()
    {
        if (!$this->start_date) {
            return false;
        }
        
        return $this->start_date->isFuture();
    }

    public function getIsOngoingAttribute()
    {
        if (!$this->start_date || !$this->end_date) {
            return false;
        }
        
        $now = now();
        return $this->start_date->isPast() && $this->end_date->isFuture();
    }

    public function getAttendeeCountAttribute()
    {
        return $this->participants()->count();
    }
}