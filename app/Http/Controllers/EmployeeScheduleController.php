<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\Schedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;

class EmployeeScheduleController extends Controller
{
    public function index(Employee $employee): Response
    {
        $schedules = EmployeeSchedule::where('employee_id', $employee->id)
            ->where('is_archived', false)
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('schedule_file_id')
            ->map(function ($group) {
                $first = $group->first();
                return [
                    'id' => $first->id,
                    'schedule_file_id' => $first->schedule_file_id,
                    'date_created' => $first->created_at->format('F d, Y'),
                    'weeks' => $first->weeks,
                    'count' => $group->count(),
                    'schedules' => $group,
                ];
            })
            ->values();

        $archivedSchedules = EmployeeSchedule::where('employee_id', $employee->id)
            ->where('is_archived', true)
            ->orderBy('archived_at', 'desc')
            ->get()
            ->groupBy('schedule_file_id')
            ->map(function ($group) {
                $first = $group->first();
                return [
                    'id' => $first->id,
                    'schedule_file_id' => $first->schedule_file_id,
                    'date_created' => $first->created_at->format('F d, Y'),
                    'weeks' => $first->weeks,
                    'count' => $group->count(),
                    'schedules' => $group,
                ];
            })
            ->values();

        $mainSchedule = Schedule::where('year', date('Y'))->first();

        return Inertia::render('employees/schedule', [
            'employee' => $employee,
            'schedules' => $schedules,
            'archivedSchedules' => $archivedSchedules,
            'mainSchedule' => $mainSchedule,
        ]);
    }

    public function store(Request $request, Employee $employee): RedirectResponse
    {
        $validated = $request->validate([
            'weeks' => ['required', 'integer', 'min:1', 'max:4'],
            'time_in' => ['required', 'date_format:H:i'],
            'time_out' => ['required', 'date_format:H:i'],
            'schedule_id' => ['nullable', 'integer'],
            'schedule_file_id' => ['nullable', 'string'],
            'days' => ['required', 'array', 'min:1'],
            'days.*.date' => ['required', 'date_format:Y-m-d'],
            'days.*.type' => ['required', 'in:work,rest'],
        ]);

        // Check for overlapping schedules
        $selectedDates = collect($validated['days'])->pluck('date')->toArray();
        $existingSchedulesQuery = EmployeeSchedule::where('employee_id', $employee->id)
            ->whereIn('date', $selectedDates);
            
        if (!empty($validated['schedule_file_id'])) {
            $existingSchedulesQuery->where('schedule_file_id', '!=', $validated['schedule_file_id']);
        }

        $existingSchedules = $existingSchedulesQuery->get();

        if ($existingSchedules->isNotEmpty()) {
            $dates = $existingSchedules->pluck('date')->map(fn($d) => $d->format('Y-m-d'))->implode(', ');
            return redirect()->back()->withErrors(['error' => "Schedule conflict: The following dates already have a schedule assigned: $dates"]);
        }

        // Determine schedule file ID
        if (!empty($validated['schedule_file_id'])) {
            $scheduleFileId = $validated['schedule_file_id'];
            // Delete existing records for this file ID (cleanup before insert)
            EmployeeSchedule::where('employee_id', $employee->id)
                ->where('schedule_file_id', $scheduleFileId)
                ->delete();
        } else {
            $scheduleFileId = Str::uuid()->toString();
        }

        // Create schedule entries for each selected day
        foreach ($validated['days'] as $day) {
            EmployeeSchedule::create([
                'employee_id' => $employee->id,
                'schedule_id' => $validated['schedule_id'] ?? null,
                'schedule_file_id' => $scheduleFileId,
                'date' => $day['date'],
                'time_in' => $day['type'] === 'work' ? $validated['time_in'] : null,
                'time_out' => $day['type'] === 'work' ? $validated['time_out'] : null,
                'type' => $day['type'],
                'weeks' => $validated['weeks'],
                'days_data' => $validated['days'],
            ]);
        }

        return redirect()->back()->with('success', !empty($validated['schedule_file_id']) ? 'Schedule updated successfully.' : 'Schedule created successfully.');
    }

    public function details(Employee $employee, string $scheduleFileId)
    {
        $schedules = EmployeeSchedule::where('employee_id', $employee->id)
            ->where('schedule_file_id', $scheduleFileId)
            ->orderBy('date')
            ->get()
            ->map(function ($schedule) {
                return [
                    'date' => $schedule->date,
                    'type' => $schedule->type,
                    'time_in' => $schedule->time_in ? $schedule->time_in->format('H:i') : null,
                    'time_out' => $schedule->time_out ? $schedule->time_out->format('H:i') : null,
                ];
            });

        return response()->json($schedules);
    }

    public function show(Employee $employee, string $scheduleFileId): Response|RedirectResponse
    {
        $schedules = EmployeeSchedule::where('employee_id', $employee->id)
            ->where('schedule_file_id', $scheduleFileId)
            ->orderBy('date')
            ->get();

        if ($schedules->isEmpty()) {
            return redirect()->back()->withErrors(['error' => 'Schedule not found']);
        }

        $schedule = $schedules->first();
        $scheduleDetails = $schedules->map(function ($s) {
            return [
                'date' => $s->date->format('Y-m-d'),
                'type' => $s->type,
                'time_in' => $s->time_in ? $s->time_in->format('H:i') : null,
                'time_out' => $s->time_out ? $s->time_out->format('H:i') : null,
            ];
        })->toArray();

        return Inertia::render('employees/schedule-show', [
            'employee' => $employee,
            'schedule' => [
                'id' => $schedule->id,
                'schedule_file_id' => $schedule->schedule_file_id,
                'date_created' => $schedule->created_at->format('F d, Y'),
                'weeks' => $schedule->weeks,
                'count' => $schedules->count(),
            ],
            'scheduleDetails' => $scheduleDetails,
            'timeIn' => $schedules->first(fn($s) => $s->type === 'work' && $s->time_in)?->time_in->format('H:i') ?? '00:00',
            'timeOut' => $schedules->first(fn($s) => $s->type === 'work' && $s->time_out)?->time_out->format('H:i') ?? '00:00',
        ]);
    }

    public function destroy(Employee $employee, string $scheduleFileId): RedirectResponse
    {
        EmployeeSchedule::where('employee_id', $employee->id)
            ->where('schedule_file_id', $scheduleFileId)
            ->delete();

        return redirect()->back()->with('success', 'Schedule deleted successfully.');
    }

    public function archive(Employee $employee, string $scheduleFileId): RedirectResponse
    {
        $schedules = EmployeeSchedule::where('employee_id', $employee->id)
            ->where('schedule_file_id', $scheduleFileId)
            ->get();

        foreach ($schedules as $schedule) {
            $schedule->archive();
        }

        return redirect()->back()->with('success', 'Schedule archived successfully.');
    }

    public function restore(Employee $employee, string $scheduleFileId): RedirectResponse
    {
        $schedules = EmployeeSchedule::where('employee_id', $employee->id)
            ->where('schedule_file_id', $scheduleFileId)
            ->get();

        foreach ($schedules as $schedule) {
            $schedule->restore();
        }

        return redirect()->back()->with('success', 'Schedule restored successfully.');
    }

    public function download(Employee $employee, string $scheduleFileId)
    {
        $schedules = EmployeeSchedule::where('employee_id', $employee->id)
            ->where('schedule_file_id', $scheduleFileId)
            ->orderBy('date')
            ->get();

        if ($schedules->isEmpty()) {
            return redirect()->back()->withErrors(['error' => 'Schedule not found']);
        }

        // Generate CSV
        $filename = "schedule_{$employee->last_name},{$employee->first_name}.csv";
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($schedules, $employee) {
            $file = fopen('php://output', 'w');
            
            // Header
            fputcsv($file, ['Employee Schedule']);
            fputcsv($file, ['Employee', $employee->full_name]);
            fputcsv($file, ['Employee Number', $employee->employee_number]);
            fputcsv($file, ['']);
            fputcsv($file, ['Date', 'Day', 'Time In', 'Time Out', 'Type']);

            // Data
            foreach ($schedules as $schedule) {
                fputcsv($file, [
                    $schedule->date->format('Y-m-d'),
                    $schedule->date->format('l'),
                    $schedule->time_in ? $schedule->time_in->format('H:i') : 'N/A',
                    $schedule->time_out ? $schedule->time_out->format('H:i') : 'N/A',
                    ucfirst($schedule->type),
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}
