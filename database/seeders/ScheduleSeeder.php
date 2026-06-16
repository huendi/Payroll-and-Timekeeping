<?php

namespace Database\Seeders;

use App\Models\Schedule;
use Illuminate\Database\Seeder;

class ScheduleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define a schedule for the current year
        $currentYear = date('Y');
        
        Schedule::create([
            'year' => $currentYear,
            'first_half_start' => 1,
            'first_half_end' => '15',
            'second_half_start' => 16,
            'second_half_end' => 'end', // Matches '16-31' logic in PayrollController
            // Setting standard 8-5 shift as default for regular hours.
            // The "6-10" for regular hours is ambiguous and may refer to shift spread or specific shifts.
            // Using 8-5 for 'regular_start' and 'regular_end' is a safer default for late calculation.
            'regular_start' => '08:00:00',
            'regular_end' => '17:00:00',
            // Night shift 10pm to 6am as requested
            'night_start' => '22:00:00',
            'night_end' => '06:00:00',
        ]);
    }
}
