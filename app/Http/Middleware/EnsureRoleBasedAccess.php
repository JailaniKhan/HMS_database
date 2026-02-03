<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use App\Models\Role;
use App\Services\RBACService;

class EnsureRoleBasedAccess
{
    protected $rbacService;

    public function __construct(RBACService $rbacService)
    {
        $this->rbacService = $rbacService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ...$permissions): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Authentication required',
            ], 401);
        }

        // Super admin bypasses all checks
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Check specific permissions
        if (!empty($permissions)) {
            foreach ($permissions as $permission) {
                if (!$user->hasPermission($permission)) {
                    Log::warning('Permission denied', [
                        'user_id' => $user->id,
                        'permission' => $permission,
                        'ip' => $request->ip(),
                        'url' => $request->fullUrl(),
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Insufficient permissions',
                        'required_permission' => $permission,
                    ], 403);
                }
            }
        }

        // Check role hierarchy for user management operations
        if ($request->route()->getName() === 'admin.users.update-role') {
            $targetUser = \App\Models\User::find($request->route('user'));
            if ($targetUser && !$user->canManageUser($targetUser)) {
                Log::warning('Role hierarchy violation', [
                    'user_id' => $user->id,
                    'target_user_id' => $targetUser->id,
                    'ip' => $request->ip(),
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Cannot manage user with equal or higher role',
                ], 403);
            }
        }

        // Check segregation of duties for critical operations
        if ($this->isCriticalOperation($request)) {
            $violations = $this->rbacService->checkSegregationViolations($user->id);
            if (!empty($violations)) {
                Log::alert('Segregation of duties violation', [
                    'user_id' => $user->id,
                    'violations' => $violations,
                    'ip' => $request->ip(),
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Segregation of duties violation detected',
                    'violations' => $violations,
                ], 403);
            }
        }

        return $next($request);
    }

    /**
     * Determine if the request is for a critical operation.
     */
    protected function isCriticalOperation(Request $request): bool
    {
        $criticalRoutes = [
            'admin.roles.destroy',
            'admin.permissions.destroy',
            'admin.users.assign-role',
            'admin.rbac.update-role-permissions',
        ];

        return in_array($request->route()->getName(), $criticalRoutes);
    }
}
