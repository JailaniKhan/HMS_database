<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * This migration adds the stock_quantity column to the medicines table as an integer
     * (to match the Medicine model's $casts configuration).
     */
    public function up(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            // Check if column doesn't exist before adding
            if (!Schema::hasColumn('medicines', 'stock_quantity')) {
                $table->integer('stock_quantity')->default(0)->after('quantity');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('medicines', function (Blueprint $table) {
            $table->dropColumn(['stock_quantity']);
        });
    }
};
