<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration adds indexes to improve query performance for the pharmacy module.
     */
    public function up(): void
    {
        // Add indexes to medicines table
        Schema::table('medicines', function (Blueprint $table) {
            // Index for medicine_id lookups (unique identifier)
            $table->index('medicine_id', 'medicines_medicine_id_index');
            
            // Index for category filtering
            $table->index('category_id', 'medicines_category_id_index');
            
            // Index for expiry date queries (expiring soon, expired)
            $table->index('expiry_date', 'medicines_expiry_date_index');
            
            // Index for stock quantity queries (low stock, out of stock)
            $table->index('stock_quantity', 'medicines_stock_quantity_index');
            
            // Composite index for low stock queries
            $table->index(['stock_quantity', 'reorder_level'], 'medicines_stock_reorder_index');
            
            // Index for batch number searches
            $table->index('batch_number', 'medicines_batch_number_index');
            
            // Index for manufacturer searches
            $table->index('manufacturer', 'medicines_manufacturer_index');
            
            // Index for status filtering
            $table->index('status', 'medicines_status_index');
            
            // Composite index for common stock status queries
            $table->index(['stock_quantity', 'expiry_date'], 'medicines_stock_expiry_index');
        });

        // Add indexes to sales table
        Schema::table('sales', function (Blueprint $table) {
            // Index for sale_id lookups
            $table->index('sale_id', 'sales_sale_id_index');
            
            // Index for patient filtering
            $table->index('patient_id', 'sales_patient_id_index');
            
            // Index for user/staff filtering
            $table->index('sold_by', 'sales_sold_by_index');
            
            // Index for status filtering
            $table->index('status', 'sales_status_index');
            
            // Index for payment method filtering
            $table->index('payment_method', 'sales_payment_method_index');
            
            // Index for date range queries
            $table->index('created_at', 'sales_created_at_index');
            
            // Composite index for common sales report queries
            $table->index(['status', 'created_at'], 'sales_status_date_index');
            
            // Composite index for patient sales history
            $table->index(['patient_id', 'created_at'], 'sales_patient_date_index');
        });

        // Add indexes to sales_items table
        Schema::table('sales_items', function (Blueprint $table) {
            // Index for sale relationship
            $table->index('sale_id', 'sales_items_sale_id_index');
            
            // Index for medicine relationship
            $table->index('medicine_id', 'sales_items_medicine_id_index');
            
            // Composite index for medicine sales analysis
            $table->index(['medicine_id', 'created_at'], 'sales_items_medicine_date_index');
        });

        // Add indexes to stock_movements table
        Schema::table('stock_movements', function (Blueprint $table) {
            // Index for medicine relationship
            $table->index('medicine_id', 'stock_movements_medicine_id_index');
            
            // Index for movement type filtering
            $table->index('type', 'stock_movements_type_index');
            
            // Index for reference type filtering
            $table->index('reference_type', 'stock_movements_reference_type_index');
            
            // Index for user who made the movement
            $table->index('user_id', 'stock_movements_user_id_index');
            
            // Index for date range queries
            $table->index('created_at', 'stock_movements_created_at_index');
            
            // Composite index for medicine movement history
            $table->index(['medicine_id', 'created_at'], 'stock_movements_medicine_date_index');
            
            // Composite index for reference lookups
            $table->index(['reference_type', 'reference_id'], 'stock_movements_reference_index');
        });

        // Add indexes to medicine_alerts table
        Schema::table('medicine_alerts', function (Blueprint $table) {
            // Index for medicine relationship
            $table->index('medicine_id', 'medicine_alerts_medicine_id_index');
            
            // Index for alert type filtering
            $table->index('alert_type', 'medicine_alerts_alert_type_index');
            
            // Index for status filtering
            $table->index('status', 'medicine_alerts_status_index');
            
            // Index for priority filtering
            $table->index('priority', 'medicine_alerts_priority_index');
            
            // Index for triggered_at date
            $table->index('triggered_at', 'medicine_alerts_triggered_at_index');
            
            // Composite index for pending alerts queries
            $table->index(['status', 'priority'], 'medicine_alerts_status_priority_index');
        });

        // Add indexes to medicine_categories table
        Schema::table('medicine_categories', function (Blueprint $table) {
            // Index for name searches
            $table->index('name', 'medicine_categories_name_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove indexes from medicines table
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropIndex('medicines_medicine_id_index');
            $table->dropIndex('medicines_category_id_index');
            $table->dropIndex('medicines_expiry_date_index');
            $table->dropIndex('medicines_stock_quantity_index');
            $table->dropIndex('medicines_stock_reorder_index');
            $table->dropIndex('medicines_batch_number_index');
            $table->dropIndex('medicines_manufacturer_index');
            $table->dropIndex('medicines_status_index');
            $table->dropIndex('medicines_stock_expiry_index');
        });

        // Remove indexes from sales table
        Schema::table('sales', function (Blueprint $table) {
            $table->dropIndex('sales_sale_id_index');
            $table->dropIndex('sales_patient_id_index');
            $table->dropIndex('sales_sold_by_index');
            $table->dropIndex('sales_status_index');
            $table->dropIndex('sales_payment_method_index');
            $table->dropIndex('sales_created_at_index');
            $table->dropIndex('sales_status_date_index');
            $table->dropIndex('sales_patient_date_index');
        });

        // Remove indexes from sales_items table
        Schema::table('sales_items', function (Blueprint $table) {
            $table->dropIndex('sales_items_sale_id_index');
            $table->dropIndex('sales_items_medicine_id_index');
            $table->dropIndex('sales_items_medicine_date_index');
        });

        // Remove indexes from stock_movements table
        Schema::table('stock_movements', function (Blueprint $table) {
            $table->dropIndex('stock_movements_medicine_id_index');
            $table->dropIndex('stock_movements_type_index');
            $table->dropIndex('stock_movements_reference_type_index');
            $table->dropIndex('stock_movements_user_id_index');
            $table->dropIndex('stock_movements_created_at_index');
            $table->dropIndex('stock_movements_medicine_date_index');
            $table->dropIndex('stock_movements_reference_index');
        });

        // Remove indexes from medicine_alerts table
        Schema::table('medicine_alerts', function (Blueprint $table) {
            $table->dropIndex('medicine_alerts_medicine_id_index');
            $table->dropIndex('medicine_alerts_alert_type_index');
            $table->dropIndex('medicine_alerts_status_index');
            $table->dropIndex('medicine_alerts_priority_index');
            $table->dropIndex('medicine_alerts_triggered_at_index');
            $table->dropIndex('medicine_alerts_status_priority_index');
        });

        // Remove indexes from medicine_categories table
        Schema::table('medicine_categories', function (Blueprint $table) {
            $table->dropIndex('medicine_categories_name_index');
        });
    }
};