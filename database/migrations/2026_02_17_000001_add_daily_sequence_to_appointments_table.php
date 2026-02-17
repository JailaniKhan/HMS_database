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
        Schema::table('appointments', function (Blueprint $table) {
            $table->unsignedInteger('daily_sequence')->nullable()->after('appointment_id');
            $table->index(['doctor_id', 'appointment_date', 'daily_sequence'], 'idx_doctor_daily_sequence');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_doctor_daily_sequence');
            $table->dropColumn('daily_sequence');
        });
    }
};
