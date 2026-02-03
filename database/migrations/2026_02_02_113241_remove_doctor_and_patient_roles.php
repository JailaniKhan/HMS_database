<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Remove Doctor and Patient roles from the system and set affected users to null role.
     */
    public function up(): void
    {
        // Set role to null for users with Doctor or Patient role
        DB::table('users')
            ->whereIn('role', ['Doctor', 'Patient'])
            ->update(['role' => null, 'role_id' => null]);

        // Delete Doctor and Patient roles from roles table
        DB::table('roles')
            ->whereIn('slug', ['doctor', 'patient'])
            ->delete();

        // Remove any role_permission_mappings for Doctor and Patient roles
        $doctorPatientRoleIds = DB::table('roles')
            ->whereIn('slug', ['doctor', 'patient'])
            ->pluck('id');

        if ($doctorPatientRoleIds->isNotEmpty()) {
            DB::table('role_permission_mappings')
                ->whereIn('role_id', $doctorPatientRoleIds)
                ->delete();
        }

        // Remove from legacy role_permissions table
        DB::table('role_permissions')
            ->whereIn('role', ['Doctor', 'Patient'])
            ->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Recreate the Doctor and Patient roles
        $now = now();
        DB::table('roles')->insert([
            [
                'name' => 'Doctor',
                'slug' => 'doctor',
                'description' => 'Doctor access',
                'is_system' => false,
                'priority' => 50,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'name' => 'Patient',
                'slug' => 'patient',
                'description' => 'Patient access',
                'is_system' => false,
                'priority' => 10,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }
};
