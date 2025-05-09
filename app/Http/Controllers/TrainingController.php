<?php

namespace App\Http\Controllers;

use App\Models\Training;
use App\Models\TrainingType;
use App\Models\Employee;
use App\Models\TrainingParticipant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class TrainingController extends Controller
{
    public function index()
    {
        $status = request()->input('status', 'all');
        
        $query = Training::with(['type', 'participants.employee'])
                ->withCount('participants');

        if ($status !== 'all' && $status !== 'All') {
            $query->where('status', $status);
        }

        $trainings = $query->orderBy('start_date', 'desc')->get();

        $counts = [
            'total' => Training::count(),
            'scheduled' => Training::where('status', 'Scheduled')->count(),
            'ongoing' => Training::where('status', 'Ongoing')->count(), 
            'completed' => Training::where('status', 'Completed')->count(),
            'cancelled' => Training::where('status', 'Cancelled')->count(),
        ];

        $trainingTypes = TrainingType::where('is_active', true)->get();
        $employees = Employee::where('JobStatus', 'Active')->get();

        return Inertia::render('Training/Trainings', [
            'trainings' => $trainings,
            'counts' => $counts,
            'trainingTypes' => $trainingTypes,
            'employees' => $employees,
            'currentStatus' => $status,
            'auth' => ['user' => Auth::user()]
        ]);
    }

    public function list(Request $request)
    {
        $status = $request->input('status', 'all');
        
        $query = Training::with(['type', 'participants.employee'])
                ->withCount('participants');

        if ($status !== 'all' && $status !== 'All') {
            $query->where('status', $status);
        }

        $trainings = $query->orderBy('start_date', 'desc')->get();

        return response()->json([
            'data' => $trainings
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'training_type_id' => 'required|exists:training_types,id',
            'department' => 'nullable|string|max:255', 
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'trainer' => 'nullable|string|max:255',
            'max_participants' => 'nullable|integer|min:1',
            'materials_link' => 'nullable|url',
            'status' => 'required|in:Scheduled,Ongoing,Completed,Cancelled',
            'participants' => 'nullable|array',
            'participants.*' => 'exists:employees,id'
        ]);

        try {
            $training = Training::create($validated);

            if (!empty($validated['participants'])) {
                $participantData = array_map(function($employeeId) {
                    return [
                        'employee_id' => $employeeId,
                        'attendance_status' => 'Registered'
                    ];
                }, $validated['participants']);

                $training->participants()->attach($participantData);
            }

            return response()->json([
                'message' => 'Training created successfully',
                'training' => $training->load(['type', 'participants.employee'])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create training', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to create training: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $training = Training::findOrFail($id);
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'training_type_id' => 'required|exists:training_types,id',
            'department' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'location' => 'nullable|string|max:255',
            'trainer' => 'nullable|string|max:255',
            'max_participants' => 'nullable|integer|min:1',
            'materials_link' => 'nullable|url',
            'status' => 'required|in:Scheduled,Ongoing,Completed,Cancelled',
            'participants' => 'nullable|array',
            'participants.*' => 'exists:employees,id'
        ]);

        try {
            $training->update($validated);

            // Update participants
            if (array_key_exists('participants', $validated)) {
                // Detach all existing participants
                $training->participants()->detach();
                
                // Attach new participants
                if (!empty($validated['participants'])) {
                    $participantData = [];
                    foreach ($validated['participants'] as $employeeId) {
                        $participantData[$employeeId] = [
                            'attendance_status' => 'Registered'
                        ];
                    }
                    $training->participants()->attach($participantData);
                }
            }

            return response()->json([
                'message' => 'Training updated successfully',
                'training' => $training->load(['type', 'participants.employee'])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update training', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to update training: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $training = Training::findOrFail($id);
            $training->delete();

            return response()->json([
                'message' => 'Training deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete training', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to delete training: ' . $e->getMessage()
            ], 500);
        }
    }

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
                'training' => $training->load(['type', 'participants.employee'])
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update training status', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to update training status: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateParticipantStatus(Request $request, $trainingId, $participantId)
    {
        $training = Training::findOrFail($trainingId);
        
        $validated = $request->validate([
            'attendance_status' => 'required|in:Registered,Attended,Absent,Cancelled'
        ]);

        try {
            $training->participants()->updateExistingPivot($participantId, [
                'attendance_status' => $validated['attendance_status']
            ]);

            return response()->json([
                'message' => 'Participant status updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update participant status', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to update participant status: ' . $e->getMessage()
            ], 500);
        }
    }

    public function export(Request $request)
    {
        $status = $request->input('status', 'all');
        
        $query = Training::with(['type', 'participants.employee']);

        if ($status !== 'all' && $status !== 'All') {
            $query->where('status', $status);
        }

        $trainings = $query->orderBy('start_date', 'desc')->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set headers
        $headers = [
            'A1' => 'ID',
            'B1' => 'Title',
            'C1' => 'Type',
            'D1' => 'Department',
            'E1' => 'Start Date',
            'F1' => 'End Date',
            'G1' => 'Location',
            'H1' => 'Trainer',
            'I1' => 'Status',
            'J1' => 'Max Participants',
            'K1' => 'Current Participants',
            'L1' => 'Description'
        ];

        // Set header data and styling
        foreach ($headers as $cell => $value) {
            $sheet->setCellValue($cell, $value);
            $sheet->getStyle($cell)->applyFromArray([
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E2E8F0']
                ]
            ]);
        }

        // Add data
        $row = 2;
        foreach ($trainings as $training) {
            $sheet->setCellValue('A' . $row, $training->id);
            $sheet->setCellValue('B' . $row, $training->title);
            $sheet->setCellValue('C' . $row, $training->type->name ?? '');
            $sheet->setCellValue('D' . $row, $training->department);
            $sheet->setCellValue('E' . $row, $training->start_date ? $training->start_date->format('Y-m-d') : '');
            $sheet->setCellValue('F' . $row, $training->end_date ? $training->end_date->format('Y-m-d') : '');
            $sheet->setCellValue('G' . $row, $training->location);
            $sheet->setCellValue('H' . $row, $training->trainer);
            $sheet->setCellValue('I' . $row, $training->status);
            $sheet->setCellValue('J' . $row, $training->max_participants);
            $sheet->setCellValue('K' . $row, $training->participants->count());
            $sheet->setCellValue('L' . $row, $training->description);
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $writer = new Xlsx($spreadsheet);
        $filename = 'trainings_' . date('Y-m-d_H-i-s') . '.xlsx';
        
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        
        $writer->save('php://output');
    }
}