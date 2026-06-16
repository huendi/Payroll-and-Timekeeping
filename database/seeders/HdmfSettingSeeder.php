<?php

namespace Database\Seeders;

use App\Models\DeductionSetting;
use Illuminate\Database\Seeder;

class HdmfSettingSeeder extends Seeder
{
    public function run()
    {
        DeductionSetting::updateOrCreate(
            ['deduction_type' => 'hdmf'],
            [
                'settings' => [
                    'employee' => 200, // Per cutoff
                    'employer' => 200, // Per cutoff
                ]
            ]
        );
    }
}
