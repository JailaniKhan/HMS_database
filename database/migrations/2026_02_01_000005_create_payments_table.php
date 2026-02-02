<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            
            // Relationship
            $table->foreignId('bill_id')->constrained()->onDelete('cascade');
            
            // Payment details
            $table->enum('payment_method', [
                'cash',
                'card',
                'insurance',
                'bank_transfer',
                'mobile_money',
                'check'
            ]);
            $table->decimal('amount', 10, 2);
            $table->dateTime('payment_date');
            
            // Transaction details
            $table->string('transaction_id')->nullable();
            $table->string('reference_number')->nullable();
            $table->string('card_last_four')->nullable();
            $table->string('card_type')->nullable(); // visa, mastercard, etc.
            $table->string('bank_name')->nullable();
            $table->string('check_number')->nullable();
            
            // For cash payments
            $table->decimal('amount_tendered', 10, 2)->nullable();
            $table->decimal('change_due', 10, 2)->nullable();
            
            // For insurance payments - foreign key added in migration 6 after insurance_claims table is created
            $table->unsignedBigInteger('insurance_claim_id')->nullable();
            
            // User tracking
            $table->foreignId('received_by')->constrained('users');
            
            // Notes
            $table->text('notes')->nullable();
            
            // Status
            $table->enum('status', ['completed', 'pending', 'failed', 'refunded'])->default('completed');
            
            $table->timestamps();
            
            // Indexes
            $table->index('bill_id');
            $table->index('payment_method');
            $table->index('payment_date');
            $table->index('transaction_id');
            $table->index('status');
            $table->index(['bill_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
