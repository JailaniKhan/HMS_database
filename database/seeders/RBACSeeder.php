<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\RolePermission;
use Illuminate\Support\Facades\DB;

class RBACSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->createRoles();
        $this->createPermissions();
        $this->assignRolePermissions();
        $this->setupRoleHierarchy();
    }

    /**
     * Create the hierarchical roles.
     */
    protected function createRoles(): void
    {
        $roles = [
            [
                'name' => 'Super Admin',
                'slug' => 'super-admin',
                'description' => 'Ultimate system authority with unrestricted access',
                'is_system' => true,
                'priority' => 100,
                'reporting_structure' => 'Top of hierarchy, reports to board/ownership',
                'module_access' => [
                    'users', 'roles', 'permissions', 'patients', 'doctors', 
                    'appointments', 'billing', 'pharmacy', 'laboratory', 'reports'
                ],
                'data_visibility_scope' => 'All system data across all departments and facilities',
                'user_management_capabilities' => [
                    'create_users', 'delete_users', 'assign_roles', 'reset_passwords'
                ],
                'system_configuration_access' => [
                    'database_config', 'security_settings', 'backup_restore', 'maintenance'
                ],
                'reporting_permissions' => [
                    'all_system_reports', 'audit_logs', 'performance_metrics', 'compliance'
                ],
                'role_specific_limitations' => [
                    'cannot_delete_own_account', 'cannot_remove_super_admin_role'
                ]
            ],
            [
                'name' => 'Sub Super Admin',
                'slug' => 'sub-super-admin',
                'description' => 'Senior administrative role with broad system access',
                'is_system' => true,
                'priority' => 90,
                'reporting_structure' => 'Reports to Super Admin, manages Hospital Admin level',
                'module_access' => [
                    'users', 'roles', 'patients', 'doctors', 'appointments', 
                    'billing', 'pharmacy', 'laboratory', 'reports'
                ],
                'data_visibility_scope' => 'All departments within assigned facilities',
                'user_management_capabilities' => [
                    'create_users', 'assign_roles', 'reset_passwords'
                ],
                'system_configuration_access' => [
                    'department_settings', 'ui_customization', 'report_templates'
                ],
                'reporting_permissions' => [
                    'department_reports', 'user_activity', 'operational_metrics'
                ],
                'role_specific_limitations' => [
                    'cannot_modify_super_admin', 'limited_financial_operations'
                ]
            ],
            [
                'name' => 'Pharmacy Admin',
                'slug' => 'pharmacy-admin',
                'description' => 'Specialized administrator for pharmaceutical operations',
                'is_system' => false,
                'priority' => 60,
                'reporting_structure' => 'Reports to Hospital Admin, manages pharmacy staff',
                'module_access' => [
                    'pharmacy', 'medicines', 'suppliers', 'purchase_orders', 
                    'stock_management', 'prescriptions'
                ],
                'data_visibility_scope' => [
                    'pharmacy_inventory', 'prescription_records', 'supplier_info'
                ],
                'user_management_capabilities' => [
                    'manage_pharmacy_staff', 'assign_pharmacy_roles'
                ],
                'system_configuration_access' => [
                    'pharmacy_settings', 'inventory_thresholds', 'supplier_configs'
                ],
                'reporting_permissions' => [
                    'inventory_reports', 'expiry_tracking', 'procurement_analytics'
                ],
                'role_specific_limitations' => [
                    'limited_patient_medical_history', 'no_financial_settings'
                ]
            ],
            [
                'name' => 'Laboratory Admin',
                'slug' => 'laboratory-admin',
                'description' => 'Specialized administrator for laboratory operations',
                'is_system' => false,
                'priority' => 60,
                'reporting_structure' => 'Reports to Hospital Admin, manages laboratory staff',
                'module_access' => [
                    'laboratory', 'lab_tests', 'test_requests', 'test_results', 
                    'equipment', 'quality_control'
                ],
                'data_visibility_scope' => [
                    'laboratory_tests', 'patient_diagnostics', 'equipment_records'
                ],
                'user_management_capabilities' => [
                    'manage_laboratory_staff', 'assign_laboratory_roles'
                ],
                'system_configuration_access' => [
                    'laboratory_settings', 'test_parameters', 'instrument_configs'
                ],
                'reporting_permissions' => [
                    'test_volume_reports', 'turnaround_analytics', 'qc_reports'
                ],
                'role_specific_limitations' => [
                    'limited_patient_medical_history', 'no_test_pricing_changes'
                ]
            ],
            [
                'name' => 'Reception',
                'slug' => 'reception',
                'description' => 'Front-desk personnel for patient interaction',
                'is_system' => false,
                'priority' => 60,
                'reporting_structure' => 'Reports to Hospital Admin, serves as primary patient interface',
                'module_access' => [
                    'patient_registration', 'appointments', 'basic_patient_info', 'communications'
                ],
                'data_visibility_scope' => [
                    'patient_demographics', 'appointment_schedules', 'basic_billing_info'
                ],
                'user_management_capabilities' => [],
                'system_configuration_access' => [
                    'appointment_preferences', 'communication_templates'
                ],
                'reporting_permissions' => [
                    'daily_schedules', 'patient_flow_reports', 'reception_metrics'
                ],
                'role_specific_limitations' => [
                    'no_medical_records', 'no_financial_transactions', 'no_patient_deletion'
                ]
            ]
        ];

        foreach ($roles as $roleData) {
            Role::updateOrCreate(
                ['slug' => $roleData['slug']],
                $roleData
            );
        }
    }

    /**
     * Create comprehensive permissions.
     */
    protected function createPermissions(): void
    {
        $permissions = [
            // User Management
            ['name' => 'view-users', 'description' => 'View user list', 'resource' => 'users', 'action' => 'view', 'category' => 'User Management', 'module' => 'users', 'segregation_group' => 'user_management', 'risk_level' => 2],
            ['name' => 'create-users', 'description' => 'Create new users', 'resource' => 'users', 'action' => 'create', 'category' => 'User Management', 'module' => 'users', 'segregation_group' => 'user_management', 'risk_level' => 3, 'requires_approval' => true],
            ['name' => 'edit-users', 'description' => 'Edit existing users', 'resource' => 'users', 'action' => 'edit', 'category' => 'User Management', 'module' => 'users', 'segregation_group' => 'user_management', 'risk_level' => 2],
            ['name' => 'delete-users', 'description' => 'Delete users', 'resource' => 'users', 'action' => 'delete', 'category' => 'User Management', 'module' => 'users', 'segregation_group' => 'user_management', 'risk_level' => 3, 'requires_approval' => true, 'is_critical' => true],
            
            // Role Management
            ['name' => 'view-roles', 'description' => 'View role list', 'resource' => 'roles', 'action' => 'view', 'category' => 'Role Management', 'module' => 'roles', 'segregation_group' => 'role_management', 'risk_level' => 1],
            ['name' => 'create-roles', 'description' => 'Create new roles', 'resource' => 'roles', 'action' => 'create', 'category' => 'Role Management', 'module' => 'roles', 'segregation_group' => 'role_management', 'risk_level' => 3, 'requires_approval' => true, 'is_critical' => true],
            ['name' => 'edit-roles', 'description' => 'Edit existing roles', 'resource' => 'roles', 'action' => 'edit', 'category' => 'Role Management', 'module' => 'roles', 'segregation_group' => 'role_management', 'risk_level' => 2],
            ['name' => 'delete-roles', 'description' => 'Delete roles', 'resource' => 'roles', 'action' => 'delete', 'category' => 'Role Management', 'module' => 'roles', 'segregation_group' => 'role_management', 'risk_level' => 3, 'requires_approval' => true, 'is_critical' => true],
            
            // Patient Management
            ['name' => 'view-patients', 'description' => 'View patient list', 'resource' => 'patients', 'action' => 'view', 'category' => 'Patient Management', 'module' => 'patients', 'segregation_group' => 'patient_care', 'risk_level' => 1],
            ['name' => 'create-patients', 'description' => 'Create new patients', 'resource' => 'patients', 'action' => 'create', 'category' => 'Patient Management', 'module' => 'patients', 'segregation_group' => 'patient_care', 'risk_level' => 1],
            ['name' => 'edit-patients', 'description' => 'Edit existing patients', 'resource' => 'patients', 'action' => 'edit', 'category' => 'Patient Management', 'module' => 'patients', 'segregation_group' => 'patient_care', 'risk_level' => 2],
            ['name' => 'delete-patients', 'description' => 'Delete patients', 'resource' => 'patients', 'action' => 'delete', 'category' => 'Patient Management', 'module' => 'patients', 'segregation_group' => 'patient_care', 'risk_level' => 3, 'requires_approval' => true],
            
            // Pharmacy Management
            ['name' => 'view-pharmacy', 'description' => 'View pharmacy section', 'resource' => 'pharmacy', 'action' => 'view', 'category' => 'Pharmacy Management', 'module' => 'pharmacy', 'segregation_group' => 'pharmacy_operations', 'risk_level' => 1],
            ['name' => 'manage-medicines', 'description' => 'Manage medicine inventory', 'resource' => 'medicines', 'action' => 'manage', 'category' => 'Pharmacy Management', 'module' => 'pharmacy', 'segregation_group' => 'pharmacy_operations', 'risk_level' => 2],
            ['name' => 'process-prescriptions', 'description' => 'Process prescriptions', 'resource' => 'prescriptions', 'action' => 'process', 'category' => 'Pharmacy Management', 'module' => 'pharmacy', 'segregation_group' => 'pharmacy_operations', 'risk_level' => 2],
            
            // Laboratory Management
            ['name' => 'view-laboratory', 'description' => 'View laboratory section', 'resource' => 'laboratory', 'action' => 'view', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 1],
            ['name' => 'manage-lab-tests', 'description' => 'Manage lab tests', 'resource' => 'lab-tests', 'action' => 'manage', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 2],
            ['name' => 'process-test-results', 'description' => 'Process test results', 'resource' => 'lab-test-results', 'action' => 'process', 'category' => 'Laboratory Management', 'module' => 'laboratory', 'segregation_group' => 'laboratory_operations', 'risk_level' => 2],
            
            // RBAC Management
            ['name' => 'view-rbac-dashboard', 'description' => 'View RBAC dashboard', 'resource' => 'rbac', 'action' => 'view', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 1],
            ['name' => 'manage-role-permissions', 'description' => 'Manage role permissions', 'resource' => 'role-permissions', 'action' => 'manage', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 3, 'requires_approval' => true, 'is_critical' => true],
            ['name' => 'view-permission-matrix', 'description' => 'View permission matrix', 'resource' => 'permissions', 'action' => 'view', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 1],
            ['name' => 'view-activity-logs', 'description' => 'View audit logs', 'resource' => 'audit-logs', 'action' => 'view', 'category' => 'RBAC Management', 'module' => 'rbac', 'segregation_group' => 'rbac_management', 'risk_level' => 1],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                ['name' => $permission['name']],
                $permission
            );
        }
    }

    /**
     * Assign permissions to roles.
     */
    protected function assignRolePermissions(): void
    {
        $rolePermissions = [
            'super-admin' => [
                'view-users', 'create-users', 'edit-users', 'delete-users',
                'view-roles', 'create-roles', 'edit-roles', 'delete-roles',
                'view-patients', 'create-patients', 'edit-patients', 'delete-patients',
                'view-pharmacy', 'manage-medicines', 'process-prescriptions',
                'view-laboratory', 'manage-lab-tests', 'process-test-results',
                'view-rbac-dashboard', 'manage-role-permissions', 'view-permission-matrix', 'view-activity-logs'
            ],
            'sub-super-admin' => [
                'view-users', 'create-users', 'edit-users',
                'view-roles', 'edit-roles',
                'view-patients', 'create-patients', 'edit-patients',
                'view-pharmacy', 'manage-medicines', 'process-prescriptions',
                'view-laboratory', 'manage-lab-tests', 'process-test-results',
                'view-rbac-dashboard', 'view-permission-matrix', 'view-activity-logs'
            ],
            'pharmacy-admin' => [
                'view-pharmacy', 'manage-medicines', 'process-prescriptions',
                'view-patients' // Limited view only
            ],
            'laboratory-admin' => [
                'view-laboratory', 'manage-lab-tests', 'process-test-results',
                'view-patients' // Limited view only
            ],
            'reception' => [
                'view-patients', 'create-patients', 'edit-patients',
                'view-users' // Limited view only
            ]
        ];

        foreach ($rolePermissions as $roleSlug => $permissionNames) {
            $role = Role::where('slug', $roleSlug)->first();
            if ($role) {
                $permissions = Permission::whereIn('name', $permissionNames)->get();
                $role->permissions()->sync($permissions->pluck('id')->toArray());
            }
        }
    }

    /**
     * Setup role hierarchy relationships.
     */
    protected function setupRoleHierarchy(): void
    {
        $hierarchy = [
            'sub-super-admin' => 'super-admin',
            'pharmacy-admin' => 'sub-super-admin',
            'laboratory-admin' => 'sub-super-admin',
            'reception' => 'sub-super-admin',
        ];

        foreach ($hierarchy as $subordinateSlug => $supervisorSlug) {
            $subordinate = Role::where('slug', $subordinateSlug)->first();
            $supervisor = Role::where('slug', $supervisorSlug)->first();
            
            if ($subordinate && $supervisor) {
                $subordinate->update(['parent_role_id' => $supervisor->id]);
            }
        }
    }
}
