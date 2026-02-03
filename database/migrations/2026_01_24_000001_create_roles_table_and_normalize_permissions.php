<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * This migration normalizes the role system by creating a proper roles table
     * and migrating existing string-based roles to the new structure.
     */
    public function up(): void
    {
        // Create roles table
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->string('slug')->unique();
            $table->string('description')->nullable();
            $table->boolean('is_system')->default(false); // System roles cannot be deleted
            $table->integer('priority')->default(0); // Higher priority = more important
            $table->timestamps();

            $table->index('slug');
            $table->index('is_system');
        });

        // Add role_id to users table
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('role_id')->nullable()->after('role');
        });

        // Insert default roles based on existing role strings
        $defaultRoles = [
            ['name' => 'Super Admin', 'slug' => 'super-admin', 'description' => 'Full system access', 'is_system' => true, 'priority' => 100],
            ['name' => 'Sub Super Admin', 'slug' => 'sub-super-admin', 'description' => 'Administrative access with some restrictions', 'is_system' => true, 'priority' => 90],
            ['name' => 'Hospital Admin', 'slug' => 'hospital-admin', 'description' => 'Hospital management access', 'is_system' => false, 'priority' => 80],
            ['name' => 'Reception Admin', 'slug' => 'reception-admin', 'description' => 'Reception and patient management', 'is_system' => false, 'priority' => 60],
            ['name' => 'Pharmacy Admin', 'slug' => 'pharmacy-admin', 'description' => 'Pharmacy management access', 'is_system' => false, 'priority' => 60],
            ['name' => 'Laboratory Admin', 'slug' => 'laboratory-admin', 'description' => 'Laboratory management access', 'is_system' => false, 'priority' => 60],
        ];

        $now = now();
        foreach ($defaultRoles as &$role) {
            $role['created_at'] = $now;
            $role['updated_at'] = $now;
        }

        DB::table('roles')->insert($defaultRoles);

        // Migrate existing users to use role_id
        $roles = DB::table('roles')->get()->keyBy('name');
        
        DB::table('users')->orderBy('id')->chunk(100, function ($users) use ($roles) {
            foreach ($users as $user) {
                if (isset($roles[$user->role])) {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['role_id' => $roles[$user->role]->id]);
                }
            }
        });

        // Add foreign key constraint
        Schema::table('users', function (Blueprint $table) {
            $table->foreign('role_id')->references('id')->on('roles')->onDelete('set null');
            $table->index('role_id');
        });

        // Create new normalized role_permissions table
        Schema::create('role_permission_mappings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('role_id');
            $table->unsignedBigInteger('permission_id');
            $table->timestamps();

            $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
            $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
            $table->unique(['role_id', 'permission_id']);
            $table->index('role_id');
            $table->index('permission_id');
        });

        // Migrate existing role_permissions to new structure
        $existingRolePermissions = DB::table('role_permissions')->get();
        
        foreach ($existingRolePermissions as $rp) {
            if (isset($roles[$rp->role])) {
                DB::table('role_permission_mappings')->insertOrIgnore([
                    'role_id' => $roles[$rp->role]->id,
                    'permission_id' => $rp->permission_id,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropColumn('role_id');
        });

        Schema::dropIfExists('role_permission_mappings');
        Schema::dropIfExists('roles');
    }
};
