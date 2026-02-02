<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurance_claims', function (Blueprint $table) {
            $table->id();
            
            // Relationships
            $table->foreignId('bill_id')->constrained()->onDelete('cascade');
            $table->foreignId('patient_insurance_id')->constrained()->onDelete('cascade');
            
            // Claim identification
            $table->string('claim_number')->unique();
            
            // Financial details
            $table->decimal('claim_amount', 10, 2);
            $table->decimal('approved_amount', 10, 2)->nullable();
            $table->decimal('deductible_amount', 10, 2)->default(0.00);
            $table->decimal('co_pay_amount', 10, 2)->default(0.00);
            
            // Status tracking
            $table->enum('status', [
                'draft',
                'pending',
                'submitted',
                'under_review',
                'approved',
                'partial_approved',
                'rejected',
                'appealed'
            ])->default('draft');
            
            // Dates
            $table->date('submission_date')->nullable();
            $table->date('response_date')->nullable();
            $table->date('approval_date')->nullable();
            
            // Rejection details
            $table->text('rejection_reason')->nullable();
            $table->json('rejection_codes')->nullable();
            
            // Documents
            $table->json('documents')->nullable(); // Array of file paths
            
            // Notes
            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            
            // User tracking
            $table->foreignId('submitted_by')->nullable()->constrained('users');
            $table->foreignId('processed_by')->nullable()->constrained('users');
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('bill_id');
            $table->index('patient_insurance_id');
            $table->index('claim_number');
            $table->index('status');
            $table->index('submission_date');
            $table->index(['status', 'submission_date']);
        });
        
        // Add foreign key to payments table after insurance_claims is created
        Schema::table('payments', function (Blueprint $table) {
            $table->foreign('insurance_claim_id')
                ->references('id')
                ->on('insurance_claims')
                ->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropForeign(['insurance_claim_id']);
        });
        
        Schema::dropIfExists('insurance_claims');
    }
};
