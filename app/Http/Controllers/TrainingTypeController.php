<?php

namespace App\Http\Controllers;

use App\Models\TrainingType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class TrainingTypeController extends Controller
{
    public function index()
    {
        $trainingTypes = TrainingType::orderBy('created_at', 'desc')->get();

        return Inertia::render('Training/TrainingTypes', [
            'trainingTypes' => $trainingTypes,
            'auth' => ['user' => Auth::user()]
        ]);
    }

    public function list()
    {
        $trainingTypes = TrainingType::orderBy('created_at', 'desc')->get();

        return response()->json([
            'data' => $trainingTypes
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:training_types',
            'description' => 'nullable|string',
            'is_active' => 'required|boolean'
        ]);

        try {
            $trainingType = TrainingType::create($validated);

            return response()->json([
                'message' => 'Training type created successfully',
                'trainingType' => $trainingType
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to create training type', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to create training type: ' . $e->getMessage()
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $trainingType = TrainingType::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:training_types,name,' . $id,
            'description' => 'nullable|string',
            'is_active' => 'required|boolean'
        ]);

        try {
            $trainingType->update($validated);

            return response()->json([
                'message' => 'Training type updated successfully',
                'trainingType' => $trainingType
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update training type', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to update training type: ' . $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $trainingType = TrainingType::findOrFail($id);
            
            // Check if any trainings are using this type
            if ($trainingType->trainings()->exists()) {
                return response()->json([
                    'error' => 'Cannot delete training type that is being used by trainings'
                ], 400);
            }

            $trainingType->delete();

            return response()->json([
                'message' => 'Training type deleted successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete training type', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to delete training type: ' . $e->getMessage()
            ], 500);
        }
    }

    public function toggleActive($id)
    {
        try {
            $trainingType = TrainingType::findOrFail($id);
            $trainingType->is_active = !$trainingType->is_active;
            $trainingType->save();

            return response()->json([
                'message' => 'Training type status updated successfully',
                'trainingType' => $trainingType
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to toggle training type status', ['error' => $e->getMessage()]);
            return response()->json([
                'error' => 'Failed to toggle training type status: ' . $e->getMessage()
            ], 500);
        }
    }
}