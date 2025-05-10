<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

class Trainer extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'position',
        'company',
        'expertise_area',
        'qualifications',
        'certifications',
        'bio',
        'photo_path',
        'website',
        'linkedin',
        'is_external',
        'is_active',
        'employee_id',
        'created_by',
        'updated_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_external' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Boot the model.
     */
    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (Auth::check()) {
                $model->created_by = Auth::id();
                $model->updated_by = Auth::id();
            }
        });
        
        static::updating(function ($model) {
            if (Auth::check()) {
                $model->updated_by = Auth::id();
            }
        });
    }

    /**
     * Get the employee associated with the trainer (if internal).
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the user who created the trainer.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who last updated the trainer.
     */
    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the trainings conducted by this trainer.
     */
    public function trainings()
    {
        return $this->hasMany(Training::class);
    }

    /**
     * Scope a query to only include active trainers.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope a query to only include external trainers.
     */
    public function scopeExternal($query)
    {
        return $query->where('is_external', true);
    }
    public function participantRecords()
    {
        return $this->hasMany(TrainingParticipant::class);
    }
    
    /**
     * Get the employees participating in this training (many-to-many).
     */
    public function participants()
    {
        return $this->belongsToMany(Employee::class, 'training_participants')
                    ->withPivot('attendance_status')
                    ->withTimestamps();
    }
    /**
     * Scope a query to only include internal trainers.
     */
    public function scopeInternal($query)
    {
        return $query->where('is_external', false);
    }
}