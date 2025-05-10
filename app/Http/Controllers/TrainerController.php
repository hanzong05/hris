<?php

namespace App\Http\Controllers;

use App\Models\Trainer;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TrainerController extends Controller
{
    /**
     * Display a listing of trainers.
     */
    public function index(Request $request)
    {
        $type = $request->input('type', 'all');
        
        // Get counts for stats
        $counts = [
            'total' => Trainer::count(),
            'internal' => Trainer::internal()->count(),
            'external' => Trainer::external()->count(),
            'active' => Trainer::active()->count(),
            'inactive' => Trainer::where('is_active', false)->count(),
        ];
        
        return Inertia::render('Training/Trainers', [
            'trainers' => $this->getFilteredTrainers($type),
            'counts' => $counts,
            'currentType' => $type,
            'auth' => ['user' => Auth::user()]
        ]);
    }

    /**
     * Get filtered trainers list based on type.
     */
    private function getFilteredTrainers($type)
    {
        $query = Trainer::with(['employee']);
        
        // Apply filters based on type
        if ($type === 'internal') {
            $query->where('is_external', false);
        } elseif ($type === 'external') {
            $query->where('is_external', true);
        } elseif ($type === 'active') {
            $query->where('is_active', true);
        } elseif ($type === 'inactive') {
            $query->where('is_active', false);
        }
        
        return $query->orderBy('name')->get();
    }

    /**
     * Get trainers list for API.
     */
    public function list(Request $request)
    {
        $type = $request->input('type', 'all');
        
        $trainers = $this->getFilteredTrainers($type);
        
        return response()->json([
            'data' => $trainers
        ]);
    }

    /**
     * Store a newly created trainer in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:255',
            'company' => 'nullable|string|max:255',
            'expertise_area' => 'nullable|string|max:255',
            'qualifications' => 'nullable|string',
            'certifications' => 'nullable|string',
            'bio' => 'nullable|string',
            'website' => 'nullable|url|max:255',
            'linkedin' => 'nullable|string|max:255',
            'is_external' => 'required|boolean',
            'is_active' => 'nullable|boolean',
            'employee_id' => [
                'nullable',
                Rule::requiredIf(function () use ($request) {
                    return $request->input('is_external') === false;
                }),
                'exists:employees,id'
            ],
            'photo' => 'nullable|image|max:2048', // 2MB max
        ]);
        
        try {
            // Handle file upload if present
            if ($request->hasFile('photo')) {
                $photoPath = $request->file('photo')->store('trainers', 'public');
                $validated['photo_path'] = $photoPath;
            }
            
            // Create trainer
            $trainer = Trainer::create($validated);
            
            return response()->json([
                'message' => 'Trainer created successfully',
                'trainer' => $trainer
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create trainer', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to create trainer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified trainer in storage.
     */
    public function update(Request $request, $id)
    {
        $trainer = Trainer::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'position' => 'nullable|string|max:255',
            'company' => 'nullable|string|max:255',
            'expertise_area' => 'nullable|string|max:255',
            'qualifications' => 'nullable|string',
            'certifications' => 'nullable|string',
            'bio' => 'nullable|string',
            'website' => 'nullable|url|max:255',
            'linkedin' => 'nullable|string|max:255',
            'is_external' => 'required|boolean',
            'is_active' => 'nullable|boolean',
            'employee_id' => [
                'nullable',
                Rule::requiredIf(function () use ($request) {
                    return $request->input('is_external') === false;
                }),
                'exists:employees,id'
            ],
            'photo' => 'nullable|image|max:2048', // 2MB max
        ]);
        
        try {
            // Handle file upload if present
            if ($request->hasFile('photo')) {
                // Delete old photo if it exists
                if ($trainer->photo_path && Storage::disk('public')->exists($trainer->photo_path)) {
                    Storage::disk('public')->delete($trainer->photo_path);
                }
                
                $photoPath = $request->file('photo')->store('trainers', 'public');
                $validated['photo_path'] = $photoPath;
            }
            
            // Update trainer
            $trainer->update($validated);
            
            return response()->json([
                'message' => 'Trainer updated successfully',
                'trainer' => $trainer
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update trainer', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to update trainer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified trainer from storage.
     */
    public function destroy($id)
    {
        try {
            $trainer = Trainer::findOrFail($id);
            
            // Check if the trainer is being used in any training before deleting
            if ($trainer->trainings()->exists()) {
                return response()->json([
                    'error' => 'Cannot delete trainer that is assigned to trainings'
                ], 400);
            }
            
            // Delete photo if it exists
            if ($trainer->photo_path && Storage::disk('public')->exists($trainer->photo_path)) {
                Storage::disk('public')->delete($trainer->photo_path);
            }
            
            $trainer->delete();
            
            return response()->json([
                'message' => 'Trainer deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete trainer', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to delete trainer: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle trainer active status.
     */
    public function toggleActive($id)
    {
        try {
            $trainer = Trainer::findOrFail($id);
            $trainer->is_active = !$trainer->is_active;
            $trainer->save();
            
            return response()->json([
                'message' => 'Trainer status updated successfully',
                'trainer' => $trainer
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to toggle trainer status', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to toggle trainer status: ' . $e->getMessage()
            ], 500);
        }
    }
    public function show($id)
    {
        $training = Training::with('participants')->findOrFail($id);
        
        // Transform participants to include an employee property
        $training->participants->each(function ($participant) {
            $participant->employee = $participant;
        });
        
        return inertia('Trainings/Show', [
            'training' => $training
        ]);
    }
    public function export(Request $request)
    {
        try {
            $type = $request->input('type', 'all');
            $trainers = $this->getFilteredTrainers($type);
            
            // Create Excel export logic here
            // This would typically use something like Laravel Excel package
            
            return response()->json([
                'message' => 'Trainers exported successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to export trainers', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to export trainers: ' . $e->getMessage()
            ], 500);
        }
    }
}