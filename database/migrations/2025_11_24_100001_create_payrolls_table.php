<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->string('payroll_period'); // "1st Half" or "2nd Half"
            $table->string('month'); // "January", "February", etc.
            $table->year('year');
            $table->boolean('apply_deductions')->default(false);
            $table->unsignedBigInteger('schedule_id'); // reference to schedule/cutoff
            $table->integer('total_employees')->default(0);
            $table->decimal('total_gross', 15, 2)->default(0);
            $table->decimal('total_deductions', 15, 2)->default(0);
            $table->decimal('total_net', 15, 2)->default(0);
            $table->enum('status', ['draft', 'pending', 'approved', 'rejected'])->default('draft');
            $table->string('excel_file_path')->nullable();
            $table->unsignedBigInteger('uploaded_by'); // HR user id
            $table->unsignedBigInteger('approved_by')->nullable(); // Admin user id
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamps();
            $table->softDeletes();

            // Foreign keys
            $table->foreign('schedule_id')->references('id')->on('schedules')->onDelete('cascade');
            // Note: uploaded_by references HR users table - adjust table name as needed
            // $table->foreign('uploaded_by')->references('id')->on('hrs')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('payrolls');
    }
};
