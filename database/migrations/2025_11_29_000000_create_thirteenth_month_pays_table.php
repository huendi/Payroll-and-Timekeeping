<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('thirteenth_month_pays', function (Blueprint $table) {
            $table->id();
            $table->year('year')->unique();
            $table->enum('status', ['active', 'archived'])->default('active');
            $table->timestamp('generated_at')->nullable();
            $table->unsignedBigInteger('generated_by')->nullable();
            $table->timestamp('archived_at')->nullable();
            $table->unsignedBigInteger('archived_by')->nullable();
            $table->timestamps();

            $table->foreign('generated_by')->references('id')->on('users')->onDelete('set null');
            $table->foreign('archived_by')->references('id')->on('users')->onDelete('set null');
        });

        Schema::create('thirteenth_month_pay_items', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('thirteenth_month_pay_id');
            $table->unsignedBigInteger('employee_id');
            $table->decimal('gross_pay_total', 14, 2)->default(0);
            $table->decimal('sss_deduction_total', 14, 2)->default(0);
            $table->decimal('thirteenth_month_pay', 14, 2)->default(0);
            $table->timestamps();

            $table->foreign('thirteenth_month_pay_id')->references('id')->on('thirteenth_month_pays')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->index(['thirteenth_month_pay_id', 'employee_id'], 'tmp_pay_emp_idx');
        });
    }

    public function down()
    {
        Schema::dropIfExists('thirteenth_month_pay_items');
        Schema::dropIfExists('thirteenth_month_pays');
    }
};
