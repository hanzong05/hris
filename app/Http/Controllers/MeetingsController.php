<?php

namespace App\Http\Controllers;

use App\Models\Meeting;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MeetingsController  extends Controller
{
    public function index(Request $request)
    {
        $status = $request->input('status', 'all');
        
        $meetings = Meeting::query()
            ->when($status !== 'all', function ($query) use ($status) {
                return $query->where('status', $status);
            })
            ->withCount('participants')
            ->orderBy('start_time', 'desc')
            ->get();

        $counts = [
            'total' => Meeting::count(),
            'scheduled' => Meeting::where('status', 'Scheduled')->count(),
            'completed' => Meeting::where('status', 'Completed')->count(),
            'cancelled' => Meeting::where('status', 'Cancelled')->count(),
        ];

        return Inertia::render('Meeting/MeetingPage', [
            'meetings' => $meetings,
            'counts' => $counts,
            'currentStatus' => $status,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'agenda' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after_or_equal:start_time',
            'location' => 'nullable|string|max:255',
            'organizer' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'status' => 'required|in:Scheduled,Completed,Cancelled,Postponed',
            'is_recurring' => 'boolean',
            'recurrence_pattern' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|string|max:255',
            'participants' => 'nullable|array',
        ]);

        $meeting = Meeting::create($validated);

        if (!empty($validated['participants'])) {
            $participants = [];
            foreach ($validated['participants'] as $participant) {
                $participants[$participant] = ['attendance_status' => 'Invited'];
            }
            $meeting->participants()->attach($participants);
        }

        return redirect()->route('meetings.index')->with('message', 'Meeting created successfully');
    }

    public function update(Request $request, Meeting $meeting)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'agenda' => 'nullable|string',
            'start_time' => 'required|date',
            'end_time' => 'required|date|after_or_equal:start_time',
            'location' => 'nullable|string|max:255',
            'organizer' => 'required|string|max:255',
            'department' => 'nullable|string|max:255',
            'status' => 'required|in:Scheduled,Completed,Cancelled,Postponed',
            'is_recurring' => 'boolean',
            'recurrence_pattern' => 'nullable|string|max:255',
            'meeting_link' => 'nullable|string|max:255',
            'participants' => 'nullable|array',
        ]);

        $meeting->update($validated);

        if (isset($validated['participants'])) {
            $participants = [];
            foreach ($validated['participants'] as $participant) {
                $participants[$participant] = ['attendance_status' => 'Invited'];
            }
            $meeting->participants()->sync($participants);
        }

        return redirect()->route('meetings.index')->with('message', 'Meeting updated successfully');
    }

    public function destroy(Meeting $meeting)
    {
        $meeting->delete();
        return redirect()->route('meetings.index')->with('message', 'Meeting deleted successfully');
    }

    public function markCompleted(Meeting $meeting)
    {
        $meeting->update(['status' => 'Completed']);
        return redirect()->back()->with('message', 'Meeting marked as completed');
    }

    public function markCancelled(Meeting $meeting)
    {
        $meeting->update(['status' => 'Cancelled']);
        return redirect()->back()->with('message', 'Meeting marked as cancelled');
    }

    public function markScheduled(Meeting $meeting)
    {
        $meeting->update(['status' => 'Scheduled']);
        return redirect()->back()->with('message', 'Meeting marked as scheduled');
    }

    public function getEmployees()
    {
        $employees = Employee::select('id', 'Fname', 'Lname', 'Department')
            ->where('JobStatus', 'Active')
            ->orderBy('Lname')
            ->get()
            ->map(function ($employee) {
                return [
                    'id' => $employee->id,
                    'name' => "{$employee->Lname}, {$employee->Fname}",
                    'department' => $employee->Department,
                ];
            });

        return response()->json($employees);
    }
}
