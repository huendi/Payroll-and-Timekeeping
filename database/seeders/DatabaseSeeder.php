<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Employee;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Create admin user
        User::firstOrCreate(
            ['email' => 'admin@payroll.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('minda567'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // Create HR user
        User::firstOrCreate(
            ['email' => 'hr@payroll.com'],
            [
                'name' => 'Hr User',
                'password' => bcrypt('TechnoP@rk20'),
                'role' => 'hr',
                'email_verified_at' => now(),
            ]
        );

        // Create Finance user
        User::firstOrCreate(
            ['email' => 'accounting@payroll.com'],
            [
                'name' => 'Accounting User',
                'password' => bcrypt('Rhea&Wendu13'),
                'role' => 'finance',
                'email_verified_at' => now(),
            ]
        );

        // Create default leave types
        $leaveTypes = ['Sick Leave', 'Vacation Leave', 'Emergency Leave'];
        foreach ($leaveTypes as $type) {
            \App\Models\LeaveType::firstOrCreate(['name' => $type]);
        }

        // Create departments
        $departments = ['IT', 'Human Resources', 'Finance', 'Operations'];
        foreach ($departments as $dept) {
            \App\Models\Department::firstOrCreate(['name' => $dept]);
        }

        // Create mock employees
        Employee::firstOrCreate(
            ['employee_number' => '2025001'],
            [
                'first_name' => 'John',
                'middle_name' => 'Michael',
                'last_name' => 'Anderson',
                'position' => 'Senior Developer',
                'department' => 'IT',
                'email' => 'john.anderson@company.com',
                'phone' => '09171234567',
                'contact' => '09171234567',
                'address' => '123 Main Street, Metro Manila',
                'zip_code' => '1200',
                'birthdate' => '1990-05-15',
                'birthplace' => 'Manila',
                'gender' => 'Male',
                'civil_status' => 'Married',
                'religion' => 'Catholic',
                'nationality' => 'Filipino',
                'sss' => '12-3456789-0',
                'philhealth' => 'PM-123456789-0',
                'pagibig' => '1234-5678-9012',
                'tin' => '123-456-789-000',
                'bank_name' => 'BDO',
                'bank_account' => '1234567890',
                'basic_rate' => '620.00',
                'rate_type' => 'daily',
                'allowance' => '60.00',
                'start_date' => '2021-01-15',
                'status' => 'regular',
            ]
        );

        Employee::firstOrCreate(
            ['employee_number' => '2025002'],
            [
                'first_name' => 'Maria',
                'middle_name' => 'Santos',
                'last_name' => 'Garcia',
                'position' => 'HR Manager',
                'department' => 'Human Resources',
                'email' => 'maria.garcia@company.com',
                'phone' => '09189876543',
                'contact' => '09189876543',
                'address' => '456 Oak Avenue, Quezon City',
                'zip_code' => '1100',
                'birthdate' => '1988-08-22',
                'birthplace' => 'Cebu',
                'gender' => 'Female',
                'civil_status' => 'Single',
                'religion' => 'Catholic',
                'nationality' => 'Filipino',
                'sss' => '12-9876543-1',
                'philhealth' => 'PM-987654321-1',
                'pagibig' => '9876-5432-1098',
                'tin' => '987-654-321-000',
                'bank_name' => 'Metrobank',
                'bank_account' => '9876543210',
                'basic_rate' => '30000.00',
                'rate_type' => 'monthly',
                'allowance' => '1000.00',
                'start_date' => '2025-09-17',
                'status' => 'regular',
            ]
        );

        Employee::firstOrCreate(
            ['employee_number' => '2025003'],
            [
                'first_name' => 'Robert',
                'middle_name' => 'James',
                'last_name' => 'Thompson',
                'position' => 'Finance Manager',
                'department' => 'Finance',
                'email' => 'robert.thompson@company.com',
                'phone' => '09155555555',
                'contact' => '09155555555',
                'address' => '789 Pine Street, Makati',
                'zip_code' => '1200',
                'birthdate' => '1985-03-10',
                'birthplace' => 'Davao',
                'gender' => 'Male',
                'civil_status' => 'Married',
                'religion' => 'Protestant',
                'nationality' => 'Filipino',
                'sss' => '12-5555555-5',
                'philhealth' => 'PM-555555555-5',
                'pagibig' => '5555-5555-5555',
                'tin' => '555-555-555-000',
                'bank_name' => 'BPI',
                'bank_account' => '5555555555',
                'basic_rate' => '610.00',
                'rate_type' => 'daily',
                'allowance' => '52.00',
                'start_date' => '2020-06-01',
                'status' => 'regular',
            ]
        );

        Employee::firstOrCreate(
            ['employee_number' => '2025004'],
            [
                'first_name' => 'Sarah',
                'middle_name' => 'Marie',
                'last_name' => 'Johnson',
                'position' => 'Operations Coordinator',
                'department' => 'Operations',
                'email' => 'sarah.johnson@company.com',
                'phone' => '09166666666',
                'contact' => '09166666666',
                'address' => '321 Elm Street, Pasig',
                'zip_code' => '1600',
                'birthdate' => '1992-07-18',
                'birthplace' => 'Iloilo',
                'gender' => 'Female',
                'civil_status' => 'Single',
                'religion' => 'Catholic',
                'nationality' => 'Filipino',
                'sss' => '12-6666666-6',
                'philhealth' => 'PM-666666666-6',
                'pagibig' => '6666-6666-6666',
                'tin' => '666-666-666-000',
                'bank_name' => 'PNB',
                'bank_account' => '6666666666',
                'basic_rate' => '600.00',
                'rate_type' => 'daily',
                'allowance' => '50.00',
                'start_date' => '2022-03-15',
                'status' => 'probationary',
            ]
        );

        Employee::firstOrCreate(
            ['employee_number' => '2025005'],
            [
                'first_name' => 'David',
                'middle_name' => 'Christopher',
                'last_name' => 'Lee',
                'position' => 'Junior Developer',
                'department' => 'IT',
                'email' => 'david.lee@company.com',
                'phone' => '09177777777',
                'contact' => '09177777777',
                'address' => '654 Birch Lane, Taguig',
                'zip_code' => '1630',
                'birthdate' => '1995-11-25',
                'birthplace' => 'Bacolod',
                'gender' => 'Male',
                'civil_status' => 'Single',
                'religion' => 'Catholic',
                'nationality' => 'Filipino',
                'sss' => '12-7777777-7',
                'philhealth' => 'PM-777777777-7',
                'pagibig' => '7777-7777-7777',
                'tin' => '777-777-777-000',
                'bank_name' => 'Security Bank',
                'bank_account' => '7777777777',
                'basic_rate' => '20000.00',
                'rate_type' => 'monthly',
                'allowance' => '500.00',
                'start_date' => '2023-01-10',
                'status' => 'probationary',
            ]
        );

        Employee::firstOrCreate(
            ['employee_number' => '2025006'],
            [
                'first_name' => 'Jennifer',
                'middle_name' => 'Anne',
                'last_name' => 'Martinez',
                'position' => 'HR Specialist',
                'department' => 'Human Resources',
                'email' => 'jennifer.martinez@company.com',
                'phone' => '09188888888',
                'contact' => '09188888888',
                'address' => '987 Cedar Road, Mandaluyong',
                'zip_code' => '1550',
                'birthdate' => '1991-02-14',
                'birthplace' => 'Cagayan de Oro',
                'gender' => 'Female',
                'civil_status' => 'Married',
                'religion' => 'Catholic',
                'nationality' => 'Filipino',
                'sss' => '12-8888888-8',
                'philhealth' => 'PM-888888888-8',
                'pagibig' => '8888-8888-8888',
                'tin' => '888-888-888-000',
                'bank_name' => 'Unionbank',
                'bank_account' => '8888888888',
                'basic_rate' => '24000.00',
                'rate_type' => 'monthly',
                'allowance' => '1000.00',
                'start_date' => '2021-08-20',
                'status' => 'regular',
            ]
        );

        // Seed all payroll-related data
        $this->call([
            PremiumSeeder::class,
            SSSBracketSeeder::class,
            TaxBracketSeeder::class,
            HdmfSettingSeeder::class,
            HolidaySeeder::class,
            DeductionSettingsSeeder::class,
            PHICBracketSeeder::class,
            ScheduleSeeder::class,
        ]);
    }
}
