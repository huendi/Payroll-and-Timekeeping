<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeLeaveCredit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmployeeLeaveCreditController extends Controller
{
    /**
     * Store a newly created leave credit or update existing one.
     */
    public function store(Request $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validate([
            'leave_type' => ['required', 'string', 'max:255'],
            'total_days' => ['required', 'numeric', 'min:0', 'max:999.9'],
        ]);

        // Check if leave credit already exists for this leave type
        $existingCredit = $employee->leaveCredits()
            ->where('leave_type', $validated['leave_type'])
            ->first();

        if ($existingCredit) {
            // Update existing credit by adding to total_days and remaining_days
            $existingCredit->update([
                'total_days' => $existingCredit->total_days + $validated['total_days'],
                'remaining_days' => $existingCredit->remaining_days + $validated['total_days'],
            ]);

            return redirect()->back()
                ->with('success', 'Leave credit updated successfully. ' . $validated['total_days'] . ' days added.');
        }

        // Create new leave credit if it doesn't exist
        $validated['remaining_days'] = $validated['total_days'];
        $employee->leaveCredits()->create($validated);

        return redirect()->back()
            ->with('success', 'Leave credit added successfully.');
    }

    /**
     * Update the specified leave credit.
     */
    public function update(Request $request, Employee $employee, EmployeeLeaveCredit $leaveCredit): RedirectResponse
    {
        $validated = $request->validate([
            'leave_type' => ['required', 'string', 'max:255'],
            'total_days' => ['required', 'numeric', 'min:0', 'max:999.9'],
            'remaining_days' => ['sometimes', 'numeric', 'min:0', 'max:999.9'],
        ]);

        $leaveCredit->update($validated);

        return redirect()->back()
            ->with('success', 'Leave credit updated successfully.');
    }

    /**
     * Remove the specified leave credit.
     */
    public function destroy(Employee $employee, EmployeeLeaveCredit $leaveCredit): RedirectResponse
    {
        $leaveCredit->delete();

        return redirect()->back()
            ->with('success', 'Leave credit deleted successfully.');
    }

    /**
     * Archive the specified leave credit.
     */
    public function archive(Employee $employee, EmployeeLeaveCredit $leaveCredit): RedirectResponse
    {
        $leaveCredit->archive();

        return redirect()->back()
            ->with('success', 'Leave credit archived successfully.');
    }

    /**
     * Restore the specified leave credit.
     */
    public function restore(Employee $employee, EmployeeLeaveCredit $leaveCredit): RedirectResponse
    {
        $leaveCredit->restore();

        return redirect()->back()
            ->with('success', 'Leave credit restored successfully.');
    }
}
