<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('employee_deductions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->enum('deduction_type', ['company_loan', 'cash_advance', 'sss_loan', 'hdmf_loan', 'other']);
            $table->string('custom_type')->nullable(); // for 'other' type
            $table->decimal('amount', 12, 2);
            $table->integer('term'); // number of payments
            $table->enum('cut_off', ['1st_half', '2nd_half']);
            $table->decimal('remaining_balance', 12, 2)->default(0);
            $table->integer('payments_made')->default(0);
            $table->boolean('is_active')->default(true);
            $table->date('start_date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('employee_deductions');
    }
};
