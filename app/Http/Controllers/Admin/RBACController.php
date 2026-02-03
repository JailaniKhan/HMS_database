<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use App\Services\RBACService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RBACController extends Controller
{
    protected $rbacService;

    public function __construct(RBACService $rbacService)
    {
        $this->rbacService = $rbacService;
    }

    /**
     * Display RBAC dashboard.
     */
    public function index()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        
        // Super Admin bypass
        if (!$user->isSuperAdmin()) {
            $this->authorize('view-rbac-dashboard');
        }

        $stats = [
            'total_roles' => Role::count(),
            'total_permissions' => Permission::count(),
            'active_users' => User::whereNotNull('role_id')->count(),
            'pending_requests' => 0, // TODO: Implement permission requests
            'recent_violations' => 0, // TODO: Implement violation tracking
        ];

        $roleDistribution = Role::withCount('users')
            ->get()
            ->map(function ($role) {
                return [
                    'role_id' => $role->id,
                    'role_name' => $role->name,
                    'user_count' => $role->users_count,
                    'percentage' => $role->users_count > 0 ? round(($role->users_count / User::count()) * 100, 1) : 0,
                    'color' => $this->getRoleColor($role->name),
                ];
            });

        // Get top roles (highest priority)
        $topRoles = Role::withCount('users')
            ->orderBy('priority', 'desc')
            ->limit(6)
            ->get();
        
        // Get recent activities (placeholder for now)
        $recentActivities = collect(); // TODO: Implement activity logging
        
        return Inertia::render('Admin/RBAC/Dashboard', [
            'stats' => $stats,
            'roleDistribution' => $roleDistribution,
            'topRoles' => $topRoles,
            'recentActivities' => $recentActivities,
        ]);
    }

    /**
     * Get role hierarchy visualization data.
     */
    public function hierarchy()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('view-role-hierarchy');
        }

        $roles = Role::with(['parentRole', 'subordinateRoles'])
            ->orderBy('priority', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'roles' => $roles,
        ]);
    }

    /**
     * Get permission matrix data.
     */
    public function permissionMatrix()
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('view-permission-matrix');
        }

        $roles = Role::with('permissions')->get();
        $permissions = Permission::all();
        
        $rolePermissions = [];
        foreach ($roles as $role) {
            $rolePermissions[$role->id] = $role->permissions->pluck('id')->toArray();
        }

        return response()->json([
            'success' => true,
            'roles' => $roles,
            'permissions' => $permissions,
            'rolePermissions' => $rolePermissions,
        ]);
    }

    /**
     * Update role-permission assignments.
     */
    public function updateRolePermissions(Request $request)
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('manage-role-permissions');
        }

        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
            'permission_ids' => 'array',
            'permission_ids.*' => 'exists:permissions,id',
        ]);

        try {
            DB::beginTransaction();
            
            $role = Role::findOrFail($validated['role_id']);
            $permissionIds = $validated['permission_ids'] ?? [];
            
            // Validate permission dependencies
            $errors = $this->rbacService->validatePermissionDependencies($permissionIds);
            if (!empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permission dependency validation failed',
                    'errors' => $errors,
                ], 422);
            }
            
            // Update role permissions
            $role->permissions()->sync($permissionIds);
            
            // Clear caches
            $this->rbacService->clearRolePermissionCache($role->id);
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Role permissions updated successfully',
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Failed to update role permissions: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update role permissions',
            ], 500);
        }
    }

    /**
     * Get user role assignment data.
     */
    public function userAssignments(Request $request)
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('view-user-assignments');
        }

        $users = User::with(['roleModel'])
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%");
            })
            ->paginate(20);

        $roles = Role::orderBy('priority', 'desc')->get();

        return Inertia::render('Admin/RBAC/UserAssignments', [
            'users' => $users,
            'roles' => $roles,
        ]);
    }

    /**
     * Update user role assignment.
     */
    public function updateUserRole(Request $request, User $user)
    {
        $currentUser = \Illuminate\Support\Facades\Auth::user();
        if (!$currentUser->isSuperAdmin()) {
            $this->authorize('manage-user-roles');
        }

        // Check if current user can manage this user
        if (!$currentUser->canManageUser($user)) {
            return redirect()->back()->withErrors(['error' => 'You do not have permission to manage this user']);
        }

        $validated = $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        try {
            $user->update(['role_id' => $validated['role_id']]);
            
            // Clear user permission cache
            $user->clearPermissionCache();
            
            return redirect()->back()->with('success', 'User role updated successfully');
            
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Failed to update user role: ' . $e->getMessage());
            
            return redirect()->back()->withErrors(['error' => 'Failed to update user role']);
        }
    }

    /**
     * Get color for role distribution.
     */
    private function getRoleColor($roleName)
    {
        $colors = [
            'Super Admin' => '#ef4444', // red-500
            'Sub Super Admin' => '#f97316', // orange-500
            'Hospital Admin' => '#3b82f6', // blue-500
            'Reception Admin' => '#10b981', // emerald-500
            'Pharmacy Admin' => '#8b5cf6', // violet-500
            'Laboratory Admin' => '#ec4899', // pink-500
        ];

        return $colors[$roleName] ?? '#6b7280'; // gray-500
    }

    /**
     * Get audit log data.
     */
    public function auditLogs(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = \Illuminate\Support\Facades\Auth::user();
        
        // Super Admin bypass
        if (!$user->isSuperAdmin()) {
            $this->authorize('view-activity-logs');
        }

        $query = \App\Models\AuditLog::query();

        // Apply filters
        if ($request->filled('severity')) {
            $query->where('severity', $request->severity);
        }

        if ($request->filled('module')) {
            $query->where('module', $request->module);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('action', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('user_name', 'like', "%{$search}%");
            });
        }

        $auditLogs = $query->orderBy('logged_at', 'desc')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/RBAC/AuditLogs', [
            'auditLogs' => $auditLogs,
            'filters' => $request->only(['severity', 'module', 'search']),
        ]);
    }

    /**
     * Export RBAC configuration.
     */
    public function exportConfiguration()
    {
        $this->authorize('export-rbac-configuration');

        $data = [
            'roles' => Role::with('permissions')->get(),
            'permissions' => Permission::all(),
            'users' => User::with('roleModel')->get(['id', 'name', 'email', 'role_id']),
        ];

        return response()->json($data);
    }

    /**
     * Import RBAC configuration.
     */
    public function importConfiguration(Request $request)
    {
        $this->authorize('import-rbac-configuration');

        $validated = $request->validate([
            'configuration' => 'required|json',
        ]);

        // TODO: Implement configuration import logic
        return response()->json([
            'success' => true,
            'message' => 'Configuration imported successfully',
        ]);
    }
}
