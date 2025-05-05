<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\EmployeeImportController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\BiometricController;
use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AttendanceLogsController;
use App\Http\Controllers\EmployeeAttendanceImportController;
use App\Http\Controllers\OvertimeController;
use App\Http\Controllers\ChangeOffScheduleController;
use App\Http\Controllers\TimeScheduleController;
use App\Http\Controllers\TravelOrderController;
use App\Http\Controllers\OfficialBusinessController;
use App\Http\Controllers\OffsetController;
use App\Http\Controllers\SLVLController;
use App\Http\Controllers\RetroController;
use App\Http\Controllers\Auth\EmployeeRegistrationController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\ProcessedAttendanceController;
use App\Http\Controllers\PromotionController;
use App\Http\Controllers\AwardController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\ResignationController;
use App\Http\Controllers\ComplaintController;
use App\Http\Controllers\WarningController;
use App\Http\Controllers\TerminationController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\LineController;
use App\Http\Controllers\SectionController;

use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Http\Request;
use Inertia\Inertia;

// Public Routes
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// Guest Routes (Authentication & Registration)
Route::middleware('guest')->group(function () {
    // Authentication Routes
    Route::get('login', [AuthenticatedSessionController::class, 'create'])
        ->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
    
    // Employee Registration Routes
    Route::get('employee/register', [EmployeeRegistrationController::class, 'create'])
        ->name('employee.register');
    Route::post('employee/register', [EmployeeRegistrationController::class, 'store']);
});

// Logout Route
Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');

// Authenticated Routes
Route::middleware(['auth', 'verified'])->group(function () {
    // Dashboard Routes
    Route::get('/dashboard', function () {
        $user = auth()->user();
        $role = $user->getRoleSlug(); 

        if ($role === 'employee') {
            return redirect()->route('employee.dashboard');
        }

        if ($role) {
            return redirect()->route($role.'.dashboard');
        }

        return Inertia::render('Dashboard');
    })->name('dashboard');

    // Employee Dashboard
    Route::get('/employee/dashboard', function () {
        return Inertia::render('Employee/Dashboard', [
            'auth' => [
                'user' => auth()->user()
            ]
        ]);
    })->name('employee.dashboard');

    // Role-Specific Dashboard Routes
    Route::get('/superadmin/dashboard', function () {
        return Inertia::render('SuperadminDashboard', [
            'auth' => ['user' => auth()->user()]
        ]);
    })->middleware('role:superadmin')->name('superadmin.dashboard');

    Route::get('/hrd/dashboard', function () {
        return Inertia::render('HrdDashboard', [
            'auth' => ['user' => auth()->user()]
        ]);
    })->middleware('role:hrd')->name('hrd.dashboard');

    Route::get('/finance/dashboard', function () {
        return Inertia::render('FinanceDashboard', [
            'auth' => ['user' => auth()->user()]
        ]);
    })->middleware('role:finance')->name('finance.dashboard');

    // Employee Management Routes
    Route::middleware(['role:superadmin,hrd'])
    ->prefix('employees')
    ->group(function () {
        Route::get('/', [EmployeeController::class, 'index'])->name('employees.index');
        
        Route::get('/list', [EmployeeController::class, 'index'])->name('employees.list');
        Route::post('/', [EmployeeController::class, 'store'])->name('employees.store');
        Route::put('/{id}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('/{id}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
        
        // Employee Status Management
        Route::post('/{id}/mark-inactive', [EmployeeController::class, 'markInactive'])->name('employees.markInactive');
        Route::post('/{id}/mark-blocked', [EmployeeController::class, 'markBlocked'])->name('employees.markBlocked');
        Route::post('/{id}/mark-active', [EmployeeController::class, 'markActive'])->name('employees.markActive');
        
        // Employee Import Routes
        Route::get('/import-employees', [EmployeeImportController::class, 'showImport'])->name('employees.import');
        Route::post('/import-employees', [EmployeeImportController::class, 'import'])->name('employees.import.process');
        Route::get('/template/download', [EmployeeImportController::class, 'downloadTemplate'])->name('employees.template.download');
    });

    // Attendance Routes
    Route::middleware(['role:superadmin,hrd'])->group(function () {
        // Biometric Devices
        Route::get('/biometric-devices', [BiometricController::class, 'index'])
            ->name('biometric-devices.index');
        Route::post('/biometric-devices', [BiometricController::class, 'storeDevice'])
            ->name('biometric-devices.store');
        Route::put('/biometric-devices/{id}', [BiometricController::class, 'updateDevice'])
            ->name('biometric-devices.update');
        Route::delete('/biometric-devices/{id}', [BiometricController::class, 'deleteDevice'])
            ->name('biometric-devices.destroy');
        Route::post('/biometric-devices/test-connection', [BiometricController::class, 'testConnection'])
            ->name('biometric-devices.test-connection');
        Route::post('/biometric-devices/fetch-logs', [BiometricController::class, 'fetchLogs'])
            ->name('biometric-devices.fetch-logs');
        Route::post('/biometric-devices/diagnostic', [BiometricController::class, 'diagnosticTest'])
            ->name('biometric-devices.diagnostic');
            Route::post('/biometric-devices/scan-network', [BiometricController::class, 'scanNetwork'])
            ->name('biometric-devices.scan-network');
        Route::get('/biometric-devices/scan-progress/{scanId}', [BiometricController::class, 'scanProgress'])
            ->name('biometric-devices.scan-progress');
            Route::get('/api/client-ip', function (Request $request) {
                return response()->json(['ip' => $request->ip()]);
            })->name('api.client-ip');
            
        // Timesheet Routes
        /* Route::get('/timesheet/import', [BiometricController::class, 'importForm'])
            ->name('timesheet.import');
        Route::post('/timesheet/import', [BiometricController::class, 'importAttendance'])
            ->name('timesheet.import.process'); */
        
        // Attendance Import Routes
        Route::get('/attendance/import', [AttendanceController::class, 'showImportPage'])
            ->name('attendance.import');
        Route::post('/attendance/import', [AttendanceController::class, 'import'])
            ->name('attendance.import.process');
        Route::get('/attendance/template/download', [AttendanceController::class, 'downloadTemplate'])
            ->name('attendance.template.download');
        
        // Manual Attendance Entry
        Route::get('/timesheet/manual-entry', [BiometricController::class, 'manualEntryForm'])
            ->name('timesheet.manual-entry');
        Route::post('/timesheet/manual-entry', [BiometricController::class, 'storeManualEntry'])
            ->name('attendance.manual.store');
        
        // Attendance Reports
        Route::get('/timesheet/report', [BiometricController::class, 'getAttendanceReport'])
            ->name('attendance.report');
        Route::get('/timesheet/report/data', [BiometricController::class, 'getAttendanceReport'])
            ->name('attendance.report.data');
        Route::get('/timesheet/report/export', [BiometricController::class, 'exportAttendanceReport'])
            ->name('attendance.report.export');
        
        // Attendance CRUD Operations
        Route::get('/timesheet/attendance/{id}/edit', [BiometricController::class, 'editAttendance'])
            ->name('attendance.edit');
        Route::put('/timesheet/attendance/{id}', [BiometricController::class, 'updateAttendance'])
            ->name('attendance.update');
        Route::delete('/timesheet/attendance/{id}', [BiometricController::class, 'deleteAttendance'])
            ->name('attendance.delete');

        // Main UI route
        Route::get('/attendance', [ProcessedAttendanceController::class, 'index'])
        ->name('attendance.index');

        // API endpoint for fetching attendance data
        Route::get('/attendance/list', [ProcessedAttendanceController::class, 'list'])
            ->name('attendance.list');

        // Update attendance record
        Route::put('/attendance/{id}', [ProcessedAttendanceController::class, 'update'])
            ->name('attendance.update');

        // Get departments for filter dropdown
        Route::get('/attendance/departments', [ProcessedAttendanceController::class, 'getDepartments'])
            ->name('attendance.departments');

        // Export attendance data
        Route::get('/attendance/export', [ProcessedAttendanceController::class, 'export'])
            ->name('attendance.export');
    });

    // HR-Related Routes
    Route::middleware(['role:superadmin,hrd'])->group(function () {
        Route::get('/overtimes', [OvertimeController::class, 'index'])
            ->name('overtimes.index');
        Route::post('/overtimes', [OvertimeController::class, 'store'])
            ->name('overtimes.store');
        Route::put('/overtimes/{id}', [OvertimeController::class, 'update'])
            ->name('overtimes.update');
        Route::post('/overtimes/{id}/status', [OvertimeController::class, 'updateStatus'])
            ->name('overtimes.updateStatus');
        Route::delete('/overtimes/{id}', [OvertimeController::class, 'destroy'])
            ->name('overtimes.destroy');
        Route::get('/overtimes/export', [OvertimeController::class, 'export'])
            ->name('overtimes.export');
        
        // Department Manager Routes
        Route::post('/department-managers', [OvertimeController::class, 'saveDepartmentManager'])
            ->name('department-managers.store');
        Route::delete('/department-managers/{id}', [OvertimeController::class, 'deleteDepartmentManager'])
            ->name('department-managers.destroy');
        
        // Bulk Actions
        Route::post('/overtimes/bulk-update', [OvertimeController::class, 'bulkUpdateStatus'])
            ->name('overtimes.bulk-update');

        // Offset Routes
        Route::get('/offsets', [OffsetController::class, 'index'])
            ->name('offsets.index');
        Route::post('/offsets', [OffsetController::class, 'store'])
            ->name('offsets.store');
        Route::put('/offsets/{id}', [OffsetController::class, 'update'])
            ->name('offsets.update');
        Route::post('/offsets/{id}/status', [OffsetController::class, 'updateStatus'])
            ->name('offsets.updateStatus');
        Route::delete('/offsets/{id}', [OffsetController::class, 'destroy'])
            ->name('offsets.destroy');
        Route::get('/offsets/export', [OffsetController::class, 'export'])
            ->name('offsets.export');

        // Change Off Schedule Routes
        Route::get('/change-off-schedules', [ChangeOffScheduleController::class, 'index'])
            ->name('change-off-schedules.index');
        Route::post('/change-off-schedules', [ChangeOffScheduleController::class, 'store'])
            ->name('change-off-schedules.store');
        Route::post('/change-off-schedules/{id}/status', [ChangeOffScheduleController::class, 'updateStatus'])
            ->name('change-off-schedules.updateStatus');
        Route::delete('/change-off-schedules/{id}', [ChangeOffScheduleController::class, 'destroy'])
            ->name('change-off-schedules.destroy');
        Route::get('/change-off-schedules/export', [ChangeOffScheduleController::class, 'export'])
            ->name('change-off-schedules.export');

        // Time Schedule Routes
        Route::get('/time-schedules', [TimeScheduleController::class, 'index'])
            ->name('time-schedules.index');
        Route::post('/time-schedules', [TimeScheduleController::class, 'store'])
            ->name('time-schedules.store');
        Route::post('/time-schedules/{id}/status', [TimeScheduleController::class, 'updateStatus'])
            ->name('time-schedules.updateStatus');
        Route::delete('/time-schedules/{id}', [TimeScheduleController::class, 'destroy'])
            ->name('time-schedules.destroy');
        Route::get('/time-schedules/export', [TimeScheduleController::class, 'export'])
            ->name('time-schedules.export');

        // Official Business Routes
        Route::get('/official-business', [OfficialBusinessController::class, 'index'])
            ->name('official-business.index');
        Route::post('/official-business', [OfficialBusinessController::class, 'store'])
            ->name('official-business.store');
        Route::post('/official-business/{id}/status', [OfficialBusinessController::class, 'updateStatus'])
            ->name('official-business.updateStatus');
        Route::delete('/official-business/{id}', [OfficialBusinessController::class, 'destroy'])
            ->name('official-business.destroy');
        Route::get('/official-business/export', [OfficialBusinessController::class, 'export'])
            ->name('official-business.export');

        // Travel Order Routes
        Route::get('/travel-orders', [TravelOrderController::class, 'index'])
            ->name('travel-orders.index');
        Route::post('/travel-orders', [TravelOrderController::class, 'store'])
            ->name('travel-orders.store');
        Route::post('/travel-orders/{id}/status', [TravelOrderController::class, 'updateStatus'])
            ->name('travel-orders.updateStatus');
        Route::delete('/travel-orders/{id}', [TravelOrderController::class, 'destroy'])
            ->name('travel-orders.destroy');
        Route::get('/travel-orders/export', [TravelOrderController::class, 'export'])
            ->name('travel-orders.export');

        // Retro Routes
        Route::get('/retro', [RetroController::class, 'index'])
            ->name('retro.index');
        Route::post('/retro', [RetroController::class, 'store'])
            ->name('retro.store');
        Route::put('/retro/{id}', [RetroController::class, 'update'])
            ->name('retro.update');
        Route::delete('/retro/{id}', [RetroController::class, 'destroy'])
            ->name('retro.destroy');
        Route::get('/retro/export', [RetroController::class, 'export'])
            ->name('retro.export');

        // SLVL (Sick Leave/Vacation Leave) Routes
        Route::get('/slvl', [SLVLController::class, 'index'])
            ->name('slvl.index');
        Route::post('/slvl', [SLVLController::class, 'store'])
            ->name('slvl.store');
        Route::post('/slvl/{id}/status', [SLVLController::class, 'updateStatus'])
            ->name('slvl.updateStatus');
        Route::delete('/slvl/{id}', [SLVLController::class, 'destroy'])
            ->name('slvl.destroy');
        Route::get('/slvl/export', [SLVLController::class, 'export'])
            ->name('slvl.export');
    });

    Route::middleware(['role:superadmin,finance'])->group(function () {
        Route::get('/benefits', [App\Http\Controllers\BenefitController::class, 'index'])->name('benefits.index');
        Route::post('/benefits', [App\Http\Controllers\BenefitController::class, 'store'])->name('benefits.store');
        Route::put('/benefits/{id}', [App\Http\Controllers\BenefitController::class, 'update'])->name('benefits.update');
        Route::patch('/benefits/{id}/field', [App\Http\Controllers\BenefitController::class, 'updateField'])->name('benefits.update-field');
        Route::post('/benefits/{id}/post', [App\Http\Controllers\BenefitController::class, 'postBenefit'])->name('benefits.post');
        Route::post('/benefits/post-all', [App\Http\Controllers\BenefitController::class, 'postAll'])->name('benefits.post-all');
        Route::post('/benefits/bulk-post', [App\Http\Controllers\BenefitController::class, 'bulkPost'])->name('benefits.bulk-post');
        Route::post('/benefits/{id}/set-default', [App\Http\Controllers\BenefitController::class, 'setDefault'])->name('benefits.set-default');
        Route::post('/benefits/bulk-set-default', [App\Http\Controllers\BenefitController::class, 'bulkSetDefault'])->name('benefits.bulk-set-default');
        Route::post('/benefits/create-from-default', [App\Http\Controllers\BenefitController::class, 'createFromDefault'])->name('benefits.create-from-default');
        Route::post('/benefits/bulk-create', [App\Http\Controllers\BenefitController::class, 'bulkCreateFromDefault'])->name('benefits.bulk-create');
        Route::get('/employee-defaults', [App\Http\Controllers\BenefitController::class, 'getEmployeeDefaults'])->name('benefits.employee-defaults');
    });

    // Profile Routes
    Route::get('/profile', [ProfileController::class, 'edit'])
        ->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])
        ->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])
        ->name('profile.destroy');
});

// Management Routes
Route::middleware(['role:superadmin,hrd'])->prefix('manage')->group(function () {
    Route::get('/departments', function () {
        return Inertia::render('Manage/Departments', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('manage.departments');
    
    Route::get('/lines-sections', function () {
        return Inertia::render('Manage/LineAndSection', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('manage.lines-sections');
    
    Route::get('/line-section', function () {
        return Inertia::render('Manage/LineAndSection', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('manage.line-section');
    
    // Add the new route for roles access
    Route::get('/roles', function () {
        return Inertia::render('Manage/RolesAndAccess', [
            'auth' => [
                'user' => Auth::user()
            ]
        ]);
    })->name('manage.roles');
});

Route::middleware(['auth:sanctum'])->group(function () {
    // Department routes
    Route::get('/departments', [DepartmentController::class, 'index']);
    Route::post('/departments', [DepartmentController::class, 'store']);
    Route::put('/departments/{id}', [DepartmentController::class, 'update']);
    Route::delete('/departments/{id}', [DepartmentController::class, 'destroy']);
    Route::patch('/departments/{id}/toggle-active', [DepartmentController::class, 'toggleActive']);
    
    // Line routes
    Route::get('/lines', [LineController::class, 'index']);
    Route::post('/lines', [LineController::class, 'store']);
    Route::put('/lines/{id}', [LineController::class, 'update']);
    Route::delete('/lines/{id}', [LineController::class, 'destroy']);
    Route::patch('/lines/{id}/toggle-active', [LineController::class, 'toggleActive']);

    // Section routes
    Route::get('/sections', [SectionController::class, 'index']);
    Route::post('/sections', [SectionController::class, 'store']);
    Route::put('/sections/{id}', [SectionController::class, 'update']);
    Route::delete('/sections/{id}', [SectionController::class, 'destroy']);
    Route::patch('/sections/{id}/toggle-active', [SectionController::class, 'toggleActive']);
});

// CoreHR Routes
// CoreHR Routes
Route::middleware(['role:superadmin,hrd'])->group(function () {
    // Promotion Routes
    Route::get('/core-hr/promotion', function () {
        return Inertia::render('CoreHR/Promotion', [
            'auth' => ['user' => Auth::user()]
        ]);
    })->name('promotions.page');
    Route::get('/promotions/list', [PromotionController::class, 'list'])->name('promotions.list');
    Route::post('/promotions', [PromotionController::class, 'store'])->name('promotions.store');
    Route::put('/promotions/{id}', [PromotionController::class, 'update'])->name('promotions.update');
    Route::post('/promotions/{id}/status', [PromotionController::class, 'updateStatus'])->name('promotions.updateStatus');
    Route::delete('/promotions/{id}', [PromotionController::class, 'destroy'])->name('promotions.destroy');
    Route::get('/promotions/export', [PromotionController::class, 'export'])->name('promotions.export');

    // Award Routes
    Route::get('/core-hr/award', function () {
        return Inertia::render('CoreHR/Award', [
            'auth' => ['user' => Auth::user()]
        ]);
    })->name('awards.page');
    Route::get('/awards/list', [AwardController::class, 'list'])->name('awards.list');
    Route::post('/awards', [AwardController::class, 'store'])->name('awards.store');
    Route::put('/awards/{id}', [AwardController::class, 'update'])->name('awards.update');
    Route::delete('/awards/{id}', [AwardController::class, 'destroy'])->name('awards.destroy');
    Route::get('/awards/export', [AwardController::class, 'export'])->name('awards.export');

    // Transfer Routes
    Route::get('/core-hr/transfer', function () {
        return Inertia::render('CoreHR/Transfer', [
            'auth' => ['user' => Auth::user()]
        ]);
    })->name('transfers.page');
    Route::get('/transfers/list', [TransferController::class, 'list'])->name('transfers.list');
    Route::post('/transfers', [TransferController::class, 'store'])->name('transfers.store');
    Route::put('/transfers/{id}', [TransferController::class, 'update'])->name('transfers.update');
    Route::post('/transfers/{id}/status', [TransferController::class, 'updateStatus'])->name('transfers.updateStatus');
    Route::delete('/transfers/{id}', [TransferController::class, 'destroy'])->name('transfers.destroy');
    Route::get('/transfers/export', [TransferController::class, 'export'])->name('transfers.export');

    // Resignation Routes
    Route::get('/core-hr/resignations', function () {
        return Inertia::render('CoreHR/Resignations', [
            'auth' => ['user' => Auth::user()]
        ]);
    })->name('resignations.page');
    Route::get('/resignations/list', [ResignationController::class, 'list'])->name('resignations.list');
    Route::post('/resignations', [ResignationController::class, 'store'])->name('resignations.store');
    Route::put('/resignations/{id}', [ResignationController::class, 'update'])->name('resignations.update');
    Route::post('/resignations/{id}/status', [ResignationController::class, 'updateStatus'])->name('resignations.updateStatus');
    Route::delete('/resignations/{id}', [ResignationController::class, 'destroy'])->name('resignations.destroy');
    Route::get('/resignations/export', [ResignationController::class, 'export'])->name('resignations.export');

    // Complaint Routes
    Route::get('/core-hr/complaints', function () {
        return Inertia::render('CoreHR/Complaints', [
            'auth' => ['user' => Auth::user()]
        ]);
    })->name('complaints.page');
    Route::get('/complaints/list', [ComplaintController::class, 'list'])->name('complaints.list');
    Route::post('/complaints', [ComplaintController::class, 'store'])->name('complaints.store');
    Route::put('/complaints/{id}', [ComplaintController::class, 'update'])->name('complaints.update');
    Route::post('/complaints/{id}/status', [ComplaintController::class, 'updateStatus'])->name('complaints.updateStatus');
    Route::delete('/complaints/{id}', [ComplaintController::class, 'destroy'])->name('complaints.destroy');
    Route::get('/complaints/export', [ComplaintController::class, 'export'])->name('complaints.export');

    // Warning Routes
    Route::get('/core-hr/warnings', function () {
        return Inertia::render('CoreHR/Warnings', [
            'auth' => ['user' => Auth::user()]
        ]);
    })->name('warnings.page');
    Route::get('/warnings/list', [WarningController::class, 'list'])->name('warnings.list');
    Route::post('/warnings', [WarningController::class, 'store'])->name('warnings.store');
    Route::put('/warnings/{id}', [WarningController::class, 'update'])->name('warnings.update');
    Route::delete('/warnings/{id}', [WarningController::class, 'destroy'])->name('warnings.destroy');
    Route::get('/warnings/export', [WarningController::class, 'export'])->name('warnings.export');

    // Termination Routes
    Route::get('/core-hr/terminations', function () {
        return Inertia::render('CoreHR/Termination', [
            'auth' => ['user' => Auth::user()]
        ]);
    })->name('terminations.page');
    Route::get('/terminations/list', [TerminationController::class, 'list'])->name('terminations.list');
    Route::post('/terminations', [TerminationController::class, 'store'])->name('terminations.store');
    Route::put('/terminations/{id}', [TerminationController::class, 'update'])->name('terminations.update');
    Route::post('/terminations/{id}/status', [TerminationController::class, 'updateStatus'])->name('terminations.updateStatus');
    Route::delete('/terminations/{id}', [TerminationController::class, 'destroy'])->name('terminations.destroy');
    Route::get('/terminations/export', [TerminationController::class, 'export'])->name('terminations.export');

    // Travel Routes
    Route::get('/core-hr/travel', function () {
        return Inertia::render('CoreHR/Travel', [
            'auth' => ['user' => Auth::user()]
        ]);
    })->name('travel.page');
    Route::get('/travel/list', [TravelController::class, 'list'])->name('travel.list');
    Route::post('/travel', [TravelController::class, 'store'])->name('travel.store');
    Route::put('/travel/{id}', [TravelController::class, 'update'])->name('travel.update');
    Route::post('/travel/{id}/status', [TravelController::class, 'updateStatus'])->name('travel.updateStatus');
    Route::delete('/travel/{id}', [TravelController::class, 'destroy'])->name('travel.destroy');
    Route::get('/travel/export', [TravelController::class, 'export'])->name('travel.export');
});

// Include additional authentication routes
require __DIR__.'/auth.php';