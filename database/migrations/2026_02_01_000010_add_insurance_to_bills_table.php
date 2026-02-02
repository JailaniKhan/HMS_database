<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            // Insurance relationship
            $table->foreignId('primary_insurance_id')
                ->nullable()
                ->constrained('patient_insurances')
                ->after('created_by')
                ->onDelete('set null');
            
            // Insurance amounts
            $table->decimal('insurance_claim_amount', 10, 2)
                ->default(0.00)
                ->after('total_tax');
            $table->decimal('insurance_approved_amount', 10, 2)
                ->nullable()
                ->after('insurance_claim_amount');
            $table->decimal('patient_responsibility', 10, 2)
                ->default(0.00)
                ->after('insurance_approved_amount');
            
            // Indexes
            $table->index('primary_insurance_id');
        });
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            $table->dropForeign(['primary_insurance_id']);
            $table->dropColumn([
                'primary_insurance_id',
                'insurance_claim_amount',
                'insurance_approved_amount',
                'patient_responsibility',
            ]);
        });
    }
};
