<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'complainant_id',
        'complaint_title',
        'complaint_description',
        'complaint_date',
        'document_path',
        'status',
        'assigned_to',
        'resolution',
        'resolution_date'
    ];

    protected $casts = [
        'complaint_date' => 'date',
        'resolution_date' => 'date'
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function complainant()
    {
        return $this->belongsTo(Employee::class, 'complainant_id');
    }

    public function assignedTo()
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }
}