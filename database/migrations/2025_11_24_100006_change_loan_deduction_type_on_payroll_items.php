<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // If the column exists, ensure it is a numeric DECIMAL field
        if (Schema::hasColumn('payroll_items', 'loan_deduction')) {
            DB::statement('ALTER TABLE `payroll_items` MODIFY `loan_deduction` DECIMAL(12,2) NOT NULL DEFAULT 0');
        }
    }

    public function down(): void
    {
        // No-op: we are not restoring the previous JSON type to avoid data loss or type conflicts.
    }
};
