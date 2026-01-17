<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $permissions = [
            // User Management Permissions
            [
                'name' => 'view-users',
                'description' => 'View user list',
                'resource' => 'users',
                'action' => 'view'
            ],
            [
                'name' => 'create-users',
                'description' => 'Create new users',
                'resource' => 'users',
                'action' => 'create'
            ],
            [
                'name' => 'edit-users',
                'description' => 'Edit existing users',
                'resource' => 'users',
                'action' => 'edit'
            ],
            [
                'name' => 'delete-users',
                'description' => 'Delete users',
                'resource' => 'users',
                'action' => 'delete'
            ],
            [
                'name' => 'view-dashboard',
                'description' => 'View main dashboard',
                'resource' => 'dashboard',
                'action' => 'view'
            ],
            
            // Patient Management Permissions
            [
                'name' => 'view-patients',
                'description' => 'View patient list',
                'resource' => 'patients',
                'action' => 'view'
            ],
            [
                'name' => 'create-patients',
                'description' => 'Create new patients',
                'resource' => 'patients',
                'action' => 'create'
            ],
            [
                'name' => 'edit-patients',
                'description' => 'Edit existing patients',
                'resource' => 'patients',
                'action' => 'edit'
            ],
            [
                'name' => 'delete-patients',
                'description' => 'Delete patients',
                'resource' => 'patients',
                'action' => 'delete'
            ],
            
            // Doctor Management Permissions
            [
                'name' => 'view-doctors',
                'description' => 'View doctor list',
                'resource' => 'doctors',
                'action' => 'view'
            ],
            [
                'name' => 'create-doctors',
                'description' => 'Create new doctors',
                'resource' => 'doctors',
                'action' => 'create'
            ],
            [
                'name' => 'edit-doctors',
                'description' => 'Edit existing doctors',
                'resource' => 'doctors',
                'action' => 'edit'
            ],
            [
                'name' => 'delete-doctors',
                'description' => 'Delete doctors',
                'resource' => 'doctors',
                'action' => 'delete'
            ],
            
            // Appointment Management Permissions
            [
                'name' => 'view-appointments',
                'description' => 'View appointment list',
                'resource' => 'appointments',
                'action' => 'view'
            ],
            [
                'name' => 'create-appointments',
                'description' => 'Create new appointments',
                'resource' => 'appointments',
                'action' => 'create'
            ],
            [
                'name' => 'edit-appointments',
                'description' => 'Edit existing appointments',
                'resource' => 'appointments',
                'action' => 'edit'
            ],
            [
                'name' => 'delete-appointments',
                'description' => 'Delete appointments',
                'resource' => 'appointments',
                'action' => 'delete'
            ],
            
            // Billing Management Permissions
            [
                'name' => 'view-billing',
                'description' => 'View billing information',
                'resource' => 'billing',
                'action' => 'view'
            ],
            [
                'name' => 'create-billing',
                'description' => 'Create new billing records',
                'resource' => 'billing',
                'action' => 'create'
            ],
            [
                'name' => 'edit-billing',
                'description' => 'Edit existing billing records',
                'resource' => 'billing',
                'action' => 'edit'
            ],
            [
                'name' => 'delete-billing',
                'description' => 'Delete billing records',
                'resource' => 'billing',
                'action' => 'delete'
            ],
            
            // Pharmacy Management Permissions
            [
                'name' => 'view-pharmacy',
                'description' => 'View pharmacy section',
                'resource' => 'pharmacy',
                'action' => 'view'
            ],
            [
                'name' => 'create-medicines',
                'description' => 'Create new medicines',
                'resource' => 'medicines',
                'action' => 'create'
            ],
            [
                'name' => 'edit-medicines',
                'description' => 'Edit existing medicines',
                'resource' => 'medicines',
                'action' => 'edit'
            ],
            [
                'name' => 'delete-medicines',
                'description' => 'Delete medicines',
                'resource' => 'medicines',
                'action' => 'delete'
            ],
            
            // Laboratory Management Permissions
            [
                'name' => 'view-laboratory',
                'description' => 'View laboratory section',
                'resource' => 'laboratory',
                'action' => 'view'
            ],
            [
                'name' => 'create-lab-tests',
                'description' => 'Create new lab tests',
                'resource' => 'lab-tests',
                'action' => 'create'
            ],
            [
                'name' => 'edit-lab-tests',
                'description' => 'Edit existing lab tests',
                'resource' => 'lab-tests',
                'action' => 'edit'
            ],
            [
                'name' => 'delete-lab-tests',
                'description' => 'Delete lab tests',
                'resource' => 'lab-tests',
                'action' => 'delete'
            ],
            
            // Reports Management Permissions
            [
                'name' => 'view-reports',
                'description' => 'View reports section',
                'resource' => 'reports',
                'action' => 'view'
            ],
            
            // Settings Management Permissions
            [
                'name' => 'view-settings',
                'description' => 'View settings section',
                'resource' => 'settings',
                'action' => 'view'
            ],
            
            // Department Management Permissions
            [
                'name' => 'view-departments',
                'description' => 'View department list',
                'resource' => 'departments',
                'action' => 'view'
            ],
            [
                'name' => 'create-departments',
                'description' => 'Create new departments',
                'resource' => 'departments',
                'action' => 'create'
            ],
            [
                'name' => 'edit-departments',
                'description' => 'Edit existing departments',
                'resource' => 'departments',
                'action' => 'edit'
            ],
            [
                'name' => 'delete-departments',
                'description' => 'Delete departments',
                'resource' => 'departments',
                'action' => 'delete'
            ],
            

        ];
        
        foreach ($permissions as $permission) {
            \App\Models\Permission::firstOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }
    }
}
