<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\RolePermission;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class CheckUserPermission extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'permission:check-user 
                            {user : The username or ID of the user}
                            {permission? : The permission to check (optional)}
                            {--clear-cache : Clear permission cache before checking}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check user permissions and diagnose access issues';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $userIdentifier = $this->argument('user');
        $permissionName = $this->argument('permission');
        $clearCache = $this->option('clear-cache');

        // Find user by ID or username
        $user = is_numeric($userIdentifier) 
            ? User::find($userIdentifier)
            : User::where('username', $userIdentifier)->first();

        if (!$user) {
            $this->error("User '{$userIdentifier}' not found.");
            return 1;
        }

        $this->info("========================================");
        $this->info("User Permission Diagnostics");
        $this->info("========================================");
        $this->newLine();

        // Basic user info
        $this->info("User Information:");
        $this->table(
            ['Field', 'Value'],
            [
                ['ID', $user->id],
                ['Username', $user->username],
                ['Name', $user->name],
                ['Role (string)', $user->role],
                ['Role ID', $user->role_id ?? 'null'],
                ['Is Super Admin', $user->isSuperAdmin() ? 'YES' : 'NO'],
            ]
        );

        // Role model info
        $this->newLine();
        $this->info("Role Model Information:");
        $roleModel = $user->roleModel;
        if ($roleModel) {
            $this->table(
                ['Field', 'Value'],
                [
                    ['Role Name', $roleModel->name],
                    ['Role Slug', $roleModel->slug],
                    ['Is System', $roleModel->is_system ? 'YES' : 'NO'],
                ]
            );
        } else {
            $this->warn("No role model found for role_id: " . ($user->role_id ?? 'null'));
        }

        // Clear cache if requested
        if ($clearCache) {
            $this->newLine();
            $this->info("Clearing permission cache...");
            $user->clearPermissionCache();
            $this->info("Cache cleared.");
        }

        // If specific permission provided, check it
        if ($permissionName) {
            $this->newLine();
            $this->info("Permission Check: '{$permissionName}'");
            $this->info("----------------------------------------");

            // Check if permission exists in database
            $permissionExists = \App\Models\Permission::where('name', $permissionName)->exists();
            if (!$permissionExists) {
                $this->error("Permission '{$permissionName}' does not exist in the database!");
                $this->warn("Run 'php artisan db:seed --class=PermissionSeeder' to create permissions.");
                return 1;
            }

            // Detailed breakdown
            $isSuperAdmin = $user->isSuperAdmin();
            
            // Check user-specific override
            $userPermission = $user->userPermissions()
                ->whereHas('permission', fn($q) => $q->where('name', $permissionName))
                ->first();
            
            // Check normalized role permissions
            $hasNormalizedRolePermission = false;
            if ($roleModel) {
                $hasNormalizedRolePermission = $roleModel->permissions()
                    ->where('name', $permissionName)
                    ->exists();
            }
            
            // Check legacy role permissions
            $hasLegacyRolePermission = RolePermission::where('role', $user->role)
                ->whereHas('permission', fn($q) => $q->where('name', $permissionName))
                ->exists();
            
            // Check temporary permissions
            $hasTemporaryPermission = $user->temporaryPermissions()
                ->active()
                ->whereHas('permission', fn($q) => $q->where('name', $permissionName))
                ->exists();

            // Final result
            $hasPermission = $user->hasPermission($permissionName);

            $this->table(
                ['Source', 'Status', 'Details'],
                [
                    ['Super Admin Bypass', $isSuperAdmin ? 'YES' : 'NO', $isSuperAdmin ? 'All permissions granted' : 'Not a super admin'],
                    ['User Override', $userPermission ? ($userPermission->allowed ? 'ALLOWED' : 'DENIED') : 'NOT SET', $userPermission ? 'User-specific permission set' : 'No override'],
                    ['Normalized Role', $hasNormalizedRolePermission ? 'YES' : 'NO', $roleModel ? 'Via role_permission_mappings table' : 'No role model'],
                    ['Legacy Role', $hasLegacyRolePermission ? 'YES' : 'NO', 'Via role_permissions table'],
                    ['Temporary', $hasTemporaryPermission ? 'YES' : 'NO', 'Active temporary permission'],
                    ['', '', ''],
                    ['FINAL RESULT', $hasPermission ? 'GRANTED' : 'DENIED', $hasPermission ? '✓ Access allowed' : '✗ Access denied'],
                ]
            );

            // Provide recommendations
            if (!$hasPermission && !$isSuperAdmin) {
                $this->newLine();
                $this->warn("Recommendations to fix:");
                
                if (!$hasNormalizedRolePermission && !$hasLegacyRolePermission) {
                    $this->warn("1. Grant permission to role:");
                    if ($roleModel) {
                        $this->warn("   php artisan db:seed --class=RolePermissionMappingSeeder");
                        $this->warn("   Or manually add to role_permission_mappings table");
                    } else {
                        $this->warn("   User has no role_id set. Set role_id or use legacy role_permissions table.");
                    }
                }
                
                if (!$userPermission) {
                    $this->warn("2. Or grant user-specific permission via admin panel");
                }
                
                $this->warn("3. Or run: php artisan cache:clear (if permissions were recently changed)");
            }
        } else {
            // Show all effective permissions
            $this->newLine();
            $this->info("All Effective Permissions:");
            $this->info("----------------------------------------");
            
            $permissions = $user->getEffectivePermissions();
            sort($permissions);
            
            if (empty($permissions)) {
                $this->warn("User has no permissions assigned!");
            } else {
                $this->info("Total: " . count($permissions) . " permissions");
                $this->newLine();
                
                // Group by category
                $permissionsByCategory = [];
                $permissionModels = \App\Models\Permission::whereIn('name', $permissions)->get();
                
                foreach ($permissionModels as $perm) {
                    $category = $perm->category ?? 'Uncategorized';
                    $permissionsByCategory[$category][] = $perm->name;
                }
                
                foreach ($permissionsByCategory as $category => $perms) {
                    $this->info("[$category]");
                    foreach ($perms as $perm) {
                        $this->line("  - {$perm}");
                    }
                    $this->newLine();
                }
            }
        }

        $this->info("========================================");

        return 0;
    }
}
