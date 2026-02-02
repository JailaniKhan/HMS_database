<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_refunds', function (Blueprint $table) {
            $table->id();
            
            // Relationships
            $table->foreignId('bill_id')->constrained()->onDelete('cascade');
            $table->foreignId('payment_id')->nullable()->constrained()->onDelete('set null');
            $table->foreignId('bill_item_id')->nullable()->constrained()->onDelete('set null');
            
            // Refund details
            $table->decimal('refund_amount', 10, 2);
            $table->enum('refund_type', ['full', 'partial', 'item'])->default('partial');
            $table->text('refund_reason');
            $table->dateTime('refund_date');
            
            // Refund method
            $table->enum('refund_method', [
                'cash',
                'card',
                'bank_transfer',
                'check'
            ]);
            $table->string('reference_number')->nullable();
            
            // Approval workflow
            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
                'processed'
            ])->default('pending');
            $table->foreignId('requested_by')->constrained('users');
            $table->foreignId('approved_by')->nullable()->constrained('users');
            $table->timestamp('approved_at')->nullable();
            $table->text('rejection_reason')->nullable();
            
            // Processing
            $table->foreignId('processed_by')->nullable()->constrained('users');
            $table->timestamp('processed_at')->nullable();
            
            // Notes
            $table->text('notes')->nullable();
            
            $table->timestamps();
            
            // Indexes
            $table->index('bill_id');
            $table->index('payment_id');
            $table->index('status');
            $table->index('refund_date');
            $table->index(['bill_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_refunds');
    }
};
