<?php

namespace App\Http\Controllers;

use App\Models\Payslip;
use App\Models\Payroll;
use App\Models\Employee;
use App\Models\Schedule;
use App\Models\ThirteenthMonthPay;
use App\Models\ThirteenthMonthPayItem;
use Illuminate\Http\Request;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;

class ReportController extends Controller
{
    /**
     * Show the reports index page with filtering options
     */
    public function index(Request $request)
    {
        $query = Payslip::with(['employee', 'payroll'])
            ->where('is_archived', false);
        $selectedMonth = null;
        $selectedYear = null;

        // Apply filters - either month or year (at least one is required)
        if ($request->filled('month')) {
            $query->where('month', $request->input('month'));
            $selectedMonth = $request->input('month');
        } elseif ($request->filled('year')) {
            $query->where('year', $request->input('year'));
            $selectedYear = $request->input('year');
        } else {
            // If no filter selected, default to current year
            $currentYear = date('Y');
            $query->where('year', $currentYear);
            $selectedYear = $currentYear;
        }

        // Get all payslips for the selected period
        $allPayslips = $query->get();

        // dd($allPayslips);
        
        // Get schedule for period formatting
        $schedule = Schedule::latest()->first();
        
        // Group and aggregate by employee only (sum all periods)
        $aggregatedData = $allPayslips->groupBy('employee_id')->map(function ($employeePayslips) use ($selectedMonth, $selectedYear, $schedule) {
            $firstPayslip = $employeePayslips->first();
            
            // Determine payroll period display
            if ($selectedMonth) {
                $periodDisplay = $selectedMonth;
            } else {
                $periodDisplay = $selectedYear ?? $firstPayslip->year;
            }
            
            // Get 13th month pay for this employee and year (exclude archived)
            $thirteenthMonthPayItem = ThirteenthMonthPayItem::where('employee_id', $firstPayslip->employee_id)
                ->whereHas('thirteenthMonthPay', function ($q) use ($firstPayslip) {
                    $q->where('year', $firstPayslip->year)
                      ->where('status', 'active');
                })
                ->first();
            $thirteenthMonthPay = (float) ($thirteenthMonthPayItem?->thirteenth_month_pay ?? 0);
            
            return [
                'id' => $firstPayslip->id,
                'employee_id' => $firstPayslip->employee_id,
                'employee' => $firstPayslip->employee,
                'payroll' => $firstPayslip->payroll,
                'payroll_period' => $periodDisplay,
                'month' => $selectedMonth ?? 'All',
                'year' => $firstPayslip->year,
                'basic_pay' => $employeePayslips->sum('basic_pay'),
                'allowance' => $employeePayslips->sum('allowance'),
                'other_pay' => $employeePayslips->sum('other_pay'),
                'incentives' => $employeePayslips->sum('incentives'),
                'overtime_pay' => $employeePayslips->sum('overtime_pay'),
                'night_diff_pay' => $employeePayslips->sum('night_diff_pay'),
                'holiday_pay' => $employeePayslips->sum('holiday_pay'),
                'restday_pay' => $employeePayslips->sum('restday_pay'),
                'gross_pay' => $employeePayslips->sum('gross_pay'),
                'sss_deduction' => $employeePayslips->sum('sss_deduction'),
                'phic_deduction' => $employeePayslips->sum('phic_deduction'),
                'hdmf_deduction' => $employeePayslips->sum('hdmf_deduction'),
                'tax_deduction' => $employeePayslips->sum('tax_deduction'),
                'late_deduction' => $employeePayslips->sum('late_deduction'),
                'absence_deduction' => $employeePayslips->sum('absence_deduction'),
                'loan_deductions' => $employeePayslips->sum(function ($slip) {
                    return is_array($slip->loan_deductions) && isset($slip->loan_deductions['total']) 
                        ? $slip->loan_deductions['total'] 
                        : 0;
                }),
                'total_deductions' => $employeePayslips->sum('total_deductions'),
                'net_pay' => $employeePayslips->sum('net_pay'),
                'hours_worked' => $employeePayslips->sum('hours_worked'),
                'days_worked' => $employeePayslips->sum('days_worked'),
                'late_minutes' => $employeePayslips->sum('late_minutes'),
                'absent_days' => $employeePayslips->sum('absent_days'),
                'leave_days_used' => $employeePayslips->sum('leave_days_used'),
                'overtime_hours' => $employeePayslips->sum('overtime_hours'),
                'night_diff_hours' => $employeePayslips->sum('night_diff_hours'),
                'thirteenth_month_pay' => $thirteenthMonthPay,
            ];
        })->values();

        // Convert to paginated collection
        $page = request()->get('page', 1);
        $perPage = 50;
        $total = $aggregatedData->count();
        $payslips = new \Illuminate\Pagination\LengthAwarePaginator(
            $aggregatedData->slice(($page - 1) * $perPage, $perPage)->values(),
            $total,
            $perPage,
            $page,
            [
                'path' => request()->url(),
                'query' => request()->query(),
            ]
        );
        
        // Get filter options (exclude archived)
        $months = Payslip::where('is_archived', false)->select('month')->distinct()->orderBy('month')->pluck('month');
        $years = Payslip::where('is_archived', false)->select('year')->distinct()->orderBy('year', 'desc')->pluck('year');

        return Inertia::render('reports/index', [
            'payslips' => $payslips,
            'filters' => $request->only(['month', 'year']),
            'months' => $months,
            'years' => $years,
        ]);
    }

    /**
     * Export payslips to Excel with selected columns
     */
    public function export(Request $request)
    {
        $validated = $request->validate([
            'columns' => 'required|array|min:1',
            'columns.*' => 'string|in:employee_name,status,tin,nationality,payroll_period,month,year,basic_pay,allowance,other_pay,incentives,overtime_pay,night_diff_pay,holiday_pay,restday_pay,gross_pay,sss_deduction,phic_deduction,hdmf_deduction,tax_deduction,late_deduction,absence_deduction,loan_deductions,total_deductions,net_pay,hours_worked,days_worked,late_minutes,absent_days,leave_days_used,overtime_hours,night_diff_hours,thirteenth_month_pay',
        ]);

        // Build query with same filters as index
        $query = Payslip::with(['employee', 'payroll'])
            ->where('is_archived', false);
        $selectedMonth = null;
        $selectedYear = null;

        // Apply filters - either month or year (at least one is required)
        if ($request->filled('month')) {
            $query->where('month', $request->input('month'));
            $selectedMonth = $request->input('month');
        } elseif ($request->filled('year')) {
            $query->where('year', $request->input('year'));
            $selectedYear = $request->input('year');
        } else {
            // If no filter selected, default to current year
            $currentYear = date('Y');
            $query->where('year', $currentYear);
            $selectedYear = $currentYear;
        }

        // Get all payslips for the selected period
        $allPayslips = $query->get();
        
        // Get schedule for period formatting
        $schedule = Schedule::latest()->first();
        
        // Group and aggregate by employee only (sum all periods)
        $payslips = $allPayslips->groupBy('employee_id')->map(function ($employeePayslips) use ($selectedMonth, $selectedYear, $schedule) {
            $firstPayslip = $employeePayslips->first();
            
            // Determine payroll period display
            if ($selectedMonth) {
                $periodDisplay = $selectedMonth;
            } else {
                $periodDisplay = $selectedYear ?? $firstPayslip->year;
            }
            
            // Get 13th month pay for this employee and year (exclude archived)
            $thirteenthMonthPayItem = ThirteenthMonthPayItem::where('employee_id', $firstPayslip->employee_id)
                ->whereHas('thirteenthMonthPay', function ($q) use ($firstPayslip) {
                    $q->where('year', $firstPayslip->year)
                      ->where('status', 'active');
                })
                ->first();
            $thirteenthMonthPay = (float) ($thirteenthMonthPayItem?->thirteenth_month_pay ?? 0);
            
            return (object)[
                'id' => $firstPayslip->id,
                'employee_id' => $firstPayslip->employee_id,
                'employee' => $firstPayslip->employee,
                'payroll' => $firstPayslip->payroll,
                'payroll_period' => $periodDisplay,
                'month' => $selectedMonth ?? 'All',
                'year' => $firstPayslip->year,
                'basic_pay' => $employeePayslips->sum('basic_pay'),
                'allowance' => $employeePayslips->sum('allowance'),
                'other_pay' => $employeePayslips->sum('other_pay'),
                'incentives' => $employeePayslips->sum('incentives'),
                'overtime_pay' => $employeePayslips->sum('overtime_pay'),
                'night_diff_pay' => $employeePayslips->sum('night_diff_pay'),
                'holiday_pay' => $employeePayslips->sum('holiday_pay'),
                'restday_pay' => $employeePayslips->sum('restday_pay'),
                'gross_pay' => $employeePayslips->sum('gross_pay'),
                'sss_deduction' => $employeePayslips->sum('sss_deduction'),
                'phic_deduction' => $employeePayslips->sum('phic_deduction'),
                'hdmf_deduction' => $employeePayslips->sum('hdmf_deduction'),
                'tax_deduction' => $employeePayslips->sum('tax_deduction'),
                'late_deduction' => $employeePayslips->sum('late_deduction'),
                'absence_deduction' => $employeePayslips->sum('absence_deduction'),
                'loan_deductions' => $employeePayslips->sum(function ($slip) {
                    return is_array($slip->loan_deductions) && isset($slip->loan_deductions['total']) 
                        ? $slip->loan_deductions['total'] 
                        : 0;
                }),
                'total_deductions' => $employeePayslips->sum('total_deductions'),
                'net_pay' => $employeePayslips->sum('net_pay'),
                'hours_worked' => $employeePayslips->sum('hours_worked'),
                'days_worked' => $employeePayslips->sum('days_worked'),
                'late_minutes' => $employeePayslips->sum('late_minutes'),
                'absent_days' => $employeePayslips->sum('absent_days'),
                'leave_days_used' => $employeePayslips->sum('leave_days_used'),
                'overtime_hours' => $employeePayslips->sum('overtime_hours'),
                'night_diff_hours' => $employeePayslips->sum('night_diff_hours'),
                'thirteenth_month_pay' => $thirteenthMonthPay,
            ];
        })->values();

        // Create spreadsheet
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Payroll Report');

        // Define column headers
        $columnHeaders = $this->getColumnHeaders();
        $selectedColumns = $validated['columns'];

        // Write headers
        $colLetters = [];
        $col = 1;
        foreach ($selectedColumns as $columnKey) {
            $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
            $colLetters[] = $colLetter;
            $sheet->setCellValue($colLetter . '1', $columnHeaders[$columnKey]);
            $col++;
        }

        // Style headers
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '366092']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN]],
        ];

        $headerRange = 'A1:' . end($colLetters) . '1';
        $sheet->getStyle($headerRange)->applyFromArray($headerStyle);

        // Write data
        $row = 2;
        foreach ($payslips as $payslip) {
            $col = 1;
            foreach ($selectedColumns as $columnKey) {
                $colLetter = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::stringFromColumnIndex($col);
                $value = $this->getColumnValue($payslip, $columnKey);
                $sheet->setCellValue($colLetter . $row, $value);
                
                // Format currency columns
                if (in_array($columnKey, ['basic_pay', 'allowance', 'other_pay', 'incentives', 'overtime_pay', 'night_diff_pay', 'holiday_pay', 'restday_pay', 'gross_pay', 'sss_deduction', 'phic_deduction', 'hdmf_deduction', 'tax_deduction', 'late_deduction', 'absence_deduction', 'loan_deductions', 'total_deductions', 'net_pay', 'thirteenth_month_pay'])) {
                    $sheet->getStyle($colLetter . $row)->getNumberFormat()->setFormatCode('#,##0.00');
                }
                
                $col++;
            }
            $row++;
        }

        // Auto-fit columns
        foreach ($colLetters as $colLetter) {
            $sheet->getColumnDimension($colLetter)->setAutoSize(true);
        }

        // Add borders to all data cells
        $dataRange = 'A1:' . end($colLetters) . ($row - 1);
        $sheet->getStyle($dataRange)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                ],
            ],
        ]);

        // Generate file
        $writer = new Xlsx($spreadsheet);
        $filename = 'payroll_report_' . now()->format('Y-m-d_His') . '.xlsx';
        
        // Ensure temp directory exists
        $tempDir = storage_path('app/temp');
        if (!is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }
        
        // Save to temporary file
        $tempPath = $tempDir . '/' . $filename;
        $writer->save($tempPath);

        // Download and delete after sending
        return response()->download($tempPath, $filename)->deleteFileAfterSend(true);
    }

    /**
     * Get all available column headers
     */
    private function getColumnHeaders(): array
    {
        return [
            'employee_name' => 'Full Name',
            'status' => 'Status',
            'tin' => 'TIN',
            'nationality' => 'Nationality',
            'payroll_period' => 'Payroll Period',
            'month' => 'Month',
            'year' => 'Year',
            'basic_pay' => 'Basic Pay',
            'allowance' => 'Allowance',
            'other_pay' => 'Other Pay',
            'incentives' => 'Incentives',
            'overtime_pay' => 'Overtime Pay',
            'night_diff_pay' => 'Night Differential',
            'holiday_pay' => 'Holiday Pay',
            'restday_pay' => 'Rest Day Pay',
            'gross_pay' => 'Gross Pay',
            'sss_deduction' => 'SSS Deduction',
            'phic_deduction' => 'PhilHealth Deduction',
            'hdmf_deduction' => 'HDMF Deduction',
            'tax_deduction' => 'Tax Deduction',
            'late_deduction' => 'Late Deduction',
            'absence_deduction' => 'Absence Deduction',
            'loan_deductions' => 'Loan Deductions',
            'total_deductions' => 'Total Deductions',
            'net_pay' => 'Net Pay',
            'hours_worked' => 'Hours Worked',
            'days_worked' => 'Days Worked',
            'late_minutes' => 'Late Minutes',
            'absent_days' => 'Absent Days',
            'leave_days_used' => 'Leave Days Used',
            'overtime_hours' => 'Overtime Hours',
            'night_diff_hours' => 'Night Differential Hours',
            'thirteenth_month_pay' => '13th Month Pay',
        ];
    }

    /**
     * Get column value from payslip
     */
    private function getColumnValue($payslip, $columnKey)
    {
        if ($columnKey === 'thirteenth_month_pay') {
            // Get 13th month pay for this employee and year (exclude archived)
            $thirteenthMonthPayItem = ThirteenthMonthPayItem::where('employee_id', $payslip->employee_id)
                ->whereHas('thirteenthMonthPay', function ($q) use ($payslip) {
                    $q->where('year', $payslip->year)
                      ->where('status', 'active');
                })
                ->first();
            return (float) ($thirteenthMonthPayItem?->thirteenth_month_pay ?? 0);
        }

        return match ($columnKey) {
            'employee_name' => $payslip->employee->first_name . ' ' . $payslip->employee->last_name,
            'status' => $payslip->employee->status ?? 'N/A',
            'tin' => $payslip->employee->tin ?? 'N/A',
            'nationality' => $payslip->employee->nationality ?? 'N/A',
            'payroll_period' => $payslip->payroll_period,
            'month' => $payslip->month,
            'year' => $payslip->year,
            'basic_pay' => (float) $payslip->basic_pay,
            'allowance' => (float) $payslip->allowance,
            'other_pay' => (float) $payslip->other_pay,
            'incentives' => (float) ($payslip->incentives ?? 0),
            'overtime_pay' => (float) $payslip->overtime_pay,
            'night_diff_pay' => (float) $payslip->night_diff_pay,
            'holiday_pay' => (float) $payslip->holiday_pay,
            'restday_pay' => (float) $payslip->restday_pay,
            'gross_pay' => (float) $payslip->gross_pay,
            'sss_deduction' => (float) $payslip->sss_deduction,
            'phic_deduction' => (float) $payslip->phic_deduction,
            'hdmf_deduction' => (float) $payslip->hdmf_deduction,
            'tax_deduction' => (float) $payslip->tax_deduction,
            'late_deduction' => (float) $payslip->late_deduction,
            'absence_deduction' => (float) $payslip->absence_deduction,
            'loan_deductions' => (float) (is_array($payslip->loan_deductions) && isset($payslip->loan_deductions['total']) ? $payslip->loan_deductions['total'] : 0),
            'total_deductions' => (float) $payslip->total_deductions,
            'net_pay' => (float) $payslip->net_pay,
            'hours_worked' => (float) $payslip->hours_worked,
            'days_worked' => (float) $payslip->days_worked,
            'late_minutes' => (float) $payslip->late_minutes,
            'absent_days' => (float) $payslip->absent_days,
            'leave_days_used' => (float) $payslip->leave_days_used,
            'overtime_hours' => (float) $payslip->overtime_hours,
            'night_diff_hours' => (float) $payslip->night_diff_hours,
            default => '',
        };
    }

    /**
     * Format month period display with specific cut (1st Half or 2nd Half)
     * Example: "October 1 - 15 (1st cut)" or "October 16 - 31 (2nd cut)"
     */
    private function formatMonthPeriodWithCut($month, $payrollPeriod, $schedule)
    {
        if (!$schedule) {
            return "{$month} - {$payrollPeriod}";
        }

        $monthNum = date('m', strtotime($month));
        $daysInMonth = date('t', strtotime("2024-{$monthNum}-01"));
        
        if ($payrollPeriod === '1st Half') {
            return "{$month} 1 - {$schedule->first_half_end} (1st cut)";
        } else {
            return "{$month} {$schedule->second_half_start} - {$daysInMonth} (2nd cut)";
        }
    }
}
