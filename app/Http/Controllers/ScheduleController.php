<?php

namespace App\Http\Controllers;

use App\Models\Schedule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    public function index(): Response
    {
        $schedules = Schedule::orderBy('year', 'desc')->get();
        $currentYear = date('Y');
        
        return Inertia::render('schedule/index', [
            'schedules' => $schedules,
            'currentYear' => $currentYear,
        ]);
    }
    
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'first_half_start' => ['required', 'integer', 'min:1', 'max:31'],
            'first_half_end' => ['required', 'string'],
            'second_half_start' => ['required', 'integer', 'min:1', 'max:31'],
            'second_half_end' => ['required', 'string'],
            'regular_start' => ['nullable', 'date_format:H:i'],
            'regular_end' => ['nullable', 'date_format:H:i'],
            'night_start' => ['nullable', 'date_format:H:i'],
            'night_end' => ['nullable', 'date_format:H:i'],
        ]);

        $schedule = Schedule::first();
        if ($schedule) {
            $schedule->update($validated);
        } else {
            Schedule::create($validated);
        }

        return redirect()->back()->with('success', 'Schedule created successfully.');
    }
    
    public function update(Request $request, Schedule $schedule): RedirectResponse
    {
        $validated = $request->validate([
            'year' => ['required', 'integer', 'min:2020', 'max:2100'],
            'first_half_start' => ['required', 'integer', 'min:1', 'max:31'],
            'first_half_end' => ['required', 'string'],
            'second_half_start' => ['required', 'integer', 'min:1', 'max:31'],
            'second_half_end' => ['required', 'string'],
            'regular_start' => ['nullable', 'date_format:H:i'],
            'regular_end' => ['nullable', 'date_format:H:i'],
            'night_start' => ['nullable', 'date_format:H:i'],
            'night_end' => ['nullable', 'date_format:H:i'],
        ]);

        $schedule->update($validated);

        return redirect()->back()->with('success', 'Schedule updated successfully.');
    }
    
    public function destroy(Schedule $schedule): RedirectResponse
    {
        $schedule->delete();

        return redirect()->back()->with('success', 'Schedule deleted successfully.');
    }
}
