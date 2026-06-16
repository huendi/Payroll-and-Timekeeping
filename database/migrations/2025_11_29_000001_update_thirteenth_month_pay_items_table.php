<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('thirteenth_month_pay_items', function (Blueprint $table) {
            // Drop the old sss_deduction_total column
            $table->dropColumn('sss_deduction_total');
        });

        Schema::table('thirteenth_month_pay_items', function (Blueprint $table) {
            // Add the new overtime_pay_total column
            $table->decimal('overtime_pay_total', 14, 2)->default(0)->after('gross_pay_total');
        });
    }

    public function down()
    {
        Schema::table('thirteenth_month_pay_items', function (Blueprint $table) {
            $table->dropColumn('overtime_pay_total');
        });

        Schema::table('thirteenth_month_pay_items', function (Blueprint $table) {
            $table->decimal('sss_deduction_total', 14, 2)->default(0)->after('gross_pay_total');
        });
    }
};
