<?php

namespace App\Http\Controllers;

use App\Models\Calendar;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(): Response
    {
        $holidays = Calendar::orderBy('date')->get();
        $hasHolidays = $holidays->count() > 0;
    
        return Inertia::render('calendar/index', [
            'holidays' => $holidays,
            'hasHolidays' => $hasHolidays,
        ]);
    }
    
    public function store(Request $request): RedirectResponse
    {
        $holidays = $request->input('holidays', []);
    
        // Clear all existing holidays
        Calendar::truncate();
    
        // Insert all holidays from form
        foreach ($holidays as $holiday) {
            if (!empty($holiday['date']) && !empty($holiday['name']) && !empty($holiday['type'])) {
                Calendar::create([
                    'date' => $holiday['date'],
                    'name' => $holiday['name'],
                    'type' => $holiday['type'],
                ]);
            }
        }
    
        return redirect()->back()->with('success', 'Holidays updated successfully.');
    }
    
    public function reset(): RedirectResponse
    {
        Calendar::truncate();
        return redirect()->back()->with('success', 'All holidays have been reset.');
    }
}
