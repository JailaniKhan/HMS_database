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
        
        // Get all permissions the user has access to
        $permissions = [];
        
        // Get role-based permissions
        if ($user->role === 'Super Admin') {
            // Super Admin has all permissions
            $allPermissions = \App\Models\Permission::all();
            foreach ($allPermissions as $permission) {
                $permissions[] = $permission->name;
            }
        } else {
            $rolePermissions = \App\Models\RolePermission::where('role', $user->role)
                ->join('permissions', 'role_permissions.permission_id', '=', 'permissions.id')
                ->select('permissions.name')
                ->get();
                
            foreach ($rolePermissions as $permission) {
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
