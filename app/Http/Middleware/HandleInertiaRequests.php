<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'csrf' => [
                'token' => $request->session()->token(),
            ],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'username' => $request->user()->username,
                    'role' => $request->user()->role,
                    'permissions' => $this->getUserPermissions($request->user()),
                ] : null,
            ],
        ];
    }
    
    private function getUserPermissions($user)
    {
        if (!$user) {
            return [];
        }
        
        $permissions = [];
        
        // Super Admin has all permissions
        if ($user->isSuperAdmin()) {
            $allPermissions = \App\Models\Permission::all();
            foreach ($allPermissions as $permission) {
                $permissions[] = $permission->name;
            }
            return $permissions;
        }
        
        // Check normalized role permissions first (new role_permission_mappings table)
        if ($user->role_id && $user->roleModel) {
            $normalizedRolePermissions = $user->roleModel->permissions()->pluck('name');
            foreach ($normalizedRolePermissions as $permissionName) {
                $permissions[] = $permissionName;
            }
        }
        
        // Fallback: Check legacy role_permissions table for backward compatibility
        $legacyRolePermissions = \App\Models\RolePermission::where('role', $user->role)
            ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
            ->select('permissions.name')
            ->get();
            
        foreach ($legacyRolePermissions as $permission) {
            if (!in_array($permission->name, $permissions)) {
                $permissions[] = $permission->name;
            }
        }
        
        // Get user-specific permissions (overrides)
        $userPermissions = $user->userPermissions()->with('permission')->get();
        
        foreach ($userPermissions as $userPermission) {
            $permissionName = $userPermission->permission->name;
            
            if ($userPermission->allowed) {
                // Add if allowed
                if (!in_array($permissionName, $permissions)) {
                    $permissions[] = $permissionName;
                }
            } else {
                // Remove if explicitly denied
                $permissions = array_filter($permissions, function($perm) use ($permissionName) {
                    return $perm !== $permissionName;
                });
            }
        }
        
        return $permissions;
    }
}
