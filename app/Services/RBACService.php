<?php

namespace App\Services;

use App\Models\Permission;
use App\Models\PermissionDependency;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RBACService
{
    protected int $cacheTtl = 900; // 15 minutes

    /**
     * Validate permission dependencies for a set of permissions.
     */
    public function validatePermissionDependencies(array $permissionIds): array
    {
        $errors = [];
        $currentPermissions = collect($permissionIds);

        foreach ($permissionIds as $permissionId) {
            $dependencies = PermissionDependency::where('permission_id', $permissionId)
                ->with('dependsOnPermission')
                ->get();

            foreach ($dependencies as $dependency) {
                if (!$currentPermissions->contains($dependency->depends_on_permission_id)) {
                    $errors[] = "Permission '" . $dependency->permission->name . "' requires '" . $dependency->dependsOnPermission->name . "'";
                }
            }
        }

        return $errors;
    }

    /**
     * Clear role permission cache.
     */
    public function clearRolePermissionCache(int $roleId): void
    {
        $pattern = "role_permissions:{$roleId}:*";
        Cache::forget("role_permissions:{$roleId}");
        
        // Clear related user caches
        $users = \App\Models\User::where('role_id', $roleId)->get();
        foreach ($users as $user) {
            $user->clearPermissionCache();
        }
    }

    /**
     * Get role hierarchy tree.
     */
    public function getRoleHierarchyTree()
    {
        $roles = \App\Models\Role::with(['parentRole', 'subordinateRoles'])
            ->orderBy('priority', 'desc')
            ->get();

        return $this->buildHierarchyTree($roles);
    }

    /**
     * Build hierarchical tree structure.
     */
    protected function buildHierarchyTree($roles, $parentId = null)
    {
        $tree = [];
        
        foreach ($roles as $role) {
            if ($role->parent_role_id == $parentId) {
                $children = $this->buildHierarchyTree($roles, $role->id);
                if (!empty($children)) {
                    $role->subordinates = $children;
                }
                $tree[] = $role;
            }
        }
        
        return $tree;
    }

    /**
     * Check if role can be assigned to user based on hierarchy.
     */
    public function canAssignRole($currentUser, $targetUser, $newRoleId): bool
    {
        if ($currentUser->isSuperAdmin()) {
            return true;
        }

        $newRole = \App\Models\Role::find($newRoleId);
        if (!$newRole) {
            return false;
        }

        // Check if current user's role is higher in hierarchy
        $currentRole = $currentUser->roleModel;
        if (!$currentRole) {
            return false;
        }

        $subordinates = $currentRole->getAllSubordinates();
        return in_array($newRoleId, array_column($subordinates, 'id'));
    }

    /**
     * Get segregation of duties violations.
     */
    public function checkSegregationViolations($userId): array
    {
        $violations = [];
        // TODO: Implement segregation of duties checking logic
        return $violations;
    }

    /**
     * Generate permission audit report.
     */
    public function generatePermissionAuditReport(): array
    {
        return [
            'roles' => \App\Models\Role::withCount('users')->get(),
            'permissions' => \App\Models\Permission::withCount('roles')->get(),
            'unused_permissions' => $this->getUnusedPermissions(),
            'overprivileged_users' => $this->getOverprivilegedUsers(),
        ];
    }

    /**
     * Get unused permissions.
     */
    protected function getUnusedPermissions()
    {
        return \App\Models\Permission::doesntHave('roles')
            ->doesntHave('userPermissions')
            ->get();
    }

    /**
     * Get overprivileged users.
     */
    protected function getOverprivilegedUsers()
    {
        // TODO: Implement overprivilege detection logic
        return collect();
    }
}