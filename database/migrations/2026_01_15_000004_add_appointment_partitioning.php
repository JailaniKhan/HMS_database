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
        // Skip partitioning for now due to MySQL constraints
        // Partitioning requires primary key to include partitioning column
        // This would require significant schema changes
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