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
        Schema::create('tax_brackets', function (Blueprint $table) {
            $table->id();
            $table->decimal('from', 12, 2);
            $table->decimal('to', 12, 2);
            $table->decimal('percentage', 5, 2);
            $table->decimal('fixed_amount', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('sss_brackets', function (Blueprint $table) {
            $table->id();
            $table->decimal('from', 12, 2);
            $table->decimal('to', 12, 2);
            $table->decimal('er', 12, 2)->default(0);
            $table->decimal('ee', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->string('others')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sss_brackets');
        Schema::dropIfExists('tax_brackets');
    }
};
