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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->year('year');
            
            // First half cutoff dates
            $table->integer('first_half_start')->nullable();
            $table->string('first_half_end')->nullable(); // can be number or 'end'
            
            // Second half cutoff dates  
            $table->integer('second_half_start')->nullable();
            $table->string('second_half_end')->nullable(); // can be number or 'end'
            
            // Work shift times
            $table->time('regular_start')->nullable();
            $table->time('regular_end')->nullable();
            $table->time('night_start')->nullable();
            $table->time('night_end')->nullable();
            
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
