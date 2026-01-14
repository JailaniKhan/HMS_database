<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Note: Partitioning requires careful planning. This is a basic example.
        // In production, ensure MySQL supports partitioning and test thoroughly.

        // First, ensure no foreign keys depend on appointments (simplified)
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        // Create a temporary table with partitioning
        DB::statement("
            CREATE TABLE appointments_temp LIKE appointments
        ");

        DB::statement("
            ALTER TABLE appointments_temp
            PARTITION BY RANGE (YEAR(appointment_date)) (
                PARTITION p2024 VALUES LESS THAN (2025),
                PARTITION p2025 VALUES LESS THAN (2026),
                PARTITION p2026 VALUES LESS THAN (2027),
                PARTITION p_future VALUES LESS THAN MAXVALUE
            )
        ");

        // Copy data
        DB::statement("INSERT INTO appointments_temp SELECT * FROM appointments");

        // Rename tables
        DB::statement("RENAME TABLE appointments TO appointments_old, appointments_temp TO appointments");

        // Drop old table
        DB::statement("DROP TABLE appointments_old");

        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove partitioning by recreating table without it
        DB::statement('SET FOREIGN_KEY_CHECKS=0');

        DB::statement("
            CREATE TABLE appointments_temp AS
            SELECT * FROM appointments
        ");

        DB::statement("DROP TABLE appointments");
        DB::statement("ALTER TABLE appointments_temp RENAME TO appointments");

        // Recreate indexes and constraints as needed
        DB::statement('SET FOREIGN_KEY_CHECKS=1');
    }
};