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
                'action' => 'view',
                'category' => 'User Management'
            ],
            [
                'name' => 'create-users',
                'description' => 'Create new users',
                'resource' => 'users',
                'action' => 'create',
                'category' => 'User Management'
            ],
            [
                'name' => 'edit-users',
                'description' => 'Edit existing users',
                'resource' => 'users',
                'action' => 'edit',
                'category' => 'User Management'
            ],
            [
                'name' => 'delete-users',
                'description' => 'Delete users',
                'resource' => 'users',
                'action' => 'delete',
                'category' => 'User Management'
            ],
            [
                'name' => 'view-dashboard',
                'description' => 'View main dashboard',
                'resource' => 'dashboard',
                'action' => 'view',
                'category' => 'Dashboard'
            ],
            
            // Patient Management Permissions
            [
                'name' => 'view-patients',
                'description' => 'View patient list',
                'resource' => 'patients',
                'action' => 'view',
                'category' => 'Patient Management'
            ],
            [
                'name' => 'create-patients',
                'description' => 'Create new patients',
                'resource' => 'patients',
                'action' => 'create',
                'category' => 'Patient Management'
            ],
            [
                'name' => 'edit-patients',
                'description' => 'Edit existing patients',
                'resource' => 'patients',
                'action' => 'edit',
                'category' => 'Patient Management'
            ],
            [
                'name' => 'delete-patients',
                'description' => 'Delete patients',
                'resource' => 'patients',
                'action' => 'delete',
                'category' => 'Patient Management'
            ],
            
            // Doctor Management Permissions
            [
                'name' => 'view-doctors',
                'description' => 'View doctor list',
                'resource' => 'doctors',
                'action' => 'view',
                'category' => 'Doctor Management'
            ],
            [
                'name' => 'create-doctors',
                'description' => 'Create new doctors',
                'resource' => 'doctors',
                'action' => 'create',
                'category' => 'Doctor Management'
            ],
            [
                'name' => 'edit-doctors',
                'description' => 'Edit existing doctors',
                'resource' => 'doctors',
                'action' => 'edit',
                'category' => 'Doctor Management'
            ],
            [
                'name' => 'delete-doctors',
                'description' => 'Delete doctors',
                'resource' => 'doctors',
                'action' => 'delete',
                'category' => 'Doctor Management'
            ],
            
            // Appointment Management Permissions
            [
                'name' => 'view-appointments',
                'description' => 'View appointment list',
                'resource' => 'appointments',
                'action' => 'view',
                'category' => 'Appointment Management'
            ],
            [
                'name' => 'create-appointments',
                'description' => 'Create new appointments',
                'resource' => 'appointments',
                'action' => 'create',
                'category' => 'Appointment Management'
            ],
            [
                'name' => 'edit-appointments',
                'description' => 'Edit existing appointments',
                'resource' => 'appointments',
                'action' => 'edit',
                'category' => 'Appointment Management'
            ],
            [
                'name' => 'delete-appointments',
                'description' => 'Delete appointments',
                'resource' => 'appointments',
                'action' => 'delete',
                'category' => 'Appointment Management'
            ],
            
            // Billing Management Permissions
            [
                'name' => 'view-billing',
                'description' => 'View billing information',
                'resource' => 'billing',
                'action' => 'view',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'create-billing',
                'description' => 'Create new billing records',
                'resource' => 'billing',
                'action' => 'create',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'edit-billing',
                'description' => 'Edit existing billing records',
                'resource' => 'billing',
                'action' => 'edit',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'delete-billing',
                'description' => 'Delete billing records',
                'resource' => 'billing',
                'action' => 'delete',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'void-billing',
                'description' => 'Void billing records',
                'resource' => 'billing',
                'action' => 'void',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'manage-billing',
                'description' => 'Manage billing records (send reminders, etc.)',
                'resource' => 'billing',
                'action' => 'manage',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'view-payments',
                'description' => 'View payment records',
                'resource' => 'payments',
                'action' => 'view',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'record-payments',
                'description' => 'Record new payments',
                'resource' => 'payments',
                'action' => 'create',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'process-refunds',
                'description' => 'Process payment refunds',
                'resource' => 'payments',
                'action' => 'refund',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'view-insurance-claims',
                'description' => 'View insurance claims',
                'resource' => 'insurance-claims',
                'action' => 'view',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'create-insurance-claims',
                'description' => 'Create new insurance claims',
                'resource' => 'insurance-claims',
                'action' => 'create',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'edit-insurance-claims',
                'description' => 'Edit existing insurance claims',
                'resource' => 'insurance-claims',
                'action' => 'edit',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'delete-insurance-claims',
                'description' => 'Delete insurance claims',
                'resource' => 'insurance-claims',
                'action' => 'delete',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'submit-insurance-claims',
                'description' => 'Submit insurance claims to providers',
                'resource' => 'insurance-claims',
                'action' => 'submit',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'process-insurance-claims',
                'description' => 'Process insurance claims (approve/reject)',
                'resource' => 'insurance-claims',
                'action' => 'process',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'view-insurance-providers',
                'description' => 'View insurance providers',
                'resource' => 'insurance-providers',
                'action' => 'view',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'create-insurance-providers',
                'description' => 'Create new insurance providers',
                'resource' => 'insurance-providers',
                'action' => 'create',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'edit-insurance-providers',
                'description' => 'Edit existing insurance providers',
                'resource' => 'insurance-providers',
                'action' => 'edit',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'delete-insurance-providers',
                'description' => 'Delete insurance providers',
                'resource' => 'insurance-providers',
                'action' => 'delete',
                'category' => 'Billing Management'
            ],
            [
                'name' => 'view-billing-reports',
                'description' => 'View billing reports',
                'resource' => 'billing-reports',
                'action' => 'view',
                'category' => 'Billing Management'
            ],
            
            // Pharmacy Management Permissions
            [
                'name' => 'view-pharmacy',
                'description' => 'View pharmacy section',
                'resource' => 'pharmacy',
                'action' => 'view',
                'category' => 'Pharmacy Management'
            ],
            [
                'name' => 'create-medicines',
                'description' => 'Create new medicines',
                'resource' => 'medicines',
                'action' => 'create',
                'category' => 'Pharmacy Management'
            ],
            [
                'name' => 'edit-medicines',
                'description' => 'Edit existing medicines',
                'resource' => 'medicines',
                'action' => 'edit',
                'category' => 'Pharmacy Management'
            ],
            [
                'name' => 'delete-medicines',
                'description' => 'Delete medicines',
                'resource' => 'medicines',
                'action' => 'delete',
                'category' => 'Pharmacy Management'
            ],
            
            // Laboratory Management Permissions
            [
                'name' => 'view-laboratory',
                'description' => 'View laboratory section',
                'resource' => 'laboratory',
                'action' => 'view',
                'category' => 'Laboratory Management'
            ],
            [
                'name' => 'create-lab-tests',
                'description' => 'Create new lab tests',
                'resource' => 'lab-tests',
                'action' => 'create',
                'category' => 'Laboratory Management'
            ],
            [
                'name' => 'edit-lab-tests',
                'description' => 'Edit existing lab tests',
                'resource' => 'lab-tests',
                'action' => 'edit',
                'category' => 'Laboratory Management'
            ],
            [
                'name' => 'delete-lab-tests',
                'description' => 'Delete lab tests',
                'resource' => 'lab-tests',
                'action' => 'delete',
                'category' => 'Laboratory Management'
            ],
            
            // Lab Test Request Permissions
            [
                'name' => 'view-lab-test-requests',
                'description' => 'View lab test requests',
                'resource' => 'lab-test-requests',
                'action' => 'view',
                'category' => 'Laboratory Management'
            ],
            [
                'name' => 'create-lab-test-requests',
                'description' => 'Create new lab test requests',
                'resource' => 'lab-test-requests',
                'action' => 'create',
                'category' => 'Laboratory Management'
            ],
            [
                'name' => 'edit-lab-test-requests',
                'description' => 'Edit lab test requests',
                'resource' => 'lab-test-requests',
                'action' => 'edit',
                'category' => 'Laboratory Management'
            ],
            [
                'name' => 'delete-lab-test-requests',
                'description' => 'Delete lab test requests',
                'resource' => 'lab-test-requests',
                'action' => 'delete',
                'category' => 'Laboratory Management'
            ],
            [
                'name' => 'process-lab-test-requests',
                'description' => 'Process lab test requests (start/completed)',
                'resource' => 'lab-test-requests',
                'action' => 'process',
                'category' => 'Laboratory Management'
            ],
            
            // Lab Test Results Permissions
            [
                'name' => 'view-lab-test-results',
                'description' => 'View lab test results',
                'resource' => 'lab-test-results',
                'action' => 'view',
                'category' => 'Laboratory Management'
            ],
            [
                'name' => 'create-lab-test-results',
                'description' => 'Create lab test results',
                'resource' => 'lab-test-results',
                'action' => 'create',
                'category' => 'Laboratory Management'
            ],
            [
                'name' => 'edit-lab-test-results',
                'description' => 'Edit lab test results',
                'resource' => 'lab-test-results',
                'action' => 'edit',
                'category' => 'Laboratory Management'
            ],
            [
                'name' => 'delete-lab-test-results',
                'description' => 'Delete lab test results',
                'resource' => 'lab-test-results',
                'action' => 'delete',
                'category' => 'Laboratory Management'
            ],
            
            // Reports Management Permissions
            [
                'name' => 'view-reports',
                'description' => 'View reports section',
                'resource' => 'reports',
                'action' => 'view',
                'category' => 'Reports Management'
            ],
            
            // Settings Management Permissions
            [
                'name' => 'view-settings',
                'description' => 'View settings section',
                'resource' => 'settings',
                'action' => 'view',
                'category' => 'Settings Management'
            ],

            // Admin Management Permissions
            [
                'name' => 'manage-users',
                'description' => 'Full user management access',
                'resource' => 'admin',
                'action' => 'manage',
                'category' => 'Admin Management'
            ],
            [
                'name' => 'manage-permissions',
                'description' => 'Manage user permissions and roles',
                'resource' => 'admin',
                'action' => 'manage',
                'category' => 'Admin Management'
            ],
            [
                'name' => 'view-activity-logs',
                'description' => 'View system activity logs',
                'resource' => 'admin',
                'action' => 'view',
                'category' => 'Admin Management'
            ],
            [
                'name' => 'manage-departments',
                'description' => 'Manage hospital departments',
                'resource' => 'departments',
                'action' => 'manage',
                'category' => 'Department Management'
            ],

            // Department Management Permissions
            [
                'name' => 'view-departments',
                'description' => 'View department list',
                'resource' => 'departments',
                'action' => 'view',
                'category' => 'Department Management'
            ],
            [
                'name' => 'create-departments',
                'description' => 'Create new departments',
                'resource' => 'departments',
                'action' => 'create',
                'category' => 'Department Management'
            ],
            [
                'name' => 'edit-departments',
                'description' => 'Edit existing departments',
                'resource' => 'departments',
                'action' => 'edit',
                'category' => 'Department Management'
            ],
            [
                'name' => 'delete-departments',
                'description' => 'Delete departments',
                'resource' => 'departments',
                'action' => 'delete',
                'category' => 'Department Management'
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
