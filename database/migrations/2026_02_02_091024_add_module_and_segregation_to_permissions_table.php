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
        Schema::table('permissions', function (Blueprint $table) {
            $table->string('module')->nullable()->after('category');
            $table->string('segregation_group')->nullable()->after('module');
            $table->boolean('requires_approval')->default(false)->after('segregation_group');
            $table->integer('risk_level')->default(1)->after('requires_approval'); // 1=low, 2=medium, 3=high
            $table->json('dependencies')->nullable()->after('risk_level');
            $table->text('hipaa_impact')->nullable()->after('dependencies');
            $table->boolean('is_critical')->default(false)->after('hipaa_impact');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('permissions', function (Blueprint $table) {
            $table->dropColumn([
                'module',
                'segregation_group',
                'requires_approval',
                'risk_level',
                'dependencies',
                'hipaa_impact',
                'is_critical'
            ]);
        });
    }
};
