<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;

class EmployeeController extends Controller
{
    /**
     * Display a listing of employees.
     */
    public function index(Request $request)
    {
        $status = $request->input('status', 'all');
        
        $query = Employee::query();
        
        // Filter by employee status
        if ($status !== 'all') {
            $query->where('JobStatus', $status);
        }
        
        $employees = $query->get();
        
        return Inertia::render('Employee/EmployeePage', [
            'employees' => $employees,
            'currentStatus' => $status,
            'auth' => [
                'user' => Auth::user(),
            ],
        ]);
    }

    /**
     * Store a newly created employee.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'idno' => 'nullable|unique:employees',
            'bid' => 'nullable|string',
            'Lname' => 'required|string',
            'Fname' => 'required|string',
            'MName' => 'nullable|string',
            'Suffix' => 'nullable|string',
            'Gender' => 'nullable|in:Male,Female',
            'EducationalAttainment' => 'nullable|string',
            'Degree' => 'nullable|string',
            'CivilStatus' => 'nullable|string',
            'Birthdate' => 'nullable|date',
            'ContactNo' => 'nullable|string',
            'Email' => 'required|email|unique:employees',
            'PresentAddress' => 'nullable|string',
            'PermanentAddress' => 'nullable|string',
            'EmerContactName' => 'nullable|string',
            'EmerContactNo' => 'nullable|string',
            'EmerRelationship' => 'nullable|string',
            'EmpStatus' => 'nullable|string',
            'JobStatus' => 'nullable|string',
            'RankFile' => 'nullable|string',
            'Department' => 'required|string',
            'Line' => 'nullable|string',
            'Jobtitle' => 'required|string',
            'HiredDate' => 'nullable|date',
            'EndOfContract' => 'nullable|date',
            'pay_type' => 'nullable|string',
            'payrate' => 'nullable|numeric|between:0,999999.99',
            'pay_allowance' => 'nullable|numeric|between:0,999999.99',
            'SSSNO' => 'nullable|string',
            'PHILHEALTHNo' => 'nullable|string',
            'HDMFNo' => 'nullable|string',
            'TaxNo' => 'nullable|string',
            'Taxable' => 'nullable|boolean',
            'CostCenter' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        // Fix: Changed from Employees to Employee
        Employee::create($request->all());

        return redirect()->back()->with('message', 'Employee created successfully');
    }

    public function update(Request $request, $id)
    {
        $employee = Employee::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'idno' => 'nullable|unique:employees,idno,' . $id,
            'bid' => 'nullable|string',
            'Lname' => 'required|string',
            'Fname' => 'required|string',
            'MName' => 'nullable|string',
            'Suffix' => 'nullable|string',
            'Gender' => 'nullable|in:Male,Female',
            'EducationalAttainment' => 'nullable|string',
            'Degree' => 'nullable|string',
            'CivilStatus' => 'nullable|string',
            'Birthdate' => 'nullable|date',
            'ContactNo' => 'nullable|string',
            'Email' => 'required|email|unique:employees,Email,' . $id,
            'PresentAddress' => 'nullable|string',
            'PermanentAddress' => 'nullable|string',
            'EmerContactName' => 'nullable|string',
            'EmerContactNo' => 'nullable|string',
            'EmerRelationship' => 'nullable|string',
            'EmpStatus' => 'nullable|string',
            'JobStatus' => 'nullable|string',
            'RankFile' => 'nullable|string',
            'Department' => 'required|string',
            'Line' => 'nullable|string',
            'Jobtitle' => 'required|string',
            'HiredDate' => 'nullable|date',
            'EndOfContract' => 'nullable|date',
            'pay_type' => 'nullable|string',
            'payrate' => 'nullable|numeric|between:0,999999.99',
            'pay_allowance' => 'nullable|numeric|between:0,999999.99',
            'SSSNO' => 'nullable|string',
            'PHILHEALTHNo' => 'nullable|string',
            'HDMFNo' => 'nullable|string',
            'TaxNo' => 'nullable|string',
            'Taxable' => 'nullable|boolean',
            'CostCenter' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            $employee->update($request->all());
            return redirect()->back()->with('message', 'Employee updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Failed to update employee: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Remove the specified employee.
     */
    public function destroy($id)
    {
        try {
            $employee = Employee::findOrFail($id);
            $employee->delete();
            
            return redirect()->route('employees.index')->with([
                'message' => 'Employee deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to delete employee', [
                'id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return redirect()->route('employees.index')->with('error', 'Failed to delete employee');
        }
    }
    
    public function markInactive($id)
    {
        $employee = Employee::findOrFail($id);
        $employee->JobStatus = 'Inactive';
        $employee->save();
        
        return back()->with('message', 'Employee marked as inactive.');
    }

    public function markBlocked($id)
    {
        $employee = Employee::findOrFail($id);
        $employee->JobStatus = 'Blocked';
        $employee->save();
        
        return back()->with('message', 'Employee blocked successfully.');
    }

    public function markActive($id)
    {
        $employee = Employee::findOrFail($id);
        $employee->JobStatus = 'Active';
        $employee->save();
        
        return back()->with('message', 'Employee activated successfully.');
    }
    public function list(Request $request)
    {
        $query = Employee::query();
        
        // Filter by active status if requested
        if ($request->has('active_only') && $request->active_only == true) {
            $query->where('JobStatus', 'Active');
        }
        
        // Optional: Filter by name for search functionality
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('Fname', 'like', "%{$search}%")
                  ->orWhere('Lname', 'like', "%{$search}%")
                  ->orWhere('idno', 'like', "%{$search}%");
            });
        }
        
        // Sort employees by last name, first name
        $query->orderBy('Lname')->orderBy('Fname');
        
        return response()->json([
            'data' => $query->get()
        ]);
    }


    /**
     * Show import page
     */
    public function showImportPage()
    {
        return Inertia::render('Employee/ImportEmployeesPage', [
            'auth' => [
                'user' => Auth::user(),
            ],
        ]);
    }
}