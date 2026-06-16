<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            // Add missing fields that should have been in original migration
            if (!Schema::hasColumn('payroll_items', 'restday_premium')) {
                $table->decimal('restday_premium', 10, 2)->default(0)->after('restday_pay');
            }

            // Night Differential Breakdown
            if (!Schema::hasColumn('payroll_items', 'night_diff_ordinary_working')) {
                $table->decimal('night_diff_ordinary_working', 10, 2)->default(0)->after('night_diff_pay');
            }
            if (!Schema::hasColumn('payroll_items', 'night_diff_holiday')) {
                $table->decimal('night_diff_holiday', 10, 2)->default(0)->after('night_diff_ordinary_working');
            }
            if (!Schema::hasColumn('payroll_items', 'night_diff_holiday_restday')) {
                $table->decimal('night_diff_holiday_restday', 10, 2)->default(0)->after('night_diff_holiday');
            }
            if (!Schema::hasColumn('payroll_items', 'night_diff_restday')) {
                $table->decimal('night_diff_restday', 10, 2)->default(0)->after('night_diff_holiday_restday');
            }
            if (!Schema::hasColumn('payroll_items', 'night_diff_holiday_ot')) {
                $table->decimal('night_diff_holiday_ot', 10, 2)->default(0)->after('night_diff_restday');
            }
            if (!Schema::hasColumn('payroll_items', 'night_diff_holiday_restday_ot')) {
                $table->decimal('night_diff_holiday_restday_ot', 10, 2)->default(0)->after('night_diff_holiday_ot');
            }

            // Overtime Pay Breakdown
            if (!Schema::hasColumn('payroll_items', 'ot_holiday')) {
                $table->decimal('ot_holiday', 10, 2)->default(0)->after('night_diff_holiday_restday_ot');
            }
            if (!Schema::hasColumn('payroll_items', 'ot_holiday_restday')) {
                $table->decimal('ot_holiday_restday', 10, 2)->default(0)->after('ot_holiday');
            }
            if (!Schema::hasColumn('payroll_items', 'ot_regular')) {
                $table->decimal('ot_regular', 10, 2)->default(0)->after('ot_holiday_restday');
            }
            if (!Schema::hasColumn('payroll_items', 'ot_restday')) {
                $table->decimal('ot_restday', 10, 2)->default(0)->after('ot_regular');
            }
            if (!Schema::hasColumn('payroll_items', 'ot_ordinary_working')) {
                $table->decimal('ot_ordinary_working', 10, 2)->default(0)->after('ot_restday');
            }

            // Additional Premium Pay (1st 8 hrs)
            if (!Schema::hasColumn('payroll_items', 'premium_restday')) {
                $table->decimal('premium_restday', 10, 2)->default(0)->after('ot_ordinary_working');
            }
            if (!Schema::hasColumn('payroll_items', 'premium_holiday_regular')) {
                $table->decimal('premium_holiday_regular', 10, 2)->default(0)->after('premium_restday');
            }
            if (!Schema::hasColumn('payroll_items', 'premium_holiday_special')) {
                $table->decimal('premium_holiday_special', 10, 2)->default(0)->after('premium_holiday_regular');
            }
            if (!Schema::hasColumn('payroll_items', 'premium_holiday_rd_regular')) {
                $table->decimal('premium_holiday_rd_regular', 10, 2)->default(0)->after('premium_holiday_special');
            }
            if (!Schema::hasColumn('payroll_items', 'premium_holiday_rd_special')) {
                $table->decimal('premium_holiday_rd_special', 10, 2)->default(0)->after('premium_holiday_rd_regular');
            }

            // Fix loan_deduction field name (was loan_deductions)
            if (Schema::hasColumn('payroll_items', 'loan_deductions') && !Schema::hasColumn('payroll_items', 'loan_deduction')) {
                $table->renameColumn('loan_deductions', 'loan_deduction');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            // Remove all added columns
            $columns = [
                'restday_premium',
                'night_diff_ordinary_working',
                'night_diff_holiday',
                'night_diff_holiday_restday',
                'night_diff_restday',
                'night_diff_holiday_ot',
                'night_diff_holiday_restday_ot',
                'ot_holiday',
                'ot_holiday_restday',
                'ot_regular',
                'ot_restday',
                'ot_ordinary_working',
                'premium_restday',
                'premium_holiday_regular',
                'premium_holiday_special',
                'premium_holiday_rd_regular',
                'premium_holiday_rd_special',
            ];

            foreach ($columns as $column) {
                if (Schema::hasColumn('payroll_items', $column)) {
                    $table->dropColumn($column);
                }
            }

            // Reverse the rename
            if (Schema::hasColumn('payroll_items', 'loan_deduction') && !Schema::hasColumn('payroll_items', 'loan_deductions')) {
                $table->renameColumn('loan_deduction', 'loan_deductions');
            }
        });
    }
};
