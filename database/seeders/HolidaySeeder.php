<?php

namespace Database\Seeders;

use App\Models\Calendar;
use Illuminate\Database\Seeder;

class HolidaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $holidays = [
            // Regular Holidays 2025
            ['date' => '2025-01-01', 'name' => 'New Year\'s Day', 'type' => 'regular'],
            ['date' => '2025-04-09', 'name' => 'Araw ng Kagitingan (Day of Valor)', 'type' => 'regular'],
            ['date' => '2025-04-17', 'name' => 'Maundy Thursday', 'type' => 'regular'],
            ['date' => '2025-04-18', 'name' => 'Good Friday', 'type' => 'regular'],
            ['date' => '2025-05-01', 'name' => 'Labor Day', 'type' => 'regular'],
            ['date' => '2025-06-12', 'name' => 'Independence Day', 'type' => 'regular'],
            ['date' => '2025-08-25', 'name' => 'National Heroes Day', 'type' => 'regular'],
            ['date' => '2025-11-30', 'name' => 'Bonifacio Day', 'type' => 'regular'],
            ['date' => '2025-12-25', 'name' => 'Christmas Day', 'type' => 'regular'],
            ['date' => '2025-12-30', 'name' => 'Rizal Day', 'type' => 'regular'],
            
            // Special Non-Working Holidays 2025
            ['date' => '2025-02-09', 'name' => 'Chinese New Year', 'type' => 'special'],
            ['date' => '2025-04-19', 'name' => 'Black Saturday', 'type' => 'special'],
            ['date' => '2025-08-21', 'name' => 'Ninoy Aquino Day', 'type' => 'special'],
            ['date' => '2025-11-01', 'name' => 'All Saints\' Day', 'type' => 'special'],
            ['date' => '2025-11-02', 'name' => 'All Souls\' Day', 'type' => 'special'],
            ['date' => '2025-12-08', 'name' => 'Feast of the Immaculate Conception of Mary', 'type' => 'special'],
            ['date' => '2025-12-24', 'name' => 'Christmas Eve', 'type' => 'special'],
            ['date' => '2025-12-31', 'name' => 'New Year\'s Eve', 'type' => 'special'],
            
            // Eid al-Fitr and Eid al-Adha (approximate dates, may change based on moon sighting)
            ['date' => '2025-03-31', 'name' => 'Eid al-Fitr', 'type' => 'regular'],
            ['date' => '2025-06-07', 'name' => 'Eid al-Adha', 'type' => 'regular'],
        ];

        foreach ($holidays as $holiday) {
            Calendar::create($holiday);
        }
    }
}
