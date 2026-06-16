<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            // Add columns for detailed pay breakdown to match draft calculations
            if (!Schema::hasColumn('payroll_items', 'regular_allowance')) {
                $table->decimal('regular_allowance', 12, 2)->default(0)->after('allowance_pay');
            }
            if (!Schema::hasColumn('payroll_items', 'restday_allowance')) {
                $table->decimal('restday_allowance', 12, 2)->default(0)->after('regular_allowance');
            }
            
            // Total hours and days for reference
            if (!Schema::hasColumn('payroll_items', 'regular_hours')) {
                $table->decimal('regular_hours', 8, 2)->default(0)->after('night_diff_hours');
            }
            if (!Schema::hasColumn('payroll_items', 'restday_hours')) {
                $table->decimal('restday_hours', 8, 2)->default(0)->after('regular_hours');
            }
            if (!Schema::hasColumn('payroll_items', 'total_days')) {
                $table->integer('total_days')->default(0)->after('days_worked');
            }
        });
    }

    public function down(): void
    {
        Schema::table('payroll_items', function (Blueprint $table) {
            if (Schema::hasColumn('payroll_items', 'regular_allowance')) {
                $table->dropColumn('regular_allowance');
            }
            if (Schema::hasColumn('payroll_items', 'restday_allowance')) {
                $table->dropColumn('restday_allowance');
            }
            if (Schema::hasColumn('payroll_items', 'regular_hours')) {
                $table->dropColumn('regular_hours');
            }
            if (Schema::hasColumn('payroll_items', 'restday_hours')) {
                $table->dropColumn('restday_hours');
            }
            if (Schema::hasColumn('payroll_items', 'total_days')) {
                $table->dropColumn('total_days');
            }
        });
    }
};
