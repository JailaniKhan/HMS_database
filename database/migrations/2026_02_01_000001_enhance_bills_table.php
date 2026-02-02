<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            // Invoice and identification
            $table->string('invoice_number')->unique()->nullable()->after('bill_number');
            $table->date('due_date')->nullable()->after('bill_date');
            
            // Financial breakdown
            $table->decimal('total_discount', 10, 2)->default(0.00)->after('discount');
            $table->decimal('total_tax', 10, 2)->default(0.00)->after('tax');
            $table->decimal('balance_due', 10, 2)->default(0.00)->after('amount_due');
            
            // Billing address
            $table->json('billing_address')->nullable()->after('notes');
            
            // Payment tracking
            $table->timestamp('last_payment_date')->nullable()->after('balance_due');
            
            // Reminder tracking
            $table->integer('reminder_sent_count')->default(0)->after('last_payment_date');
            $table->timestamp('reminder_last_sent')->nullable()->after('reminder_sent_count');
            
            // Void tracking
            $table->timestamp('voided_at')->nullable()->after('reminder_last_sent');
            $table->foreignId('voided_by')->nullable()->constrained('users')->after('voided_at');
            $table->text('void_reason')->nullable()->after('voided_by');
            
            // Indexes for performance
            $table->index('invoice_number');
            $table->index('due_date');
            $table->index('payment_status');
            $table->index('status');
            $table->index(['patient_id', 'payment_status']);
            $table->index(['bill_date', 'payment_status']);
        });
    }

    public function down(): void
    {
        Schema::table('bills', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['voided_by']);
            
            // Drop indexes
            $table->dropIndex(['invoice_number']);
            $table->dropIndex(['due_date']);
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['status']);
            $table->dropIndex(['patient_id', 'payment_status']);
            $table->dropIndex(['bill_date', 'payment_status']);
            
            // Drop columns
            $table->dropColumn([
                'invoice_number',
                'due_date',
                'total_discount',
                'total_tax',
                'balance_due',
                'billing_address',
                'last_payment_date',
                'reminder_sent_count',
                'reminder_last_sent',
                'voided_at',
                'voided_by',
                'void_reason',
            ]);
        });
    }
};
