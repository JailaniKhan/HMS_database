<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\RolePermission;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PermissionsController extends Controller
{
    /**
     * Display the permissions management page.
     */
    public function index(): Response
    {
        $permissions = Permission::all();
        $roles = RolePermission::select('role')->distinct()->pluck('role');
        
        // Get role permissions mapping
        $rolePermissions = [];
        foreach ($roles as $role) {
            $rolePermissions[$role] = RolePermission::where('role', $role)
                ->pluck('permission_id')
                ->toArray();
        }
        
        return Inertia::render('Admin/Permissions/Index', [
            'permissions' => $permissions,
            'roles' => $roles,
            'rolePermissions' => $rolePermissions,
        ]);
    }

    /**
     * Show the form for assigning permissions to a role.
     */
    public function editRolePermissions(string $role): Response
    {
        $permissions = Permission::all();
        $assignedPermissionIds = RolePermission::where('role', $role)
            ->pluck('permission_id')
            ->toArray();
            
        return Inertia::render('Admin/Permissions/EditRole', [
            'role' => $role,
            'permissions' => $permissions,
            'assignedPermissionIds' => $assignedPermissionIds,
        ]);
    }

    /**
     * Update permissions for a specific role.
     */
    public function updateRolePermissions(Request $request, string $role): RedirectResponse
    {
        // Validate the role exists in our system
        $validRoles = RolePermission::select('role')->distinct()->pluck('role');
        if (!$validRoles->contains($role)) {
            return redirect()->back()->with('error', 'Invalid role specified.');
        }

        // Clear existing role permissions
        RolePermission::where('role', $role)->delete();

        // Add new permissions if provided
        if ($request->has('permissions') && is_array($request->permissions)) {
            foreach ($request->permissions as $permissionId) {
                $permission = Permission::find($permissionId);
                if ($permission) {
                    RolePermission::create([
                        'role' => $role,
                        'permission_id' => $permission->id,
                    ]);
                }
            }
        }

        return redirect()->route('admin.permissions.index')->with('success', 'Role permissions updated successfully.');
    }

    /**
     * Display the user permissions management page.
     */
    public function editUserPermissions(string $userId): Response
    {
        $user = User::with('userPermissions.permission')->findOrFail($userId);
        $allPermissions = Permission::all();
        
        // Get permissions currently assigned to the user
        $userPermissionIds = $user->userPermissions->pluck('permission_id')->toArray();
        
        return Inertia::render('Admin/Permissions/EditUser', [
            'user' => $user,
            'allPermissions' => $allPermissions,
            'userPermissionIds' => $userPermissionIds,
        ]);
    }

    /**
     * Update permissions for a specific user.
     */
    public function updateUserPermissions(Request $request, string $userId): RedirectResponse
    {
        $user = User::findOrFail($userId);
        
        // Clear existing user-specific permissions
        $user->userPermissions()->delete();
        
        // Add new permissions if provided
        if ($request->has('permissions') && is_array($request->permissions)) {
            foreach ($request->permissions as $permissionId) {
                $permission = Permission::find($permissionId);
                if ($permission) {
                    $user->userPermissions()->create([
                        'permission_id' => $permission->id,
                        'granted' => true,
                    ]);
                }
            }
        }
        
        return redirect()->route('admin.users.index')->with('success', 'User permissions updated successfully.');
    }
}