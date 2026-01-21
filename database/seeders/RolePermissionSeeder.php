<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Define role-permission mappings
        // Most roles now have empty permissions by default
        // Permissions should be assigned manually through the admin panel
        $rolePermissions = [
            'Super Admin' => [
                // Maintain essential admin-level permissions for system management
                'manage-users', 'manage-permissions', 'view-activity-logs',
            ],
            'Sub Super Admin' => [
                // No default permissions - assign manually
            ],
            'Pharmacy Admin' => [
                // No default permissions - assign manually
            ],
            'Laboratory Admin' => [
                // No default permissions - assign manually
            ],
            'Reception Admin' => [
                // No default permissions - assign manually
            ],

        ];

        foreach ($rolePermissions as $role => $permissions) {
            foreach ($permissions as $permissionName) {
                $permission = \App\Models\Permission::where('name', $permissionName)->first();

                if ($permission) {
                    \App\Models\RolePermission::firstOrCreate(
                        [
                            'role' => $role,
                            'permission_id' => $permission->id,
                        ]
                    );
                }
            }
        }
    }
}
