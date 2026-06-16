<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DeductionSettingsSeeder extends Seeder
{
    public function run(): void
    {
        // Use updateOrCreate to avoid duplicate key errors
        $settings = [
            [
                'deduction_type' => 'late_absences',
                'settings' => ['days' => '26'],
            ],
            [
                'deduction_type' => 'loan_advances',
                'settings' => [],
            ],
            [
                'deduction_type' => 'phic',
                'settings' => [
                    'rate' => '5',
                    'min_salary' => '10000',
                    'max_salary' => '100000',
                    'employee_share' => '50',
                    'employer_share' => '50',
                ],
            ],
            [
                'deduction_type' => 'sss_contribution',
                'settings' => [],
            ],
            [
                'deduction_type' => 'sss_loan',
                'settings' => [],
            ],
            [
                'deduction_type' => 'hdmf_loan',
                'settings' => [],
            ],
            [
                'deduction_type' => 'income_tax',
                'settings' => [],
            ],
        ];

        foreach ($settings as $setting) {
            DB::table('deduction_settings')->updateOrInsert(
                ['deduction_type' => $setting['deduction_type']],
                [
                    'settings' => json_encode($setting['settings']),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
