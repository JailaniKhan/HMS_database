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
            // Make doctor_id and department_id nullable to allow appointments without specific doctor
            $table->foreignId('doctor_id')->nullable()->change();
            $table->foreignId('department_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Revert to NOT NULL (be careful with this - may cause data loss)
            $table->foreignId('doctor_id')->change();
            $table->foreignId('department_id')->change();
        });
    }
};
