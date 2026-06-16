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
        Schema::create('deduction_settings', function (Blueprint $table) {
            $table->id();
            $table->string('deduction_type')->unique(); // e.g. "late_absences", "sss_contribution"
            $table->json('settings')->nullable();       // daily_rate, per_minute_rate, etc.
            $table->timestamps(); // includes created_at & updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('deduction_settings');
    }
};
