<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;
use Illuminate\Support\Facades\Log;

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
        try {
            return parent::version($request);
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $userData = null;
        $user = $request->user();
        
        // Check if session exists - handle session_not_found error
        $sessionId = null;
        try {
            $sessionId = $request->session()->getId();
        } catch (\Exception $e) {
            Log::warning('[HandleInertiaRequests] Failed to get session ID: ' . $e->getMessage());
            $sessionId = null;
        }
        
        Log::debug('[HandleInertiaRequests] Share method', [
            'has_user' => !!$user,
            'user_id' => $user?->id,
            'session_id' => $sessionId,
        ]);
        
        try {
            // Only check for user, not sessionId - the user being authenticated is enough
            if ($user) {
                // Load roleModel to get proper role name
                $user->loadMissing('roleModel');
                
                $userData = [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'role' => $user->roleModel?->name ?? $user->role,
                    'role_id' => $user->role_id,
                    'is_super_admin' => $user->isSuperAdmin(),
                    'permissions' => $this->getUserPermissions($user),
                ];
                Log::debug('[HandleInertiaRequests] User data prepared', [
                    'user_id' => $user->id,
                    'is_super_admin' => $userData['is_super_admin'],
                    'permissions_count' => count($userData['permissions']),
                ]);
            } else {
                Log::debug('[HandleInertiaRequests] No user found in request');
            }
        } catch (\Exception $e) {
            Log::error('[HandleInertiaRequests] Error getting user data: ' . $e->getMessage());
            report($e);
            $userData = null;
        }
        
        return array_merge(parent::share($request), [
            'csrf' => [
                'token' => $request->session()->token(),
            ],
            'auth' => [
                'user' => $userData,
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
                'success' => fn () => $request->session()->get('success'),
                'printAppointment' => fn () => $request->session()->get('printAppointment'),
            ],
        ]);
    }
    
    /**
     * Handle the incoming request.
     */
    public function handle(Request $request, \Closure $next): \Symfony\Component\HttpFoundation\Response
    {
        $response = $next($request);
        
        // Add security headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        // Add CSP header for production
        if (app()->environment('production')) {
            $csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; frame-ancestors 'none';";
            $response->headers->set('Content-Security-Policy', $csp);
        }
        
        return $response;
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
