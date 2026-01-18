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
        Schema::create('permission_health_checks', function (Blueprint $table) {
            $table->id();
            $table->string('check_type'); // e.g., 'database', 'cache', 'api_endpoints'
            $table->enum('status', ['healthy', 'warning', 'critical'])->default('healthy');
            $table->json('details')->nullable(); // Response times, error messages, etc.
            $table->timestamp('checked_at')->useCurrent();
            $table->timestamps();

            $table->index(['check_type', 'checked_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_health_checks');
    }
};
