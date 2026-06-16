<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phic_brackets', function (Blueprint $table) {
            $table->id();
            $table->decimal('from', 12, 2);
            $table->decimal('to', 12, 2)->nullable();
            $table->decimal('percentage', 5, 2)->default(0);
            $table->decimal('fixed_amount', 12, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phic_brackets');
    }
};
