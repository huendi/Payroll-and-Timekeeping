<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payroll_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('payroll_id');
            $table->unsignedBigInteger('employee_id');

            // Attendance summary
            $table->decimal('hours_worked', 8, 2)->default(0);
            $table->integer('days_worked')->default(0);
            $table->integer('late_minutes')->default(0);
            $table->decimal('absent_days', 5, 2)->default(0);
            $table->decimal('leave_days_used', 5, 2)->default(0);
            $table->json('leave_breakdown')->nullable();
            $table->decimal('overtime_hours', 8, 2)->default(0);
            $table->decimal('night_diff_hours', 8, 2)->default(0);

            // Earnings
            $table->decimal('basic_pay', 12, 2)->default(0);
            $table->decimal('allowance_pay', 12, 2)->default(0);
            $table->decimal('other_pay', 12, 2)->default(0);
            $table->decimal('overtime_pay', 12, 2)->default(0);
            $table->decimal('night_diff_pay', 12, 2)->default(0);
            $table->decimal('holiday_pay', 12, 2)->default(0);
            $table->decimal('restday_pay', 12, 2)->default(0);
            $table->decimal('restday_premium', 12, 2)->default(0);
            $table->decimal('gross_pay', 12, 2)->default(0);

            // Deductions
            $table->decimal('sss_deduction', 12, 2)->default(0);
            $table->decimal('phic_deduction', 12, 2)->default(0);
            $table->decimal('hdmf_deduction', 12, 2)->default(0);
            $table->decimal('tax_deduction', 12, 2)->default(0);
            $table->decimal('late_deduction', 12, 2)->default(0);
            $table->decimal('absence_deduction', 12, 2)->default(0);
            $table->decimal('loan_deduction', 12, 2)->default(0);
            $table->decimal('total_deductions', 12, 2)->default(0);

            // Net
            $table->decimal('net_pay', 12, 2)->default(0);

            // Meta
            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->foreign('payroll_id')->references('id')->on('payrolls')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('payroll_items');
    }
};
