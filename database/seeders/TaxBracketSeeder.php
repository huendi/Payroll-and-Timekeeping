<?php

namespace Database\Seeders;

use App\Models\TaxBracket;
use Illuminate\Database\Seeder;

class TaxBracketSeeder extends Seeder
{
    public function run(): void
    {
        $brackets = [
            ['from' => 0.00,        'to' => 250000.00,   'percentage' => 0.00,  'fixed_amount' => 0.00],
            ['from' => 250000.01,   'to' => 400000.00,   'percentage' => 0.15,  'fixed_amount' => 0.00],
            ['from' => 400000.01,   'to' => 800000.00,   'percentage' => 0.20,  'fixed_amount' => 22500.00],
            ['from' => 800000.01,   'to' => 2000000.00,  'percentage' => 0.25,  'fixed_amount' => 102500.00],
            ['from' => 2000000.01,  'to' => 8000000.00,  'percentage' => 0.30,  'fixed_amount' => 402500.00],
            ['from' => 8000000.01,  'to' => 99999999.99, 'percentage' => 0.35,  'fixed_amount' => 2202500.00],
        ];

        foreach ($brackets as $bracket) {
            TaxBracket::create($bracket);
        }
    }
}
