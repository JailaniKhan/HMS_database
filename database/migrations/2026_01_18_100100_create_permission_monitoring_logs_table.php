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
        Schema::create('permission_monitoring_logs', function (Blueprint $table) {
            $table->id();
            $table->string('metric_type'); // e.g., 'response_time', 'cache_hit_rate', 'db_query_time'
            $table->decimal('value', 15, 4)->nullable(); // Numeric value for metrics
            $table->json('metadata')->nullable(); // Additional data like user_id, endpoint, etc.
            $table->timestamp('logged_at')->useCurrent();
            $table->timestamps();

            $table->index(['metric_type', 'logged_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('permission_monitoring_logs');
    }
};
