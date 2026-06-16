<?php

namespace App\Http\Controllers;

use App\Models\Payslip;
use App\Models\Payroll;
use App\Models\Employee;
use Illuminate\Http\Request;
use Inertia\Inertia;
use ZipArchive;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class PayslipController extends Controller
{
    public function index(Request $request)
    {
        $query = Payslip::with(['employee', 'payroll'])->orderBy('year', 'desc')->orderBy('month', 'desc');

        if ($request->filled('payroll_id')) {
            $query->where('payroll_id', $request->input('payroll_id'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->filled('period')) {
            $query->where('payroll_period', 'like', '%' . $request->input('period') . '%');
        }

        if ($request->filled('month')) {
            $query->where('month', $request->input('month'));
        }

        if ($request->filled('year')) {
            $query->where('year', $request->input('year'));
        }

        $payslips = $query->paginate(20)->withQueryString();

        $payroll = null;
        if ($request->filled('payroll_id')) {
            $payroll = Payroll::find($request->input('payroll_id'));
        }

        $employee = null;
        if ($request->filled('employee_id')) {
            $employee = Employee::find($request->input('employee_id'));
        }

        return Inertia::render('payslips/index', [
            'payslips' => $payslips,
            'filters' => $request->only(['payroll_id', 'employee_id', 'period', 'month', 'year']),
            'payroll' => $payroll,
            'employee' => $employee,
        ]);
    }

    public function showGroup($period, $month, $year)
    {
        $payslips = Payslip::where('payroll_period', $period)
            ->where('month', $month)
            ->where('year', $year)
            ->where('is_archived', false)
            ->with(['employee', 'payroll'])
            ->orderBy('employee_id')
            ->paginate(20);

        return Inertia::render('payslips/group', [
            'payslips' => $payslips,
            'period' => $period,
            'month' => $month,
            'year' => $year,
        ]);
    }

    private function enrichPayslipWithSnapshotData(Payslip $payslip)
    {
        $hasSnapshotData = false;

        if ($payslip->payroll && !empty($payslip->payroll->draft_snapshot)) {
            $snapshot = $payslip->payroll->draft_snapshot;
            // dd($snapshot);
            $rows = $snapshot['rows'] ?? [];
            
            $employeeRow = collect($rows)->firstWhere('employee.id', $payslip->employee_id);
            
            if ($employeeRow) {
                $payrollData = $employeeRow['payroll'] ?? [];
                $attendances = collect($employeeRow['attendances'] ?? []);

                // Only consider snapshot valid if we have pre-calculated totals OR raw attendance data
                if (isset($payrollData['totalOvertimeHours']) || isset($payrollData['lateAndAbsMinutes']) || $attendances->isNotEmpty()) {
                    // Overtime Hours
                    if (isset($payrollData['totalOvertimeHours'])) {
                        $totalOvertimeHours = $payrollData['totalOvertimeHours'];
                    } else {
                        $totalOvertimeHours = $attendances->sum('overtime_hours');
                    }

                    // Night Diff Hours
                    if (isset($payrollData['totalNightDiffHours'])) {
                        $totalNightDiffHours = $payrollData['totalNightDiffHours'];
                    } else {
                        $totalNightDiffHours = $attendances->sum('night_diff_hours');
                    }

                    // Holiday/Restday Hours
                    if (isset($payrollData['totalHolidayRestdayHours'])) {
                        $holidayRestdayHours = $payrollData['totalHolidayRestdayHours'];
                    } else {
                        $holidayRestdayHours = $attendances->filter(function ($att) {
                            return ($att['is_holiday'] ?? false) || ($att['is_restday'] ?? false);
                        })->sum(function ($att) {
                            return max(0, ($att['hours_worked'] ?? 0) - ($att['overtime_hours'] ?? 0));
                        });
                    }

                    $payslip->setAttribute('overtime_hours', $totalOvertimeHours);
                    $payslip->setAttribute('night_diff_hours', $totalNightDiffHours);
                    $payslip->setAttribute('holiday_restday_hours', $holidayRestdayHours);
                    
                    // Late and Absences Minutes
                    if (isset($payrollData['lateAndAbsMinutes'])) {
                        $payslip->setAttribute('late_and_abs_minutes', $payrollData['lateAndAbsMinutes']);
                    } else {
                        $lateMins = $payrollData['totalLateMinutes'] ?? 0;
                        $absDays = $payrollData['absentDays'] ?? 0;
                        $payslip->setAttribute('late_and_abs_minutes', $lateMins + ((float)$absDays * 480));
                    }

                    $hasSnapshotData = true;
                }
            }
        }

        if (!$hasSnapshotData) {
            // Fallback to DB Attendance records if snapshot is missing or data not found
            $attendances = \App\Models\Attendance::where('payroll_id', $payslip->payroll_id)
                ->where('employee_id', $payslip->employee_id)
                ->get();

            if ($attendances->isNotEmpty()) {
                $totalOvertimeHours = $attendances->sum('overtime_hours');
                $totalNightDiffHours = $attendances->sum('night_diff_hours');
                
                $holidayRestdayHours = $attendances->filter(function ($att) {
                    return $att->is_holiday || $att->is_restday;
                })->sum(function ($att) {
                    return max(0, $att->hours_worked - $att->overtime_hours);
                });

                $payslip->setAttribute('overtime_hours', $totalOvertimeHours);
                $payslip->setAttribute('night_diff_hours', $totalNightDiffHours);
                $payslip->setAttribute('holiday_restday_hours', $holidayRestdayHours);
            } else {
                // If no attendance records found, use values from payslip table (for OT/ND)
                if (!$payslip->overtime_hours) $payslip->setAttribute('overtime_hours', 0);
                if (!$payslip->night_diff_hours) $payslip->setAttribute('night_diff_hours', 0);
                $payslip->setAttribute('holiday_restday_hours', 0);
            }
            
            // Fallback for late/abs calculation using DB columns
            $payslip->setAttribute('late_and_abs_minutes', ($payslip->late_minutes ?? 0) + (($payslip->absent_days ?? 0) * 480));
        }
        
        return $payslip;
    }

    public function show(Payslip $payslip)
    {
        $payslip->load(['employee', 'payroll']);
        $this->enrichPayslipWithSnapshotData($payslip);
        // dd($payslip);

        return Inertia::render('payslips/show', [
            'payslip' => $payslip,
        ]);
    }

    public function getPayslipHTML(Payslip $payslip)
    {
        $payslip->load(['employee', 'payroll']);
        $this->enrichPayslipWithSnapshotData($payslip);

        // Calculate values needed for the template
        $loanTotal = null;
        if ($payslip->loan_deductions && isset($payslip->loan_deductions['total'])) {
            $loanTotal = $payslip->loan_deductions['total'];
            if (!is_numeric($loanTotal)) {
                $loanTotal = floatval($loanTotal);
            }
        }

        $incentivesAmount = $payslip->incentives ?? 0;
        $adjustmentsAmount = $payslip->adjustments ?? 0;
        $totalPayWithIncentives = $payslip->gross_pay; // gross_pay now includes adjustments and incentives

        // Return HTML for the payslip card using the Blade template
        $html = view('payslips.card', [
            'payslip' => $payslip,
            'loanTotal' => $loanTotal,
            'totalPayWithIncentives' => $totalPayWithIncentives,
        ])->render();

        return response()->json(['html' => $html]);
    }

    public function update(Request $request, Payslip $payslip)
    {
        try {
            $data = $request->validate([
                'incentives' => ['nullable', 'numeric'],
                'adjustments' => ['nullable', 'numeric'],
            ]);

           

            $incentives = $data['incentives'] ?? $payslip->incentives;
            $adjustments = $data['adjustments'] ?? $payslip->adjustments;

            // Base gross pay from original computation (without incentives and adjustments)
            // Note: gross_pay in DB currently includes previous incentives if updated before.
            // But here we are assuming gross_pay stored is the computed gross. 
            // Ideally we should recalculate gross_pay from components or store base_gross.
            // For now, let's assume we are updating it. 
            
            // Actually, to be safe, let's recalculate net_pay using the components:
            // Net Pay = (Basic + Allowance + Other + OT + ND + Holiday + Restday + Incentives + Adjustments) - Total Deductions
            
            $earnings = $payslip->basic_pay 
                      + $payslip->allowance 
                      + $payslip->overtime_pay 
                      + $payslip->night_diff_pay 
                      + $payslip->holiday_pay 
                      + $payslip->restday_pay
                      + $incentives
                      + $adjustments;

            $payslip->incentives = $incentives;
            $payslip->adjustments = $adjustments;
            $payslip->gross_pay = $earnings;
            $payslip->net_pay = $earnings - $payslip->total_deductions;

            $payslip->save();

            // Check if this is an API request
            if ($request->expectsJson()) {
                
                return response()->json([
                    'success' => true,
                    'message' => 'Payslip updated successfully',
                    'payslip' => $payslip,
                ]);
            }

            return redirect()->back()->with('success', 'Payslip updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
          
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $e->errors(),
                ], 422);
            }
            throw $e;
        } catch (\Exception $e) {
           
            if ($request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update payslip: ' . $e->getMessage(),
                ], 500);
            }
            return redirect()->back()->with('error', 'Failed to update payslip: ' . $e->getMessage());
        }
    }

    public function archive(Payslip $payslip)
    {
        $payslip->archive();

        return redirect()->back()->with('success', 'Payslip archived successfully.');
    }

    public function restore(Payslip $payslip)
    {
        $payslip->restore();

        return redirect()->back()->with('success', 'Payslip restored successfully.');
    }

    public function downloadGroup($period, $month, $year)
    {
        // Get all payslips for this group
        $payslips = Payslip::where('payroll_period', $period)
            ->where('month', $month)
            ->where('year', $year)
            ->with(['employee'])
            ->orderBy('employee_id')
            ->get();

        if ($payslips->isEmpty()) {
            return response()->json(['error' => 'No payslips found'], 404);
        }

        // Create temporary directory for images
        $tempDirName = Str::random(32);
        $tempDir = storage_path('app/temp/' . $tempDirName);
        @mkdir($tempDir, 0755, true);

        // Create temporary ZIP file
        $zipFileName = Str::random(32) . '.zip';
        $zipPath = storage_path('app/temp/' . $zipFileName);

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return response()->json(['error' => 'Failed to create ZIP file'], 500);
        }

        // Generate payslip data as JSON (since we can't render images server-side easily)
        $successCount = 0;
        foreach ($payslips as $payslip) {
            try {
                $this->enrichPayslipWithSnapshotData($payslip);
                $filename = "payslip_{$payslip->employee->last_name},{$payslip->employee->first_name}.json";
                
                $loanTotal = null;
                if ($payslip->loan_deductions && isset($payslip->loan_deductions['total'])) {
                    $loanTotal = $payslip->loan_deductions['total'];
                }

                $payslipData = [
                    'employee_id' => $payslip->employee->employee_number,
                    'employee_name' => $payslip->employee->first_name . ' ' . $payslip->employee->last_name,
                    'payroll_period' => $payslip->month . ' ' . ($payslip->payroll_period === '1st Half' ? '1-15' : '16-End') . ', ' . $payslip->year,
                    'month' => $payslip->month,
                    'year' => $payslip->year,
                    'rate_type' => $payslip->employee->rate_type,
                    'is_daily' => $payslip->employee->rate_type === 'daily',
                    'days_worked' => floatval($payslip->days_worked),
                    'basic_pay' => floatval($payslip->basic_pay),
                    'allowance' => floatval($payslip->allowance),
                    'incentives' => floatval($payslip->incentives ?? 0),
                    'adjustments' => floatval($payslip->adjustments ?? 0),
                    'overtime_pay' => floatval($payslip->overtime_pay),
                    'overtime_hours' => floatval($payslip->overtime_hours),
                    'night_diff_pay' => floatval($payslip->night_diff_pay),
                    'night_diff_hours' => floatval($payslip->night_diff_hours),
                    'holiday_pay' => floatval($payslip->holiday_pay),
                    'restday_pay' => floatval($payslip->restday_pay),
                    'holiday_restday_hours' => floatval($payslip->holiday_restday_hours ?? 0),
                    'gross_pay' => floatval($payslip->gross_pay),
                    'sss_deduction' => floatval($payslip->sss_deduction),
                    'phic_deduction' => floatval($payslip->phic_deduction),
                    'hdmf_deduction' => floatval($payslip->hdmf_deduction),
                    'tax_deduction' => floatval($payslip->tax_deduction),
                    'late_deduction' => floatval($payslip->late_deduction),
                    'absence_deduction' => floatval($payslip->absence_deduction),
                    'late_minutes' => floatval($payslip->late_minutes),
                    'absent_days' => floatval($payslip->absent_days),
                    'total_late_absence_minutes' => floatval($payslip->late_and_abs_minutes ?? (($payslip->late_minutes ?? 0) + (($payslip->absent_days ?? 0) * 480))),
                    'loan_deductions' => $payslip->loan_deductions,
                    'total_deductions' => floatval($payslip->total_deductions),
                    'net_pay' => floatval($payslip->net_pay),
                ];
                
                $zip->addFromString($filename, json_encode($payslipData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
                $successCount++;
            } catch (\Exception $e) {
                Log::error("Failed to add payslip {$payslip->id} to ZIP: " . $e->getMessage());
            }
        }

        $zip->close();

        if ($successCount === 0) {
            @unlink($zipPath);
            return response()->json(['error' => 'Failed to generate payslips'], 500);
        }

        // Download and cleanup
        $response = response()->download($zipPath, "payslips_{$period}_{$month}_{$year}.zip");
        $response->deleteFileAfterSend(true);

        return $response;
    }

    public function destroy(Payslip $payslip)
    {
        $payslip->delete();

        return redirect()->back()->with('success', 'Payslip deleted permanently');
    }

    public function archiveList(Request $request)
    {
        $query = Payslip::where('is_archived', true)
            ->with(['employee', 'payroll'])
            ->orderBy('archived_at', 'desc');

        if ($request->filled('payroll_id')) {
            $query->where('payroll_id', $request->input('payroll_id'));
        }

        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->input('employee_id'));
        }

        if ($request->filled('month')) {
            $query->where('month', $request->input('month'));
        }

        if ($request->filled('year')) {
            $query->where('year', $request->input('year'));
        }

        $payslips = $query->paginate(20)->withQueryString();

        return Inertia::render('payslips/archive', [
            'payslips' => $payslips,
            'filters' => $request->only(['payroll_id', 'employee_id', 'month', 'year']),
        ]);
    }
}
