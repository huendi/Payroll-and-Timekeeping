<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeDeduction;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class EmployeeDeductionController extends Controller
{
    /**
     * Store a newly created deduction.
     */
    public function store(Request $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validate([
            'deduction_type' => ['required', 'in:company_loan,cash_advance,sss_loan,hdmf_loan,other'],
            'custom_type' => ['nullable', 'string', 'max:255', 'required_if:deduction_type,other'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'term' => ['required', 'integer', 'min:1'],
            'cut_off' => ['required', 'in:1st_half,2nd_half'],
            'start_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        // Set remaining balance to the amount initially
        $validated['remaining_balance'] = $validated['amount'];
        $validated['employee_id'] = $employee->id;

        EmployeeDeduction::create($validated);

        return redirect()->back()
            ->with('success', 'Deduction created successfully.');
    }

    /**
     * Update the specified deduction.
     */
    public function update(Request $request, Employee $employee, EmployeeDeduction $deduction): RedirectResponse
    {
        $validated = $request->validate([
            'deduction_type' => ['required', 'in:company_loan,cash_advance,sss_loan,hdmf_loan,other'],
            'custom_type' => ['nullable', 'string', 'max:255', 'required_if:deduction_type,other'],
            'amount' => ['required', 'numeric', 'min:0.01'],
            'term' => ['required', 'integer', 'min:1'],
            'cut_off' => ['required', 'in:1st_half,2nd_half'],
            'start_date' => ['required', 'date'],
            'is_active' => ['boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $deduction->update($validated);

        return redirect()->back()
            ->with('success', 'Deduction updated successfully.');
    }

    /**
     * Get payment history for a deduction.
     */
    public function payments(Employee $employee, EmployeeDeduction $deduction)
    {
        // Get the current schedule for cutoff label formatting
        $currentYear = now()->year;
        $schedule = \App\Models\Schedule::where('year', $currentYear)->first() ?? \App\Models\Schedule::latest()->first();
        
        // Fetch actual payment records from database
        $payments = $deduction->payments()
            ->with('payslip:id,payroll_period,month,year')
            ->orderBy('payment_date', 'asc')
            ->get()
            ->map(function ($payment) use ($schedule) {
                $payrollPeriod = $payment->payslip->payroll_period ?? 'N/A';
                $month = $payment->payslip->month ?? '';
                
                // Format cutoff label with dates if schedule is available
                if ($schedule && $payrollPeriod !== 'N/A') {
                    if ($payrollPeriod === '1st Half') {
                        $firstHalfEnd = (int)$schedule->first_half_end;
                        $payrollPeriod = "1st Half (1-{$firstHalfEnd}) {$month}";
                    } elseif ($payrollPeriod === '2nd Half') {
                        $secondHalfStart = (int)$schedule->first_half_end + 1;
                        $payrollPeriod = "2nd Half ({$secondHalfStart}-End) {$month}";
                    }
                }
                
                return [
                    'payment_date' => $payment->payment_date,
                    'payroll_period' => $payrollPeriod,
                    'amount' => $payment->amount,
                    'balance_after' => $payment->balance_after,
                ];
            })
            ->toArray();

        return response()->json([
            'payments' => $payments,
            'deduction' => [
                'type' => $deduction->deduction_type,
                'amount' => $deduction->amount,
                'remaining_balance' => $deduction->remaining_balance,
                'payments_made' => $deduction->payments_made,
            ],
        ]);
    }

    /**
     * Remove the specified deduction.
     */
    public function destroy(Employee $employee, EmployeeDeduction $deduction): RedirectResponse
    {
        $deduction->delete();

        return redirect()->back()
            ->with('success', 'Deduction deleted successfully.');
    }

    /**
     * Archive the specified deduction.
     */
    public function archive(Employee $employee, EmployeeDeduction $deduction): RedirectResponse
    {
        $deduction->archive();

        return redirect()->back()
            ->with('success', 'Deduction archived successfully.');
    }

    /**
     * Restore the specified deduction.
     */
    public function restore(Employee $employee, EmployeeDeduction $deduction): RedirectResponse
    {
        $deduction->restore();

        return redirect()->back()
            ->with('success', 'Deduction restored successfully.');
    }
}
