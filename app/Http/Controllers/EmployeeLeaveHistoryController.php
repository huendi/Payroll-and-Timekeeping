<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeLeaveCredit;
use App\Models\EmployeeLeaveHistory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmployeeLeaveHistoryController extends Controller
{
    /**
     * Store a newly created leave application.
     */
    public function store(Request $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validate([
            'leave_type' => ['required', 'string', 'max:255'],
            'duration' => ['required', 'in:Full Day,Half Day'],
            'date_from' => ['required', 'date'],
            'date_to' => ['required', 'date', 'after_or_equal:date_from'],
            'remarks' => ['nullable', 'string'],
        ]);

        // Calculate days used based on date range and duration
        $dateFrom = new \DateTime($validated['date_from']);
        $dateTo = new \DateTime($validated['date_to']);
        $dateTo->modify('+1 day'); // Include end date
        
        $interval = $dateFrom->diff($dateTo);
        $totalDays = $interval->days;
        
        // If Half Day and single day, use 0.5, otherwise calculate full days
        if ($validated['duration'] === 'Half Day' && $totalDays === 1) {
            $daysUsed = 0.5;
        } else {
            $daysUsed = $totalDays;
        }
        
        $validated['days_used'] = $daysUsed;

        // Check if employee has enough leave credits
        $leaveCredit = EmployeeLeaveCredit::where('employee_id', $employee->id)
            ->where('leave_type', $validated['leave_type'])
            ->first();

        if (!$leaveCredit) {
            return redirect()->back()
                ->withErrors(['leave_type' => 'No leave credits found for this leave type.']);
        }

        if ($leaveCredit->remaining_days < $daysUsed) {
            return redirect()->back()
                ->withErrors(['date_to' => 'Insufficient leave credits. Available: ' . $leaveCredit->remaining_days . ' days, Required: ' . $daysUsed . ' days.']);
        }

        // Create leave history
        $employee->leaveHistory()->create($validated);

        // Deduct from leave credits
        $leaveCredit->decrement('remaining_days', $daysUsed);

        return redirect()->back()
            ->with('success', 'Leave filed successfully. Days used: ' . $daysUsed);
    }

    /**
     * Remove the specified leave history.
     */
    public function destroy(Employee $employee, EmployeeLeaveHistory $leaveHistory): RedirectResponse
    {
        // Restore leave credits
        $leaveCredit = EmployeeLeaveCredit::where('employee_id', $employee->id)
            ->where('leave_type', $leaveHistory->leave_type)
            ->first();

        if ($leaveCredit) {
            $leaveCredit->increment('remaining_days', $leaveHistory->days_used);
        }

        $leaveHistory->delete();

        return redirect()->back()
            ->with('success', 'Leave record deleted and credits restored.');
    }

    /**
     * Archive the specified leave history.
     */
    public function archive(Employee $employee, EmployeeLeaveHistory $leaveHistory): RedirectResponse
    {
        $leaveHistory->archive();

        return redirect()->back()
            ->with('success', 'Leave record archived successfully.');
    }

    /**
     * Restore the specified leave history.
     */
    public function restore(Employee $employee, EmployeeLeaveHistory $leaveHistory): RedirectResponse
    {
        $leaveHistory->restore();

        return redirect()->back()
            ->with('success', 'Leave record restored successfully.');
    }
}
