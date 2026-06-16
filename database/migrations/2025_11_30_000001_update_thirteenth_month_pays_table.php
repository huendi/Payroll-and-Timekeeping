<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('thirteenth_month_pays', function (Blueprint $table) {
            // Add date range columns
            $table->integer('from_month')->nullable()->after('year');
            $table->integer('from_year')->nullable()->after('from_month');
            $table->integer('to_month')->nullable()->after('from_year');
            $table->integer('to_year')->nullable()->after('to_month');
            
            // Drop the unique constraint on year since we'll have multiple records per year
            $table->dropUnique(['year']);
        });
    }

    public function down()
    {
        Schema::table('thirteenth_month_pays', function (Blueprint $table) {
            $table->dropColumn(['from_month', 'from_year', 'to_month', 'to_year']);
            $table->unique('year');
        });
    }
};
