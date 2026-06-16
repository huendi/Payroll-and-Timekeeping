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
        Schema::create('deduction_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_deduction_id')->constrained('employee_deductions')->onDelete('cascade');
            $table->foreignId('payslip_id')->constrained('payslips')->onDelete('cascade');
            $table->decimal('amount', 12, 2);
            $table->decimal('balance_after', 12, 2);
            $table->date('payment_date');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deduction_payments');
    }
};
