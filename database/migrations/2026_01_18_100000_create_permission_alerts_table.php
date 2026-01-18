<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('permission_alerts', function (Blueprint $table) {
            $table->id();
            $table->enum('alert_type', ['critical', 'high', 'medium', 'low'])->default('medium');
            $table->string('title');
            $table->text('message');
            $table->json('data')->nullable();
            $table->enum('status', ['active', 'acknowledged', 'resolved'])->default('active');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_alerts');
    }
};
