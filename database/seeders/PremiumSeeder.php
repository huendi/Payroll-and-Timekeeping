<?php

namespace Database\Seeders;

use App\Models\PremiumCategory;
use App\Models\PremiumType;
use Illuminate\Database\Seeder;

class PremiumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {

        // Additional Premium Pay
        $additionalPremium = PremiumCategory::create([
            'name' => 'Additional Premium Pay',
            'description' => 'Additional premium pay for first 8 hours',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $additionalPremium->id,
            'name' => 'Restday',
            'regular_rate' => 30.00,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $additionalPremium->id,
            'name' => 'Regular Holiday ',
            'regular_rate' => 100,
            'sort_order' => 2,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $additionalPremium->id,
            'name' => 'Special Holiday ',
            'regular_rate' => 30,
            'sort_order' => 3,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $additionalPremium->id,
            'name' => 'Restday Regular Holiday',
            'regular_rate' => 160,
            'sort_order' => 4,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $additionalPremium->id,
            'name' => 'Holiday Restday Special',
            'regular_rate' => 50,
            'sort_order' => 5,
            'is_active' => true,
        ]);

        # --------------------------------------------------------------------------------------------------------


           // Overtime Pay
        $overtimePay = PremiumCategory::create([
            'name' => 'Overtime Pay',
            'description' => 'Premium pay for overtime work beyond 8 hours',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $overtimePay->id,
            'name' => 'Regular Overtime',
            'regular_rate' => 125,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $overtimePay->id,
            'name' => 'Restday Overtime',
            'regular_rate' => 169,
            'sort_order' => 2,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $overtimePay->id,
            'name' => 'Regular Holiday ',
            'regular_rate' => 260,
            'sort_order' => 3,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $overtimePay->id,
            'name' => 'Special Holiday',
            'regular_rate' => 169.00,
            'sort_order' => 4,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $overtimePay->id,
            'name' => 'Restday Regular Holiday',
            'regular_rate' => 338,
            'sort_order' => 5,
            'is_active' => true,
        ]);

           PremiumType::create([
            'category_id' => $overtimePay->id,
            'name' => 'Restday Special Holiday',
            'regular_rate' => 195,
            'sort_order' => 7,
            'is_active' => true,
        ]);

        # --------------------------------------------------------------------------------------------------------

         // Night Differential
        $nightDifferential = PremiumCategory::create([
            'name' => 'Night Differential',
            'description' => 'Premium pay for night shift work',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Ordinary Working days',
            'regular_rate' => 10.00,
            'sort_order' => 1,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Restday Premium',
            'regular_rate' => 13.00,
            'sort_order' => 2,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Holiday Regular Premium',
            'regular_rate' => 20.00,
            'sort_order' => 3,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Holiday Special Premium',
            'regular_rate' => 13.00,
            'sort_order' => 4,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Holiday Restday Regular Premium',
            'regular_rate' => 26,
            'sort_order' => 5,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Holiday Restday Special Premium',
            'regular_rate' => 15,
            'sort_order' => 6,
            'is_active' => true,
        ]);


        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Regular Overtime',
            'regular_rate' => 12.50,
            'sort_order' => 7,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Restday Overtime',
            'regular_rate' => 16.90,
            'sort_order' => 8,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Holiday Regular Overtime',
            'regular_rate' => 26,
            'sort_order' => 9,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Holiday Special Overtime',
            'regular_rate' => 16.90,
            'sort_order' => 10,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Holiday Restday Regular Overtime',
            'regular_rate' => 33.80,
            'sort_order' => 11,
            'is_active' => true,
        ]);

        PremiumType::create([
            'category_id' => $nightDifferential->id,
            'name' => 'Holiday Restday Special Overtime',
            'regular_rate' => 19.50,
            'sort_order' => 12,
            'is_active' => true,
        ]);
    }
}
