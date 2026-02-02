<?php

namespace App\Console\Commands;

use App\Models\Permission;
use App\Models\Role;
use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class FixBillingPermissions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'permission:fix-billing 
                            {--role= : Assign to a specific role slug (e.g., hospital-admin, reception-admin)}
                            {--user= : Assign to a specific user (username or ID)}
                            {--all-roles : Assign to all roles that should have billing access}
                            {--check-only : Only check, do not fix}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix billing permissions for roles or users';

    /**
     * Billing permissions that should exist.
     */
    protected array $billingPermissions = [
        'view-billing',
        'create-billing',
        'edit-billing',
        'delete-billing',
        'void-billing',
        'manage-billing',
        'view-payments',
        'record-payments',
        'process-refunds',
        'view-insurance-claims',
        'create-insurance-claims',
        'edit-insurance-claims',
        'delete-insurance-claims',
        'submit-insurance-claims',
        'process-insurance-claims',
        'view-insurance-providers',
        'create-insurance-providers',
        'edit-insurance-providers',
        'delete-insurance-providers',
        'view-billing-reports',
    ];

    /**
     * Roles that typically need billing access.
     */
    protected array $rolesWithBillingAccess = [
        'super-admin',
        'sub-super-admin',
        'hospital-admin',
        'reception-admin',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $checkOnly = $this->option('check-only');
        $specificRole = $this->option('role');
        $specificUser = $this->option('user');
        $allRoles = $this->option('all-roles');

        $this->info("========================================");
        $this->info("Billing Permissions Fix Tool");
        $this->info("========================================");
        $this->newLine();

        // Step 1: Check if billing permissions exist
        $this->info("Step 1: Checking if billing permissions exist in database...");
        $missingPermissions = [];
        foreach ($this->billingPermissions as $permName) {
            if (!Permission::where('name', $permName)->exists()) {
                $missingPermissions[] = $permName;
            }
        }

        if (!empty($missingPermissions)) {
            $this->warn("Missing permissions: " . implode(', ', $missingPermissions));
            if (!$checkOnly) {
                $this->info("Creating missing permissions...");
                foreach ($missingPermissions as $permName) {
                    Permission::create([
                        'name' => $permName,
                        'description' => ucwords(str_replace('-', ' ', $permName)),
                        'resource' => 'billing',
                        'action' => explode('-', $permName)[0],
                        'category' => 'Billing Management',
                    ]);
                }
                $this->info("✓ Created " . count($missingPermissions) . " missing permissions.");
            }
        } else {
            $this->info("✓ All billing permissions exist.");
        }

        // Step 2: Check/fix specific user
        if ($specificUser) {
            return $this->fixUserPermissions($specificUser, $checkOnly);
        }

        // Step 3: Check/fix specific role
        if ($specificRole) {
            return $this->fixRolePermissions($specificRole, $checkOnly);
        }

        // Step 4: Check/fix all roles
        if ($allRoles) {
            foreach ($this->rolesWithBillingAccess as $roleSlug) {
                $this->fixRolePermissions($roleSlug, $checkOnly);
                $this->newLine();
            }
            return 0;
        }

        // If no options specified, show status
        $this->showStatus();

        return 0;
    }

    /**
     * Fix permissions for a specific user.
     */
    protected function fixUserPermissions(string $userIdentifier, bool $checkOnly): int
    {
        $user = is_numeric($userIdentifier)
            ? User::find($userIdentifier)
            : User::where('username', $userIdentifier)->first();

        if (!$user) {
            $this->error("User '{$userIdentifier}' not found.");
            return 1;
        }

        $this->info("Checking user: {$user->username} (ID: {$user->id})");
        $this->info("Role: {$user->role}, Role ID: " . ($user->role_id ?? 'null'));

        // Check current permissions
        $hasViewBilling = $user->hasPermission('view-billing');
        $this->info("Has 'view-billing': " . ($hasViewBilling ? 'YES' : 'NO'));

        if ($checkOnly) {
            return 0;
        }

        if (!$hasViewBilling) {
            // Try to assign via role first
            if ($user->role_id && $user->roleModel) {
                $role = $user->roleModel;
                $viewBillingPerm = Permission::where('name', 'view-billing')->first();
                
                if ($viewBillingPerm && !$role->permissions()->where('permission_id', $viewBillingPerm->id)->exists()) {
                    $role->permissions()->attach($viewBillingPerm->id);
                    $this->info("✓ Added 'view-billing' to role '{$role->name}'");
                }
            }

            // Also add to legacy table for backward compatibility
            $this->addLegacyPermission($user->role, 'view-billing');

            // Clear cache
            $user->clearPermissionCache();
            Cache::flush();

            // Verify
            $user->refresh();
            $nowHasPermission = $user->hasPermission('view-billing');
            $this->info("After fix - Has 'view-billing': " . ($nowHasPermission ? 'YES ✓' : 'NO ✗'));
        }

        return 0;
    }

    /**
     * Fix permissions for a specific role.
     */
    protected function fixRolePermissions(string $roleSlug, bool $checkOnly): int
    {
        $role = Role::where('slug', $roleSlug)->first();

        if (!$role) {
            $this->warn("Role '{$roleSlug}' not found in roles table.");
            // Try legacy approach
            return $this->fixLegacyRolePermissions($roleSlug, $checkOnly);
        }

        $this->info("Checking role: {$role->name} (slug: {$role->slug})");

        // Get current permissions
        $currentPermissions = $role->permissions->pluck('name')->toArray();
        $permissionsToAdd = [];

        foreach ($this->billingPermissions as $permName) {
            if (!in_array($permName, $currentPermissions)) {
                $permissionsToAdd[] = $permName;
            }
        }

        if (empty($permissionsToAdd)) {
            $this->info("✓ Role already has all billing permissions.");
            return 0;
        }

        $this->warn("Missing permissions: " . implode(', ', $permissionsToAdd));

        if ($checkOnly) {
            return 0;
        }

        // Add missing permissions
        $permIds = Permission::whereIn('name', $permissionsToAdd)->pluck('id')->toArray();
        $role->permissions()->syncWithoutDetaching($permIds);
        $this->info("✓ Added " . count($permIds) . " billing permissions to role.");

        // Clear cache for all users with this role
        User::where('role_id', $role->id)->each(function ($user) {
            $user->clearPermissionCache();
        });

        return 0;
    }

    /**
     * Fix permissions using legacy role_permissions table.
     */
    protected function fixLegacyRolePermissions(string $roleSlug, bool $checkOnly): int
    {
        // Map slugs to legacy role names
        $roleName = str_replace('-', ' ', $roleSlug);
        $roleName = ucwords($roleName);

        $this->info("Checking legacy role: {$roleName}");

        $viewBillingPerm = Permission::where('name', 'view-billing')->first();
        if (!$viewBillingPerm) {
            $this->error("view-billing permission not found!");
            return 1;
        }

        $exists = RolePermission::where('role', $roleName)
            ->where('permission_id', $viewBillingPerm->id)
            ->exists();

        if ($exists) {
            $this->info("✓ Legacy permission already exists.");
            return 0;
        }

        $this->warn("Legacy permission missing for role '{$roleName}'");

        if ($checkOnly) {
            return 0;
        }

        RolePermission::create([
            'role' => $roleName,
            'permission_id' => $viewBillingPerm->id,
        ]);
        $this->info("✓ Added legacy permission.");

        // Clear cache
        Cache::flush();

        return 0;
    }

    /**
     * Add permission to legacy table.
     */
    protected function addLegacyPermission(string $roleName, string $permissionName): void
    {
        $permission = Permission::where('name', $permissionName)->first();
        if (!$permission) return;

        $exists = RolePermission::where('role', $roleName)
            ->where('permission_id', $permission->id)
            ->exists();

        if (!$exists) {
            RolePermission::create([
                'role' => $roleName,
                'permission_id' => $permission->id,
            ]);
            $this->info("✓ Added legacy permission for role '{$roleName}'");
        }
    }

    /**
     * Show overall status of billing permissions.
     */
    protected function showStatus(): void
    {
        $this->info("Current Status:");
        $this->info("----------------------------------------");

        // Count users with billing access
        $users = User::all();
        $withAccess = 0;
        $withoutAccess = 0;

        foreach ($users as $user) {
            if ($user->hasPermission('view-billing')) {
                $withAccess++;
            } else {
                $withoutAccess++;
            }
        }

        $this->info("Users with 'view-billing': {$withAccess}");
        $this->warn("Users without 'view-billing': {$withoutAccess}");
        $this->newLine();

        // Show roles with billing permissions
        $this->info("Roles with billing permissions:");
        $roles = Role::all();
        foreach ($roles as $role) {
            $hasBilling = $role->permissions()->where('name', 'like', '%billing%')->exists();
            $this->line("  {$role->name}: " . ($hasBilling ? '✓' : '✗'));
        }

        $this->newLine();
        $this->info("Usage examples:");
        $this->line("  php artisan permission:fix-billing --role=hospital-admin");
        $this->line("  php artisan permission:fix-billing --user=admin");
        $this->line("  php artisan permission:fix-billing --all-roles");
        $this->line("  php artisan permission:fix-billing --check-only");
    }
}
