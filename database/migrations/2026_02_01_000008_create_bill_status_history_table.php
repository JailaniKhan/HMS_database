<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bill_status_history', function (Blueprint $table) {
            $table->id();
            
            // Relationship
            $table->foreignId('bill_id')->constrained()->onDelete('cascade');
            
            // Status change
            $table->string('status_from')->nullable();
            $table->string('status_to');
            $table->string('field_name')->default('payment_status'); // payment_status, status, etc.
            
            // User and reason
            $table->foreignId('changed_by')->constrained('users');
            $table->text('reason')->nullable();
            
            // Additional data
            $table->json('metadata')->nullable();
            
            $table->timestamp('created_at');
            
            // Indexes
            $table->index('bill_id');
            $table->index('status_to');
            $table->index('changed_by');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bill_status_history');
    }
};
