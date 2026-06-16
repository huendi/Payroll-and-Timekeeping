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
        Schema::create('employee_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->foreignId('schedule_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('schedule_file_id')->nullable(); // groups schedules together
            $table->date('date');
            $table->time('time_in')->nullable();
            $table->time('time_out')->nullable();
            $table->enum('type', ['work', 'rest'])->default('work');
            $table->integer('weeks')->default(1); // how many weeks this schedule covers
            $table->json('days_data')->nullable(); // store selected days data
            $table->timestamps();

            // Indexes for better performance
            $table->index(['employee_id', 'date']);
            $table->index('schedule_id');
            $table->index('schedule_file_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_schedules');
    }
};
