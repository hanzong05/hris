<?php
// app/Models/DepartmentManager.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepartmentManager extends Model
{
    use HasFactory;

    protected $fillable = [
        'department',
        'manager_id',
        'created_by',
        'updated_by'
    ];

    public function manager()
    {
        return $this->belongsTo(User::class, 'manager_id');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater()
    {
        return $this->belongsTo(User::class, 'updated_by');
    }

    /**
     * Get the manager ID for a specific department
     *
     * @param string $department
     * @return int|null
     */
    public static function getManagerIdForDepartment($department)
    {
        return self::where('department', $department)->value('manager_id');
    }

    /**
     * Get all departments managed by a specific user
     *
     * @param int $userId
     * @return array
     */
    public static function getDepartmentsManagedBy($userId)
    {
        return self::where('manager_id', $userId)->pluck('department')->toArray();
    }
}