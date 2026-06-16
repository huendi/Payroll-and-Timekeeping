<?php

namespace Database\Seeders;

use App\Models\PHICBracket;
use Illuminate\Database\Seeder;

class PHICBracketSeeder extends Seeder
{
    public function run(): void
    {
        $brackets = [
            ['from' => 0.00, 'to' => 10000.00, 'percentage' => 0.00, 'fixed_amount' => 500.00],
            ['from' => 10000.01, 'to' => 99999.99, 'percentage' => 5.00, 'fixed_amount' => 0.00],
            ['from' => 100000.00, 'to' => 999999999.99, 'percentage' => 0.00, 'fixed_amount' => 5000.00],
        ];

        foreach ($brackets as $bracket) {
            PHICBracket::create($bracket);
        }
    }
}
