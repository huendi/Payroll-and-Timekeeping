<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payslips', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('payroll_id');
            $table->unsignedBigInteger('employee_id');
            
            // Earnings
            $table->decimal('basic_pay', 12, 2)->default(0);
            $table->decimal('allowance', 12, 2)->default(0);
            $table->decimal('other_pay', 12, 2)->default(0);
            $table->decimal('overtime_pay', 12, 2)->default(0);
            $table->decimal('night_diff_pay', 12, 2)->default(0);
            $table->decimal('holiday_pay', 12, 2)->default(0);
            $table->decimal('restday_pay', 12, 2)->default(0);
            $table->decimal('gross_pay', 12, 2)->default(0);

            // Deductions
            $table->decimal('sss_deduction', 12, 2)->default(0);
            $table->decimal('phic_deduction', 12, 2)->default(0);
            $table->decimal('hdmf_deduction', 12, 2)->default(0);
            $table->decimal('tax_deduction', 12, 2)->default(0);
            $table->decimal('late_deduction', 12, 2)->default(0);
            $table->decimal('absence_deduction', 12, 2)->default(0);
            $table->json('loan_deductions')->nullable();
            $table->decimal('total_deductions', 12, 2)->default(0);

            // Net Pay
            $table->decimal('net_pay', 12, 2)->default(0);

            // Attendance Summary
            $table->decimal('hours_worked', 8, 2)->default(0);
            $table->integer('days_worked')->default(0);
            $table->integer('late_minutes')->default(0);
            $table->decimal('absent_days', 5, 2)->default(0);
            $table->decimal('leave_days_used', 5, 2)->default(0);
            $table->json('leave_breakdown')->nullable();
            $table->decimal('overtime_hours', 8, 2)->default(0);
            $table->decimal('night_diff_hours', 8, 2)->default(0);

            // Period Info
            $table->string('payroll_period');
            $table->string('month');
            $table->year('year');
            
            // Remarks
            $table->text('remarks')->nullable();
            
            // Generated timestamp
            $table->timestamp('generated_at')->nullable();
            
            $table->timestamps();

            // Foreign keys
            $table->foreign('payroll_id')->references('id')->on('payrolls')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            
            // Indexes
            $table->index(['employee_id', 'payroll_period', 'month', 'year']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('payslips');
    }
};
