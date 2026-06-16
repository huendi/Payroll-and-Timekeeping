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
        Schema::table('employee_schedules', function (Blueprint $table) {
            $table->dropForeign(['schedule_id']);
            $table->unsignedBigInteger('schedule_id')->nullable()->change();
            $table->foreign('schedule_id')->references('id')->on('schedules')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No-op: the original create_employee_schedules migration's down()
        // will drop the table entirely, so we don't need to modify columns
        // here. Leaving this empty avoids errors when existing rows contain
        // NULL schedule_id values during rollback.
    }
};
