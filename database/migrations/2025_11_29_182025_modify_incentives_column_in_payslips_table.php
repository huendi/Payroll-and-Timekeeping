<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->decimal('incentives', 12, 2)->nullable()->change();
        });
    }

    public function down()
    {
        Schema::table('payslips', function (Blueprint $table) {
            $table->decimal('incentives', 12, 2)->nullable()->default(0)->change();
        });
    }
};
