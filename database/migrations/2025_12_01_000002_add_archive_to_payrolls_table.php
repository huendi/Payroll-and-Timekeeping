<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->boolean('is_archived')->default(false)->after('approved_at');
            $table->timestamp('archived_at')->nullable()->after('is_archived');
            $table->unsignedBigInteger('archived_by')->nullable()->after('archived_at');
            
            // Index for archived queries
            $table->index('is_archived');
        });
    }

    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropIndex(['is_archived']);
            $table->dropColumn(['is_archived', 'archived_at', 'archived_by']);
        });
    }
};
