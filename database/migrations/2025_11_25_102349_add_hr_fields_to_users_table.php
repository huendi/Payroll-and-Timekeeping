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
        Schema::table('users', function (Blueprint $table) {
            $table->string('employee_number')->nullable()->after('id');
            $table->string('department')->nullable()->after('employee_number');
            $table->string('first_name')->nullable()->after('department');
            $table->string('last_name')->nullable()->after('first_name');
            $table->enum('status', ['active', 'inactive'])->default('active')->after('password');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['employee_number', 'department', 'first_name', 'last_name', 'status']);
        });
    }
};
