<?php

namespace App\Http\Controllers;

use App\Models\Training;
use App\Models\TrainingType;
use App\Models\TrainingParticipant;
use App\Models\Employee;
use App\Models\Trainer;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class TrainingController extends Controller
{
    /**
     * Display a listing of trainings.
     */
    public function index(Request $request)
    {
        $status = $request->input('status', 'all');
        
        // Get counts for stats
        $counts = [
            'total' => Training::count(),
            'scheduled' => Training::where('status', 'Scheduled')->count(),
            'ongoing' => Training::where('status', 'Ongoing')->count(),
            'completed' => Training::where('status', 'Completed')->count(),
            'cancelled' => Training::where('status', 'Cancelled')->count(),
        ];
        
        // Get training types for filter dropdown
        $trainingTypes = TrainingType::orderBy('name')->get();
        
        // Get trainings with relationships
        $trainingQuery = Training::with(['type', 'participants.employee', 'trainer']);
        
        // Apply status filter if specified
        if ($status !== 'all') {
            $trainingQuery->where('status', $status);
        }
        
        // Get all employees for participant selection
        $employees = Employee::select('id', 'Fname', 'Lname', 'idno', 'Department')
            ->orderBy('Lname')
            ->get();
        
        // Debug: Check trainers count
        $activeTrainersCount = Trainer::active()->count();
        $totalTrainersCount = Trainer::count();
        
        \Log::info('Active trainers count: ' . $activeTrainersCount);
        \Log::info('Total trainers count: ' . $totalTrainersCount);
        
        // Get ALL trainers (not just active) for debugging
        $trainers = Trainer::orderBy('name')->get();
        
        // Alternative: If you want to use active trainers but fall back to all if none are active
        // $trainers = Trainer::active()->orderBy('name')->get();
        // if ($trainers->isEmpty()) {
        //     $trainers = Trainer::orderBy('name')->get();
        // }
        
        \Log::info('Trainers being passed to frontend: ' . $trainers->count());
        
        return Inertia::render('Training/Trainings', [
            'trainings' => $trainingQuery->orderBy('start_date', 'desc')->get(),
            'counts' => $counts,
            'trainingTypes' => $trainingTypes,
            'employees' => $employees,
            'trainers' => $trainers,
            'currentStatus' => $status,
            'auth' => ['user' => Auth::user()]
        ]);
    }
    /**
     * Get trainings list for API.
     */
    public function list(Request $request)
    {
        $status = $request->input('status', 'all');
        
        $query = Training::with(['type', 'participants.employee', 'trainer']);
        
        if ($status !== 'all') {
            $query->where('status', $status);
        }
        
        $trainings = $query->orderBy('start_date', 'desc')->get();
        
        return response()->json([
            'data' => $trainings
        ]);
    }

    /**
     * Store a newly created training in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'training_type_id' => 'required|exists:training_types,id',
            'department' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'location' => 'nullable|string|max:255',
            'trainer_id' => 'nullable|exists:trainers,id',
            'max_participants' => 'nullable|integer|min:1',
            'materials_link' => 'nullable|url',
            'status' => 'required|in:Scheduled,Ongoing,Completed,Cancelled',
            'participants' => 'nullable|array',
            'participants.*' => 'exists:employees,id'
        ]);

        DB::beginTransaction();
        try {
            // Create training
            $training = Training::create($validated);
            
            // Add participants if provided
            if (!empty($validated['participants'])) {
                foreach ($validated['participants'] as $employeeId) {
                    TrainingParticipant::create([
                        'training_id' => $training->id,
                        'employee_id' => $employeeId
                    ]);
                }
            }
            
            DB::commit();
            
            // Load relationships for response
            $training->load(['type', 'participants.employee', 'trainer']);
            
            return response()->json([
                'message' => 'Training created successfully',
                'training' => $training
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to create training', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to create training: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified training.
     */
    public function show($id)
    {
        $training = Training::with(['type', 'participants.employee', 'trainer'])
            ->findOrFail($id);
        
        // Transform participants to include proper employee data
        $training->participants->each(function ($participant) {
            if ($participant->employee) {
                $participant->employee->full_name = $participant->employee->Fname . ' ' . $participant->employee->Lname;
            }
        });
        
        return response()->json($training);
    }

    /**
     * Update the specified training in storage.
     */
    public function update(Request $request, $id)
    {
        $training = Training::findOrFail($id);
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'training_type_id' => 'required|exists:training_types,id',
            'department' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'location' => 'nullable|string|max:255',
            'trainer_id' => 'nullable|exists:trainers,id',
            'max_participants' => 'nullable|integer|min:1',
            'materials_link' => 'nullable|url',
            'status' => 'required|in:Scheduled,Ongoing,Completed,Cancelled',
            'participants' => 'nullable|array',
            'participants.*' => 'exists:employees,id'
        ]);

        DB::beginTransaction();
        try {
            // Update training
            $training->update($validated);
            
            // Update participants
            if (array_key_exists('participants', $validated)) {
                // Remove old participants
                TrainingParticipant::where('training_id', $training->id)->delete();
                
                // Add new participants
                foreach ($validated['participants'] as $employeeId) {
                    TrainingParticipant::create([
                        'training_id' => $training->id,
                        'employee_id' => $employeeId
                    ]);
                }
            }
            
            DB::commit();
            
            // Load relationships for response
            $training->load(['type', 'participants.employee', 'trainer']);
            
            return response()->json([
                'message' => 'Training updated successfully',
                'training' => $training
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to update training', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to update training: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified training from storage.
     */
    public function destroy($id)
    {
        DB::beginTransaction();
        try {
            $training = Training::findOrFail($id);
            
            // Delete participants first
            TrainingParticipant::where('training_id', $training->id)->delete();
            
            // Delete training
            $training->delete();
            
            DB::commit();
            
            return response()->json([
                'message' => 'Training deleted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Failed to delete training', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to delete training: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update training status.
     */
    public function updateStatus(Request $request, $id)
    {
        $training = Training::findOrFail($id);
        
        $validated = $request->validate([
            'status' => 'required|in:Scheduled,Ongoing,Completed,Cancelled'
        ]);
        
        try {
            $training->update(['status' => $validated['status']]);
            
            return response()->json([
                'message' => 'Training status updated successfully',
                'training' => $training
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update training status', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to update training status: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export trainings to Excel.
     */
    public function export(Request $request)
    {
        try {
            $status = $request->input('status', 'all');
            
            $query = Training::with(['type', 'participants.employee', 'trainer']);
            
            if ($status !== 'all') {
                $query->where('status', $status);
            }
            
            $trainings = $query->orderBy('start_date', 'desc')->get();
            
            $spreadsheet = new Spreadsheet();
            $sheet = $spreadsheet->getActiveSheet();
            
            // Set headers
            $headers = [
                'A1' => 'Title',
                'B1' => 'Type',
                'C1' => 'Department',
                'D1' => 'Status',
                'E1' => 'Start Date',
                'F1' => 'End Date',
                'G1' => 'Location',
                'H1' => 'Trainer',
                'I1' => 'Max Participants',
                'J1' => 'Current Participants',
                'K1' => 'Description'
            ];
            
            foreach ($headers as $cell => $header) {
                $sheet->setCellValue($cell, $header);
                $sheet->getStyle($cell)->getFont()->setBold(true);
            }
            
            // Fill data
            $row = 2;
            foreach ($trainings as $training) {
                $sheet->setCellValue('A' . $row, $training->title);
                $sheet->setCellValue('B' . $row, $training->type->name ?? 'N/A');
                $sheet->setCellValue('C' . $row, $training->department);
                $sheet->setCellValue('D' . $row, $training->status);
                $sheet->setCellValue('E' . $row, $training->start_date);
                $sheet->setCellValue('F' . $row, $training->end_date);
                $sheet->setCellValue('G' . $row, $training->location ?? 'N/A');
                $sheet->setCellValue('H' . $row, $training->trainer->name ?? 'N/A');
                $sheet->setCellValue('I' . $row, $training->max_participants ?? 'Unlimited');
                $sheet->setCellValue('J' . $row, $training->participants->count());
                $sheet->setCellValue('K' . $row, $training->description ?? '');
                $row++;
            }
            
            // Auto-size columns
            foreach (range('A', 'K') as $column) {
                $sheet->getColumnDimension($column)->setAutoSize(true);
            }
            
            // Create writer
            $writer = new Xlsx($spreadsheet);
            
            // Generate filename
            $filename = 'trainings_' . ($status !== 'all' ? $status . '_' : '') . date('Y-m-d_His') . '.xlsx';
            
            // Save to temp file
            $tempFile = tempnam(sys_get_temp_dir(), 'trainings');
            $writer->save($tempFile);
            
            // Return download response
            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            Log::error('Failed to export trainings', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to export trainings: ' . $e->getMessage()
            ], 500);
        }
    }
}