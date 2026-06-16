<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Calendar;
use App\Models\DeductionPayment;
use App\Models\DeductionSetting;
use App\Models\Employee;
use App\Models\EmployeeDeduction;
use App\Models\EmployeeLeaveHistory;
use App\Models\EmployeeSchedule;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\Payslip;
use App\Models\PremiumType;
use App\Models\Schedule;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class PayrollController extends Controller
{
    public function index(Request $request)
    {
        $query = Payroll::with(['uploadedBy', 'schedule'])
            ->where('is_archived', false);

        // Apply filters
        if ($request->has('status') && $request->input('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->has('month') && $request->input('month')) {
            $query->where('month', $request->input('month'));
        }

        if ($request->has('year') && $request->input('year')) {
            $query->where('year', $request->input('year'));
        }

        $payrolls = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();

        // Calculate totals for draft payrolls from attendance
        $payrolls->getCollection()->transform(function ($payroll) {
            if ($payroll->isDraft()) {
                $totals = $this->calculateDraftTotals($payroll);
                $payroll->total_gross = $totals['gross'];
                $payroll->total_deductions = $totals['deductions'];
                $payroll->total_net = $totals['net'];
            }
            return $payroll;
        });

        return Inertia::render('payroll/index', [
            'payrolls' => $payrolls,
            'filters' => $request->only(['status', 'month', 'year'])
        ]);
    }

    public function create()
    {
        $schedules = Schedule::orderBy('year', 'desc')->get();
        
        return Inertia::render('payroll/create', [
            'schedules' => $schedules
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'month' => 'required|string',
            'year' => 'required|integer',
            'payroll_period' => 'required|in:1st Half,2nd Half',
            'apply_deductions' => 'required|in:yes,no',
            'excel_file' => 'required|file|mimes:xlsx,xls',
        ]);

        // Use the payroll period provided by the user
        $payrollPeriod = $request->input('payroll_period');

        // Check for duplicate (exclude archived and rejected)
        $existingPayroll = Payroll::where('payroll_period', $payrollPeriod)
            ->where('month', $request->month)
            ->where('year', $request->year)
            ->where('is_archived', false)
            ->where('status', '!=', 'rejected')
            ->first();

        if ($existingPayroll) {
            $statusMessage = match($existingPayroll->status) {
                'draft' => 'still in draft status',
                'pending' => 'pending approval',
                'approved' => 'already approved',
                default => 'already exists'
            };
            return back()->with('error', "Payroll for {$request->month} {$request->year} ({$payrollPeriod}) {$statusMessage}. Please complete or archive the existing payroll first.");
        }

        // Check if there's an archived payroll for this period (informational only)
        $archivedPayroll = Payroll::where('payroll_period', $payrollPeriod)
            ->where('month', $request->month)
            ->where('year', $request->year)
            ->where('is_archived', true)
            ->first();

        if ($archivedPayroll && $archivedPayroll->status === 'rejected') {
            // Allow creation but inform user
            \Log::info("Creating new payroll for {$request->month} {$request->year} ({$payrollPeriod}). Previous payroll was rejected.");
        }

        // Get schedule
        $schedule = Schedule::latest()->first();
        if (!$schedule) {
            return back()->with('error', 'No schedule found. Please create a schedule first.');
        }

        // Data integrity check: Verify there are active employees in the system
        $activeEmployeeCount = Employee::count();
        if ($activeEmployeeCount === 0) {
            return back()->with('error', 'No active employees found in the system. Please add employees before creating payroll.');
        }

        // Pre-validate Excel file before creating payroll
        $tempCutoffRange = $this->getTempCutoffDateRange($payrollPeriod, $request->month, $request->year);
        $validationResult = $this->validateExcelFile($request->file('excel_file'), $schedule, $tempCutoffRange);

        // Check if validation failed
        if ($validationResult['missing_schedules'] > 0) {
            return back()->with('error', "Cannot create payroll. {$validationResult['missing_schedules']} attendance records do not have a corresponding employee schedule. Please assign schedules for these employees first.");
        }

        if ($validationResult['total_records'] === 0) {
            $errorMessage = 'Cannot create payroll. ';
            
            if ($validationResult['failed_dates'] > 0) {
                $errorMessage .= "Failed to parse {$validationResult['failed_dates']} dates. Please check that dates are in a valid format (MM/DD/YYYY, DD/MM/YYYY, or YYYY-MM-DD). ";
            }
            
            if ($validationResult['skipped_dates'] > 0) {
                $errorMessage .= "{$validationResult['skipped_dates']} dates were outside the cutoff period ({$tempCutoffRange['start']} to {$tempCutoffRange['end']}). ";
            }
            
            if ($validationResult['missing_employees'] > 0) {
                $errorMessage .= "{$validationResult['missing_employees']} employee numbers were not found in the system. ";
            }

            return redirect()->route('payroll.create')->with('error', $errorMessage);
        }

        // All validations passed, now start the transaction
        DB::beginTransaction();

        try {

            // Store file
            $filename = strtolower(str_replace(' ', '_', $payrollPeriod . '_' . $request->month . '_' . $request->year)) . '.xlsx';
            $filePath = $request->file('excel_file')->storeAs('uploads/payrolls', $filename, 'public');

            // Create payroll
            $payroll = Payroll::create([
                'schedule_id' => $schedule->id,
                'payroll_period' => $payrollPeriod,
                'month' => $request->month,
                'year' => $request->year,
                'apply_deductions' => $request->apply_deductions === 'yes',
                'uploaded_by' => auth()->id() ?? 1,
                'excel_file_path' => $filePath,
                'status' => 'draft',
            ]);

            // Get cutoff date range
            $cutoffRange = $this->getCutoffDateRange($payroll);
            
            // Process Excel with date validation
            $result = $this->processExcelFile($request->file('excel_file'), $payroll, $schedule, $cutoffRange);

            // Process Paid Leaves to fill in gaps
            $this->processLeaves($payroll, $schedule, $cutoffRange);

            DB::commit();

            return redirect()->route('payroll.show', $payroll->id)
                ->with('success', "DTR uploaded successfully! {$result['total_records']} attendance records created for {$result['total_employees']} employees.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payroll upload failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to upload payroll: ' . $e->getMessage());
        }
    }

    public function show($id)
    {
        $payroll = Payroll::with(['uploadedBy', 'schedule'])->findOrFail($id);

        if ($payroll->isDraft()) {
            // Load detailed attendance records with employee data
            $attendanceCount = Attendance::where('payroll_id', $payroll->id)->count();
            \Log::info("Show draft - Payroll ID: {$payroll->id}, Attendance count: $attendanceCount");
            
            $attendances = Attendance::where('payroll_id', $payroll->id)
                ->with('employee')
                ->orderBy('employee_id')
                ->orderBy('date')
                ->get()
                ->groupBy('employee_id');

            // Compute payroll for each employee in the backend
            $computedPayrollItems = [];
            
            foreach ($attendances as $employeeId => $records) {
                $employee = $records->first()->employee;

                // Normalize rest day flag using employee schedule
                $records = $records->map(function ($att) use ($employee) {
                    $empSchedule = EmployeeSchedule::where('employee_id', $employee->id)
                        ->where('is_archived', false)
                        ->where('date', $att->date->format('Y-m-d'))
                        ->first();

                    if ($empSchedule) {
                        $att->is_restday = strtolower($empSchedule->type) === 'rest';
                    }

                    return $att;
                });

                // Get scheduled working days
                $cutoffRange = $this->getCutoffDateRange($payroll);
                $scheduledWorkingDays = EmployeeSchedule::where('employee_id', $employee->id)
                    ->where('is_archived', false)
                    ->where('type', 'work')
                    ->whereBetween('date', [$cutoffRange['start'], $cutoffRange['end']])
                    ->count();

                // Fetch leaves that fall within the cutoff period
                $leaves = EmployeeLeaveHistory::where('employee_id', $employee->id)
                    ->where(function ($q) use ($cutoffRange) {
                        $q->whereBetween('date_from', [$cutoffRange['start'], $cutoffRange['end']])
                          ->orWhereBetween('date_to', [$cutoffRange['start'], $cutoffRange['end']])
                          ->orWhere(function($q2) use ($cutoffRange) {
                              $q2->where('date_from', '<', $cutoffRange['start'])
                                 ->where('date_to', '>', $cutoffRange['end']);
                          });
                    })
                    ->get();

                // Calculate credited leave days (days covered by leave that are working days)
                $creditedLeaveDays = 0;
                $startDate = \Carbon\Carbon::parse($cutoffRange['start']);
                $endDate = \Carbon\Carbon::parse($cutoffRange['end']);
                
                // Pre-fetch schedule for faster lookup
                $schedules = EmployeeSchedule::where('employee_id', $employee->id)
                    ->where('is_archived', false)
                    ->whereBetween('date', [$cutoffRange['start'], $cutoffRange['end']])
                    ->get()
                    ->keyBy('date');

                for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
                    $dateStr = $date->format('Y-m-d');
                    
                    // Check if this day is covered by any leave
                    $isOnLeave = $leaves->contains(function ($leave) use ($dateStr) {
                        $start = substr((string)$leave->date_from, 0, 10);
                        $end = substr((string)$leave->date_to, 0, 10);
                        return $dateStr >= $start && $dateStr <= $end;
                    });

                    if ($isOnLeave) {
                        // Check if it is a working day (default to yes if no schedule, or check schedule)
                        $isWorkingDay = true;
                        if (isset($schedules[$dateStr])) {
                            if (strtolower($schedules[$dateStr]->type) === 'rest') {
                                $isWorkingDay = false;
                            }
                        }

                        // Check if already attended (don't double count)
                        $hasAttendance = $records->contains(function ($att) use ($dateStr) {
                            // Ignore ghost records (empty times)
                            $hasTime = !empty($att->clock_in) || !empty($att->clock_out) || ($att->overtime_hours > 0);
                            return substr($att->date, 0, 10) === $dateStr && $hasTime;
                        });

                        if ($isWorkingDay && !$hasAttendance) {
                            $creditedLeaveDays++;
                        }
                    }
                }

                if ($scheduledWorkingDays === 0 && $payroll->schedule_id) {
                    $daysInPeriod = \Carbon\Carbon::parse($cutoffRange['start'])->diffInDays(\Carbon\Carbon::parse($cutoffRange['end'])) + 1;
                    $restDaysFromAttendance = $records->filter(fn($a) => $a->is_restday)->count();
                    $scheduledWorkingDays = $daysInPeriod - $restDaysFromAttendance;
                }

                if ($scheduledWorkingDays === 0) {
                    $totalAttendanceDays = $records->count();
                    $restDaysFromAttendance = $records->filter(fn($a) => $a->is_restday)->count();
                    $scheduledWorkingDays = ($totalAttendanceDays - $restDaysFromAttendance) + $creditedLeaveDays;
                }

                // Filter out ghost records (empty times)
                $actualWorkingDays = $records->filter(fn($a) => 
                    !$a->is_restday && 
                    (!empty($a->clock_in) || !empty($a->clock_out) || $a->overtime_hours > 0)
                )->count();
                $absentDays = max(0, $scheduledWorkingDays - $actualWorkingDays - $creditedLeaveDays);
                $loanDeduction = $this->getEmployeeLoanDeduction($employee->id, $payroll);

                // Compute detailed payroll in backend
                $computed = $this->computeDetailedPayrollForDraft(
                    $employee,
                    $records,
                    $loanDeduction,
                    $scheduledWorkingDays,
                    $absentDays,
                    $payroll
                );

                $computedPayrollItems[] = [
                    'employee' => $employee,
                    'attendances' => $records->values(),
                    'payroll' => $computed,
                    'loan_deduction' => $loanDeduction,
                    'scheduled_working_days' => $scheduledWorkingDays,
                    'actual_working_days' => $actualWorkingDays,
                    'absent_days' => $absentDays,
                ];
            }
            
            return Inertia::render('payroll/show-draft', [
                'payroll' => $payroll,
                'computedPayrollItems' => $computedPayrollItems,
            ]);
        }

        // Load payroll items and payslips
        $payroll->load(['items.employee', 'payslips']);

        return Inertia::render('payroll/show', [
            'payroll' => $payroll,
            'hasPayslips' => $payroll->payslips->count() > 0,
        ]);
    }

    public function showDraft($id)
    {
        $payroll = Payroll::with(['uploadedBy', 'schedule'])->findOrFail($id);

        // If we have a stored draft snapshot, use it as the single source of truth
        if (!empty($payroll->draft_snapshot)) {
            return Inertia::render('payroll/show-draft', [
                'payroll' => $payroll,
                'computedPayrollItems' => $payroll->draft_snapshot['rows'] ?? [],
            ]);
        }

        // Load detailed attendance records with employee data
        $attendances = Attendance::where('payroll_id', $payroll->id)
            ->with('employee')
            ->orderBy('employee_id')
            ->orderBy('date')
            ->get()
            ->groupBy('employee_id')
            ->map(function ($records) use ($payroll) {
                $employee = $records->first()->employee;

                // Normalize rest day flag using employee schedule so summaries & premiums follow schedule
                $records = $records->map(function ($att) use ($employee) {
                    $empSchedule = EmployeeSchedule::where('employee_id', $employee->id)
                        ->where('is_archived', false)
                        ->where('date', $att->date->format('Y-m-d'))
                        ->first();

                    if ($empSchedule) {
                        $att->is_restday = strtolower($empSchedule->type) === 'rest';
                    }

                    return $att;
                });

                // Get scheduled working days - prioritize employee schedule, fallback to general schedule
                $cutoffRange = $this->getCutoffDateRange($payroll);

                // First, try to get from employee's specific schedule
                $scheduledWorkingDays = EmployeeSchedule::where('employee_id', $employee->id)
                    ->where('is_archived', false)
                    ->where('type', 'work')
                    ->whereBetween('date', [$cutoffRange['start'], $cutoffRange['end']])
                    ->count();

                // Fetch leaves that fall within the cutoff period
                $leaves = EmployeeLeaveHistory::where('employee_id', $employee->id)
                    ->where(function ($q) use ($cutoffRange) {
                        $q->whereBetween('date_from', [$cutoffRange['start'], $cutoffRange['end']])
                          ->orWhereBetween('date_to', [$cutoffRange['start'], $cutoffRange['end']])
                          ->orWhere(function($q2) use ($cutoffRange) {
                              $q2->where('date_from', '<', $cutoffRange['start'])
                                 ->where('date_to', '>', $cutoffRange['end']);
                          });
                    })
                    ->get();

                // Calculate credited leave days
                $creditedLeaveDays = 0;
                $startDate = \Carbon\Carbon::parse($cutoffRange['start']);
                $endDate = \Carbon\Carbon::parse($cutoffRange['end']);
                
                $schedules = EmployeeSchedule::where('employee_id', $employee->id)
                    ->where('is_archived', false)
                    ->whereBetween('date', [$cutoffRange['start'], $cutoffRange['end']])
                    ->get()
                    ->keyBy('date');

                for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
                    $dateStr = $date->format('Y-m-d');
                    
                    $isOnLeave = $leaves->contains(function ($leave) use ($dateStr) {
                        $start = substr((string)$leave->date_from, 0, 10);
                        $end = substr((string)$leave->date_to, 0, 10);
                        return $dateStr >= $start && $dateStr <= $end;
                    });

                    if ($isOnLeave) {
                        $isWorkingDay = true;
                        if (isset($schedules[$dateStr])) {
                            if (strtolower($schedules[$dateStr]->type) === 'rest') {
                                $isWorkingDay = false;
                            }
                        }

                        $hasAttendance = $records->contains(function ($att) use ($dateStr) {
                            // Ignore ghost records (empty times)
                            $hasTime = !empty($att->clock_in) || !empty($att->clock_out) || ($att->overtime_hours > 0);
                            return substr($att->date, 0, 10) === $dateStr && $hasTime;
                        });

                        if ($isWorkingDay && !$hasAttendance) {
                            $creditedLeaveDays++;
                        }
                    }
                }

                // If no employee schedule, use general schedule
                if ($scheduledWorkingDays === 0 && $payroll->schedule_id) {
                    // Count days in period minus rest days (from general schedule pattern)
                    $daysInPeriod = \Carbon\Carbon::parse($cutoffRange['start'])->diffInDays(\Carbon\Carbon::parse($cutoffRange['end'])) + 1;
                    $restDaysFromAttendance = $records->filter(fn($a) => $a->is_restday)->count();
                    $scheduledWorkingDays = $daysInPeriod - $restDaysFromAttendance;
                }

                // If still no schedule, infer from attendance
                if ($scheduledWorkingDays === 0) {
                    $totalAttendanceDays = $records->count();
                    $restDaysFromAttendance = $records->filter(fn($a) => $a->is_restday)->count();
                    $scheduledWorkingDays = ($totalAttendanceDays - $restDaysFromAttendance) + $creditedLeaveDays;
                }

                // Count actual working days attended (excluding rest days)
                // Filter out ghost records (empty times)
                $actualWorkingDays = $records->filter(fn($a) => 
                    !$a->is_restday && 
                    (!empty($a->clock_in) || !empty($a->clock_out) || $a->overtime_hours > 0)
                )->count();

                // Calculate absent days
                $absentDays = max(0, $scheduledWorkingDays - $actualWorkingDays - $creditedLeaveDays);
                $loanDeduction = $this->getEmployeeLoanDeduction($employee->id, $payroll);

                $computed = $this->computeDetailedPayrollForDraft(
                    $employee,
                    $records,
                    $loanDeduction,
                    $scheduledWorkingDays,
                    $absentDays,
                    $payroll
                );

                return [
                    'employee' => $employee,
                    'attendances' => $records->values(),
                    'payroll' => $computed,
                    'loan_deduction' => $loanDeduction,
                    'scheduled_working_days' => $scheduledWorkingDays,
                    'actual_working_days' => $actualWorkingDays,
                    'absent_days' => $absentDays,
                ];
            })
            ->values();

        // Fetch SSS brackets to pass to frontend
        $sssBrackets = \App\Models\SSSBracket::orderBy('from')->get(['from', 'to', 'ee']);

        // Fetch PHIC settings
        $phicSetting = \App\Models\DeductionSetting::where('deduction_type', 'phic')->first();
        $phicSettings = null;
        if ($phicSetting) {
            $settings = is_array($phicSetting->settings)
                ? $phicSetting->settings
                : json_decode($phicSetting->settings, true);
            $phicSettings = [
                'rate' => $settings['rate'] ?? 5,
                'employee_share' => $settings['employee_share'] ?? $settings['employee'] ?? 50,
                'min_salary' => $settings['min_salary'] ?? 10000,
                'max_salary' => $settings['max_salary'] ?? 100000,
            ];
        }

        // Fetch ALL Premium settings dynamically
        $premiumSettings = [
            'night_diff' => [],
            'overtime' => [],
            'additional' => [],
        ];

        // Night Differential rates
        $nightDiffCategory = \App\Models\PremiumCategory::where('name', 'Night Differential')->first();
        if ($nightDiffCategory) {
            $nightDiffPremiums = \App\Models\PremiumType::where('category_id', $nightDiffCategory->id)->get();
            foreach ($nightDiffPremiums as $premium) {
                $premiumSettings['night_diff'][$premium->name] = $premium->regular_rate;
            }
        }

        // Overtime Pay rates
        $overtimeCategory = \App\Models\PremiumCategory::where('name', 'Overtime Pay')->first();
        if ($overtimeCategory) {
            $overtimePremiums = \App\Models\PremiumType::where('category_id', $overtimeCategory->id)->get();
            foreach ($overtimePremiums as $premium) {
                $premiumSettings['overtime'][$premium->name] = $premium->regular_rate;
            }
        }

        // Additional Premium Pay rates
        $additionalCategory = \App\Models\PremiumCategory::where('name', 'Additional Premium Pay')->first();
        if ($additionalCategory) {
            $additionalPremiums = \App\Models\PremiumType::where('category_id', $additionalCategory->id)->get();
            foreach ($additionalPremiums as $premium) {
                $premiumSettings['additional'][$premium->name] = $premium->regular_rate;
            }
        }

        // Fetch tax brackets
        $taxBrackets = \App\Models\TaxBracket::orderBy('from')->get()->map(function($bracket) {
            return [
                'from' => floatval($bracket->from),
                'to' => floatval($bracket->to),
                'percentage' => floatval($bracket->percentage),
                'fixed_amount' => floatval($bracket->fixed_amount),
            ];
        });

        return Inertia::render('payroll/show-draft', [
            'payroll' => $payroll,
            'computedPayrollItems' => $attendances,
            'sssBrackets' => $sssBrackets,
            'phicSettings' => $phicSettings,
            'premiumSettings' => $premiumSettings,
            'taxBrackets' => $taxBrackets,
        ]);
    }

    public function generate(Request $request, $id)
    {
        $payroll = Payroll::findOrFail($id);

        if (!$payroll->isDraft()) {
            return back()->with('error', 'Payroll already generated.');
        }

        \Log::info("Generate payroll for payroll ID: {$payroll->id}");

        $attendanceCount = Attendance::where('payroll_id', $payroll->id)->count();

        if ($attendanceCount === 0) {
            return back()->with(
                'error',
                "No attendance records found for this payroll. Please upload a DTR file first."
            );
        }

        DB::beginTransaction();

        try {

            // dd($request->all());

            // Get pre-computed payroll items and draft snapshot from frontend
            $payrollItems = $request->input('payroll_items', []);
            $draftSnapshot = $request->input('draft_snapshot', null);

            \Log::info("Payroll items count: " . count($payrollItems));
            \Log::info("First item: " . json_encode($payrollItems[0] ?? []));

            if (empty($payrollItems)) {
                return back()->with('error', 'No payroll data provided.');
            }

            // Store the draft snapshot so the draft view can always show the original computed table
            if (!empty($draftSnapshot)) {
                $payroll->draft_snapshot = $draftSnapshot;
                $payroll->save();
            }

            // Store each payroll item directly (no recalculation)
            foreach ($payrollItems as $item) {
                // Calculate aggregated premium values from detailed breakdown
                $overtimePay = ($item['ot_regular'] ?? 0) + ($item['ot_restday'] ?? 0) + 
                              ($item['ot_holiday'] ?? 0) + ($item['ot_holiday_restday'] ?? 0) + 
                              ($item['ot_ordinary_working'] ?? 0);
                
                $nightDiffPay = ($item['night_diff_ordinary_working'] ?? 0) + 
                               ($item['night_diff_holiday'] ?? 0) + 
                               ($item['night_diff_holiday_restday'] ?? 0) + 
                               ($item['night_diff_restday'] ?? 0) + 
                               ($item['night_diff_holiday_ot'] ?? 0) + 
                               ($item['night_diff_holiday_restday_ot'] ?? 0);
                
                $holidayPay = ($item['premium_restday'] ?? 0) + 
                             ($item['premium_holiday_regular'] ?? 0) + 
                             ($item['premium_holiday_special'] ?? 0) + 
                             ($item['premium_holiday_rd_regular'] ?? 0) + 
                             ($item['premium_holiday_rd_special'] ?? 0);

                PayrollItem::create([
                    'payroll_id' => $payroll->id,
                    'employee_id' => $item['employee_id'],
                    'basic_pay' => $item['basic_pay'],
                    'restday_pay' => $item['restday_pay'],
                    'allowance_pay' => $item['allowance_pay'],
                    'regular_allowance' => $item['regular_allowance'],
                    'restday_allowance' => $item['restday_allowance'],
                    'gross_pay' => $item['gross_pay'],
                    // Aggregated premium values (for summary display)
                    'overtime_pay' => $overtimePay,
                    'night_diff_pay' => $nightDiffPay,
                    'holiday_pay' => $holidayPay,
                    // Deductions
                    'sss_deduction' => $item['sss_deduction'],
                    'phic_deduction' => $item['phic_deduction'],
                    'hdmf_deduction' => $item['hdmf_deduction'],
                    'tax_deduction' => $item['tax_deduction'],
                    'late_deduction' => $item['late_deduction'],
                    'absence_deduction' => $item['absence_deduction'],
                    'loan_deduction' => $item['loan_deduction'],
                    'total_deductions' => $item['total_deductions'],
                    'net_pay' => $item['net_pay'],
                    // Hours and days
                    'hours_worked' => $item['hours_worked'],
                    'regular_hours' => $item['regular_hours'],
                    'restday_hours' => $item['restday_hours'],
                    'overtime_hours' => $item['overtime_hours'] ?? 0,
                    'night_diff_hours' => $item['night_diff_hours'] ?? 0,
                    'days_worked' => $item['days_worked'],
                    'total_days' => $item['total_days'],
                    'late_minutes' => $item['late_minutes'],
                    'absent_days' => $item['absent_days'],
                    // Night Differential Breakdown
                    'night_diff_ordinary_working' => (float) ($item['night_diff_ordinary_working'] ?? 0),
                    'night_diff_holiday' => (float) ($item['night_diff_holiday'] ?? 0),
                    'night_diff_holiday_restday' => (float) ($item['night_diff_holiday_restday'] ?? 0),
                    'night_diff_restday' => (float) ($item['night_diff_restday'] ?? 0),
                    'night_diff_holiday_ot' => (float) ($item['night_diff_holiday_ot'] ?? 0),
                    'night_diff_holiday_restday_ot' => (float) ($item['night_diff_holiday_restday_ot'] ?? 0),
                    // Overtime Pay Breakdown
                    'ot_holiday' => (float) ($item['ot_holiday'] ?? 0),
                    'ot_holiday_restday' => (float) ($item['ot_holiday_restday'] ?? 0),
                    'ot_regular' => (float) ($item['ot_regular'] ?? 0),
                    'ot_restday' => (float) ($item['ot_restday'] ?? 0),
                    'ot_ordinary_working' => (float) ($item['ot_ordinary_working'] ?? 0),
                    // Additional Premium Pay Breakdown
                    'premium_restday' => (float) ($item['premium_restday'] ?? 0),
                    'premium_holiday_regular' => (float) ($item['premium_holiday_regular'] ?? 0),
                    'premium_holiday_special' => (float) ($item['premium_holiday_special'] ?? 0),
                    'premium_holiday_rd_regular' => (float) ($item['premium_holiday_rd_regular'] ?? 0),
                    'premium_holiday_rd_special' => (float) ($item['premium_holiday_rd_special'] ?? 0),
                ]);
            }

            $this->recalculatePayrollTotals($payroll);
            $payroll->update(['status' => 'pending']);

            DB::commit();

            return redirect()->route('payroll.show', $payroll->id)
                ->with('success', 'Payroll generated successfully!');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payroll generation failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to generate payroll: ' . $e->getMessage());
        }
    }

    public function approve($id)
    {
        try {
            DB::beginTransaction();

            $payroll = Payroll::findOrFail($id);

            if (!$payroll->isPending()) {
                return back()->with('error', 'Only pending payroll can be approved.');
            }

            $payroll->update([
                'status' => 'approved',
                'approved_by' => Auth::id() ?? 1,
                'approved_at' => now()
            ]);

            DB::commit();

            return redirect()->route('payroll.show', $payroll->id)
                ->with('success', 'Payroll approved. You can now generate payslips for this period.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payroll approval failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to approve payroll: ' . $e->getMessage());
        }
    }

    public function generatePayslips($id)
    {
        try {
            DB::beginTransaction();

            $payroll = Payroll::with(['items', 'payslips'])->findOrFail($id);

            if (!$payroll->isApproved()) {
                return back()->with('error', 'Payslips can only be generated for approved payrolls.');
            }

            if ($payroll->payslips->count() > 0) {
                return back()->with('warning', 'Payslips have already been generated for this payroll.');
            }

            $payslipsCreated = 0;

            foreach ($payroll->items as $item) {
                $leaveData = $this->getLeaveUsedForPayrollPeriod($item->employee_id, $payroll);

                $payslip = Payslip::create([
                    'payroll_id' => $payroll->id,
                    'employee_id' => $item->employee_id,
                    'basic_pay' => $item->basic_pay,
                    'allowance' => $item->allowance_pay,
                    'other_pay' => $item->other_pay,
                    'overtime_pay' => $item->overtime_pay,
                    'night_diff_pay' => $item->night_diff_pay,
                    'holiday_pay' => $item->holiday_pay,
                    'restday_pay' => $item->restday_pay,
                    'gross_pay' => $item->gross_pay,
                    'sss_deduction' => $item->sss_deduction,
                    'phic_deduction' => $item->phic_deduction,
                    'hdmf_deduction' => $item->hdmf_deduction,
                    'tax_deduction' => $item->tax_deduction,
                    'late_deduction' => $item->late_deduction,
                    'absence_deduction' => $item->absence_deduction,
                    'loan_deductions' => $item->loan_deduction
                        ? ['total' => $item->loan_deduction]
                        : [],
                    'total_deductions' => $item->total_deductions,
                    'net_pay' => $item->net_pay,
                    'hours_worked' => $item->hours_worked,
                    'days_worked' => $item->days_worked,
                    'late_minutes' => $item->late_minutes,
                    'absent_days' => $item->absent_days,
                    'leave_days_used' => $leaveData['total_days'],
                    'leave_breakdown' => json_encode($leaveData['breakdown']),
                    'overtime_hours' => $item->overtime_hours,
                    'night_diff_hours' => $item->night_diff_hours,
                    'remarks' => $item->remarks,
                    'payroll_period' => $payroll->payroll_period,
                    'month' => $payroll->month,
                    'year' => $payroll->year,
                    'generated_at' => now()
                ]);
                $payslipsCreated++;

                $this->processLoanPaymentsForEmployee($item->employee_id, $payroll->payroll_period, $payslip);
                $this->deductLeavesFromCredits($item->employee_id, $payroll);
            }

            $this->recalculatePayrollTotals($payroll);

            DB::commit();

            return redirect()->route('payslips.index', ['payroll_id' => $payroll->id])
                ->with('success', "Payslips generated successfully! {$payslipsCreated} payslips created.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Payslip generation failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to generate payslips: ' . $e->getMessage());
        }
    }

    public function reject(Request $request, $id)
    {
        $payroll = Payroll::findOrFail($id);

        if (!$payroll->isPending()) {
            return back()->with('error', 'Only pending payroll can be rejected.');
        }

        try {
            $remarks = $request->input('remarks', 'No remarks provided');
            
            $payroll->update([
                'status' => 'rejected',
                'rejection_reason' => $remarks,
            ]);

            return redirect()->route('payroll.index')
                ->with('success', 'Payroll rejected successfully.');

        } catch (\Exception $e) {
            Log::error('Payroll rejection failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to reject payroll: ' . $e->getMessage());
        }
    }

    public function archivedList()
    {
        $payrolls = Payroll::archived()
            ->with('uploadedBy')
            ->orderBy('archived_at', 'desc')
            ->paginate(10);

        return Inertia::render('payroll/archived', [
            'payrolls' => $payrolls,
        ]);
    }

    public function destroy($id)
    {
        $payroll = Payroll::withTrashed()->findOrFail($id);

        if ($payroll->isApproved()) {
            return back()->with('error', 'Cannot delete approved payroll.');
        }

        DB::beginTransaction();

        try {
            // Delete all related attendance records
            Attendance::where('payroll_id', $payroll->id)->delete();

            // Delete all related payroll items (if any)
            PayrollItem::where('payroll_id', $payroll->id)->delete();

            // Delete stored Excel file if it exists
            if ($payroll->excel_file_path && \Storage::disk('public')->exists($payroll->excel_file_path)) {
                \Storage::disk('public')->delete($payroll->excel_file_path);
            }

            // Permanently delete the payroll record
            $payroll->forceDelete();

            DB::commit();

            return redirect()->route('payroll.index')
                ->with('success', 'Payroll permanently deleted successfully.');

        } catch (\Exception $e) {
            DB::rollBack();

            return back()->with('error', 'Failed to delete payroll: ' . $e->getMessage());
        }
    }

    public function removeDTR($id)
    {
        DB::beginTransaction();

        try {
            $payroll = Payroll::findOrFail($id);

            if (!$payroll->isDraft()) {
                return back()->with('error', 'Cannot remove DTR. Payroll is already ' . $payroll->status . '.');
            }

            Attendance::where('payroll_id', $payroll->id)->delete();

            if ($payroll->excel_file_path && \Storage::disk('public')->exists($payroll->excel_file_path)) {
                \Storage::disk('public')->delete($payroll->excel_file_path);
            }

            $payroll->delete();

            DB::commit();

            return redirect()->route('payroll.index')
                ->with('success', 'DTR and payroll draft removed successfully.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Remove DTR failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to remove DTR: ' . $e->getMessage());
        }
    }

    public function downloadSample()
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(15);
        $sheet->getColumnDimension('B')->setWidth(25);
        $sheet->getColumnDimension('C')->setWidth(15);
        $sheet->getColumnDimension('D')->setWidth(12);
        $sheet->getColumnDimension('E')->setWidth(12);
        $sheet->getColumnDimension('F')->setWidth(15);
        $sheet->getColumnDimension('G')->setWidth(12);
        $sheet->getColumnDimension('H')->setWidth(12);
        $sheet->getColumnDimension('I')->setWidth(30);

        // Headers
        $headers = [
            'A1' => 'Employee Number',
            'B1' => 'Name (Last, First, Middle)',
            'C1' => 'Date (MM-DD-YYYY)',
            'D1' => 'Time In (AM/PM)',
            'E1' => 'Time Out (AM/PM)',
            'F1' => 'TOTAL # HOURS',
            'G1' => 'OT HOURS',
            'H1' => 'OT TYPE',
            'I1' => 'Remarks',
        ];

        foreach ($headers as $cell => $value) {
            $sheet->setCellValue($cell, $value);
            $sheet->getStyle($cell)->getFont()->setBold(true);
            $sheet->getStyle($cell)->getAlignment()->setHorizontal(\PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER);
            $sheet->getStyle($cell)->getFill()
                ->setFillType(\PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID)
                ->getStartColor()->setARGB('FFE0E0E0');
        }

        // Example data
        $examples = [
            ['EMP001', 'Cruz, Juan M.', '11-24-2025', '08:00 AM', '05:00 PM', '', '', '', 'Present'],
            ['EMP001', 'Cruz, Juan M.', '11-25-2025', '08:30 AM', '05:00 PM', '', '', '', 'Late'],
            ['EMP002', 'Santos, Maria L.', '11-25-2025', '10:00 PM', '06:00 AM', '', '', '', 'Night Shift'],
        ];

        // Helper function: convert AM/PM string to Excel time fraction (0.0–1.0)
        function timeToExcelFraction($timeStr) {
            $parts = date_parse($timeStr);
            $hour = $parts['hour'];
            $minute = $parts['minute'];
            return ($hour + $minute / 60) / 24;
        }

        $row = 2;
        foreach ($examples as $example) {
            $sheet->setCellValue('A' . $row, $example[0]);
            $sheet->setCellValue('B' . $row, $example[1]);
            $sheet->setCellValue('C' . $row, $example[2]);

            // Set Time In / Time Out as Excel time fractions (no date)
            $sheet->setCellValue('D' . $row, timeToExcelFraction($example[3]));
            $sheet->setCellValue('E' . $row, timeToExcelFraction($example[4]));

            // TOTAL HOURS (supports night shift)
            $sheet->setCellValue(
                'F' . $row,
                '=IF(AND(D'.$row.'<>"",E'.$row.'<>""),IF(E'.$row.'<D'.$row.',(E'.$row.'+1)-D'.$row.',E'.$row.'-D'.$row.'),"")'
            );

            // OT HOURS (over 9 hours)
            $sheet->setCellValue(
                'G' . $row,
                '=IF(F'.$row.'="","",IF((HOUR(F'.$row.')+MINUTE(F'.$row.')/60)>9,(HOUR(F'.$row.')+MINUTE(F'.$row.')/60)-9,0))'
            );

            $sheet->setCellValue('H' . $row, $example[7]);
            $sheet->setCellValue('I' . $row, $example[8]);
            $row++;
        }

        // Apply number formats
        $sheet->getStyle('D2:E' . ($row - 1))->getNumberFormat()->setFormatCode('h:mm AM/PM'); // AM/PM format, no date
        $sheet->getStyle('F2:F' . ($row - 1))->getNumberFormat()->setFormatCode('[h]:mm');
        $sheet->getStyle('G2:G' . ($row - 1))->getNumberFormat()->setFormatCode('0.00');

        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $filename = 'payroll_dtr_template.xlsx';

        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header("Content-Disposition: attachment; filename=\"$filename\"");
        header('Cache-Control: max-age=0');

        $writer->save('php://output');
        exit;
    }

    // Helper methods - TODO: Implement full logic from your original code
    private function processExcelFile($file, $payroll, $schedule, $cutoffRange)
    {
        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            Log::info('Excel file loaded. Total rows: ' . count($rows));
            Log::info('Cutoff range: ' . $cutoffRange['start'] . ' to ' . $cutoffRange['end']);

            $totalEmployees = [];
            $totalRecords = 0;
            $skippedDates = 0;
            $failedDates = 0;
            $missingEmployees = 0;

            foreach ($rows as $index => $row) {
                if ($index === 1) continue; // Skip header

                $employeeNumber = trim($row['A'] ?? '');
                $dateValue = trim($row['C'] ?? '');
                
                // Get raw cell values for times (to avoid WPS Chinese formatting)
                try {
                    $timeInCell = $sheet->getCell("D{$index}");
                    $timeOutCell = $sheet->getCell("E{$index}");
                    
                    // Try to get calculated value first (raw numeric), then formatted value
                    $timeIn = $timeInCell->getCalculatedValue() ?? $timeInCell->getValue() ?? '';
                    $timeOut = $timeOutCell->getCalculatedValue() ?? $timeOutCell->getValue() ?? '';
                } catch (\Exception $e) {
                    // Fallback to values from toArray if direct cell access fails
                    Log::warning("Row $index: Failed to access cells directly: " . $e->getMessage());
                    $timeIn = trim($row['D'] ?? '');
                    $timeOut = trim($row['E'] ?? '');
                }
                
                $otHours = trim($row['G'] ?? '');
                $otType = strtoupper(trim($row['H'] ?? ''));
                $remarks = trim($row['I'] ?? '');

                Log::info("Row $index: EmpNum=$employeeNumber, Date=$dateValue, TimeIn=$timeIn, TimeOut=$timeOut");

                if (!$employeeNumber || !$dateValue) {
                    Log::warning("Row $index: Skipped - missing employee number or date");
                    continue;
                }

                // Find employee (exclude soft-deleted)
                $employee = Employee::where('employee_number', $employeeNumber)
                    ->whereNull('deleted_at')
                    ->first();
                if (!$employee) {
                    Log::warning("Row $index: Employee not found with number: $employeeNumber");
                    $missingEmployees++;
                    continue;
                }

                // Parse date
                $date = $this->parseDate($dateValue);
                if (!$date) {
                    Log::warning("Row $index: Failed to parse date: $dateValue");
                    $failedDates++;
                    continue;
                }

                // Validate date is within cutoff period
                $dateStr = $date->format('Y-m-d');
                if ($dateStr < $cutoffRange['start'] || $dateStr > $cutoffRange['end']) {
                    Log::warning("Row $index: Date $dateStr is outside cutoff period ({$cutoffRange['start']} to {$cutoffRange['end']})");
                    $skippedDates++;
                    continue;
                }

                // Parse times
                $clockIn = $this->parseTime($timeIn);
                $clockOut = $this->parseTime($timeOut);

                // Compute hours worked
                // Always calculate from clock in/out times for accuracy
                $hoursWorked = 0;
                
                if ($clockIn && $clockOut) {
                    // Extract hour from time string (HH:mm:ss format)
                    $inHour = (int)explode(':', $clockIn)[0];
                    $outHour = (int)explode(':', $clockOut)[0];
                    
                    // Calculate from times
                    $in = Carbon::parse($date->format('Y-m-d') . ' ' . $clockIn);
                    $out = Carbon::parse($date->format('Y-m-d') . ' ' . $clockOut);
                    
                    $outBeforeAddDay = $out->format('Y-m-d H:i:s');

                    // Detect overnight shift: if out hour < in hour, it's next day
                    if ($outHour < $inHour) {
                        $out->addDay();
                        Log::info("Row $index: OVERNIGHT DETECTED - out time changed from $outBeforeAddDay to " . $out->format('Y-m-d H:i:s'));
                    }

                    $totalMinutes = abs($out->diffInMinutes($in));
                    $hoursWorked = round($totalMinutes / 60, 2);
                    
                    Log::info("Row $index: HOURS CALC - in={$in->format('Y-m-d H:i:s')}, out={$out->format('Y-m-d H:i:s')}, totalMinutes=$totalMinutes, hoursWorked=$hoursWorked");
                    
                    // Deduct 1-hour break if >= 9 hours (standard 8-hour workday + 1 hour break)
                    // BUT: Don't deduct break for rest days - all hours are OT
                    // Note: $isRestday will be set later, so we can't check it here yet
                    // The break deduction will be applied after $isRestday is determined
                }

                // Parse OT hours from Excel column G
                $overtimeHours = 0;
                if (!empty($otHours) && is_numeric($otHours)) {
                    $overtimeHours = floatval($otHours);
                }

                // Get employee schedule
                $empSchedule = EmployeeSchedule::where('employee_id', $employee->id)
                    ->where('is_archived', false)
                    ->where('date', $date->format('Y-m-d'))
                    ->first();

                // Use employee schedule if available, otherwise use general schedule
                if ($empSchedule) {
                    $scheduledIn = $empSchedule->time_in ? Carbon::parse($empSchedule->time_in)->format('H:i:s') : null;
                    $scheduledOut = $empSchedule->time_out ? Carbon::parse($empSchedule->time_out)->format('H:i:s') : null;
                    $isRestday = strtolower($empSchedule->type) === 'rest';
                    Log::info("Row $index: Employee schedule found for {$employee->employee_number} on {$date->format('Y-m-d')} - Type: {$empSchedule->type}, IsRestday: " . ($isRestday ? 'YES' : 'NO'));
                } else {
                    // Use general schedule
                    $scheduledIn = $schedule->regular_start ? Carbon::parse($schedule->regular_start)->format('H:i:s') : null;
                    $scheduledOut = $schedule->regular_end ? Carbon::parse($schedule->regular_end)->format('H:i:s') : null;
                    $isRestday = false;
                    Log::info("Row $index: NO employee schedule for {$employee->employee_number} on {$date->format('Y-m-d')} - Using general schedule");
                }
                
                // NOW apply break deduction if needed (after $isRestday is determined)
                if ($hoursWorked >= 9 && !$isRestday) {
                    $hoursWorked -= 1;
                }
                
                // Log time parsing for debugging overnight shifts
                if ($clockIn && $clockOut) {
                    $inHour = (int)explode(':', $clockIn)[0];
                    $outHour = (int)explode(':', $clockOut)[0];
                    Log::info("Row $index: Time parsing - clockIn=$clockIn (hour=$inHour), clockOut=$clockOut (hour=$outHour), isRestday=" . ($isRestday ? 'YES' : 'NO') . ", hoursWorked=$hoursWorked");
                }

                // Check if holiday
                $holiday = Calendar::where('date', $date->format('Y-m-d'))->first();
                $isHoliday = $holiday ? true : false;
                $holidayType = $holiday ? strtolower($holiday->type) : null;

                // Compute late minutes (with 15-minute grace threshold)
                // If employee arrives within 15 minutes, no late is recorded.
                // If more than 15 minutes late, full difference is counted.
                $lateMinutes = 0;
                if ($clockIn && $scheduledIn && !$isRestday && !$isHoliday) {
                    $in = Carbon::parse($date->format('Y-m-d') . ' ' . $clockIn);
                    $scheduled = Carbon::parse($date->format('Y-m-d') . ' ' . $scheduledIn);
                    $diffMinutes = $in->diffInMinutes($scheduled);
                    if ($diffMinutes > 15) {
                        $lateMinutes = $diffMinutes;
                    }
                }

                // Compute night differential
                $nightDiffHours = 0;
                if ($clockIn && $clockOut) {
                    $nightDiffHours = $this->calculateNightDiff($clockIn, $clockOut, $date, $schedule);
                }

                // Log rest day detection for debugging
                if ($isRestday) {
                    Log::info("Row $index: REST DAY detected for {$employee->employee_number} on {$date->format('Y-m-d')} - Hours: $hoursWorked, Night Diff: $nightDiffHours");
                }

                // Create attendance record only if there is valid attendance data
                if ($clockIn || $clockOut || $overtimeHours > 0) {
                    Attendance::create([
                        'employee_id' => $employee->id,
                        'payroll_id' => $payroll->id,
                        'date' => $date->format('Y-m-d'),
                        'clock_in' => $clockIn,
                        'clock_out' => $clockOut,
                        'scheduled_in' => $scheduledIn,
                        'scheduled_out' => $scheduledOut,
                        'hours_worked' => round($hoursWorked, 2),
                        'late_minutes' => $lateMinutes,
                        'overtime_hours' => round($overtimeHours, 2),
                        'overtime_type' => $overtimeHours > 0 ? $otType : null,
                        'is_ot_paid' => $overtimeHours > 0 && $otType === 'PAID',
                        'night_diff_hours' => round($nightDiffHours, 2),
                        'is_holiday' => $isHoliday,
                        'holiday_type' => $holidayType,
                        'is_restday' => $isRestday,
                        'remarks' => $remarks,
                    ]);
                } else {
                    Log::info("Row $index: Skipped creating attendance record - empty time in/out and no OT.");
                }

                $totalEmployees[$employee->id] = true;
                $totalRecords++;
            }

            $payroll->update([
                'total_employees' => count($totalEmployees),
            ]);

            Log::info("Excel processing complete. Total records: $totalRecords, Total employees: " . count($totalEmployees) . ", Skipped dates: $skippedDates, Failed dates: $failedDates, Missing employees: $missingEmployees");

            return [
                'total_records' => $totalRecords,
                'total_employees' => count($totalEmployees),
                'skipped_dates' => $skippedDates,
                'failed_dates' => $failedDates,
                'missing_employees' => $missingEmployees,
            ];

        } catch (\Exception $e) {
            Log::error('Excel processing failed: ' . $e->getMessage());
            Log::error($e->getTraceAsString());
            throw $e;
        }
    }

    private function getCutoffDateRange($payroll)
    {
        $year = $payroll->year;
        $month = date('m', strtotime($payroll->month));
        
        if ($payroll->payroll_period === '1st Half') {
            // 1st to 15th
            $start = Carbon::create($year, $month, 1)->format('Y-m-d');
            $end = Carbon::create($year, $month, 15)->format('Y-m-d');
        } else {
            // 16th to end of month
            $start = Carbon::create($year, $month, 16)->format('Y-m-d');
            $end = Carbon::create($year, $month, 1)->endOfMonth()->format('Y-m-d');
        }
        
        return [
            'start' => $start,
            'end' => $end,
        ];
    }

    private function getTempCutoffDateRange($period, $month, $year)
    {
        $monthNum = date('m', strtotime($month));
        
        if ($period === '1st Half') {
            $start = Carbon::create($year, $monthNum, 1)->format('Y-m-d');
            $end = Carbon::create($year, $monthNum, 15)->format('Y-m-d');
        } else {
            $start = Carbon::create($year, $monthNum, 16)->format('Y-m-d');
            $end = Carbon::create($year, $monthNum, 1)->endOfMonth()->format('Y-m-d');
        }
        
        return [
            'start' => $start,
            'end' => $end,
        ];
    }

    private function validateExcelFile($file, $schedule, $cutoffRange)
    {
        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            $totalRecords = 0;
            $skippedDates = 0;
            $failedDates = 0;
            $missingEmployees = 0;
            $missingSchedules = 0;

            foreach ($rows as $index => $row) {
                if ($index === 1) continue; // Skip header

                $employeeNumber = trim($row['A'] ?? '');
                $dateValue = trim($row['C'] ?? '');

                if (!$employeeNumber || !$dateValue) {
                    continue;
                }

                // Check employee exists (exclude soft-deleted)
                $employee = Employee::where('employee_number', $employeeNumber)
                    ->whereNull('deleted_at')
                    ->first();
                if (!$employee) {
                    $missingEmployees++;
                    continue;
                }

                // Try to parse date
                $date = $this->parseDate($dateValue);
                if (!$date) {
                    $failedDates++;
                    continue;
                }

                // Check if date is within cutoff
                $dateStr = $date->format('Y-m-d');
                if ($dateStr < $cutoffRange['start'] || $dateStr > $cutoffRange['end']) {
                    $skippedDates++;
                    continue;
                }

                // Check if employee has a schedule for this date
                $hasSchedule = EmployeeSchedule::where('employee_id', $employee->id)
                    ->where('is_archived', false)
                    ->where('date', $dateStr)
                    ->exists();
                
                if (!$hasSchedule) {
                    $missingSchedules++;
                }

                $totalRecords++;
            }

            return [
                'total_records' => $totalRecords,
                'skipped_dates' => $skippedDates,
                'failed_dates' => $failedDates,
                'missing_employees' => $missingEmployees,
                'missing_schedules' => $missingSchedules,
            ];

        } catch (\Exception $e) {
            Log::error('Excel validation failed: ' . $e->getMessage());
            return [
                'total_records' => 0,
                'skipped_dates' => 0,
                'failed_dates' => 0,
                'missing_employees' => 0,
                'missing_schedules' => 0,
            ];
        }
    }

    private function getAttendanceSummary($payroll)
    {
        return Attendance::where('payroll_id', $payroll->id)
            ->with('employee')
            ->get()
            ->groupBy('employee_id')
            ->map(function ($records) use ($payroll) {
                $employee = $records->first()->employee;
                return [
                    'employee' => $employee,
                    'total_days' => $records->count(),
                    'total_hours' => $records->sum('hours_worked'),
                    'total_late_minutes' => $records->sum('late_minutes'),
                    'total_overtime' => $records->sum('overtime_hours'),
                ];
            });
    }

    private function getAbsentDaysForEmployee($employee, $payroll, $attendances)
    {
        $cutoffRange = $this->getCutoffDateRange($payroll);

        // First, try to get scheduled working days from the employee's specific schedule
        $scheduledWorkingDays = EmployeeSchedule::where('employee_id', $employee->id)
            ->where('is_archived', false)
            ->where('type', 'work')
            ->whereBetween('date', [$cutoffRange['start'], $cutoffRange['end']])
            ->count();

        // If no employee-specific schedule, approximate from the general schedule
        if ($scheduledWorkingDays === 0 && $payroll->schedule_id) {
            $daysInPeriod = Carbon::parse($cutoffRange['start'])->diffInDays(Carbon::parse($cutoffRange['end'])) + 1;
            $restDaysFromAttendance = $attendances->filter(fn($a) => $a->is_restday)->count();
            $scheduledWorkingDays = $daysInPeriod - $restDaysFromAttendance;
        }

        // If still nothing, infer from attendance: total days minus rest days
        if ($scheduledWorkingDays === 0) {
            $totalAttendanceDays = $attendances->count();
            $restDaysFromAttendance = $attendances->filter(fn($a) => $a->is_restday)->count();
            $scheduledWorkingDays = $totalAttendanceDays - $restDaysFromAttendance;
        }

        // Actual working days are attendance days excluding rest days
        $actualWorkingDays = $attendances->filter(fn($a) => !$a->is_restday)->count();

        return max(0, $scheduledWorkingDays - $actualWorkingDays);
    }

    private function computePayrollForEmployee($payroll, $employee, $attendances, $schedule)
    {
        try {
            $basicRate = floatval($employee->basic_rate);
            $allowance = floatval($employee->allowance ?? 0);
            
            // Fetch dynamic settings
            $lateAbsenceSettings = DeductionSetting::where('deduction_type', 'late_absences')->first();
            $settings = $lateAbsenceSettings ? ($lateAbsenceSettings->settings ?? []) : [];
            if (is_string($settings)) $settings = json_decode($settings, true);
            $standardDays = floatval($settings['days'] ?? 20);

            // Fetch Additional Premium Rates
            $additionalPremiums = PremiumType::whereHas('category', function($q) {
                $q->where('name', 'Additional Premium Pay');
            })->get()->keyBy('name');

            // Helper to get add-on rate (percentage) from total rate in DB
            $getPremiumRate = function($name, $default) use ($additionalPremiums) {
                if (isset($additionalPremiums[$name])) {
                    $rate = $additionalPremiums[$name]->regular_rate;
                    return $rate / 100;
                }
                return $default > 5 ? $default / 100 : $default;
            };

            // Fetch Overtime Rates
            $overtimePremiums = PremiumType::whereHas('category', function($q) {
                $q->where('name', 'Overtime Pay');
            })->get()->keyBy('name');

            $getOvertimeRate = function($name, $default) use ($overtimePremiums) {
                if (isset($overtimePremiums[$name])) {
                    return $overtimePremiums[$name]->regular_rate / 100;
                }
                return $default / 100;
            };

            // Fetch Night Diff Rates
            $nightDiffPremiums = PremiumType::whereHas('category', function($q) {
                $q->where('name', 'Night Differential');
            })->get()->keyBy('name');

            $getNightDiffRate = function($name, $default) use ($nightDiffPremiums) {
                if (isset($nightDiffPremiums[$name])) {
                    return $nightDiffPremiums[$name]->regular_rate / 100;
                }
                return $default / 100;
            };

            // Calculate hourly rates
            $hourlyRate = $employee->rate_type === 'monthly' ? ($basicRate / $standardDays / 8) : ($basicRate / 8);
            $hourlyAllowance = $employee->rate_type === 'monthly' ? ($allowance / $standardDays / 8) : ($allowance / 8);
            
            // Categorize and Accumulate Buckets (Consistent with Draft Logic)
            $ndBuckets = [
                'regular' => ['reg' => 0, 'ot' => 0],
                'restday' => ['reg' => 0, 'ot' => 0],
                'holiday_regular' => ['reg' => 0, 'ot' => 0],
                'holiday_special' => ['reg' => 0, 'ot' => 0],
                'holiday_rd_regular' => ['reg' => 0, 'ot' => 0],
                'holiday_rd_special' => ['reg' => 0, 'ot' => 0],
            ];
            $addPremBuckets = [
                'restday' => 0,
                'holiday_regular' => 0,
                'holiday_special' => 0,
                'holiday_rd_regular' => 0,
                'holiday_rd_special' => 0,
            ];
            $otBuckets = [
                'regular' => 0,
                'restday' => 0,
                'holiday_regular' => 0,
                'holiday_special' => 0,
                'holiday_rd_regular' => 0,
                'holiday_rd_special' => 0,
            ];
            
            $regularHours = 0;
            $restdayHours = 0;

            foreach ($attendances as $att) {
                if (!$att->clock_in || !$att->clock_out) continue;

                $category = 'regular';
                if ($att->is_holiday && $att->is_restday) {
                    $category = ($att->holiday_type === 'regular') ? 'holiday_rd_regular' : 'holiday_rd_special';
                } elseif ($att->is_holiday) {
                    $category = ($att->holiday_type === 'regular') ? 'holiday_regular' : 'holiday_special';
                } elseif ($att->is_restday) {
                    $category = 'restday';
                }

                // Accumulate Regular and Restday Hours
                if ($category === 'regular') {
                    $regularHours += $att->hours_worked;
                } elseif ($category === 'restday') {
                    $restdayHours += $att->hours_worked;
                }

                // Accumulate OT Hours for Basic OT Pay (only if paid OT)
                if (isset($otBuckets[$category]) && $att->is_ot_paid) {
                     $otBuckets[$category] += $att->overtime_hours;
                }
                
                // Accumulate Additional Premium Hours (Capped at 8)
                if ($category !== 'regular') {
                    $cappedHours = min($att->hours_worked, 8);
                    if (isset($addPremBuckets[$category])) {
                        $addPremBuckets[$category] += $cappedHours;
                    }
                }

                // Recalculate ND split
                try {
                    $dateStr = $att->date instanceof \Carbon\Carbon ? $att->date->format('Y-m-d') : $att->date;
                    $in = \Carbon\Carbon::parse($dateStr . ' ' . $att->clock_in);
                    $out = \Carbon\Carbon::parse($dateStr . ' ' . $att->clock_out);
                    if ($out->lt($in)) $out->addDay();

                    // First 8 hours window
                    $threshold = $in->copy()->addHours(8);
                    
                    $regEnd = $out->copy();
                    if ($regEnd->gt($threshold)) $regEnd = $threshold;
                    
                    // Regular ND (Raw)
                    $rawRegND = $this->calculateNightDiff($in->format('H:i'), $regEnd->format('H:i'), \Carbon\Carbon::parse($dateStr), $schedule);
                    
                    // OT ND (Raw)
                    $rawOtND = 0;
                    if ($out->gt($threshold)) {
                        $rawOtND = $this->calculateNightDiff($threshold->format('H:i'), $out->format('H:i'), \Carbon\Carbon::parse($dateStr), $schedule);
                    }

                    // Normalize to match DB total
                    $totalRaw = $rawRegND + $rawOtND;
                    $dbTotal = $att->night_diff_hours;
                    $finalReg = 0;
                    $finalOt = 0;
                    
                    if ($totalRaw > 0) {
                        $factor = $dbTotal / $totalRaw;
                        $finalReg = $rawRegND * $factor;
                        $finalOt = $rawOtND * $factor;
                    } else {
                        $finalReg = $dbTotal;
                    }

                    // Holiday Override: Force OT as ND if Holiday
                    if ($att->is_holiday && $finalReg > 0 && $att->overtime_hours > 0) {
                         $finalOt = $att->overtime_hours;
                    }

                    $ndBuckets[$category]['reg'] += $finalReg;
                    $ndBuckets[$category]['ot'] += $finalOt;

                } catch (\Exception $e) {
                    $ndBuckets[$category]['reg'] += $att->night_diff_hours;
                }
            }

            // Totals used for displaying Qty on payslips
            $totalOvertimeHours = $attendances->sum('overtime_hours');
            $totalNightDiffHours = $attendances->sum('night_diff_hours');
            
            // ===== NIGHT DIFFERENTIAL BREAKDOWN =====
            $nightDiffOrdinaryWorking = (float) ($ndBuckets['regular']['reg'] * $hourlyRate * $getNightDiffRate('Ordinary Working days', 10));
            $nightDiffRestday = (float) ($ndBuckets['restday']['reg'] * $hourlyRate * $getNightDiffRate('Restday Premium', 13));
            
            // Holidays: Sum Regular + Special
            $nightDiffHoliday = (float) (($ndBuckets['holiday_regular']['reg'] * $hourlyRate * $getNightDiffRate('Holiday Regular Premium', 20)) + 
                                ($ndBuckets['holiday_special']['reg'] * $hourlyRate * $getNightDiffRate('Holiday Special Premium', 13)));
            
            $nightDiffHolidayRestday = (float) (($ndBuckets['holiday_rd_regular']['reg'] * $hourlyRate * $getNightDiffRate('Holiday Restday Regular Premium', 26)) + 
                                       ($ndBuckets['holiday_rd_special']['reg'] * $hourlyRate * $getNightDiffRate('Holiday Restday Special Premium', 15)));
            
            // Night Diff OT: Aggregated
            $nightDiffHolidayOT = (float) (($ndBuckets['holiday_regular']['ot'] * $hourlyRate * $getNightDiffRate('Holiday Regular Overtime', 26)) +
                                  ($ndBuckets['holiday_special']['ot'] * $hourlyRate * $getNightDiffRate('Holiday Special Overtime', 17)));
                                  
            $nightDiffHolidayRestdayOT = (float) (($ndBuckets['holiday_rd_regular']['ot'] * $hourlyRate * $getNightDiffRate('Holiday Restday Regular Overtime', 34)) +
                                         ($ndBuckets['holiday_rd_special']['ot'] * $hourlyRate * $getNightDiffRate('Holiday Restday Special Overtime', 20)));
            
            // ===== OVERTIME PAY BREAKDOWN =====
            $otRegular = (float) ($otBuckets['regular'] * $hourlyRate * $getOvertimeRate('Regular Overtime', 125));
            $otRestday = (float) ($otBuckets['restday'] * $hourlyRate * $getOvertimeRate('Restday Overtime', 169));
            
            $otHoliday = (float) (($otBuckets['holiday_regular'] * $hourlyRate * $getOvertimeRate('Regular Holiday ', 260)) +
                         ($otBuckets['holiday_special'] * $hourlyRate * $getOvertimeRate('Special Holiday', 169)));
            
            $otHolidayRestday = (float) (($otBuckets['holiday_rd_regular'] * $hourlyRate * $getOvertimeRate('Restday Regular Holiday', 388)) +
                                ($otBuckets['holiday_rd_special'] * $hourlyRate * $getOvertimeRate('Restday Special Holiday', 195)));
            
            $otOrdinaryWorking = 0.0;
            
            // ===== ADDITIONAL PREMIUM PAY (1st 8 hrs) =====
            $premiumRestday = (float) ($addPremBuckets['restday'] * $hourlyRate * $getPremiumRate('Restday', 0.30));
            $premiumHolidayRegular = (float) ($addPremBuckets['holiday_regular'] * $hourlyRate * $getPremiumRate('Regular Holiday ', 100));
            $premiumHolidaySpecial = (float) ($addPremBuckets['holiday_special'] * $hourlyRate * $getPremiumRate('Special Holiday ', 30));
            $premiumHolidayRDRegular = (float) ($addPremBuckets['holiday_rd_regular'] * $hourlyRate * $getPremiumRate('Restday Regular Holiday', 160));
            $premiumHolidayRDSpecial = (float) ($addPremBuckets['holiday_rd_special'] * $hourlyRate * $getPremiumRate('Holiday Restday Special', 50));
            
            // ===== BASIC PAY & ALLOWANCE =====
            // regularHours and restdayHours are accumulated in the loop above


            // Total actual working days (excluding rest days) - matches draft table "Total No. of work days"
            $actualWorkingDays = $attendances->filter(fn($a) => !$a->is_restday)->count();
            $totalDays = max(0, $actualWorkingDays);

            if ($employee->rate_type === 'monthly') {
                // Draft logic: Basic Pay = Monthly Rate / 2 for the cutoff
                $basicPay = $basicRate / 2;

                // Restday Pay: (Basic Pay / Total Days) × (Restday Hours / 8)
                $restdayPay = $totalDays > 0
                    ? ($basicPay / $totalDays) * ($restdayHours / 8)
                    : 0;

                // Allowance: Allowance / 2 for the cutoff
                $regularAllowance = $allowance / 2;

                // Restday allowance: proportional hourly share (same pattern as draft)
                $restdayAllowance = 0;
                if ($restdayHours > 0 && $allowance > 0) {
                    $hourlyAllowanceRestday = $allowance / 2 / $standardDays / 4; // allowance/2/days/4
                    $restdayAllowance = $restdayHours * $hourlyAllowanceRestday;
                }
            } else {
                // Daily employees: Basic Pay = Daily Rate × Total Days
                $basicPay = $basicRate * $totalDays;

                // Restday pay: restday hours at normal hourly rate
                $restdayPay = $restdayHours * $hourlyRate;

                // Allowance: For daily employees, multiply daily allowance by days worked
                // For restday: multiply hourly allowance by restday hours
                $regularAllowance = $allowance * $totalDays;
                $restdayAllowance = $restdayHours > 0 ? $restdayHours * $hourlyAllowance : 0;
            }
            
            // ===== LATE & ABSENCE DEDUCTIONS =====
            // Late deduction is based purely on late minutes.
            $totalLateMinutes = max(0, $attendances->sum('late_minutes'));
            $latesDeduction = ($totalLateMinutes / 60) * $hourlyRate;

            // Absence deduction is computed from scheduled vs actual working days.
            $absentDays = $this->getAbsentDaysForEmployee($employee, $payroll, $attendances);
            $absenceDeduction = 0;

            if ($employee->rate_type === 'monthly') {
                $dailyRate = $basicRate / $standardDays;
                $absenceDeduction = $dailyRate * $absentDays;
            }
            
            // ===== TOTAL PAY (Gross Pay) =====
            // Total Pay = Basic + Restday + All Premiums + Allowances (NO late deduction here)
            $totalPay = $basicPay + $restdayPay + $regularAllowance + $restdayAllowance +
                       $nightDiffOrdinaryWorking + $nightDiffHoliday + $nightDiffHolidayRestday + 
                       $nightDiffRestday + $nightDiffHolidayOT + $nightDiffHolidayRestdayOT +
                       $otHoliday + $otHolidayRestday + $otRegular + $otRestday + $otOrdinaryWorking +
                       $premiumRestday + $premiumHolidayRegular + $premiumHolidaySpecial + 
                       $premiumHolidayRDRegular + $premiumHolidayRDSpecial;
            
            // ===== DEDUCTIONS =====
            // Calculate statutory deductions based on total pay
            $monthlySalary = $employee->rate_type === 'monthly' ? floatval($employee->basic_rate) : null;
            $deductions = $this->calculateDeductions($totalPay, $payroll->apply_deductions, $monthlySalary);
            $loanDeduction = $this->getEmployeeLoanDeduction($employee->id, $payroll);
            
            // Total Deductions = SSS + PhilHealth + HDMF + Tax + Late + Absence + Loan
            $totalDeductions = $deductions['total'] + $latesDeduction + $absenceDeduction + $loanDeduction;
            
            // Net Pay = Total Pay - Total Deductions
            $netPay = $totalPay - $totalDeductions;
            
            // ===== CREATE PAYROLL ITEM =====
            PayrollItem::create([
                'payroll_id' => $payroll->id,
                'employee_id' => $employee->id,
                'basic_pay' => $basicPay,
                'restday_pay' => $restdayPay,
                'allowance_pay' => $regularAllowance + $restdayAllowance,
                'regular_allowance' => $regularAllowance,
                'restday_allowance' => $restdayAllowance,
                'gross_pay' => $totalPay,
                'sss_deduction' => $deductions['sss'],
                'phic_deduction' => $deductions['phic'],
                'hdmf_deduction' => $deductions['hdmf'],
                'tax_deduction' => $deductions['tax'],
                'late_deduction' => $latesDeduction,
                'absence_deduction' => $absenceDeduction,
                'loan_deduction' => $loanDeduction,
                'total_deductions' => $totalDeductions,
                'net_pay' => $netPay,
                // Hours and days breakdown
                'hours_worked' => $regularHours + $restdayHours,
                'overtime_hours' => $totalOvertimeHours,
                'night_diff_hours' => $totalNightDiffHours,
                'regular_hours' => $regularHours,
                'restday_hours' => $restdayHours,
                'days_worked' => $totalDays,
                'total_days' => $totalDays,
                'late_minutes' => $totalLateMinutes,
                'absent_days' => $absentDays,
                // Night Differential Breakdown
                'night_diff_ordinary_working' => (float) (isset($nightDiffOrdinaryWorking) ? $nightDiffOrdinaryWorking : 0),
                'night_diff_holiday' => (float) (isset($nightDiffHoliday) ? $nightDiffHoliday : 0),
                'night_diff_holiday_restday' => (float) (isset($nightDiffHolidayRestday) ? $nightDiffHolidayRestday : 0),
                'night_diff_restday' => (float) (isset($nightDiffRestday) ? $nightDiffRestday : 0),
                'night_diff_holiday_ot' => (float) (isset($nightDiffHolidayOT) ? $nightDiffHolidayOT : 0),
                'night_diff_holiday_restday_ot' => (float) (isset($nightDiffHolidayRestdayOT) ? $nightDiffHolidayRestdayOT : 0),
                // Overtime Pay Breakdown
                'ot_holiday' => (float) (isset($otHoliday) ? $otHoliday : 0),
                'ot_holiday_restday' => (float) (isset($otHolidayRestday) ? $otHolidayRestday : 0),
                'ot_regular' => (float) (isset($otRegular) ? $otRegular : 0),
                'ot_restday' => (float) (isset($otRestday) ? $otRestday : 0),
                'ot_ordinary_working' => (float) (isset($otOrdinaryWorking) ? $otOrdinaryWorking : 0),
                // Additional Premium Pay (1st 8 hrs)
                'premium_restday' => (float) (isset($premiumRestday) ? $premiumRestday : 0),
                'premium_holiday_regular' => (float) (isset($premiumHolidayRegular) ? $premiumHolidayRegular : 0),
                'premium_holiday_special' => (float) (isset($premiumHolidaySpecial) ? $premiumHolidaySpecial : 0),
                'premium_holiday_rd_regular' => (float) (isset($premiumHolidayRDRegular) ? $premiumHolidayRDRegular : 0),
                'premium_holiday_rd_special' => (float) (isset($premiumHolidayRDSpecial) ? $premiumHolidayRDSpecial : 0),
            ]);
            
            Log::info('Payroll computed for employee: ' . $employee->id);
            
        } catch (\Exception $e) {
            Log::error('Failed to compute payroll for employee ' . $employee->id . ': ' . $e->getMessage());
            throw $e;
        }
    }

    private function recalculatePayrollTotals($payroll)
    {
        $items = $payroll->items;
        
        $payroll->update([
            'total_gross' => $items->sum('gross_pay'),
            'total_deductions' => $items->sum('total_deductions'),
            'total_net' => $items->sum('net_pay')
        ]);
    }

    private function getLeaveUsedForPayrollPeriod($employeeId, $payroll)
    {
        return [
            'total_days' => 0,
            'breakdown' => []
        ];
    }

    private function processLoanPaymentsForEmployee($employeeId, $period, $payslip = null)
    {
        try {
            // Map payroll period label to cut_off value used on EmployeeDeduction
            $cutoffPeriod = $period === '1st Half' ? '1st_half' : '2nd_half';

            $loans = EmployeeDeduction::where('employee_id', $employeeId)
                ->where('is_active', true)
                ->where('is_archived', false)
                ->where('cut_off', $cutoffPeriod)
                ->where('remaining_balance', '>', 0)
                ->get();
            
            Log::info("Processing loan payments for employee {$employeeId}, period {$period} (cutoff: {$cutoffPeriod}). Found " . $loans->count() . " active loans.");

            // Use today's date for payment
            $paymentDate = now();

            foreach ($loans as $loan) {
                // Guard against invalid term
                if (!$loan->term || $loan->term <= 0) {
                    Log::warning("Loan {$loan->id} has invalid term: {$loan->term}");
                    continue;
                }

                // Per-cutoff payment for this loan
                $perCutoffPayment = $loan->amount / $loan->term;

                // Do not deduct more than remaining balance
                $payment = min($perCutoffPayment, $loan->remaining_balance);

                Log::info("Processing loan {$loan->id}: amount={$loan->amount}, term={$loan->term}, perCutoff={$perCutoffPayment}, payment={$payment}, remaining={$loan->remaining_balance}");

                if ($payment <= 0) {
                    Log::warning("Loan {$loan->id} has zero or negative payment");
                    continue;
                }

                // Update remaining balance and payments made
                $loan->remaining_balance = $loan->remaining_balance - $payment;
                $loan->payments_made = ($loan->payments_made ?? 0) + 1;

                // If fully paid or term reached, deactivate the loan
                if ($loan->remaining_balance <= 0.01 || $loan->payments_made >= $loan->term) {
                    $loan->remaining_balance = 0;
                    $loan->is_active = false;
                }

                $loan->save();
                Log::info("Loan {$loan->id} saved: payments_made={$loan->payments_made}, remaining={$loan->remaining_balance}, is_active={$loan->is_active}");

                // Create a DeductionPayment record if payslip is provided
                if ($payslip) {
                    Log::info("Creating DeductionPayment for loan {$loan->id}, payslip {$payslip->id}, amount {$payment}");
                    DeductionPayment::create([
                        'employee_deduction_id' => $loan->id,
                        'payslip_id' => $payslip->id,
                        'amount' => $payment,
                        'balance_after' => $loan->remaining_balance,
                        'payment_date' => $paymentDate,
                    ]);
                    Log::info("DeductionPayment created successfully");
                } else {
                    Log::warning("Payslip is null, skipping DeductionPayment creation");
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to process loan payments for employee ' . $employeeId . ': ' . $e->getMessage());
        }
    }

    private function deductLeavesFromCredits($employeeId, $payroll)
    {
        // TODO: Implement leave deduction
    }

    private function getPayrollDateRange($payroll)
    {
        $year = $payroll->year;
        $month = date('m', strtotime($payroll->month));
        
        if ($payroll->payroll_period === '1st Half') {
            $start = "{$year}-{$month}-01";
            $end = "{$year}-{$month}-15";
        } else {
            $start = "{$year}-{$month}-16";
            $lastDay = date('t', strtotime("{$year}-{$month}-01"));
            $end = "{$year}-{$month}-{$lastDay}";
        }
        
        return ['start' => $start, 'end' => $end];
    }

    private function parseDate($value)
    {
        if (empty($value)) return null;

        try {
            if (is_numeric($value)) {
                return Carbon::instance(\PhpOffice\PhpSpreadsheet\Shared\Date::excelToDateTimeObject($value));
            }
            
            // Handle WPS Office Chinese date format: "1212122025年10月16日"
            // Extract year, month, day from Chinese format
            if (preg_match('/(\d{4})年(\d{1,2})月(\d{1,2})日/', $value, $matches)) {
                $year = $matches[1];
                $month = $matches[2];
                $day = $matches[3];
                return Carbon::create($year, $month, $day);
            }
            
            // Try parsing with common date formats
            $formats = ['m-d-Y', 'm/d/Y', 'Y-m-d', 'Y/m/d', 'd-m-Y', 'd/m/Y', 'n-j-Y', 'n/j/Y', 'j-n-Y', 'j/n/Y'];
            foreach ($formats as $format) {
                try {
                    return Carbon::createFromFormat($format, $value);
                } catch (\Exception $e) {
                    continue;
                }
            }
            
            // Fallback to parse
            return Carbon::parse($value);
        } catch (\Exception $e) {
            Log::warning("Failed to parse date '$value': " . $e->getMessage());
            return null;
        }
    }

    private function parseTime($timeString)
    {
        if (empty($timeString)) return null;

        try {
            // Handle numeric Excel time (0.0 to 1.0)
            if (is_numeric($timeString)) {
                $totalMinutes = round($timeString * 24 * 60);
                $hours = floor($totalMinutes / 60);
                $minutes = $totalMinutes % 60;
                return sprintf('%02d:%02d:00', $hours, $minutes);
            }

            // Handle DateTime objects
            if ($timeString instanceof \DateTime) {
                return $timeString->format('H:i:s');
            }

            // Handle Chinese date format like "1月1日" (which WPS uses for some cells)
            // This is actually a date, not a time - skip it
            if (preg_match('/\d+月\d+日/', $timeString)) {
                Log::warning("Skipping Chinese date format in time field: {$timeString}");
                return null;
            }

            // Try normal parsing
            return Carbon::parse($timeString)->format('H:i:s');
        } catch (\Exception $e) {
            Log::warning("Failed to parse time: {$timeString}");
            return null;
        }
    }

    private function isNightShift($clockIn)
    {
        if (empty($clockIn)) return false;

        try {
            $time = Carbon::parse($clockIn);
            $hour = $time->hour;

            // Night shift: 6PM (18:00) to 6AM (06:00)
            return $hour >= 18 || $hour < 6;
        } catch (\Exception $e) {
            return false;
        }
    }

   private function calculateNightDiff($clockIn, $clockOut, $date, $schedule)
    {
        try {
            // Ensure $clockIn and $clockOut are TIME ONLY
            $clockIn  = Carbon::parse($clockIn)->format('H:i:s');
            $clockOut = Carbon::parse($clockOut)->format('H:i:s');

            // Build full datetime for IN/OUT
            $in = Carbon::parse($date->format('Y-m-d') . ' ' . $clockIn);
            $out = Carbon::parse($date->format('Y-m-d') . ' ' . $clockOut);

            // If employee worked past midnight
            if ($out->lessThanOrEqualTo($in)) {
                $out->addDay();
            }

            /*
            |--------------------------------------------------------------------------
            | NIGHT DIFF RANGE
            |--------------------------------------------------------------------------
            | If schedule does not have custom night hours, default is 22:00 → 06:00.
            */
            if (!$schedule->night_start || !$schedule->night_end) {

                $nightStart = Carbon::parse($date->format('Y-m-d') . ' 22:00:00');
                $nightEnd = Carbon::parse($date->format('Y-m-d') . ' 06:00:00')->addDay();

            } else {

                // Make sure schedule times are TIME ONLY
                $nightStartTime = Carbon::parse($schedule->night_start)->format('H:i:s');
                $nightEndTime = Carbon::parse($schedule->night_end)->format('H:i:s');

                $nightStart = Carbon::parse($date->format('Y-m-d') . ' ' . $nightStartTime);
                $nightEnd   = Carbon::parse($date->format('Y-m-d') . ' ' . $nightEndTime);

                // If night end is next day
                if ($nightEnd->lessThan($nightStart)) {
                    $nightEnd->addDay();
                }
            }

            /*
            |--------------------------------------------------------------------------
            | Compute overlap between work hours and night hours
            |--------------------------------------------------------------------------
            */

            $ndStart = $in->greaterThan($nightStart) ? $in : $nightStart;
            $ndEnd   = $out->lessThan($nightEnd) ? $out : $nightEnd;

            if ($ndStart->greaterThanOrEqualTo($ndEnd)) {
                return 0; // No night diff
            }

            return abs($ndEnd->diffInMinutes($ndStart)) / 60; // Hours

        } catch (\Exception $e) {
            // Debug error
            dd($e);
            return 0;
        }
    }

    private function calculateDraftTotals($payroll)
    {
        $attendances = Attendance::where('payroll_id', $payroll->id)
            ->with('employee')
            ->get()
            ->groupBy('employee_id');

        // Fetch dynamic settings
        $lateAbsenceSettings = DeductionSetting::where('deduction_type', 'late_absences')->first();
        $settings = $lateAbsenceSettings ? ($lateAbsenceSettings->settings ?? []) : [];
        if (is_string($settings)) $settings = json_decode($settings, true);
        $standardDays = floatval($settings['days'] ?? 20);

        // Fetch Additional Premium Rates
        $additionalPremiums = PremiumType::whereHas('category', function($q) {
            $q->where('name', 'Additional Premium Pay');
        })->get()->keyBy('name');

        // Helper to get add-on rate (percentage) from total rate in DB
        $getPremiumRate = function($name, $defaultAddOn) use ($additionalPremiums) {
            if (isset($additionalPremiums[$name])) {
                $rate = $additionalPremiums[$name]->regular_rate;
                // If rate is >= 100 (e.g. 130, 200), it's a total rate, so subtract 100 to get add-on
                // If rate < 100 (e.g. 30), it's already an add-on rate
                if ($rate >= 100) {
                    return ($rate - 100) / 100;
                }
                return $rate / 100;
            }
            return $defaultAddOn;
        };

        // Fetch Overtime Rates
        $overtimePremiums = PremiumType::whereHas('category', function($q) {
            $q->where('name', 'Overtime Pay');
        })->get()->keyBy('name');

        $getOvertimeRate = function($name, $defaultRate) use ($overtimePremiums) {
            if (isset($overtimePremiums[$name])) {
                return $overtimePremiums[$name]->regular_rate / 100;
            }
            return $defaultRate / 100;
        };

        // Fetch Night Diff Rates
        $nightDiffPremiums = PremiumType::whereHas('category', function($q) {
            $q->where('name', 'Night Differential');
        })->get()->keyBy('name');

        $getNightDiffRate = function($name, $defaultRate) use ($nightDiffPremiums) {
            if (isset($nightDiffPremiums[$name])) {
                return $nightDiffPremiums[$name]->regular_rate / 100;
            }
            return $defaultRate / 100;
        };

        $totalGross = 0;
        $totalDeductions = 0;

        foreach ($attendances as $employeeId => $empAttendances) {
            $employee = $empAttendances->first()->employee;
            
            $basicRate = floatval($employee->basic_rate);
            $allowance = floatval($employee->allowance ?? 0);
            
            // Calculate hourly rates
            $hourlyRate = $employee->rate_type === 'monthly' ? ($basicRate / $standardDays / 8) : ($basicRate / 8);
            $hourlyAllowance = $employee->rate_type === 'monthly' ? ($allowance / $standardDays / 8) : ($allowance / 8);
            
            // Calculate hours
            $regularHours = $empAttendances->filter(fn($a) => !$a->is_restday)->sum('hours_worked');
            $restdayHours = $empAttendances->filter(fn($a) => $a->is_restday)->sum('hours_worked');
            $regularOT = $empAttendances->filter(fn($a) => !$a->is_restday && $a->is_ot_paid)->sum('overtime_hours');
            $regularNightDiff = $empAttendances->filter(fn($a) => !$a->is_restday)->sum('night_diff_hours');
            $nightShiftRestday = $empAttendances->filter(fn($a) => $a->is_restday)->sum('night_diff_hours');
            $totalLateMinutes = max(0, $empAttendances->sum('late_minutes'));
            
            // Get dynamic rates
            $restdayPremiumRate = $getPremiumRate('Restday', 0.30);
            $regularOTRate = $getOvertimeRate('Regular', 125);
            $nightDiffRate = $getNightDiffRate('Ordinary Working days', 10);
            $nightDiffRestdayRate = $getNightDiffRate('Restday', 13);

            // Calculate pay using dynamic rates
            $basicPay = $regularHours * $hourlyRate;
            $restdayPay = $restdayHours * $hourlyRate; // Base pay for rest day
            
            $latesDeduction = ($totalLateMinutes / 60) * $hourlyRate;
            
            if ($employee->rate_type === 'monthly') {
                $regularAllowance = $regularHours * $hourlyAllowance;
            } else {
                // Daily employees: Daily Allowance * Days Worked
                $daysWorked = $empAttendances->filter(fn($a) => !$a->is_restday && $a->hours_worked > 0)->count();
                $regularAllowance = $daysWorked * $allowance;
            }
            
            // Rest day premium (allowance and basic)
            $restdayAllowance = $restdayHours * $hourlyAllowance * $restdayPremiumRate;
            $restdayAddPremium = $restdayHours * $hourlyRate * $restdayPremiumRate;
            
            $regularOTPay = $regularOT * $hourlyRate * $regularOTRate;
            
            $nightShiftDiffPay = ($regularNightDiff * $hourlyRate * $nightDiffRate) + 
                                 ($nightShiftRestday * $hourlyRate * $nightDiffRestdayRate);
            
            // Gross pay (before deductions)
            $employeeGross = $basicPay + $restdayPay + $regularAllowance + $restdayAllowance + $restdayAddPremium + $regularOTPay + $nightShiftDiffPay;
            
            // Calculate deductions using database values
            $monthlySalary = $employee->rate_type === 'monthly' ? floatval($employee->basic_rate) : null;
            $deductions = $this->calculateDeductions($employeeGross, $payroll->apply_deductions, $monthlySalary);
            
            // Get employee loan deductions for this cutoff period
            $loanDeduction = $this->getEmployeeLoanDeduction($employee->id, $payroll);
            
            $employeeDeductions = $deductions['total'] + $latesDeduction + $loanDeduction;
            
            $totalGross += $employeeGross;
            $totalDeductions += $employeeDeductions;
        }

        return [
            'gross' => $totalGross,
            'deductions' => $totalDeductions,
            'net' => $totalGross - $totalDeductions,
        ];
    }

    private function computeDetailedPayrollForDraft($employee, $attendanceList, $loanDeduction, $scheduledWorkingDays, $absentDays, $payroll)
    {
        $basicRate = floatval($employee->basic_rate);
        $allowance = floatval($employee->allowance ?? 0);
        $loanDeductionAmount = floatval($loanDeduction);

        // Fetch dynamic settings
        $lateAbsenceSettings = DeductionSetting::where('deduction_type', 'late_absences')->first();
        $settings = $lateAbsenceSettings ? ($lateAbsenceSettings->settings ?? []) : [];
        if (is_string($settings)) $settings = json_decode($settings, true);
        $standardDays = floatval($settings['days'] ?? 20);

        // Calculate rates
        $hourlyRate = $employee->rate_type === 'monthly' ? ($basicRate / $standardDays / 8) : ($basicRate / 8);
        $hourlyAllowance = $employee->rate_type === 'monthly' ? ($allowance / $standardDays / 8) : ($allowance / 8);
        $totalHourlyRate = $hourlyRate + $hourlyAllowance;

        // Total days = scheduled working days minus absences
        $totalDays = max(0, $scheduledWorkingDays - $absentDays);

        // Calculate late minutes (with 15-minute grace period)
        $totalLateMinutes = $attendanceList->reduce(function ($sum, $att) {
            if ($att->is_restday || $att->is_holiday || !$att->clock_in || !$att->scheduled_in) {
                return $sum;
            }
            
            try {
                $dateStr = $att->date instanceof \Carbon\Carbon ? $att->date->format('Y-m-d') : $att->date;
                
                // Parse times. clock_in might be just time 'H:i:s'
                $clockIn = \Carbon\Carbon::parse($dateStr . ' ' . $att->clock_in);
                $scheduledIn = \Carbon\Carbon::parse($dateStr . ' ' . $att->scheduled_in);

                // Calculate difference: ClockIn - ScheduledIn
                // If ClockIn > ScheduledIn, result is positive (Late)
                $diffMinutes = $scheduledIn->diffInMinutes($clockIn, false);

                // 15-minute grace: <=15 mins late => 0, >15 => full diff
                if ($diffMinutes > 15) {
                    return $sum + $diffMinutes;
                }
            } catch (\Exception $e) {
                // Ignore parse errors
                return $sum;
            }

            return $sum;
        }, 0);

        // Total late minutes (used for late deduction). Absences are handled separately.
        // But for display in "LATE / ABSENCES (in mins.)" column, we include absences converted to minutes.
        $absenceMinutes = $absentDays * 8 * 60; // 8 hours per day
        $lateAndAbsMinutes = $totalLateMinutes + $absenceMinutes;

        // Categorize attendance by day type
        $regularDays = $attendanceList->filter(fn($a) => !$a->is_restday && !$a->is_holiday);
        $restdays = $attendanceList->filter(fn($a) => $a->is_restday && !$a->is_holiday);
        $regularHolidays = $attendanceList->filter(fn($a) => $a->is_holiday && $a->holiday_type === 'regular' && !$a->is_restday);
        $specialHolidays = $attendanceList->filter(fn($a) => $a->is_holiday && $a->holiday_type === 'special' && !$a->is_restday);
        $regularHolidaysOnRD = $attendanceList->filter(fn($a) => $a->is_holiday && $a->holiday_type === 'regular' && $a->is_restday);
        $specialHolidaysOnRD = $attendanceList->filter(fn($a) => $a->is_holiday && $a->holiday_type === 'special' && $a->is_restday);

        // Hours worked by category
        $regularHours = $regularDays->sum('hours_worked');
        $restdayHours = $restdays->sum('hours_worked');
        $regularHolidayHours = $regularHolidays->sum('hours_worked');
        $specialHolidayHours = $specialHolidays->sum('hours_worked');
        $regularHolidayRDHours = $regularHolidaysOnRD->sum('hours_worked');
        $specialHolidayRDHours = $specialHolidaysOnRD->sum('hours_worked');

        // OT hours by category
        $regularOT = $regularDays->filter(fn($a) => $a->is_ot_paid)->sum('overtime_hours');
        $restdayOT = $restdays->filter(fn($a) => $a->is_ot_paid)->sum('overtime_hours');
        $regularHolidayOT = $regularHolidays->filter(fn($a) => $a->is_ot_paid)->sum('overtime_hours');
        $specialHolidayOT = $specialHolidays->filter(fn($a) => $a->is_ot_paid)->sum('overtime_hours');
        $regularHolidayRDOT = $regularHolidaysOnRD->filter(fn($a) => $a->is_ot_paid)->sum('overtime_hours');
        $specialHolidayRDOT = $specialHolidaysOnRD->filter(fn($a) => $a->is_ot_paid)->sum('overtime_hours');

        // OT Buckets for calculation and display
        $otBuckets = [
            'regular' => $regularOT,
            'restday' => $restdayOT,
            'holiday_regular' => $regularHolidayOT,
            'holiday_special' => $specialHolidayOT,
            'holiday_rd_regular' => $regularHolidayRDOT,
            'holiday_rd_special' => $specialHolidayRDOT,
        ];

        // Night diff hours by category (Regular vs OT split)
        $ndBuckets = [
            'regular' => ['reg' => 0, 'ot' => 0],
            'restday' => ['reg' => 0, 'ot' => 0],
            'holiday_regular' => ['reg' => 0, 'ot' => 0],
            'holiday_special' => ['reg' => 0, 'ot' => 0],
            'holiday_rd_regular' => ['reg' => 0, 'ot' => 0],
            'holiday_rd_special' => ['reg' => 0, 'ot' => 0],
        ];

        // Additional Premium hours (Capped at 8 hours)
        $addPremBuckets = [
            'restday' => 0,
            'holiday_regular' => 0,
            'holiday_special' => 0,
            'holiday_rd_regular' => 0,
            'holiday_rd_special' => 0,
        ];

        $scheduleModel = $payroll->schedule;

        foreach ($attendanceList as $att) {
            if (!$att->clock_in || !$att->clock_out) continue;

            $category = 'regular';
            if ($att->is_holiday && $att->is_restday) {
                $category = ($att->holiday_type === 'regular') ? 'holiday_rd_regular' : 'holiday_rd_special';
            } elseif ($att->is_holiday) {
                $category = ($att->holiday_type === 'regular') ? 'holiday_regular' : 'holiday_special';
            } elseif ($att->is_restday) {
                $category = 'restday';
            }

            // Accumulate Additional Premium Hours (Capped at 8)
            if ($category !== 'regular') {
                // Ensure we don't calculate premium on more than 8 hours (Additional Premium Pay is for 1st 8 hrs)
                $cappedHours = min($att->hours_worked, 8);
                if (isset($addPremBuckets[$category])) {
                    $addPremBuckets[$category] += $cappedHours;
                }
            }

            // Recalculate ND split
            try {
                $dateStr = $att->date instanceof \Carbon\Carbon ? $att->date->format('Y-m-d') : $att->date;
                $in = \Carbon\Carbon::parse($dateStr . ' ' . $att->clock_in);
                $out = \Carbon\Carbon::parse($dateStr . ' ' . $att->clock_out);
                if ($out->lt($in)) $out->addDay();

                // First 8 hours window
                $threshold = $in->copy()->addHours(8);
                
                $regEnd = $out->copy();
                if ($regEnd->gt($threshold)) $regEnd = $threshold;
                
                // Regular ND (Raw)
                $rawRegND = $this->calculateNightDiff($in->format('H:i'), $regEnd->format('H:i'), \Carbon\Carbon::parse($dateStr), $scheduleModel);
                
                // OT ND (Raw) - Only calculate if OT is PAID
                $rawOtND = 0;
                if ($out->gt($threshold) && $att->is_ot_paid) {
                    $rawOtND = $this->calculateNightDiff($threshold->format('H:i'), $out->format('H:i'), \Carbon\Carbon::parse($dateStr), $scheduleModel);
                }

                // Use calculated values directly to ensure Schedule changes are reflected dynamically
                // instead of relying on the static value stored during upload.
                $finalReg = $rawRegND;
                $finalOt = $rawOtND;

                // Night Shift Override: If employee has Night Diff in regular hours and has PAID OT,
                // treat ALL OT as Night Diff OT (even if some OT hours fall outside night window)
                // This ensures night shift workers don't get split into Day OT + Night OT incorrectly
                if ($finalReg > 0 && $att->overtime_hours > 0 && $att->is_ot_paid) {
                     $finalOt = $att->overtime_hours;
                }

                // Holiday Override: If Holiday and we have Night Diff, assume ALL PAID OT is Night Diff OT
                // This handles cases where OT is in the morning (after 6am) but considered part of Night Shift payment rules for Holidays
                if ($att->is_holiday && $finalReg > 0 && $att->overtime_hours > 0 && $att->is_ot_paid) {
                     $finalOt = $att->overtime_hours;
                }

                $ndBuckets[$category]['reg'] += $finalReg;
                $ndBuckets[$category]['ot'] += $finalOt;

            } catch (\Exception $e) {
                // Fallback to total if parse fails
                $ndBuckets[$category]['reg'] += $att->night_diff_hours;
            }
        }

        // Fetch premium rates
        $nightDiffPremiums = PremiumType::whereHas('category', fn($q) => $q->where('name', 'Night Differential'))->get()->keyBy('name');
        $overtimePremiums = PremiumType::whereHas('category', fn($q) => $q->where('name', 'Overtime Pay'))->get()->keyBy('name');
        $additionalPremiums = PremiumType::whereHas('category', fn($q) => $q->where('name', 'Additional Premium Pay'))->get()->keyBy('name');

        $getNightDiffRate = function($name, $default) use ($nightDiffPremiums) {
            return isset($nightDiffPremiums[$name]) ? $nightDiffPremiums[$name]->regular_rate / 100 : $default / 100;
        };
        $getOvertimeRate = function($name, $default) use ($overtimePremiums) {
            return isset($overtimePremiums[$name]) ? $overtimePremiums[$name]->regular_rate / 100 : $default / 100;
        };
        $getAdditionalRate = function($name, $default) use ($additionalPremiums) {
            if (isset($additionalPremiums[$name])) {
                $rate = $additionalPremiums[$name]->regular_rate;
                // For Additional Premium Pay, the rate in DB is always the Premium Percentage (e.g. 30, 100, 160)
                // So we simply divide by 100.
                return $rate / 100;
            }
            // Handle default: If > 5, assume Percentage (e.g. 160, 50). If <= 5, assume Factor (e.g. 1.6, 0.5)
            return $default > 5 ? $default / 100 : $default;
        };

        // Basic pay & allowance
        $basicPay = $employee->rate_type === 'monthly' ? $basicRate / 2 : $basicRate * $totalDays;
        $regularAllowance = 0;
        $restdayAllowance = 0;

        if ($employee->rate_type === 'monthly') {
            $regularAllowance = $allowance / 2;
            if ($restdayHours > 0) {
                $hourlyAllowanceRate = $allowance / 2 / $standardDays / 4;
                $restdayAllowance = $restdayHours * $hourlyAllowanceRate;
            }
        } else {
            // Daily employees: Daily Allowance * Total Days
            $regularAllowance = $allowance * $totalDays;
            if ($restdayHours > 0) {
                $restdayAllowance = $restdayHours * $hourlyAllowance;
            }
        }

        // Restday pay
        $restdayPay = 0;
        if ($employee->rate_type === 'monthly') {
            $restdayPay = $totalDays > 0 ? ($basicPay / $totalDays) * ($restdayHours / 8) : 0;
        } else {
            $restdayPay = $restdayHours * $hourlyRate;
        }

        // Night differential breakdown
        $nightDiffOrdinaryWorking = $ndBuckets['regular']['reg'] * $hourlyRate * $getNightDiffRate('Ordinary Working days', 10);
        $nightDiffRestday = $ndBuckets['restday']['reg'] * $hourlyRate * $getNightDiffRate('Restday Premium', 13);
        $nightDiffHolidayRegular = $ndBuckets['holiday_regular']['reg'] * $hourlyRate * $getNightDiffRate('Holiday Regular Premium', 20);
        $nightDiffHolidaySpecial = $ndBuckets['holiday_special']['reg'] * $hourlyRate * $getNightDiffRate('Holiday Special Premium', 13);
        $nightDiffHolidayRDRegular = $ndBuckets['holiday_rd_regular']['reg'] * $hourlyRate * $getNightDiffRate('Holiday Restday Regular Premium', 26);
        $nightDiffHolidayRDSpecial = $ndBuckets['holiday_rd_special']['reg'] * $hourlyRate * $getNightDiffRate('Holiday Restday Special Premium', 15);
        
        // Night Diff on OT (Includes Base OT Rate + Night Premium)
        $nightDiffOTRegular = $ndBuckets['regular']['ot'] * $hourlyRate *  $getNightDiffRate('Regular Overtime', 12.50);
        $nightDiffOTRestday = $ndBuckets['restday']['ot'] * $hourlyRate * $getNightDiffRate('Restday Overtime', 16.90);
        $nightDiffHolidayOT = $ndBuckets['holiday_regular']['ot'] * $hourlyRate * $getNightDiffRate('Holiday Regular Overtime', 20);
        $nightDiffHolidaySpecialOT = $ndBuckets['holiday_special']['ot'] * $hourlyRate * $getNightDiffRate('Holiday Special Overtime', 16.90);
        $nightDiffHolidayRDOT = $ndBuckets['holiday_rd_regular']['ot'] * $hourlyRate * $getNightDiffRate('Holiday Restday Regular Overtime', 33.80);
        $nightDiffHolidayRDSpecialOT = $ndBuckets['holiday_rd_special']['ot'] * $hourlyRate * $getNightDiffRate('Holiday Restday Special Overtime', 19.50);

        // Additional premium pay
        $additionalRestday = $addPremBuckets['restday'] * $hourlyRate * $getAdditionalRate('Restday', 0.3);
        $additionalHolidayRegular = $addPremBuckets['holiday_regular'] * $hourlyRate * $getAdditionalRate('Regular Holiday ', 100);
        $additionalHolidaySpecial = $addPremBuckets['holiday_special'] * $hourlyRate * $getAdditionalRate('Special Holiday ', 30);
        $additionalHolidayRDRegular = $addPremBuckets['holiday_rd_regular'] * $hourlyRate * $getAdditionalRate('Restday Regular Holiday', 160);
        $additionalHolidayRDSpecial = $addPremBuckets['holiday_rd_special'] * $hourlyRate * $getAdditionalRate('Holiday Restday Special', 50);

        // Overtime pay (Day Shift OT Only)
        // Calculate actual day shift OT hours (after subtracting night diff OT)
        $otRegularHours = max(0, $otBuckets['regular'] - $ndBuckets['regular']['ot']);
        $otRestdayHours = max(0, $otBuckets['restday'] - $ndBuckets['restday']['ot']);
        $otHolidayRegularHours = max(0, $otBuckets['holiday_regular'] - $ndBuckets['holiday_regular']['ot']);
        $otHolidaySpecialHours = max(0, $otBuckets['holiday_special'] - $ndBuckets['holiday_special']['ot']);
        $otHolidayRDRegularHours = max(0, $otBuckets['holiday_rd_regular'] - $ndBuckets['holiday_rd_regular']['ot']);
        $otHolidayRDSpecialHours = max(0, $otBuckets['holiday_rd_special'] - $ndBuckets['holiday_rd_special']['ot']);
        
        $otRegular = $otRegularHours * $hourlyRate * $getOvertimeRate('Regular Overtime', 125);
        $otRestday = $otRestdayHours * $hourlyRate * $getOvertimeRate('Restday Overtime', 169);
        $otHolidayRegular = $otHolidayRegularHours * $hourlyRate * $getOvertimeRate('Regular Holiday ', 260);
        $otHolidaySpecial = $otHolidaySpecialHours * $hourlyRate * $getOvertimeRate('Special Holiday', 169);
        $otHolidayRDRegular = $otHolidayRDRegularHours * $hourlyRate * $getOvertimeRate('Restday Regular Holiday', 388);
        $otHolidayRDSpecial = $otHolidayRDSpecialHours * $hourlyRate * $getOvertimeRate('Restday Special Holiday', 195);
        
        // Add regular OT for night shift OT hours (night shift employees get OT rate twice)
        $otRegularHours += $ndBuckets['regular']['ot'];
        $otRestdayHours += $ndBuckets['restday']['ot'];
        $otHolidayRegularHours += $ndBuckets['holiday_regular']['ot'];
        $otHolidaySpecialHours += $ndBuckets['holiday_special']['ot'];
        $otHolidayRDRegularHours += $ndBuckets['holiday_rd_regular']['ot'];
        $otHolidayRDSpecialHours += $ndBuckets['holiday_rd_special']['ot'];
        
        $otRegular += $ndBuckets['regular']['ot'] * $hourlyRate * $getOvertimeRate('Regular Overtime', 125);
        $otRestday += $ndBuckets['restday']['ot'] * $hourlyRate * $getOvertimeRate('Restday Overtime', 169);
        $otHolidayRegular += $ndBuckets['holiday_regular']['ot'] * $hourlyRate * $getOvertimeRate('Regular Holiday ', 260);
        $otHolidaySpecial += $ndBuckets['holiday_special']['ot'] * $hourlyRate * $getOvertimeRate('Special Holiday', 169);
        $otHolidayRDRegular += $ndBuckets['holiday_rd_regular']['ot'] * $hourlyRate * $getOvertimeRate('Restday Regular Holiday', 388);
        $otHolidayRDSpecial += $ndBuckets['holiday_rd_special']['ot'] * $hourlyRate * $getOvertimeRate('Restday Special Holiday', 195);
        
        // otOrdinaryWorking seems to be a legacy variable or mistake. Removing it as it overlaps with nightDiffOrdinaryWorking or is redundant.
        $otOrdinaryWorking = 0; 

        // Late & absence deductions
        $lateDeduction = ($totalLateMinutes / 60) * $hourlyRate;
        $absenceDeduction = 0;
        if ($employee->rate_type === 'monthly') {
            $dailyRateForAbsence = $basicRate / $standardDays;
            $absenceDeduction = $dailyRateForAbsence * $absentDays;
        }

        // Gross pay
        $totalPay = ($basicPay + $restdayPay + $regularAllowance + $restdayAllowance +
                   $nightDiffOrdinaryWorking + $nightDiffRestday + $nightDiffHolidayRegular + $nightDiffHolidaySpecial +
                   $nightDiffHolidayRDRegular + $nightDiffHolidayRDSpecial + 
                   $nightDiffOTRegular + $nightDiffOTRestday + $nightDiffHolidayOT + $nightDiffHolidaySpecialOT + 
                   $nightDiffHolidayRDOT + $nightDiffHolidayRDSpecialOT +
                   $otRegular + $otRestday + $otHolidayRegular + $otHolidaySpecial + $otHolidayRDRegular + $otHolidayRDSpecial +
                   $additionalRestday + $additionalHolidayRegular + $additionalHolidaySpecial +
                   $additionalHolidayRDRegular + $additionalHolidayRDSpecial) - ($lateDeduction + $absenceDeduction);

        // Statutory deductions
        $sssDeduction = 0;
        $phicDeduction = 0;
        $hdmfDeduction = 0;
        $taxDeduction = 0;

        // PHIC - Unconditional (Bypass apply_deductions)
        // Use Basic Pay (Earnings) as basis for ALL employees (User request)
        $phicBasisAmount = $basicPay;
        
        $phicSetting = DeductionSetting::where('deduction_type', 'phic')->first();
        if ($phicSetting && $phicBasisAmount > 0) {
            $phicSettings = is_array($phicSetting->settings) ? $phicSetting->settings : json_decode($phicSetting->settings, true);
            $phicEmployeeShare = floatval($phicSettings['employee_share'] ?? $phicSettings['employee'] ?? 50) / 100; 
            
            // Use PHIC Brackets
            $phicBracket = \App\Models\PHICBracket::where('from', '<=', $phicBasisAmount)
                ->where(function($q) use ($phicBasisAmount) {
                    $q->where('to', '>=', $phicBasisAmount)
                      ->orWhereNull('to');
                })
                ->orderBy('from', 'desc')
                ->first();

            if ($phicBracket) {
                if ($phicBracket->fixed_amount > 0) {
                    $totalPhicPremium = $phicBracket->fixed_amount;
                } else {
                    $totalPhicPremium = $phicBasisAmount * ($phicBracket->percentage / 100);
                }
            } else {
                // Fallback to old logic if no brackets found
                $phicRate = floatval($phicSettings['rate'] ?? 5) / 100;
                $minSalary = floatval($phicSettings['min_salary'] ?? 10000);
                $maxSalary = floatval($phicSettings['max_salary'] ?? 100000);
                $clampedBasis = max($minSalary, min($maxSalary, $phicBasisAmount));
                $totalPhicPremium = $clampedBasis * $phicRate;
            }
            
            // Deduction is simply Total Premium / 2 (50% Share)
            $phicDeduction = $totalPhicPremium / 2;
        }

        if ($payroll->apply_deductions) {
            // SSS
            // Use Total Pay as basis for SSS bracket check
            $sssBasis = $totalPay;
            if ($sssBasis > 0) {
                $sssBracket = \App\Models\SSSBracket::where('from', '<=', $sssBasis)
                    ->where('to', '>=', $sssBasis)
                    ->first();
                
                // Fallback: if exceeding max bracket
                if (!$sssBracket) {
                     $sssBracket = \App\Models\SSSBracket::where('to', '<', $sssBasis)->orderBy('to', 'desc')->first();
                }

                if ($sssBracket) {
                    $sssDeduction = $sssBracket->ee;
                }
            }

            // HDMF
            $hdmfSetting = DeductionSetting::where('deduction_type', 'hdmf')->first();
            if ($hdmfSetting) {
                $hdmfSettings = is_array($hdmfSetting->settings) ? $hdmfSetting->settings : json_decode($hdmfSetting->settings, true);
                $hdmfDeduction = floatval($hdmfSettings['employee_contribution'] ?? 200);
            }

            // Tax
            if ($payroll->payroll_period === '1st Half') {
                $taxDeduction = 0;
            } else {
                // 2nd Half - consolidate with 1st Half (exclude archived)
                $firstHalfPayroll = Payroll::where('month', $payroll->month)
                    ->where('year', $payroll->year)
                    ->where('payroll_period', '1st Half')
                    ->where('is_archived', false)
                    ->first();

                $firstHalfItem = null;
                if ($firstHalfPayroll) {
                    $firstHalfItem = PayrollItem::where('payroll_id', $firstHalfPayroll->id)
                        ->where('employee_id', $employee->id)
                        ->first();
                }

                // If no 1st cut, tax is 0 (per user request)
                if (!$firstHalfItem) {
                    $taxDeduction = 0;
                } else {
                    $gross1 = $firstHalfItem->gross_pay; // 1st Half Gross
                    $gross2 = $totalPay;                 // 2nd Half Gross (Current)
                    
                    $deductions1 = $firstHalfItem->sss_deduction + $firstHalfItem->phic_deduction + $firstHalfItem->hdmf_deduction;
                    $deductions2 = $sssDeduction + $phicDeduction + $hdmfDeduction;
                    
                    // Monthly Taxable Income = Total Monthly Gross - Total Statutory Deductions
                    $monthlyTaxableIncome = ($gross1 + $gross2) - ($deductions1 + $deductions2);
                    
                    // Use Annual Tax Table but converted to Monthly values
                    // Annualize? No, user asked for Monthly Brackets. 
                    // So we compare Monthly Income vs (Annual Bracket / 12)
                    
                    // Find the bracket where (Annual From / 12) <= Monthly Income <= (Annual To / 12)
                    $taxBracket = \App\Models\TaxBracket::all()->filter(function($bracket) use ($monthlyTaxableIncome) {
                        $monthlyFrom = $bracket->from / 12;
                        $monthlyTo = $bracket->to / 12;
                        return $monthlyTaxableIncome >= $monthlyFrom && $monthlyTaxableIncome <= $monthlyTo;
                    })->first();
                    
                    // Fallback for highest tax bracket (if income exceeds all defined brackets)
                    if (!$taxBracket) {
                         $taxBracket = \App\Models\TaxBracket::orderBy('to', 'desc')->first();
                         // Verify if it really exceeds the max
                         if ($taxBracket && $monthlyTaxableIncome < ($taxBracket->from / 12)) {
                             $taxBracket = null; // Should not happen if brackets cover 0 to infinity
                         }
                    }

                    if ($taxBracket) {
                        $monthlyFrom = $taxBracket->from / 12;
                        $monthlyFixed = $taxBracket->fixed_amount / 12;
                        $rate = $taxBracket->percentage; // e.g. 0.15 for 15%
                        
                        // Tax = (Taxable Income - Excess over Lower Limit) * Rate + Fixed Amount
                        $taxDeduction = ($monthlyTaxableIncome - $monthlyFrom) * $rate + $monthlyFixed;
                    }
                }
            }
        }

        // Total deductions
        $totalDeductions = $sssDeduction + $phicDeduction + $hdmfDeduction + $taxDeduction + $lateDeduction + $absenceDeduction + $loanDeductionAmount;
        $netPay = $totalPay - $totalDeductions;

        // Hours Totals for Snapshot
        $totalOvertimeHours = $attendanceList->sum('overtime_hours');
        $totalNightDiffHours = $attendanceList->sum('night_diff_hours');
        $totalHolidayRestdayHours = $attendanceList->filter(fn($a) => $a->is_holiday || $a->is_restday)
            ->sum(fn($a) => max(0, $a->hours_worked - $a->overtime_hours));

        return [
            'payrollType' => $employee->rate_type === 'monthly' ? 'Monthly' : 'Daily',
            'totalOvertimeHours' => number_format($totalOvertimeHours, 2, '.', ''),
            'totalNightDiffHours' => number_format($totalNightDiffHours, 2, '.', ''),
            'totalHolidayRestdayHours' => number_format($totalHolidayRestdayHours, 2, '.', ''),
            'basicRate' => number_format($basicRate, 2, '.', ''),
            'allowanceRate' => number_format($allowance, 2, '.', ''),
            'hourlyBasic' => number_format($hourlyRate, 2, '.', ''),
            'hourlyAllowance' => number_format($hourlyAllowance, 2, '.', ''),
            'hourlyTotal' => number_format($totalHourlyRate, 2, '.', ''),
            'totalDays' => $totalDays,
            'totalLateMinutes' => $totalLateMinutes,
            'restdayOT' => number_format($restdayHours, 2, '.', ''),
            'regularOT' => number_format($otRegularHours, 2, '.', ''),
            'nightShiftRestday' => number_format($ndBuckets['restday']['reg'], 2, '.', ''),
            'basicPay' => number_format($basicPay, 2, '.', ''),
            'restdayPay' => number_format($restdayPay, 2, '.', ''),
            'regularAllowance' => number_format($regularAllowance, 2, '.', ''),
            'restdayAllowance' => number_format($restdayAllowance, 2, '.', ''),
            'latesDeduction' => number_format($lateDeduction + $absenceDeduction, 2, '.', ''),
            'totalPay' => number_format($totalPay, 2, '.', ''),
            'lateAndAbsMinutes' => $lateAndAbsMinutes,
            'nightDiffOrdinaryWorking' => number_format($nightDiffOrdinaryWorking, 2, '.', ''),
            'nightDiffRestday' => number_format($nightDiffRestday, 2, '.', ''),
            'nightDiffHolidayRegular' => number_format($nightDiffHolidayRegular, 2, '.', ''),
            'nightDiffHolidaySpecial' => number_format($nightDiffHolidaySpecial, 2, '.', ''),
            'nightDiffHolidayRDRegular' => number_format($nightDiffHolidayRDRegular, 2, '.', ''),
            'nightDiffHolidayRDSpecial' => number_format($nightDiffHolidayRDSpecial, 2, '.', ''),
            
            // Night Diff Hours (1st 8 hrs)
            'nightDiffOrdinaryWorkingHours' => number_format($ndBuckets['regular']['reg'], 2, '.', ''),
            'nightDiffRestdayHours' => number_format($ndBuckets['restday']['reg'], 2, '.', ''),
            'nightDiffHolidayRegularHours' => number_format($ndBuckets['holiday_regular']['reg'], 2, '.', ''),
            'nightDiffHolidaySpecialHours' => number_format($ndBuckets['holiday_special']['reg'], 2, '.', ''),
            'nightDiffHolidayRDRegularHours' => number_format($ndBuckets['holiday_rd_regular']['reg'], 2, '.', ''),
            'nightDiffHolidayRDSpecialHours' => number_format($ndBuckets['holiday_rd_special']['reg'], 2, '.', ''),

            // Night Diff Hours (OT)
            'nightDiffOTRegularHours' => number_format($ndBuckets['regular']['ot'], 2, '.', ''),
            'nightDiffOTRestdayHours' => number_format($ndBuckets['restday']['ot'], 2, '.', ''),
            'nightDiffHolidayOTHours' => number_format($ndBuckets['holiday_regular']['ot'], 2, '.', ''),
            'nightDiffHolidaySpecialOTHours' => number_format($ndBuckets['holiday_special']['ot'], 2, '.', ''),
            'nightDiffHolidayRDOTHours' => number_format($ndBuckets['holiday_rd_regular']['ot'], 2, '.', ''),
            'nightDiffHolidayRDSpecialOTHours' => number_format($ndBuckets['holiday_rd_special']['ot'], 2, '.', ''),

            // Additional Premium Hours
            'additionalRestdayHours' => number_format($addPremBuckets['restday'], 2, '.', ''),
            'additionalHolidayRegularHours' => number_format($addPremBuckets['holiday_regular'], 2, '.', ''),
            'additionalHolidaySpecialHours' => number_format($addPremBuckets['holiday_special'], 2, '.', ''),
            'additionalHolidayRDRegularHours' => number_format($addPremBuckets['holiday_rd_regular'], 2, '.', ''),
            'additionalHolidayRDSpecialHours' => number_format($addPremBuckets['holiday_rd_special'], 2, '.', ''),

            // Overtime Hours (Display: Total OT minus Night OT to show split)
            'otRegularHours' => number_format($otRegularHours, 2, '.', ''),
            'otRestdayHours' => number_format($otRestdayHours, 2, '.', ''),
            'otHolidayRegularHours' => number_format($otHolidayRegularHours, 2, '.', ''),
            'otHolidaySpecialHours' => number_format($otHolidaySpecialHours, 2, '.', ''),
            'otHolidayRDRegularHours' => number_format($otHolidayRDRegularHours, 2, '.', ''),
            'otHolidayRDSpecialHours' => number_format($otHolidayRDSpecialHours, 2, '.', ''),
            'otOrdinaryWorkingHours' => number_format($otRegularHours, 2, '.', ''),
            
            'nightDiffOTRegular' => number_format($nightDiffOTRegular, 2, '.', ''),
            'nightDiffOTRestday' => number_format($nightDiffOTRestday, 2, '.', ''),
            'nightDiffHolidayOT' => number_format($nightDiffHolidayOT, 2, '.', ''),
            'nightDiffHolidaySpecialOT' => number_format($nightDiffHolidaySpecialOT, 2, '.', ''),
            'nightDiffHolidayRDOT' => number_format($nightDiffHolidayRDOT, 2, '.', ''),
            'nightDiffHolidayRDSpecialOT' => number_format($nightDiffHolidayRDSpecialOT, 2, '.', ''),

            'additionalRestday' => number_format($additionalRestday, 2, '.', ''),
            'additionalHolidayRegular' => number_format($additionalHolidayRegular, 2, '.', ''),
            'additionalHolidaySpecial' => number_format($additionalHolidaySpecial, 2, '.', ''),
            'additionalHolidayRDRegular' => number_format($additionalHolidayRDRegular, 2, '.', ''),
            'additionalHolidayRDSpecial' => number_format($additionalHolidayRDSpecial, 2, '.', ''),
            'otRegular' => number_format($otRegular, 2, '.', ''),
            'otRestday' => number_format($otRestday, 2, '.', ''),
            'otHolidayRegular' => number_format($otHolidayRegular, 2, '.', ''),
            'otHolidaySpecial' => number_format($otHolidaySpecial, 2, '.', ''),
            'otHolidayRDRegular' => number_format($otHolidayRDRegular, 2, '.', ''),
            'otHolidayRDSpecial' => number_format($otHolidayRDSpecial, 2, '.', ''),
            'otOrdinaryWorking' => number_format($otOrdinaryWorking, 2, '.', ''),
            'premiumRestday' => number_format($additionalRestday, 2, '.', ''),
            'premiumHolidayRegular' => number_format($additionalHolidayRegular, 2, '.', ''),
            'premiumHolidaySpecial' => number_format($additionalHolidaySpecial, 2, '.', ''),
            'premiumHolidayRDRegular' => number_format($additionalHolidayRDRegular, 2, '.', ''),
            'premiumHolidayRDSpecial' => number_format($additionalHolidayRDSpecial, 2, '.', ''),
            'sssDeduction' => number_format($sssDeduction, 2, '.', ''),
            'phicDeduction' => number_format($phicDeduction, 2, '.', ''),
            'hdmfDeduction' => number_format($hdmfDeduction, 2, '.', ''),
            'taxDeduction' => number_format($taxDeduction, 2, '.', ''),
            'loanDeduction' => number_format($loanDeductionAmount, 2, '.', ''),
            'lateDeduction' => number_format($lateDeduction, 2, '.', ''),
            'absenceDeduction' => number_format($absenceDeduction, 2, '.', ''),
            'totalDeductions' => number_format($totalDeductions, 2, '.', ''),
            'netPay' => number_format($netPay, 2, '.', ''),
            'regularHours' => number_format($regularHours, 2, '.', ''),
            'restdayHours' => number_format($restdayHours, 2, '.', ''),
            'absentDays' => (string)$absentDays,
        ];
    }

    private function determineCategory($attendance)
    {
        if ($attendance->is_holiday && $attendance->is_restday) {
            return 'holiday_restday';
        } elseif ($attendance->is_holiday) {
            return 'holiday';
        } elseif ($attendance->is_restday) {
            return 'restday';
        } else {
            return 'regular';
        }
    }

    private function getHolidayCategory($date)
    {
        $holiday = Calendar::where('date', $date)->first();
        if (!$holiday) {
            return null;
        }
        
        $type = strtolower($holiday->type);
        
        // Determine if it's a regular or special holiday
        if (str_contains($type, 'special')) {
            return 'special';
        }
        
        return 'regular';
    }

    private function getPremiumRates()
    {
        // Get premium rates from database, fallback to standard rates
        $rates = [
            'restday' => 130, // 130%
            'regular_ot' => 125, // 125%
            'night_diff' => 10, // 10%
            'night_diff_restday' => 13, // 13%
            'holiday_regular' => 200, // 200%
            'holiday_special' => 130, // 130%
        ];

        try {
            // Try to get from database
            $premiumTypes = PremiumType::with('category')->get();
            
            foreach ($premiumTypes as $type) {
                $name = strtolower($type->name);
                
                if (str_contains($name, 'restday') && !str_contains($name, 'holiday')) {
                    $rates['restday'] = $type->regular_rate;
                } elseif (str_contains($name, 'regular') && str_contains($name, 'ot')) {
                    $rates['regular_ot'] = $type->regular_rate;
                } elseif (str_contains($name, 'ordinary') && str_contains($type->category->name, 'night')) {
                    $rates['night_diff'] = $type->regular_rate;
                } elseif (str_contains($name, 'restday') && str_contains($type->category->name, 'night')) {
                    $rates['night_diff_restday'] = $type->regular_rate;
                } elseif (str_contains($name, 'holiday regular')) {
                    $rates['holiday_regular'] = $type->regular_rate;
                } elseif (str_contains($name, 'holiday special')) {
                    $rates['holiday_special'] = $type->regular_rate;
                }
            }
        } catch (\Exception $e) {
            Log::warning('Failed to load premium rates from database, using defaults: ' . $e->getMessage());
        }

        return $rates;
    }

    private function calculateDeductions($grossPay, $applyStatutory = true, $monthlySalary = null)
    {
        $deductions = [
            'sss' => 0,
            'phic' => 0,
            'hdmf' => 0,
            'tax' => 0,
            'total' => 0,
        ];

        if (!$applyStatutory) {
            return $deductions;
        }

        try {
            // SSS: Use bracket table based on monthly salary
            if ($monthlySalary) {
                $sssBracket = \App\Models\SSSBracket::where('from', '<=', $monthlySalary)
                    ->where('to', '>=', $monthlySalary)
                    ->first();
                
                if ($sssBracket) {
                    // Divide by 2 for cutoff period
                    $deductions['sss'] = $sssBracket->ee / 2;
                }
            }
            
            // PHIC
            if ($monthlySalary) {
                $phicSetting = DeductionSetting::where('deduction_type', 'phic')->first();
                if ($phicSetting) {
                    $settings = is_array($phicSetting->settings) ? $phicSetting->settings : json_decode($phicSetting->settings, true);
                    $share = floatval($settings['employee_share'] ?? $settings['employee'] ?? 50) / 100;

                    // Try PHIC Brackets first
                    $phicBracket = \App\Models\PHICBracket::where('from', '<=', $monthlySalary)
                        ->where(function($q) use ($monthlySalary) {
                            $q->where('to', '>=', $monthlySalary)
                              ->orWhereNull('to');
                        })
                        ->orderBy('from', 'desc')
                        ->first();

                    if ($phicBracket) {
                        if ($phicBracket->fixed_amount > 0) {
                            $premium = $phicBracket->fixed_amount;
                        } else {
                            $premium = $monthlySalary * ($phicBracket->percentage / 100);
                        }
                    } else {
                        // Fallback
                        $rate = floatval($settings['rate'] ?? 5) / 100;
                        $min = floatval($settings['min_salary'] ?? 10000);
                        $max = floatval($settings['max_salary'] ?? 100000);
                        $basis = max($min, min($max, $monthlySalary));
                        $premium = $basis * $rate;
                    }
                    
                    $deductions['phic'] = $premium / 2;
                } else {
                    // Fallback if no settings found
                    $deductions['phic'] = ($monthlySalary * 0.05) / 2;
                }
            }
            
            // HDMF: Get from deduction settings
            try {
                $hdmfSetting = DeductionSetting::where('deduction_type', 'hdmf')->first();
                if ($hdmfSetting) {
                    $settings = is_array($hdmfSetting->settings) 
                        ? $hdmfSetting->settings 
                        : json_decode($hdmfSetting->settings, true);
                    $deductions['hdmf'] = floatval($settings['employee'] ?? 200);
                } else {
                    $deductions['hdmf'] = 200;
                }
            } catch (\Exception $e) {
                $deductions['hdmf'] = 200;
            }
            
            // Tax: Based on annual income bracket
            if ($monthlySalary) {
                $annualSalary = $monthlySalary * 12;
                $taxBracket = \App\Models\TaxBracket::where('from', '<=', $annualSalary)
                    ->where('to', '>=', $annualSalary)
                    ->first();
                
                if ($taxBracket) {
                    // Calculate annual tax, then divide by 12 for monthly, then by 2 for cutoff
                    $annualTax = ($annualSalary - $taxBracket->from) * ($taxBracket->percentage / 100) + $taxBracket->fixed_amount;
                    $deductions['tax'] = $annualTax / 12 / 2;
                }
            }
            
        } catch (\Exception $e) {
            Log::warning('Failed to calculate deductions: ' . $e->getMessage());
            // Fallback to simple calculation
            $deductions['sss'] = $grossPay * 0.045;
            $deductions['phic'] = $grossPay * 0.025;
            $deductions['hdmf'] = 200;
            $deductions['tax'] = 0;
        }

        $deductions['total'] = $deductions['sss'] + $deductions['phic'] + $deductions['hdmf'] + $deductions['tax'];

        return $deductions;
    }

    private function getEmployeeLoanDeduction($employeeId, $payroll)
    {
        try {
            // Get active employee deductions for this cutoff period
            $cutoffPeriod = $payroll->payroll_period === '1st Half' ? '1st_half' : '2nd_half';
            
            $loans = EmployeeDeduction::where('employee_id', $employeeId)
                ->where('is_active', true)
                ->where('is_archived', false)
                ->where('cut_off', $cutoffPeriod)
                ->where('remaining_balance', '>', 0)
                ->get();
            
            $totalLoanDeduction = 0;
            
            foreach ($loans as $loan) {
                // Calculate per-cutoff payment
                $perCutoffPayment = $loan->amount / $loan->term;
                
                // Don't exceed remaining balance
                $payment = min($perCutoffPayment, $loan->remaining_balance);
                
                $totalLoanDeduction += $payment;
                
                // Update loan (will be done during payroll generation)
                // For now, just calculate the amount
            }
            
            return $totalLoanDeduction;
            
        } catch (\Exception $e) {
            Log::warning('Failed to calculate employee loan deduction: ' . $e->getMessage());
            return 0;
        }
    }

    private function processLeaves($payroll, $schedule, $cutoffRange)
    {
        $employees = Employee::whereNull('deleted_at')->get();

        foreach ($employees as $employee) {
            $leaves = EmployeeLeaveHistory::where('employee_id', $employee->id)
                ->where('is_archived', false)
                ->where(function ($q) use ($cutoffRange) {
                    $q->whereBetween('date_from', [$cutoffRange['start'], $cutoffRange['end']])
                      ->orWhereBetween('date_to', [$cutoffRange['start'], $cutoffRange['end']])
                      ->orWhere(function ($sq) use ($cutoffRange) {
                          $sq->where('date_from', '<=', $cutoffRange['start'])
                             ->where('date_to', '>=', $cutoffRange['end']);
                      });
                })
                ->get();

            foreach ($leaves as $leave) {
                $startDate = Carbon::parse($leave->date_from);
                $endDate = Carbon::parse($leave->date_to);
                
                $start = $startDate->max(Carbon::parse($cutoffRange['start']));
                $end = $endDate->min(Carbon::parse($cutoffRange['end']));

                for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
                    $dateStr = $date->format('Y-m-d');

                    $empSchedule = EmployeeSchedule::where('employee_id', $employee->id)
                        ->where('is_archived', false)
                        ->where('date', $dateStr)
                        ->first();
                    
                    $isRestday = false;
                    if ($empSchedule) {
                        $isRestday = strtolower($empSchedule->type) === 'rest';
                    }

                    $holiday = Calendar::where('date', $dateStr)->first();
                    $isHoliday = $holiday ? true : false;

                    if ($isRestday || $isHoliday) {
                        continue;
                    }

                    $attendance = Attendance::where('payroll_id', $payroll->id)
                        ->where('employee_id', $employee->id)
                        ->where('date', $dateStr)
                        ->first();

                    if ($attendance) {
                        if ($attendance->hours_worked == 0) {
                            $attendance->update([
                                'hours_worked' => $leave->duration === 'Half Day' ? 4 : 8,
                                'remarks' => 'Paid Leave: ' . $leave->leave_type,
                            ]);
                        }
                    } else {
                        Attendance::create([
                            'payroll_id' => $payroll->id,
                            'employee_id' => $employee->id,
                            'date' => $dateStr,
                            'hours_worked' => $leave->duration === 'Half Day' ? 4 : 8,
                            'remarks' => 'Paid Leave: ' . $leave->leave_type,
                            'late_minutes' => 0,
                            'overtime_hours' => 0,
                            'night_diff_hours' => 0,
                            'is_holiday' => false,
                            'is_restday' => false,
                        ]);
                    }
                }
            }
        }
    }

    public function archive(Payroll $payroll)
    {
        $payroll->archive();

        return redirect()->back()->with('success', 'Payroll archived successfully.');
    }

    public function restore(Payroll $payroll)
    {
        $payroll->restore();

        return redirect()->back()->with('success', 'Payroll restored successfully.');
    }

    /**
     * Determine payroll period based on dates in Excel file
     * Returns '1st Half' if dates are 1-15, '2nd Half' if dates are 16-end of month
     */
    private function determinePayrollPeriodFromExcel($file, $month, $year)
    {
        try {
            $spreadsheet = IOFactory::load($file->getRealPath());
            $sheet = $spreadsheet->getActiveSheet();
            $rows = $sheet->toArray(null, true, true, true);

            $dates = [];
            foreach ($rows as $index => $row) {
                if ($index === 1) continue; // Skip header
                
                $dateValue = trim($row['C'] ?? '');
                if (!$dateValue) continue;

                $date = $this->parseDate($dateValue);
                if ($date) {
                    $dates[] = $date->day;
                }
            }

            if (empty($dates)) {
                return '2nd Half'; // Default fallback
            }

            // Determine period based on dates
            $minDay = min($dates);
            $maxDay = max($dates);

            // If all dates are 1-15, it's 1st Half
            if ($maxDay <= 15) {
                return '1st Half';
            }
            // If all dates are 16+, it's 2nd Half
            elseif ($minDay >= 16) {
                return '2nd Half';
            }
            // If mixed, determine by majority
            else {
                $firstHalfCount = count(array_filter($dates, fn($d) => $d <= 15));
                $secondHalfCount = count(array_filter($dates, fn($d) => $d >= 16));
                return $firstHalfCount > $secondHalfCount ? '1st Half' : '2nd Half';
            }
        } catch (\Exception $e) {
            Log::warning('Failed to determine payroll period from Excel: ' . $e->getMessage());
            return '2nd Half'; // Default fallback
        }
    }
}
