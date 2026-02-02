<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('patient_insurances', function (Blueprint $table) {
            $table->id();
            
            // Relationships
            $table->foreignId('patient_id')->constrained()->onDelete('cascade');
            $table->foreignId('insurance_provider_id')->constrained()->onDelete('cascade');
            
            // Policy details
            $table->string('policy_number');
            $table->string('policy_holder_name');
            $table->string('relationship_to_patient')->default('self'); // self, spouse, child, parent
            
            // Coverage period
            $table->date('coverage_start_date');
            $table->date('coverage_end_date')->nullable();
            
            // Co-pay details
            $table->decimal('co_pay_amount', 10, 2)->default(0.00);
            $table->decimal('co_pay_percentage', 5, 2)->default(0.00);
            $table->decimal('deductible_amount', 10, 2)->default(0.00);
            $table->decimal('deductible_met', 10, 2)->default(0.00);
            
            // Coverage limits
            $table->decimal('annual_max_coverage', 12, 2)->nullable();
            $table->decimal('annual_used_amount', 12, 2)->default(0.00);
            
            // Priority
            $table->boolean('is_primary')->default(false);
            $table->integer('priority_order')->default(1);
            
            // Status
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->unique(['patient_id', 'policy_number']);
            $table->index(['patient_id', 'is_active']);
            $table->index(['insurance_provider_id', 'is_active']);
            $table->index('policy_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('patient_insurances');
    }
};
