<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('billing_settings', function (Blueprint $table) {
            $table->id();
            
            // General settings
            $table->string('setting_key')->unique();
            $table->text('setting_value')->nullable();
            $table->string('data_type')->default('string'); // string, integer, float, boolean, json
            $table->string('group')->default('general');
            
            // Description
            $table->string('label');
            $table->text('description')->nullable();
            
            // UI hints
            $table->string('input_type')->default('text'); // text, number, select, checkbox, textarea
            $table->json('options')->nullable(); // For select inputs
            
            $table->timestamps();
            
            // Indexes
            $table->index('setting_key');
            $table->index('group');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('billing_settings');
    }
};
