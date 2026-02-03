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
        Schema::table('roles', function (Blueprint $table) {
            $table->unsignedBigInteger('parent_role_id')->nullable()->after('priority');
            $table->text('reporting_structure')->nullable()->after('parent_role_id');
            $table->json('module_access')->nullable()->after('reporting_structure');
            $table->json('data_visibility_scope')->nullable()->after('module_access');
            $table->json('user_management_capabilities')->nullable()->after('data_visibility_scope');
            $table->json('system_configuration_access')->nullable()->after('user_management_capabilities');
            $table->json('reporting_permissions')->nullable()->after('system_configuration_access');
            $table->json('role_specific_limitations')->nullable()->after('reporting_permissions');
            
            $table->foreign('parent_role_id')->references('id')->on('roles')->onDelete('set null');
            $table->index('parent_role_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropForeign(['parent_role_id']);
            $table->dropIndex(['parent_role_id']);
            $table->dropColumn([
                'parent_role_id',
                'reporting_structure',
                'module_access',
                'data_visibility_scope',
                'user_management_capabilities',
                'system_configuration_access',
                'reporting_permissions',
                'role_specific_limitations'
            ]);
        });
    }
};
