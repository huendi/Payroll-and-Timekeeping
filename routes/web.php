<?php

use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CustomDeductionTypeController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\DeductionSettingController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\EmployeeDeductionController;
use App\Http\Controllers\EmployeeLeaveCreditController;
use App\Http\Controllers\EmployeeLeaveHistoryController;
use App\Http\Controllers\EmployeeScheduleController;
use App\Http\Controllers\HRController;
use App\Http\Controllers\LeaveTypeController;
use App\Http\Controllers\PayrollController;
use App\Http\Controllers\PremiumCategoryController;
use App\Http\Controllers\PremiumTypeController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ScheduleController;
use App\Http\Controllers\PayslipController;
use App\Http\Controllers\SSSController;
use App\Http\Controllers\TaxController;
use App\Http\Controllers\ThirteenthMonthPayController;
use App\Models\Payroll;
use App\Models\Payslip;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
//    redirect to login or dashboard if authenticated
    
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }
    
    return redirect()->route('login');
})->name('home');

// CSRF token endpoint for AJAX requests
Route::get('/api/csrf-token', function () {
    return response()->json(['token' => csrf_token()]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function (Request $request) {
        // Get year filter (only year filter now)
        $year = $request->input('year') ?: date('Y');
        
        // Get all employees for total count
        $totalEmployees = \App\Models\Employee::count();
        
        // Get gender breakdown
        $employeesByGender = \App\Models\Employee::selectRaw('gender, COUNT(*) as count')
            ->groupBy('gender')
            ->get()
            ->map(fn($item) => [
                'name' => $item->gender ?: 'Unspecified',
                'count' => $item->count,
            ])
            ->values();

        // Get employee breakdown by department and gender
        $employeesByDepartmentAndGender = \App\Models\Employee::selectRaw('department, gender, COUNT(*) as count')
            ->groupBy('department', 'gender')
            ->orderBy('department')
            ->get()
            ->groupBy(function($item) {
                return $item->department ?: 'Unassigned';
            })
            ->map(function($group) {
                return $group->map(fn($item) => [
                    'gender' => $item->gender ?: 'Unspecified',
                    'count' => $item->count,
                ])->keyBy('gender');
            });

        // Get on-time and late data by month for the selected year
        $attendanceByMonth = \App\Models\Attendance::whereYear('date', $year)
            ->selectRaw('MONTH(date) as month, COUNT(*) as total, SUM(CASE WHEN late_minutes > 0 THEN 1 ELSE 0 END) as late_count')
            ->groupByRaw('MONTH(date)')
            ->orderBy('month')
            ->get();

        // Format attendance data for charts
        $monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $onTimePercentageByMonth = [];
        $lateReportByMonth = [];

        foreach ($attendanceByMonth as $attendance) {
            $monthIndex = $attendance->month - 1;
            $monthName = $monthNames[$monthIndex] ?? 'Unknown';
            $total = $attendance->total ?? 1;
            $lateCount = $attendance->late_count ?? 0;
            $onTimeCount = $total - $lateCount;
            $onTimePercentage = round(($onTimeCount / $total) * 100);

            $onTimePercentageByMonth[] = [
                'month' => $monthName,
                'percentage' => $onTimePercentage,
                'count' => $onTimeCount,
            ];

            $lateReportByMonth[] = [
                'month' => $monthName,
                'lateCount' => $lateCount,
            ];
        }

        // Get payslip data by month (money released)
        $allPayslips = Payslip::where('year', $year)
            ->where('is_archived', false)
            ->get();

        // Group payslips by month and sum net_pay and total_deductions
        $payslipsByMonthMap = [];
        foreach ($allPayslips as $payslip) {
            // Convert month name to number
            $monthNum = match($payslip->month) {
                'January' => 1, 'February' => 2, 'March' => 3, 'April' => 4,
                'May' => 5, 'June' => 6, 'July' => 7, 'August' => 8,
                'September' => 9, 'October' => 10, 'November' => 11, 'December' => 12,
                default => 0
            };
            
            if (!isset($payslipsByMonthMap[$monthNum])) {
                $payslipsByMonthMap[$monthNum] = [
                    'netPay' => 0,
                    'totalDeductions' => 0,
                    'count' => 0,
                ];
            }
            $payslipsByMonthMap[$monthNum]['netPay'] += (float) $payslip->net_pay;
            $payslipsByMonthMap[$monthNum]['totalDeductions'] += (float) $payslip->total_deductions;
            $payslipsByMonthMap[$monthNum]['count'] += 1;
        }

        $payslipReportByMonth = [];
        foreach ($payslipsByMonthMap as $monthNum => $data) {
            $monthName = $monthNames[$monthNum - 1] ?? 'Unknown';
            $payslipReportByMonth[] = [
                'month' => $monthName,
                'totalReleased' => $data['netPay'],
                'totalDeductions' => $data['totalDeductions'],
                'count' => $data['count'],
            ];
        }
        
        // Sort by month number
        usort($payslipReportByMonth, function($a, $b) {
            $monthOrder = ['Jan' => 1, 'Feb' => 2, 'Mar' => 3, 'Apr' => 4, 'May' => 5, 'Jun' => 6,
                          'Jul' => 7, 'Aug' => 8, 'Sep' => 9, 'Oct' => 10, 'Nov' => 11, 'Dec' => 12];
            return ($monthOrder[$a['month']] ?? 0) - ($monthOrder[$b['month']] ?? 0);
        });

        // Get best employee (lowest late minutes for the year)
        $bestEmployee = \App\Models\Attendance::whereYear('date', $year)
            ->selectRaw('employee_id, SUM(late_minutes) as total_late_minutes')
            ->groupBy('employee_id')
            ->orderBy('total_late_minutes', 'asc')
            ->with('employee')
            ->first();

        $bestEmployeeData = null;
        if ($bestEmployee && $bestEmployee->employee) {
            $bestEmployeeData = [
                'name' => $bestEmployee->employee->first_name . ' ' . $bestEmployee->employee->last_name,
                'employee_id' => $bestEmployee->employee->employee_id,
                'lateMinutes' => (int) $bestEmployee->total_late_minutes,
            ];
        }

        // Count total payslips generated for the year
        $totalPayslipsCount = Payslip::where('year', $year)
            ->where('is_archived', false)
            ->count();

        // Get year options
        $yearOptions = Payslip::distinct('year')
            ->where('is_archived', false)
            ->pluck('year')
            ->sort()
            ->reverse()
            ->values();

        return Inertia::render('dashboard', [
            'totalEmployees' => $totalEmployees,
            'employeesByGender' => $employeesByGender,
            'employeesByDepartmentAndGender' => $employeesByDepartmentAndGender,
            'onTimePercentageByMonth' => $onTimePercentageByMonth,
            'lateReportByMonth' => $lateReportByMonth,
            'payslipReportByMonth' => $payslipReportByMonth,
            'selectedYear' => (int) $year,
            'yearOptions' => $yearOptions,
            'bestEmployee' => $bestEmployeeData,
            'totalPayslipsCount' => $totalPayslipsCount,
        ]);
    })->name('dashboard');

    // ============================================
    // ADMIN-ONLY ROUTES
    // ============================================
    Route::middleware(['role:admin'])->group(function () {
        // Staff Management (Full CRUD)
        Route::resource('staff', \App\Http\Controllers\StaffController::class);
        
        // Payroll Approval
        Route::post('payroll/{id}/approve', [PayrollController::class, 'approve'])->name('payroll.approve');
        Route::post('payroll/{id}/reject', [PayrollController::class, 'reject'])->name('payroll.reject');
        
        // Payslip Generation (Admin Only? Or Finance too? Stuck to Admin for now per old logic)
        Route::post('payroll/{id}/generate-payslips', [PayrollController::class, 'generatePayslips'])->name('payroll.generatePayslips');
        
        // Payslip Updates (Incentives/Adjustments)
        Route::put('payslips/{payslip}', [PayslipController::class, 'update'])->name('payslips.update');
    });

    // ============================================
    // FINANCE-ONLY ROUTES (Payroll & Payslip Management)
    // ============================================
    Route::middleware(['role:finance'])->group(function () {
        // Payroll CRUD (except approve/reject/generate-payslips)
        Route::get('payroll/create', [PayrollController::class, 'create'])->name('payroll.create');
        Route::post('payroll', [PayrollController::class, 'store'])->name('payroll.store');
        Route::post('payroll/{id}/generate', [PayrollController::class, 'generate'])->name('payroll.generate');
        Route::delete('payroll/{id}', [PayrollController::class, 'destroy'])->name('payroll.destroy');
        Route::delete('payroll/{id}/remove-dtr', [PayrollController::class, 'removeDTR'])->name('payroll.removeDTR');
        Route::post('payroll/{payroll}/archive', [PayrollController::class, 'archive'])->name('payroll.archive');
        Route::post('payroll/{payroll}/restore', [PayrollController::class, 'restore'])->name('payroll.restore');

        // Payslips Write
        Route::post('payslips/{payslip}/archive', [PayslipController::class, 'archive'])->name('payslips.archive');
        Route::post('payslips/{payslip}/restore', [PayslipController::class, 'restore'])->name('payslips.restore');
        Route::delete('payslips/{payslip}', [PayslipController::class, 'destroy'])->name('payslips.destroy');
        
        // 13th Month Pay Write
        Route::get('thirteenth-month-pay/generate', [ThirteenthMonthPayController::class, 'generatePage'])->name('thirteenth-month-pay.generatePage');
        Route::post('thirteenth-month-pay/generate', [ThirteenthMonthPayController::class, 'generate'])->name('thirteenth-month-pay.generate');
        Route::post('thirteenth-month-pay/{thirteenthMonthPay}/archive', [ThirteenthMonthPayController::class, 'archive'])->name('thirteenth-month-pay.archive');
        Route::delete('thirteenth-month-pay/{thirteenthMonthPay}', [ThirteenthMonthPayController::class, 'destroy'])->name('thirteenth-month-pay.destroy');
    });

    // ============================================
    // HR-ONLY ROUTES (Employee Management)
    // ============================================
    Route::middleware(['role:hr'])->group(function () {
        // Employee CRUD
        Route::get('employees/create', [EmployeeController::class, 'create'])->name('employees.create');
        Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
        Route::get('employees/{employee}/edit', [EmployeeController::class, 'edit'])->name('employees.edit');
        Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])->name('employees.destroy');
        Route::post('employees/{id}/restore', [EmployeeController::class, 'restore'])->name('employees.restore');
        Route::delete('employees/{id}/force-delete', [EmployeeController::class, 'forceDelete'])->name('employees.force-delete');
        
        // Employee Sub-Resources
        Route::post('employees/{employee}/leave-credits', [EmployeeLeaveCreditController::class, 'store'])->name('employees.leave-credits.store');
        Route::put('employees/{employee}/leave-credits/{leaveCredit}', [EmployeeLeaveCreditController::class, 'update'])->name('employees.leave-credits.update');
        Route::delete('employees/{employee}/leave-credits/{leaveCredit}', [EmployeeLeaveCreditController::class, 'destroy'])->name('employees.leave-credits.destroy');
        Route::post('employees/{employee}/leave-credits/{leaveCredit}/archive', [EmployeeLeaveCreditController::class, 'archive'])->name('employees.leave-credits.archive');
        Route::post('employees/{employee}/leave-credits/{leaveCredit}/restore', [EmployeeLeaveCreditController::class, 'restore'])->name('employees.leave-credits.restore');
        
        Route::post('employees/{employee}/leave-history', [EmployeeLeaveHistoryController::class, 'store'])->name('employees.leave-history.store');
        Route::delete('employees/{employee}/leave-history/{leaveHistory}', [EmployeeLeaveHistoryController::class, 'destroy'])->name('employees.leave-history.destroy');
        Route::post('employees/{employee}/leave-history/{leaveHistory}/archive', [EmployeeLeaveHistoryController::class, 'archive'])->name('employees.leave-history.archive');
        Route::post('employees/{employee}/leave-history/{leaveHistory}/restore', [EmployeeLeaveHistoryController::class, 'restore'])->name('employees.leave-history.restore');
        
        Route::post('employees/{employee}/deductions', [EmployeeDeductionController::class, 'store'])->name('employees.deductions.store');
        Route::put('employees/{employee}/deductions/{deduction}', [EmployeeDeductionController::class, 'update'])->name('employees.deductions.update');
        Route::delete('employees/{employee}/deductions/{deduction}', [EmployeeDeductionController::class, 'destroy'])->name('employees.deductions.destroy');
        Route::post('employees/{employee}/deductions/{deduction}/archive', [EmployeeDeductionController::class, 'archive'])->name('employees.deductions.archive');
        Route::post('employees/{employee}/deductions/{deduction}/restore', [EmployeeDeductionController::class, 'restore'])->name('employees.deductions.restore');

        Route::post('/employees/{employee}/schedule', [EmployeeScheduleController::class, 'store'])->name('employees.schedule.store');
        Route::delete('/employees/{employee}/schedule/{scheduleFileId}', [EmployeeScheduleController::class, 'destroy'])->name('employees.schedule.destroy');
        Route::post('/employees/{employee}/schedule/{scheduleFileId}/archive', [EmployeeScheduleController::class, 'archive'])->name('employees.schedule.archive');
        Route::post('/employees/{employee}/schedule/{scheduleFileId}/restore', [EmployeeScheduleController::class, 'restore'])->name('employees.schedule.restore');
    });

    // ============================================
    // SHARED WRITE ROUTES (HR & FINANCE) - Settings
    // ============================================
    Route::middleware(['role:hr|finance'])->group(function () {
        Route::post('departments', [DepartmentController::class, 'store'])->name('departments.store');
        Route::post('leave-types', [LeaveTypeController::class, 'store'])->name('leave-types.store');
        
        Route::post('premium-categories', [PremiumCategoryController::class, 'store'])->name('premium-categories.store');
        Route::put('premium-categories/{category}', [PremiumCategoryController::class, 'update'])->name('premium-categories.update');
        Route::delete('premium-categories/{category}', [PremiumCategoryController::class, 'destroy'])->name('premium-categories.destroy');
        
        Route::post('premium-categories/{category}/types', [PremiumTypeController::class, 'store'])->name('premium-types.store');
        Route::put('premium-categories/{category}/types/{type}', [PremiumTypeController::class, 'update'])->name('premium-types.update');
        Route::delete('premium-categories/{category}/types/{type}', [PremiumTypeController::class, 'destroy'])->name('premium-types.destroy');
        
        Route::put('deduction-settings/{setting}', [DeductionSettingController::class, 'update'])->name('deduction-settings.update');
        
        Route::post('sss-brackets', [SSSController::class, 'store'])->name('sss.store');
        Route::put('sss-brackets', [SSSController::class, 'update'])->name('sss.update');
        Route::delete('sss-brackets/{id}', [SSSController::class, 'destroy'])->name('sss.destroy');
        
        Route::post('tax-brackets', [TaxController::class, 'store'])->name('tax.store');
        Route::put('tax-brackets', [TaxController::class, 'update'])->name('tax.update');
        Route::delete('tax-brackets/{id}', [TaxController::class, 'destroy'])->name('tax.destroy');
        
        Route::put('phic-brackets', [DeductionSettingController::class, 'updatePHICBrackets'])->name('phic.update');
        
        Route::post('calendar', [CalendarController::class, 'store'])->name('calendar.store');
        Route::post('calendar/reset', [CalendarController::class, 'reset'])->name('calendar.reset');
        
        Route::post('schedule', [ScheduleController::class, 'store'])->name('schedule.store');
        Route::put('schedule/{schedule}', [ScheduleController::class, 'update'])->name('schedule.update');
        Route::delete('schedule/{schedule}', [ScheduleController::class, 'destroy'])->name('schedule.destroy');

        Route::post('custom-deduction-types', [CustomDeductionTypeController::class, 'store'])->name('custom-deduction-types.store');
    });

    // ============================================
    // SHARED VIEW ROUTES - RESTRICTED (Admin & Finance)
    // ============================================
    Route::middleware(['role:admin|finance'])->group(function () {
         // Payroll View
        Route::get('payroll', [PayrollController::class, 'index'])->name('payroll.index');
        Route::get('payroll/archive', [PayrollController::class, 'archivedList'])->name('payroll.archived');
        Route::get('payroll/download-sample', [PayrollController::class, 'downloadSample'])->name('payroll.downloadSample');
        Route::get('payroll/{id}', [PayrollController::class, 'show'])->name('payroll.show');
        Route::get('payroll/{id}/draft', [PayrollController::class, 'showDraft'])->name('payroll.showDraft');

        // Payslips View
        Route::get('payslips', [PayslipController::class, 'index'])->name('payslips.index');
        Route::get('payslips/archive', [PayslipController::class, 'archiveList'])->name('payslips.archiveList');
        Route::get('payslips/group/{period}/{month}/{year}', [PayslipController::class, 'showGroup'])->name('payslips.group');
        Route::get('payslips/{payslip}', [PayslipController::class, 'show'])->name('payslips.show');
        Route::get('payslips/download/{period}/{month}/{year}', [PayslipController::class, 'downloadGroup'])->name('payslips.download');
        
        // 13th Month Pay View
        Route::get('thirteenth-month-pay', [ThirteenthMonthPayController::class, 'index'])->name('thirteenth-month-pay.index');
        Route::get('thirteenth-month-pay/archive', [ThirteenthMonthPayController::class, 'archiveList'])->name('thirteenth-month-pay.archiveList');
        Route::get('thirteenth-month-pay/{thirteenthMonthPay}', [ThirteenthMonthPayController::class, 'show'])->name('thirteenth-month-pay.show');

        // Reports
        Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
        Route::match(['get', 'post'], 'reports/export', [ReportController::class, 'export'])->name('reports.export');
    });

    // ============================================
    // SHARED ROUTES (Admin, HR, Finance)
    // ============================================
    
    // Employees - View Only
    Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
    Route::get('employees/archive', [EmployeeController::class, 'archiveList'])->name('employees.archive');
    Route::get('employees/{employee}', [EmployeeController::class, 'show'])->name('employees.show');
    Route::get('employees/{employee}/attendances', [EmployeeController::class, 'getAttendances'])->name('employees.attendances');
    Route::get('employees/{employee}/attendance/{payrollId}', [EmployeeController::class, 'showAttendance'])->name('employees.attendance.show');
    Route::get('employees/{employee}/deductions/{deduction}/payments', [EmployeeDeductionController::class, 'payments'])->name('employees.deductions.payments');
    Route::get('/employees/{employee}/schedule', [EmployeeScheduleController::class, 'index'])->name('employees.schedule.index');
    Route::get('/employees/{employee}/schedule/{scheduleFileId}/details', [EmployeeScheduleController::class, 'details'])->name('employees.schedule.details');
    Route::get('/employees/{employee}/schedule/{scheduleFileId}/show', [EmployeeScheduleController::class, 'show'])->name('employees.schedule.show');
    Route::get('/employees/{employee}/schedule/{scheduleFileId}/download', [EmployeeScheduleController::class, 'download'])->name('employees.schedule.download');
    
    // Custom Deduction Types - View Only
    Route::get('custom-deduction-types', [CustomDeductionTypeController::class, 'index'])->name('custom-deduction-types.index');
    
    // Settings - View Only
    Route::get('departments', [DepartmentController::class, 'index'])->name('departments.index');
    Route::get('leave-types', [LeaveTypeController::class, 'index'])->name('leave-types.index');
    Route::get('premium-setup', [PremiumCategoryController::class, 'index'])->name('premium-setup.index');
    Route::get('deduction-settings', [DeductionSettingController::class, 'index'])->name('deduction-settings.index');
    Route::get('sss-brackets', [SSSController::class, 'index'])->name('sss.index');
    Route::get('tax-brackets', [TaxController::class, 'index'])->name('tax.index');
    Route::get('calendar', [CalendarController::class, 'index'])->name('calendar.index');
    Route::get('schedule', [ScheduleController::class, 'index'])->name('schedule.index');
    
    // Payslips API
    Route::get('api/payslips/{payslip}', [PayslipController::class, 'getPayslipHTML'])->name('api.payslips.html');
});

require __DIR__.'/settings.php';