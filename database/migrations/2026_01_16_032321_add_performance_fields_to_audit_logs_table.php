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
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->softDeletes();
            $table->float('response_time')->nullable()->after('severity');
            $table->unsignedBigInteger('memory_usage')->nullable()->after('response_time');
            $table->json('error_details')->nullable()->after('memory_usage');
            $table->string('request_method')->nullable()->after('error_details');
            $table->string('request_url')->nullable()->after('request_method');
            $table->string('session_id')->nullable()->after('request_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn(['response_time', 'memory_usage', 'error_details', 'request_method', 'request_url', 'session_id']);
        });
    }
};
