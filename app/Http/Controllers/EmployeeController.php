<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\Payroll;
use App\Models\Schedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    /**
     * Display a listing of employees.
     */
    public function index(Request $request): Response
    {
        $query = Employee::query();

        // Filter by archived status
        $archived = $request->input('archived', 'active');
        if ($archived === 'archived') {
            $query->onlyTrashed();
        } elseif ($archived === 'all') {
            $query->withTrashed();
        }

        // Search functionality
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT_WS(' ', first_name, middle_name, last_name) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("CONCAT_WS(' ', first_name, last_name) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("CONCAT_WS(' ', last_name, first_name, middle_name) LIKE ?", ["%{$search}%"])
                    ->orWhere('employee_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhere('status', 'like', "%{$search}%");
            });
        }

        // Filter by department
        if ($request->has('department') && $request->input('department') !== 'all') {
            $query->where('department', $request->input('department'));
        }

        // Sort - default to alphabetical by last_name, then first_name
        $sortBy = $request->input('sort_by', 'last_name');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);
        if ($sortBy === 'last_name') {
            $query->orderBy('first_name', 'asc');
        }

        // Pagination per page
        $perPage = $request->input('per_page', 10);
        $perPage = in_array($perPage, [5, 10, 15, 30]) ? $perPage : 10;

        $employees = $query->paginate($perPage)->withQueryString();

        $departments = \App\Models\Department::select('name')->orderBy('name')->get();

        return Inertia::render('employees/index', [
            'employees' => $employees,
            'departments' => $departments,
            'filters' => $request->only(['search', 'department', 'archived', 'sort_by', 'sort_order', 'per_page']),
        ]);
    }

    /**
     * Show the form for creating a new employee.
     */
    public function create(): Response
    {
        return Inertia::render('employees/create');
    }

    /**
     * Store a newly created employee in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'department' => ['nullable', 'string', 'max:255'],
            'employee_number' => ['required', 'string', 'max:255', 'unique:employees'],
            'position' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'zip_code' => ['nullable', 'string', 'max:20'],
            'contact' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'birthplace' => ['nullable', 'string', 'max:255'],
            'birthdate' => ['nullable', 'date', 'before:-18 years'],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'gender' => ['nullable', 'string', 'max:50'],
            'civil_status' => ['nullable', 'string', 'max:50'],
            'religion' => ['nullable', 'string', 'max:100'],
            'nationality' => ['nullable', 'string', 'max:100'],
            'sss' => ['nullable', 'string', 'max:50'],
            'philhealth' => ['nullable', 'string', 'max:50'],
            'pagibig' => ['nullable', 'string', 'max:50'],
            'tin' => ['nullable', 'string', 'max:50'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_account' => ['nullable', 'string', 'max:255'],
            'basic_rate' => ['nullable', 'numeric', 'min:0'],
            'rate_type' => ['nullable', 'in:monthly,daily'],
            'allowance' => ['nullable', 'numeric', 'min:0'],
            'photo' => ['nullable', 'image', 'max:2048'],
            'start_date' => ['nullable', 'date'],
            'status' => ['required', 'string', 'in:regular,contractual,probationary'],
        ]);

        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('employee_images'), $filename);
            $validated['photo'] = 'employee_images/' . $filename;
        }

        Employee::create($validated);

        return redirect()->route('employees.index')
            ->with('success', 'Employee created successfully.');
    }

    /**
     * Display the specified employee.
     */
    public function show(Request $request, Employee $employee): Response
    {
        $employee->load(['leaveCredits', 'leaveHistory', 'deductions', 'schedules']);
        
        $perPageActive = $request->get('per_page_active', 10);
        $pageActive = $request->get('page_active', 1);
        $perPageArchived = $request->get('per_page_archived', 10);
        $pageArchived = $request->get('page_archived', 1);
        
        // Get active schedules with pagination
        $activeSchedulesQuery = $employee->schedules()
            ->where('is_archived', false)
            ->orderBy('created_at', 'desc');
        
        $activeSchedulesData = $activeSchedulesQuery->get()
            ->groupBy('schedule_file_id')
            ->map(function ($group) {
                $first = $group->first();
                
                // Find first working day to determine shift times
                $workDay = $group->first(function ($item) {
                    return strtolower($item->type) === 'work';
                });
                $timeIn = null;
                $timeOut = null;

                if ($workDay && $workDay->time_in) {
                    $timeIn = $workDay->time_in->format('h:i A');
                    $timeOut = $workDay->time_out ? $workDay->time_out->format('h:i A') : null;
                }

                return [
                    'id' => $first->id,
                    'schedule_file_id' => $first->schedule_file_id,
                    'date_created' => $first->created_at->format('F d, Y'),
                    'weeks' => $first->weeks,
                    'count' => $group->count(),
                    'time_in' => $timeIn,
                    'time_out' => $timeOut,
                ];
            })
            ->values();
        
        // Paginate active schedules
        $schedules = new \Illuminate\Pagination\LengthAwarePaginator(
            $activeSchedulesData->forPage($pageActive, $perPageActive)->values(),
            $activeSchedulesData->count(),
            $perPageActive,
            $pageActive,
            [
                'path' => $request->url(),
                'query' => $request->query(),
                'pageName' => 'page_active',
            ]
        );
        // Get archived schedules with pagination
        $archivedSchedulesQuery = $employee->schedules()
            ->where('is_archived', true)
            ->orderBy('archived_at', 'desc');
        
        $archivedSchedulesData = $archivedSchedulesQuery->get()
            ->groupBy('schedule_file_id')
            ->map(function ($group) {
                $first = $group->first();
                
                // Find first working day to determine shift times
                $workDay = $group->first(function ($item) {
                    return strtolower($item->type) === 'work';
                });
                $timeIn = null;
                $timeOut = null;

                if ($workDay && $workDay->time_in) {
                    $timeIn = $workDay->time_in->format('h:i A');
                    $timeOut = $workDay->time_out ? $workDay->time_out->format('h:i A') : null;
                }

                return [
                    'id' => $first->id,
                    'schedule_file_id' => $first->schedule_file_id,
                    'date_created' => $first->created_at->format('F d, Y'),
                    'weeks' => $first->weeks,
                    'count' => $group->count(),
                    'time_in' => $timeIn,
                    'time_out' => $timeOut,
                ];
            })
            ->values();
        
        // Paginate archived schedules
        $archivedSchedules = new \Illuminate\Pagination\LengthAwarePaginator(
            $archivedSchedulesData->forPage($pageArchived, $perPageArchived)->values(),
            $archivedSchedulesData->count(),
            $perPageArchived,
            $pageArchived,
            [
                'path' => $request->url(),
                'query' => $request->query(),
                'pageName' => 'page_archived',
            ]
        );
        
        // Load attendance records with payroll info
        $attendanceQuery = $employee->attendances()
            ->with('payroll:id,payroll_period,month,year')
            ->orderBy('date', 'desc');

        if ($request->has('attendance_date') && $request->attendance_date) {
            $attendanceQuery->whereDate('date', $request->attendance_date);
        }
        
        $attendances = $attendanceQuery->paginate(10, ['*'], 'attendance_page')->withQueryString();

        // Fetch distinct payrolls for attendance grouping with pagination
        $perPageAttendancePayroll = $request->get('per_page_attendance', 10);
        $pageAttendancePayroll = $request->get('page_attendance', 1);
        
        $attendancePayrollsQuery = Payroll::whereHas('attendances', function($q) use ($employee) {
            $q->where('employee_id', $employee->id);
        })
        ->orderBy('year', 'desc')
        ->orderBy('id', 'desc');
        
        $attendancePayrollsData = $attendancePayrollsQuery->get()
        ->map(function ($payroll) use ($employee) {
            return [
                'id' => $payroll->id,
                'payroll_period' => $payroll->payroll_period,
                'month' => $payroll->month,
                'year' => $payroll->year,
                'count' => $payroll->attendances()->where('employee_id', $employee->id)->count(),
            ];
        });
        
        $total = $attendancePayrollsData->count();
        $attendancePayrolls = new \Illuminate\Pagination\LengthAwarePaginator(
            $attendancePayrollsData->forPage($pageAttendancePayroll, $perPageAttendancePayroll)->values(),
            $total,
            $perPageAttendancePayroll,
            $pageAttendancePayroll,
            [
                'path' => $request->url(),
                'query' => $request->query(),
                'pageName' => 'page_attendance',
            ]
        );

        // Payslips pagination
        $pagePayslips = $request->input('page_payslips', 1);
        $perPagePayslips = $request->input('per_page_payslips', 10);
        
        $payslipsQuery = $employee->payslips()->orderBy('generated_at', 'desc');
        $payslips = $payslipsQuery->paginate($perPagePayslips, ['*'], 'page_payslips', $pagePayslips);

        // Navigation (Alphabetical by last_name, first_name)
        $prevEmployee = Employee::where(function($q) use ($employee) {
                $q->where('last_name', '<', $employee->last_name)
                  ->orWhere(function($q2) use ($employee) {
                      $q2->where('last_name', '=', $employee->last_name)
                        ->where('first_name', '<', $employee->first_name);
                  });
            })
            ->orderBy('last_name', 'desc')
            ->orderBy('first_name', 'desc')
            ->select('id', 'first_name', 'last_name')
            ->first();

        $nextEmployee = Employee::where(function($q) use ($employee) {
                $q->where('last_name', '>', $employee->last_name)
                  ->orWhere(function($q2) use ($employee) {
                      $q2->where('last_name', '=', $employee->last_name)
                        ->where('first_name', '>', $employee->first_name);
                  });
            })
            ->orderBy('last_name', 'asc')
            ->orderBy('first_name', 'asc')
            ->select('id', 'first_name', 'last_name')
            ->first();
        
        // Get the current schedule for cutoff label formatting
        $currentYear = now()->year;
        $schedule = Schedule::where('year', $currentYear)->first() ?? Schedule::latest()->first();

        return Inertia::render('employees/show', [
            'employee' => $employee,
            'prevEmployee' => $prevEmployee,
            'nextEmployee' => $nextEmployee,
            'leaveCredits' => $employee->leaveCredits,
            'leaveHistory' => $employee->leaveHistory()->orderBy('date_from', 'desc')->get(),
            'deductions' => $employee->deductions()->orderBy('created_at', 'desc')->get(),
            'schedules' => $schedules,
            'archivedSchedules' => $archivedSchedules,
            'payslips' => $payslips,
            'attendances' => $attendances,
            'attendancePayrolls' => $attendancePayrolls->toArray(),
            'schedule' => $schedule ? [
                'first_half_end' => (int)$schedule->first_half_end,
                'second_half_start' => (int)$schedule->first_half_end + 1,
            ] : null,
            'filters' => $request->only(['attendance_date']),
        ]);
    }

    public function getAttendances(Request $request, Employee $employee)
    {
        $query = $employee->attendances()
            ->with('payroll:id,payroll_period,month,year')
            ->orderBy('date', 'asc');

        if ($request->has('payroll_id')) {
            $query->where('payroll_id', $request->payroll_id);
        }

        return response()->json($query->get());
    }

    /**
     * Show the form for editing the specified employee.
     */
    public function edit(Employee $employee): Response
    {
        return Inertia::render('employees/edit', [
            'employee' => $employee,
        ]);
    }

    /**
     * Update the specified employee in storage.
     */
    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validate([
            'department' => ['nullable', 'string', 'max:255'],
            'employee_number' => ['required', 'string', 'max:255', 'unique:employees,employee_number,' . $employee->id],
            'position' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'zip_code' => ['nullable', 'string', 'max:20'],
            'contact' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'birthplace' => ['nullable', 'string', 'max:255'],
            'birthdate' => ['nullable', 'date', 'before:-18 years'],
            'age' => ['nullable', 'integer', 'min:0', 'max:150'],
            'gender' => ['nullable', 'string', 'max:50'],
            'civil_status' => ['nullable', 'string', 'max:50'],
            'religion' => ['nullable', 'string', 'max:100'],
            'nationality' => ['nullable', 'string', 'max:100'],
            'sss' => ['nullable', 'string', 'max:50'],
            'philhealth' => ['nullable', 'string', 'max:50'],
            'pagibig' => ['nullable', 'string', 'max:50'],
            'tin' => ['nullable', 'string', 'max:50'],
            'bank_name' => ['nullable', 'string', 'max:255'],
            'bank_account' => ['nullable', 'string', 'max:255'],
            'basic_rate' => ['nullable', 'numeric', 'min:0'],
            'rate_type' => ['nullable', 'in:monthly,daily'],
            'allowance' => ['nullable', 'numeric', 'min:0'],
            'photo' => ['nullable', 'image', 'max:2048'],
            'start_date' => ['nullable', 'date'],
            'status' => ['required', 'string', 'in:regular,contractual,probationary'],
        ]);

        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($employee->photo && file_exists(public_path($employee->photo))) {
                unlink(public_path($employee->photo));
            }
            $file = $request->file('photo');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('employee_images'), $filename);
            $validated['photo'] = 'employee_images/' . $filename;
        }

        $employee->update($validated);

        return redirect()->route('employees.show', $employee)
            ->with('success', 'Employee updated successfully.');
    }

    /**
     * Display a listing of archived employees.
     */
    public function archiveList(Request $request): Response
    {
        $query = Employee::onlyTrashed();

        // Search functionality
        if ($request->has('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('middle_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT_WS(' ', first_name, middle_name, last_name) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("CONCAT_WS(' ', first_name, last_name) LIKE ?", ["%{$search}%"])
                    ->orWhereRaw("CONCAT_WS(' ', last_name, first_name, middle_name) LIKE ?", ["%{$search}%"])
                    ->orWhere('employee_number', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%");
            });
        }

        // Filter by department
        if ($request->has('department') && $request->input('department') !== 'all') {
            $query->where('department', $request->input('department'));
        }

        // Sort - default to alphabetical by last_name, then first_name
        $sortBy = $request->input('sort_by', 'last_name');
        $sortOrder = $request->input('sort_order', 'asc');
        $query->orderBy($sortBy, $sortOrder);
        if ($sortBy === 'last_name') {
            $query->orderBy('first_name', 'asc');
        }

        $employees = $query->paginate(10)->withQueryString();

        $departments = \App\Models\Department::select('name')->orderBy('name')->get();

        return Inertia::render('employees/archive', [
            'employees' => $employees,
            'departments' => $departments,
            'filters' => $request->only(['search', 'department', 'sort_by', 'sort_order']),
        ]);
    }

    /**
     * Archive the specified employee (soft delete).
     */
    public function destroy(Employee $employee): RedirectResponse
    {
        $employee->delete();

        return redirect()->route('employees.index')
            ->with('success', 'Employee archived successfully.');
    }

    /**
     * Restore an archived employee.
     */
    public function restore($id): RedirectResponse
    {
        $employee = Employee::withTrashed()->findOrFail($id);
        $employee->restore();

        return redirect()->route('employees.index')
            ->with('success', 'Employee restored successfully.');
    }

    /**
     * Permanently delete an employee.
     */
    public function forceDelete($id): RedirectResponse
    {
        $employee = Employee::withTrashed()->findOrFail($id);
        $employee->forceDelete();

        return redirect()->route('employees.index')
            ->with('success', 'Employee permanently deleted.');
    }

    /**
     * Show attendance details for a specific payroll period.
     */
    public function showAttendance(Employee $employee, $payrollId): Response
    {
        $payroll = Payroll::findOrFail($payrollId);
        
        $attendances = $employee->attendances()
            ->where('payroll_id', $payrollId)
            ->orderBy('date', 'asc')
            ->get();

        $attendancePayroll = [
            'id' => $payroll->id,
            'payroll_period' => $payroll->payroll_period,
            'month' => $payroll->month,
            'year' => $payroll->year,
            'count' => $attendances->count(),
        ];

        return Inertia::render('employees/attendance', [
            'employee' => $employee,
            'attendancePayroll' => $attendancePayroll,
            'attendances' => $attendances,
        ]);
    }
}
