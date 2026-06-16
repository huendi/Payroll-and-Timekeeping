<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Only add the column if it truly does not exist.
        if (! Schema::hasColumn('payroll_items', 'allowance_pay')) {
            Schema::table('payroll_items', function (Blueprint $table) {
                $table->decimal('allowance_pay', 12, 2)->default(0)->after('basic_pay');
            });
        }
    }

    public function down(): void
    {
        // Safe no-op: we won't drop the column to avoid accidental data loss.
        // If you ever need to roll this back, you can adjust this method.
    }
};
