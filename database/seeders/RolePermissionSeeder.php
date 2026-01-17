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
        $rolePermissions = [
            'Super Admin' => [
                'view-users', 'create-users', 'edit-users', 'delete-users',
                'view-patients', 'create-patients', 'edit-patients', 'delete-patients',
                'view-doctors', 'create-doctors', 'edit-doctors', 'delete-doctors',
                'view-appointments', 'create-appointments', 'edit-appointments', 'delete-appointments',
                'view-billing', 'create-billing', 'edit-billing', 'delete-billing',
                'view-pharmacy', 'create-medicines', 'edit-medicines', 'delete-medicines',
                'view-laboratory', 'create-lab-tests', 'edit-lab-tests', 'delete-lab-tests',
                'view-dashboard', 'view-reports', 'view-settings',
                'manage-users', 'manage-permissions', 'view-activity-logs', 'manage-departments',
                'view-departments', 'create-departments', 'edit-departments', 'delete-departments',
            ],
            'Sub Super Admin' => [
                'view-users',
                'view-patients', 'create-patients', 'edit-patients', 'delete-patients',
                'view-doctors', 'create-doctors', 'edit-doctors', 'delete-doctors',
                'view-appointments', 'create-appointments', 'edit-appointments', 'delete-appointments',
                'view-billing', 'create-billing', 'edit-billing', 'delete-billing',
                'view-pharmacy', 'create-medicines', 'edit-medicines', 'delete-medicines',
                'view-laboratory', 'create-lab-tests', 'edit-lab-tests', 'delete-lab-tests',
                'view-dashboard', 'view-reports',
            ],
            'Pharmacy Admin' => [
                'view-pharmacy', 'create-medicines', 'edit-medicines', 'delete-medicines',
                'view-reports',
            ],
            'Laboratory Admin' => [
                'view-laboratory', 'create-lab-tests', 'edit-lab-tests', 'delete-lab-tests',
                'view-reports',
            ],
            'Reception Admin' => [
                'view-users',
                'view-patients', 'create-patients', 'edit-patients', 'delete-patients',
                'view-doctors', 'create-doctors', 'edit-doctors', 'delete-doctors',
                'view-appointments', 'create-appointments', 'edit-appointments', 'delete-appointments',
                'view-billing', 'create-billing', 'edit-billing', 'delete-billing',
                'view-reports',
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
