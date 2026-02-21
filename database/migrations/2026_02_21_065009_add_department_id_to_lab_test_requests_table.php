<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Add department_id foreign key to lab_test_requests table for
     * Lab Test Request to Department relationship feature.
     */
    public function up(): void
    {
        Schema::table('lab_test_requests', function (Blueprint $table) {
            // Add nullable department_id foreign key
            $table->foreignId('department_id')
                ->nullable()
                ->constrained('departments')
                ->onDelete('set null')
                ->after('doctor_id');

            // Add composite index for department_id and status
            $table->index(['department_id', 'status'], 'lab_test_requests_dept_status_idx');

            // Add composite index for department_id and created_at
            $table->index(['department_id', 'created_at'], 'lab_test_requests_dept_created_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lab_test_requests', function (Blueprint $table) {
            // Drop the composite indexes first
            $table->dropIndex('lab_test_requests_dept_status_idx');
            $table->dropIndex('lab_test_requests_dept_created_idx');

            // Drop the foreign key column
            $table->dropForeign(['department_id']);
            $table->dropColumn('department_id');
        });
    }
};
