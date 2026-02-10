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
        // Additional indexes for better performance

        // Patients table additional indexes
        Schema::table('patients', function (Blueprint $table) {
            if (!$this->indexExists('patients', 'idx_patients_phone')) {
                $table->index('phone', 'idx_patients_phone');
            }
            if (!$this->indexExists('patients', 'idx_patients_created')) {
                $table->index('created_at', 'idx_patients_created');
            }
        });

        // Medicines table additional indexes
        Schema::table('medicines', function (Blueprint $table) {
            if (!$this->indexExists('medicines', 'idx_medicines_name')) {
                $table->index('name', 'idx_medicines_name');
            }
        });

        // Audit logs additional indexes for performance
        Schema::table('audit_logs', function (Blueprint $table) {
            if (!$this->indexExists('audit_logs', 'idx_audit_user_time')) {
                $table->index(['user_id', 'logged_at'], 'idx_audit_user_time');
            }
            if (!$this->indexExists('audit_logs', 'idx_audit_module_severity')) {
                $table->index(['module', 'severity'], 'idx_audit_module_severity');
            }
        });

        // Sales items additional indexes
        Schema::table('sales_items', function (Blueprint $table) {
            if (!$this->indexExists('sales_items', 'idx_sales_items_medicine')) {
                $table->index('medicine_id', 'idx_sales_items_medicine');
            }
            if (!$this->indexExists('sales_items', 'idx_sales_items_sale')) {
                $table->index('sale_id', 'idx_sales_items_sale');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('patients', function (Blueprint $table) {
            $table->dropIndex('idx_patients_phone');
            $table->dropIndex('idx_patients_created');
        });

        Schema::table('medicines', function (Blueprint $table) {
            $table->dropIndex('idx_medicines_name');
        });

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('idx_audit_user_time');
            $table->dropIndex('idx_audit_module_severity');
        });

        Schema::table('sales_items', function (Blueprint $table) {
            $table->dropIndex('idx_sales_items_medicine');
            $table->dropIndex('idx_sales_items_sale');
        });
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
