<?php
// app/Http/Controllers/OvertimeController.php
namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Overtime;
use App\Models\DepartmentManager;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Inertia\Inertia;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Alignment;

class OvertimeController extends Controller
{
    /**
     * Display the overtime management page.
     */
    public function index()
    {
        $user = Auth::user();
        $query = Overtime::with(['employee', 'departmentManager', 'departmentApprover', 'hrdApprover', 'creator']);
        
        // Filter overtimes based on user role
        if ($this->userHasRole($user, 'superadmin') || $this->userHasRole($user, 'hrd_manager')) {
            // Show all overtime records
        } elseif ($this->userHasRole($user, 'hrd_timekeeper')) {
            // Show only overtimes created by this timekeeper or awaiting final HRD approval
            $query->where(function($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhere('status', 'manager_approved');
            });
        } elseif ($this->userHasRole($user, 'department_manager')) {
            // Show only overtimes for departments this user manages or created by this user
            $managedDepartments = DepartmentManager::where('manager_id', $user->id)->pluck('department')->toArray();
            
            $query->where(function($q) use ($user, $managedDepartments) {
                $q->where('created_by', $user->id)
                  ->orWhere('dept_manager_id', $user->id)
                  ->orWhereHas('employee', function($subq) use ($managedDepartments) {
                      $subq->whereIn('Department', $managedDepartments);
                  });
            });
        } else {
            // Regular users only see their own department's overtimes or ones they created
            $userDept = Employee::where('idno', $user->employee_id)->value('Department');
            
            $query->where(function($q) use ($user, $userDept) {
                $q->where('created_by', $user->id)
                  ->orWhereHas('employee', function($subq) use ($userDept) {
                      $subq->where('Department', $userDept);
                  });
            });
        }
        
        $overtimes = $query->latest()->get();
        $employees = Employee::select(['id', 'idno', 'Lname', 'Fname', 'MName', 'Department', 'Jobtitle'])->get();
        $departments = Employee::distinct()->pluck('Department')->filter()->values();
        
        // Get all users for the department manager assignment form (for superadmin)
        $users = [];
        if ($this->userHasRole($user, 'superadmin')) {
            $users = User::select(['id', 'name', 'email'])->get();
            $departmentManagers = DepartmentManager::with('manager')->get();
        } else {
            $departmentManagers = DepartmentManager::where('manager_id', $user->id)->with('manager')->get();
        }
        
        // Prepare user roles for UI permissions
        $userRoles = [
            'isHrdTimekeeper' => $this->userHasRole($user, 'hrd_timekeeper'),
            'isDepartmentManager' => $this->userHasRole($user, 'department_manager'),
            'isHrdManager' => $this->userHasRole($user, 'hrd_manager'),
            'isSuperAdmin' => $this->userHasRole($user, 'superadmin'),
            'userId' => $user->id,
            'managedDepartments' => DepartmentManager::where('manager_id', $user->id)->pluck('department')->toArray()
        ];
        
        // Updated DOLE standard rate multipliers according to Philippine Labor Code
        $rateMultipliers = [
            ['value' => 1.25, 'label' => 'Ordinary Weekday Overtime (125%)'],
            ['value' => 1.30, 'label' => 'Rest Day/Special Day - Regular Hours (130%)'],
            ['value' => 1.50, 'label' => 'Scheduled Rest Day - Regular Hours (150%)'],
            ['value' => 2.00, 'label' => 'Regular Holiday - Regular Hours (200%)'],
            ['value' => 1.69, 'label' => 'Rest Day/Special Day Overtime (169%)'],
            ['value' => 1.95, 'label' => 'Scheduled Rest Day Overtime (195%)'],
            ['value' => 2.60, 'label' => 'Regular Holiday Overtime (260%)'],
            ['value' => 1.375, 'label' => 'Ordinary Weekday Overtime + Night Differential (137.5%)'],
            ['value' => 1.43, 'label' => 'Rest Day/Special Day + Night Differential (143%)'],
            ['value' => 1.65, 'label' => 'Scheduled Rest Day + Night Differential (165%)'],
            ['value' => 2.20, 'label' => 'Regular Holiday + Night Differential (220%)'],
            ['value' => 1.859, 'label' => 'Rest Day/Special Day Overtime + Night Differential (185.9%)'],
            ['value' => 2.145, 'label' => 'Scheduled Rest Day Overtime + Night Differential (214.5%)'],
            ['value' => 2.86, 'label' => 'Regular Holiday Overtime + Night Differential (286%)'],
        ];
        
        return Inertia::render('Overtime/OvertimePage', [
            'overtimes' => $overtimes,
            'employees' => $employees,
            'departments' => $departments,
            'departmentManagers' => $departmentManagers,
            'users' => $users,
            'rateMultipliers' => $rateMultipliers,
            'userRoles' => $userRoles,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    /**
     * Update the status of an overtime request (approval/rejection)
     */
    public function updateStatus(Request $request, $id)
    {
        Log::info('Update status request received', [
            'overtime_id' => $id,
            'user_id' => Auth::id(),
            'request_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'status' => 'required|in:approved,rejected,manager_approved',
            'remarks' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            Log::warning('Validation failed for overtime status update', [
                'errors' => $validator->errors()->toArray()
            ]);
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $overtime = Overtime::findOrFail($id);
            $user = Auth::user();
            $isHrdManager = $this->userHasRole($user, 'hrd_manager');
            $isDeptManager = $this->userHasRole($user, 'department_manager');
            $isSuperAdmin = $this->userHasRole($user, 'superadmin');
            
            // Validate user can update this overtime's status
            $canUpdateStatus = false;
            
            // Log the current state for debugging
            Log::info('Checking permissions for status update', [
                'overtime_id' => $id,
                'overtime_status' => $overtime->status,
                'user_id' => $user->id,
                'is_superadmin' => $isSuperAdmin,
                'is_hrd_manager' => $isHrdManager,
                'is_dept_manager' => $isDeptManager,
                'requested_status' => $request->status
            ]);
            
            // Superadmin can do anything
            if ($isSuperAdmin) {
                $canUpdateStatus = true;
                Log::info('SuperAdmin permission granted for status update');
            }
            // Department Manager can only approve/reject pending requests assigned to them
            else if ($isDeptManager && $overtime->status === 'pending') {
                // Check if user manages this employee's department
                $employeeDept = $overtime->employee->Department ?? null;
                $managesDepartment = $this->userManagesDepartment($user, $employeeDept);
                
                if ($overtime->dept_manager_id === $user->id || $managesDepartment) {
                    if ($request->status === 'manager_approved' || $request->status === 'rejected') {
                        $canUpdateStatus = true;
                        Log::info('Department manager permission granted', [
                            'manages_department' => $managesDepartment,
                            'employee_dept' => $employeeDept
                        ]);
                    } else {
                        Log::warning('Department manager attempted invalid status change', [
                            'requested_status' => $request->status
                        ]);
                    }
                } else {
                    Log::warning('Department manager does not manage this department', [
                        'overtime_dept_manager_id' => $overtime->dept_manager_id,
                        'user_id' => $user->id,
                        'employee_dept' => $employeeDept
                    ]);
                }
            }
            // HRD Manager can approve/reject requests that have manager approval
            else if ($isHrdManager && $overtime->status === 'manager_approved') {
                $canUpdateStatus = true;
                Log::info('HRD Manager permission granted for status update');
            }
            
            if (!$canUpdateStatus) {
                Log::warning('Permission denied for status update', [
                    'user_id' => $user->id,
                    'overtime_id' => $id
                ]);
                return redirect()->back()->with('error', 'You do not have permission to update this overtime request status');
            }
            
            // Handle different approval scenarios
            if ($isDeptManager && $request->status === 'manager_approved') {
                // Department manager approval
                $overtime->status = 'manager_approved';
                $overtime->dept_approved_by = $user->id;
                $overtime->dept_approved_at = now();
                $overtime->dept_remarks = $request->remarks;
                
                Log::info('Overtime approved by department manager', [
                    'overtime_id' => $id,
                    'department_manager_id' => $user->id
                ]);
            } 
            else if (($isHrdManager || $isSuperAdmin) && $request->status === 'approved') {
                // HRD Manager final approval
                $overtime->status = 'approved';
                
                // If it wasn't manager approved yet, set that too
                if (!$overtime->dept_approved_by) {
                    $overtime->dept_approved_by = $user->id;
                    $overtime->dept_approved_at = now();
                    $overtime->dept_remarks = "Auto-approved by HRD Manager";
                }
                
                $overtime->hrd_approved_by = $user->id;
                $overtime->hrd_approved_at = now();
                $overtime->hrd_remarks = $request->remarks;
                
                Log::info('Overtime fully approved by HRD manager', [
                    'overtime_id' => $id,
                    'hrd_manager_id' => $user->id
                ]);
            }
            else if ($request->status === 'rejected') {
                // Rejection (can be done by either manager or HRD)
                $overtime->status = 'rejected';
                
                // Record who rejected it
                if ($isDeptManager || ($isSuperAdmin && $overtime->status === 'pending')) {
                    $overtime->dept_approved_by = $user->id;
                    $overtime->dept_approved_at = now();
                    $overtime->dept_remarks = $request->remarks;
                } else {
                    // HRD rejection
                    if (!$overtime->dept_approved_by) {
                        $overtime->dept_approved_by = $user->id;
                        $overtime->dept_approved_at = now();
                        $overtime->dept_remarks = "Auto-processed by HRD Manager";
                    }
                    
                    $overtime->hrd_approved_by = $user->id;
                    $overtime->hrd_approved_at = now();
                    $overtime->hrd_remarks = $request->remarks;
                }
                
                Log::info('Overtime rejected', [
                    'overtime_id' => $id,
                    'rejected_by' => $user->id,
                    'rejection_level' => ($isDeptManager || 
                                         ($isSuperAdmin && $overtime->status === 'pending')) 
                                         ? 'department' : 'hrd'
                ]);
            }
            
            $overtime->save();
            
            // Get updated list of all overtimes to return to the frontend
            $allOvertimes = $this->getFilteredOvertimes();
            
            $statusMessage = '';
            if ($request->status === 'manager_approved') {
                $statusMessage = 'Overtime approved at department level and forwarded to HRD for final approval';
            } else if ($request->status === 'approved') {
                $statusMessage = 'Overtime fully approved';
            } else {
                $statusMessage = 'Overtime rejected';
            }
            
            Log::info('Overtime status updated successfully', [
                'overtime_id' => $id,
                'new_status' => $overtime->status,
                'message' => $statusMessage
            ]);
            
            return redirect()->back()->with([
                'message' => $statusMessage,
                'overtimes' => $allOvertimes
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update overtime status', [
                'id' => $id,
                'error' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return redirect()->back()
                ->with('error', 'Failed to update overtime status: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Bulk update status of multiple overtime requests
     */
    public function bulkUpdateStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'overtime_ids' => 'required|array',
            'overtime_ids.*' => 'exists:overtimes,id',
            'status' => 'required|in:approved,rejected,manager_approved',
            'remarks' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $user = Auth::user();
            $isHrdManager = $this->userHasRole($user, 'hrd_manager');
            $isDeptManager = $this->userHasRole($user, 'department_manager');
            $isSuperAdmin = $this->userHasRole($user, 'superadmin');
            
            $successCount = 0;
            $failCount = 0;
            
            foreach ($request->overtime_ids as $id) {
                $overtime = Overtime::findOrFail($id);
                
                // Validate user can update this overtime's status
                $canUpdateStatus = false;
                
                // Superadmin can do anything
                if ($isSuperAdmin) {
                    $canUpdateStatus = true;
                }
                // Department Manager can only approve/reject pending requests assigned to them
                else if ($isDeptManager && $overtime->status === 'pending') {
                    $employeeDept = $overtime->employee->Department ?? null;
                    $managesDepartment = $this->userManagesDepartment($user, $employeeDept);
                    
                    if (($overtime->dept_manager_id === $user->id || $managesDepartment) && 
                        ($request->status === 'manager_approved' || $request->status === 'rejected')) {
                        $canUpdateStatus = true;
                    }
                }
                // HRD Manager can approve/reject requests that have manager approval
                else if ($isHrdManager && $overtime->status === 'manager_approved') {
                    $canUpdateStatus = true;
                }
                
                if (!$canUpdateStatus) {
                    $failCount++;
                    continue;
                }
                
                // Handle different approval scenarios
                if ($isDeptManager && $request->status === 'manager_approved') {
                    $overtime->status = 'manager_approved';
                    $overtime->dept_approved_by = $user->id;
                    $overtime->dept_approved_at = now();
                    $overtime->dept_remarks = $request->remarks;
                } 
                else if (($isHrdManager || $isSuperAdmin) && $request->status === 'approved') {
                    $overtime->status = 'approved';
                    
                    // If it wasn't manager approved yet, set that too
                    if (!$overtime->dept_approved_by) {
                        $overtime->dept_approved_by = $user->id;
                        $overtime->dept_approved_at = now();
                        $overtime->dept_remarks = "Auto-approved by HRD Manager";
                    }
                    
                    $overtime->hrd_approved_by = $user->id;
                    $overtime->hrd_approved_at = now();
                    $overtime->hrd_remarks = $request->remarks;
                }
                else if ($request->status === 'rejected') {
                    $overtime->status = 'rejected';
                    
                    // Record who rejected it
                    if ($isDeptManager || ($isSuperAdmin && $overtime->status === 'pending')) {
                        $overtime->dept_approved_by = $user->id;
                        $overtime->dept_approved_at = now();
                        $overtime->dept_remarks = $request->remarks;
                    } else {
                        // HRD rejection
                        if (!$overtime->dept_approved_by) {
                            $overtime->dept_approved_by = $user->id;
                            $overtime->dept_approved_at = now();
                            $overtime->dept_remarks = "Auto-processed by HRD Manager";
                        }
                        
                        $overtime->hrd_approved_by = $user->id;
                        $overtime->hrd_approved_at = now();
                        $overtime->hrd_remarks = $request->remarks;
                    }
                }
                
                $overtime->save();
                $successCount++;
            }
            
            // Get updated list of all overtimes to return to the frontend
            $allOvertimes = $this->getFilteredOvertimes();
            
            $statusMessage = "Updated $successCount overtime requests successfully";
            if ($failCount > 0) {
                $statusMessage .= " ($failCount could not be updated due to permission issues)";
            }
            
            return redirect()->back()->with([
                'message' => $statusMessage,
                'overtimes' => $allOvertimes
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to bulk update overtime status', [
                'error' => $e->getMessage(),
                'error_trace' => $e->getTraceAsString(),
                'request' => $request->all()
            ]);
            
            return redirect()->back()
                ->with('error', 'Failed to update overtime status: ' . $e->getMessage())
                ->withInput();
        }
    }

    // ... [Keep all other existing methods]

    /**
     * Helper method to check if user has a specific role.
     */
    private function userHasRole($user, $roleName)
    {
        // If the user has a roles relationship
        if (method_exists($user, 'roles') && $user->roles) {
            return $user->roles->pluck('name')->contains($roleName);
        }
        
        // If the user has a getRoleSlug method
        if (method_exists($user, 'getRoleSlug')) {
            $roleSlug = $user->getRoleSlug();
            return $roleSlug === $roleName;
        }
        
        // Check user permissions/roles table if it exists (Laravel 11 permission check)
        if (method_exists($user, 'hasRole')) {
            return $user->hasRole($roleName);
        }
        
        // Fallback for simple role detection based on username/email patterns
        switch ($roleName) {
            case 'superadmin':
                return stripos($user->name, 'admin') !== false || $user->id === 1;
            case 'hrd_manager':
                return stripos($user->name, 'hrd manager') !== false || 
                       stripos($user->email, 'hrdmanager') !== false;
            case 'hrd_timekeeper':
                return stripos($user->name, 'timekeeper') !== false || 
                       stripos($user->email, 'timekeeper') !== false;
            case 'department_manager':
                // Check if user is assigned as a manager for any department
                return DepartmentManager::where('manager_id', $user->id)->exists();
            default:
                return false;
        }
    }

    /**
     * Helper method to check if user manages a specific department.
     */
    private function userManagesDepartment($user, $department)
    {
        if (!$department) return false;
        
        return DepartmentManager::where('manager_id', $user->id)
            ->where('department', $department)
            ->exists();
    }

    /**
     * Helper method to get overtimes filtered by user role.
     */
    private function getFilteredOvertimes()
    {
        $user = Auth::user();
        $query = Overtime::with(['employee', 'departmentManager', 'departmentApprover', 'hrdApprover', 'creator']);
        
        // Filter overtimes based on user role
        if ($this->userHasRole($user, 'superadmin') || $this->userHasRole($user, 'hrd_manager')) {
            // Show all overtime records
        } elseif ($this->userHasRole($user, 'hrd_timekeeper')) {
            // Show only overtimes created by this timekeeper or awaiting final HRD approval
            $query->where(function($q) use ($user) {
                $q->where('created_by', $user->id)
                  ->orWhere('status', 'manager_approved');
            });
        } elseif ($this->userHasRole($user, 'department_manager')) {
            // Show only overtimes for departments this user manages or created by this user
            $managedDepartments = DepartmentManager::where('manager_id', $user->id)->pluck('department')->toArray();
            
            $query->where(function($q) use ($user, $managedDepartments) {
                $q->where('created_by', $user->id)
                  ->orWhere('dept_manager_id', $user->id)
                  ->orWhereHas('employee', function($subq) use ($managedDepartments) {
                      $subq->whereIn('Department', $managedDepartments);
                  });
            });
        } else {
            // Regular users only see their own department's overtimes or ones they created
            $userDept = Employee::where('idno', $user->employee_id)->value('Department');
            
            $query->where(function($q) use ($user, $userDept) {
                $q->where('created_by', $user->id)
                  ->orWhereHas('employee', function($subq) use ($userDept) {
                      $subq->where('Department', $userDept);
                  });
            });
        }
        
        return $query->latest()->get();
    }
}