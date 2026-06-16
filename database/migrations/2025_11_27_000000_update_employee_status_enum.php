<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // We need to modify the enum column to include 'probationary'
        // Since Doctrine DBAL doesn't support enum modification well, we use raw SQL
        DB::statement("ALTER TABLE employees MODIFY COLUMN status ENUM('regular', 'contractual', 'probationary') DEFAULT 'probationary'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // First, convert any 'probationary' values to 'regular'
        DB::statement("UPDATE employees SET status = 'regular' WHERE status = 'probationary'");
        
        // Revert back to original enum values
        DB::statement("ALTER TABLE employees MODIFY COLUMN status ENUM('regular', 'contractual') DEFAULT 'regular'");
    }
};
