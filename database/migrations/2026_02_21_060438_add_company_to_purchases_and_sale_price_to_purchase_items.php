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
        Schema::table('purchases', function (Blueprint $table) {
            $table->string('company')->nullable()->after('invoice_number');
        });

        Schema::table('purchase_items', function (Blueprint $table) {
            $table->decimal('sale_price', 10, 2)->nullable()->after('cost_price');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('purchases', function (Blueprint $table) {
            $table->dropColumn('company');
        });

        Schema::table('purchase_items', function (Blueprint $table) {
            $table->dropColumn('sale_price');
        });
    }
};
