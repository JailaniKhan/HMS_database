<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insurance_providers', function (Blueprint $table) {
            $table->id();
            
            // Basic info
            $table->string('name');
            $table->string('code')->unique();
            $table->text('description')->nullable();
            
            // Contact information
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('website')->nullable();
            $table->json('address')->nullable();
            
            // Coverage details
            $table->json('coverage_types')->nullable(); // ['inpatient', 'outpatient', 'pharmacy', 'lab']
            $table->decimal('max_coverage_amount', 12, 2)->nullable();
            
            // API integration (for future)
            $table->string('api_endpoint')->nullable();
            $table->string('api_key')->nullable();
            
            // Status
            $table->boolean('is_active')->default(true);
            
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('code');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insurance_providers');
    }
};
