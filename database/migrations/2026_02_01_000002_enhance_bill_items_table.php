<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bill_items', function (Blueprint $table) {
            // Item source tracking
            $table->enum('item_type', [
                'appointment',
                'lab_test',
                'pharmacy',
                'department_service',
                'manual'
            ])->default('manual')->after('bill_id');
            
            $table->string('source_type')->nullable()->after('item_type'); // App\Models\Appointment, etc.
            $table->unsignedBigInteger('source_id')->nullable()->after('source_type');
            
            // Enhanced pricing
            $table->decimal('discount_amount', 10, 2)->default(0.00)->after('unit_price');
            $table->decimal('discount_percentage', 5, 2)->default(0.00)->after('discount_amount');
            
            // Item categorization
            $table->string('category')->nullable()->after('item_description');
            
            // Indexes
            $table->index(['item_type', 'source_type', 'source_id']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::table('bill_items', function (Blueprint $table) {
            $table->dropColumn([
                'item_type',
                'source_type',
                'source_id',
                'discount_amount',
                'discount_percentage',
                'category',
            ]);
        });
    }
};
