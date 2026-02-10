<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Appointments table indexes
        Schema::table('appointments', function (Blueprint $table) {
            if (!$this->indexExists('appointments', 'idx_appointments_patient_date')) {
                $table->index(['patient_id', 'appointment_date'], 'idx_appointments_patient_date');
            }
            if (!$this->indexExists('appointments', 'idx_appointments_doctor_date')) {
                $table->index(['doctor_id', 'appointment_date'], 'idx_appointments_doctor_date');
            }
            if (!$this->indexExists('appointments', 'idx_appointments_dept_status')) {
                $table->index(['department_id', 'status'], 'idx_appointments_dept_status');
            }
            if (!$this->indexExists('appointments', 'idx_appointments_date')) {
                $table->index('appointment_date', 'idx_appointments_date');
            }
        });

        // Bills table indexes
        Schema::table('bills', function (Blueprint $table) {
            if (!$this->indexExists('bills', 'idx_bills_patient_date')) {
                $table->index(['patient_id', 'bill_date'], 'idx_bills_patient_date');
            }
            if (!$this->indexExists('bills', 'idx_bills_status_created')) {
                $table->index(['payment_status', 'created_at'], 'idx_bills_status_created');
            }
            if (!$this->indexExists('bills', 'idx_bills_date')) {
                $table->index('bill_date', 'idx_bills_date');
            }
        });

        // Doctors table indexes
        Schema::table('doctors', function (Blueprint $table) {
            if (!$this->indexExists('doctors', 'idx_doctors_user')) {
                $table->index('user_id', 'idx_doctors_user');
            }
            if (!$this->indexExists('doctors', 'idx_doctors_dept')) {
                $table->index('department_id', 'idx_doctors_dept');
            }
            if (!$this->indexExists('doctors', 'idx_doctors_status')) {
                $table->index('status', 'idx_doctors_status');
            }
        });

        // Patients table indexes
        Schema::table('patients', function (Blueprint $table) {
            if (!$this->indexExists('patients', 'idx_patients_user')) {
                $table->index('user_id', 'idx_patients_user');
            }
            if (!$this->indexExists('patients', 'idx_patients_name')) {
                $table->index('first_name', 'idx_patients_name');
            }
        });

        // Medicines table indexes
        Schema::table('medicines', function (Blueprint $table) {
            if (!$this->indexExists('medicines', 'idx_medicines_category')) {
                $table->index('category_id', 'idx_medicines_category'); // Assuming added later
            }
            if (!$this->indexExists('medicines', 'idx_medicines_expiry')) {
                $table->index('expiry_date', 'idx_medicines_expiry');
            }
            if (!$this->indexExists('medicines', 'idx_medicines_status')) {
                $table->index('status', 'idx_medicines_status');
            }
        });

        // Lab tests and results
        Schema::table('lab_test_results', function (Blueprint $table) {
            if (!$this->indexExists('lab_test_results', 'idx_lab_results_patient_date')) {
                $table->index(['patient_id', 'created_at'], 'idx_lab_results_patient_date');
            }
            if (!$this->indexExists('lab_test_results', 'idx_lab_results_test')) {
                $table->index('test_id', 'idx_lab_results_test');
            }
        });

        // Sales and purchase orders
        Schema::table('sales', function (Blueprint $table) {
            if (!$this->indexExists('sales', 'idx_sales_patient')) {
                $table->index('patient_id', 'idx_sales_patient');
            }
            if (!$this->indexExists('sales', 'idx_sales_date')) {
                $table->index('created_at', 'idx_sales_date');
            }
        });

        // Sales indexes already added above
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            $table->dropIndex('idx_appointments_patient_date');
            $table->dropIndex('idx_appointments_doctor_date');
            $table->dropIndex('idx_appointments_dept_status');
            $table->dropIndex('idx_appointments_date');
        });

        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex('idx_bills_patient_date');
            $table->dropIndex('idx_bills_status_created');
            $table->dropIndex('idx_bills_date');
        });

        Schema::table('doctors', function (Blueprint $table) {
            $table->dropIndex('idx_doctors_user');
            $table->dropIndex('idx_doctors_dept');
            $table->dropIndex('idx_doctors_status');
        });

        Schema::table('patients', function (Blueprint $table) {
            $table->dropIndex('idx_patients_user');
            $table->dropIndex('idx_patients_name');
        });

        Schema::table('medicines', function (Blueprint $table) {
            $table->dropIndex('idx_medicines_category');
            $table->dropIndex('idx_medicines_expiry');
            $table->dropIndex('idx_medicines_status');
        });

        Schema::table('lab_test_results', function (Blueprint $table) {
            $table->dropIndex('idx_lab_results_patient_date');
            $table->dropIndex('idx_lab_results_test');
        });

        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('idx_sales_patient');
            $table->dropIndex('idx_sales_date');
        });

        // Sales indexes already removed above
    }

    private function indexExists(string $table, string $indexName): bool
    {
        $indexes = DB::select("
            SELECT INDEX_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND INDEX_NAME = ?
        ", [$table, $indexName]);

        return !empty($indexes);
    }
};