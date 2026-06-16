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
        Schema::create('premium_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description')->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('premium_types', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('premium_categories')->onDelete('cascade');
            $table->string('name');
            $table->string('description')->nullable();
            $table->decimal('regular_rate', 8, 2)->default(0);
            $table->decimal('special_rate', 8, 2)->nullable();
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('premium_types');
        Schema::dropIfExists('premium_categories');
    }
};
