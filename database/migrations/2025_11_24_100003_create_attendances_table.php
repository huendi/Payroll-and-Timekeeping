<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('payroll_id');
            $table->date('date');
            $table->time('clock_in')->nullable();
            $table->time('clock_out')->nullable();
            $table->time('scheduled_in')->nullable();
            $table->time('scheduled_out')->nullable();
            $table->decimal('hours_worked', 8, 2)->default(0);
            $table->integer('late_minutes')->default(0);
            $table->decimal('overtime_hours', 8, 2)->default(0);
            $table->string('overtime_type')->nullable(); // 'PAID' or 'UNPAID'
            $table->boolean('is_ot_paid')->default(false);
            $table->decimal('night_diff_hours', 8, 2)->default(0);
            $table->boolean('is_holiday')->default(false);
            $table->string('holiday_type')->nullable(); // 'regular' or 'special'
            $table->boolean('is_restday')->default(false);
            $table->text('remarks')->nullable();
            $table->timestamps();

            // Foreign keys
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('payroll_id')->references('id')->on('payrolls')->onDelete('cascade');
            
            // Index for faster queries
            $table->index(['employee_id', 'payroll_id']);
            $table->index('date');
        });
    }

    public function down()
    {
        Schema::dropIfExists('attendances');
    }
};
