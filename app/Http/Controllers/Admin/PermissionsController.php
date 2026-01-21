<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\PermissionChangeRequest;
use App\Models\RolePermission;
use App\Models\TemporaryPermission;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use App\Services\PermissionMonitoringService;

class PermissionsController extends Controller
{
    protected $monitoringService;

    public function __construct(PermissionMonitoringService $monitoringService)
    {
        $this->monitoringService = $monitoringService;
    }
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
    public function updateRolePermissions(Request $request, string $role)
    {
        // Validate the role exists in our system
        $validRoles = RolePermission::select('role')->distinct()->pluck('role');
        if (!$validRoles->contains($role)) {
            if ($request->expectsJson()) {
                return response()->json(['error' => 'Invalid role specified.'], 400);
            }
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

        // Log permission change for monitoring
        $this->monitoringService->logMetric('permission_change', count($request->permissions ?? []), [
            'action' => 'role_permissions_updated',
            'role' => $role,
            'user_id' => Auth::id(),
            'permissions_count' => count($request->permissions ?? []),
        ]);

        if ($request->expectsJson()) {
            return response()->json(['success' => 'Role permissions updated successfully.']);
        }

        return redirect()->route('admin.permissions.index')->with('success', 'Role permissions updated successfully.');
    }

    /**
     * Reset role permissions to default state.
     */
    public function resetRolePermissions(string $role)
    {
        // Define default permissions for each role
        $defaultPermissions = [
            'Super Admin' => [], // Super Admin gets all permissions implicitly
            'Reception Admin' => [],
            'Pharmacy Admin' => [],
            'Laboratory Admin' => [],
            'Sub Super Admin' => [],
        ];

        // Validate the role
        if (!isset($defaultPermissions[$role])) {
            return response()->json(['error' => 'Invalid role specified.'], 400);
        }

        // Clear existing role permissions
        RolePermission::where('role', $role)->delete();

        // Get permission IDs for default permissions
        $permissionIds = Permission::whereIn('name', $defaultPermissions[$role])->pluck('id')->toArray();

        // Add default permissions
        foreach ($permissionIds as $permissionId) {
            RolePermission::create([
                'role' => $role,
                'permission_id' => $permissionId,
            ]);
        }

        return response()->json(['success' => 'Role permissions reset to default successfully.']);
    }

    /**
     * Display the user permissions management page.
     */
    public function editUserPermissions(string $userId): Response
    {
        $user = User::with(['userPermissions' => function($query) {
            $query->where('user_permissions.allowed', true)->with('permission');
        }])->findOrFail($userId);

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
                        'allowed' => true,
                    ]);
                }
            }
        }

        // Log permission change for monitoring
        $this->monitoringService->logMetric('permission_change', count($request->permissions ?? []), [
            'action' => 'user_permissions_updated',
            'user_id' => $userId,
            'changed_by' => Auth::id(),
            'permissions_count' => count($request->permissions ?? []),
        ]);

        return redirect()->route('admin.users.index')->with('success', 'User permissions updated successfully.');
    }

    /**
     * Grant temporary permission to a user.
     */
    public function grantTemporaryPermission(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'permission_id' => 'required|exists:permissions,id',
            'expires_at' => 'required|date|after:now',
            'reason' => 'required|string|max:500',
        ]);

        $user = User::findOrFail($request->user_id);
        $permission = Permission::findOrFail($request->permission_id);

        // Check if user already has this temporary permission active
        $existingTempPermission = TemporaryPermission::active()
            ->where('user_id', $request->user_id)
            ->where('permission_id', $request->permission_id)
            ->first();

        if ($existingTempPermission) {
            return response()->json([
                'error' => 'User already has an active temporary permission for this action.'
            ], 400);
        }

        DB::transaction(function () use ($request) {
            TemporaryPermission::create([
                'user_id' => $request->user_id,
                'permission_id' => $request->permission_id,
                'granted_by' => Auth::id(),
                'granted_at' => now(),
                'expires_at' => $request->expires_at,
                'reason' => $request->reason,
                'is_active' => true,
            ]);
        });

        // Log temporary permission grant for monitoring
        $this->monitoringService->logMetric('temporary_permission_granted', 1, [
            'user_id' => $request->user_id,
            'permission_id' => $request->permission_id,
            'granted_by' => Auth::id(),
            'expires_at' => $request->expires_at,
        ]);

        return response()->json([
            'success' => 'Temporary permission granted successfully.',
            'permission' => $permission->name,
            'user' => $user->name,
        ]);
    }

    /**
     * Revoke temporary permission.
     */
    public function revokeTemporaryPermission(Request $request, $tempPermissionId)
    {
        $tempPermission = TemporaryPermission::findOrFail($tempPermissionId);

        // Check authorization - only the granter or super admin can revoke
        if ($tempPermission->granted_by !== Auth::id() && !Auth::user()->isSuperAdmin()) {
            return response()->json(['error' => 'Unauthorized to revoke this permission.'], 403);
        }

        $tempPermission->revoke();

        return response()->json([
            'success' => 'Temporary permission revoked successfully.',
        ]);
    }

    /**
     * List active temporary permissions.
     */
    public function listTemporaryPermissions(Request $request)
    {
        $query = TemporaryPermission::with(['user', 'permission', 'grantedBy'])
            ->active();

        // Filter by user if specified
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by permission if specified
        if ($request->has('permission_id')) {
            $query->where('permission_id', $request->permission_id);
        }

        $tempPermissions = $query->orderBy('expires_at', 'asc')->get();

        return response()->json([
            'temporary_permissions' => $tempPermissions,
        ]);
    }

    /**
     * Check if a user has a valid temporary permission for a specific action.
     */
    public function checkTemporaryPermission(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'permission_name' => 'required|string',
        ]);

        $user = User::findOrFail($request->user_id);

        $hasPermission = $user->hasPermission($request->permission_name);

        $tempPermission = null;
        if ($hasPermission) {
            // Find the temporary permission that grants this access
            $tempPermission = TemporaryPermission::active()
                ->where('user_id', $request->user_id)
                ->whereHas('permission', function ($query) use ($request) {
                    $query->where('name', $request->permission_name);
                })
                ->with(['permission', 'grantedBy'])
                ->first();
        }

        return response()->json([
            'has_permission' => $hasPermission,
            'temporary_permission' => $tempPermission,
        ]);
    }

    /**
     * Create a new permission change request.
     */
    public function createPermissionChangeRequest(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'permissions_to_add' => 'nullable|array',
            'permissions_to_add.*' => 'exists:permissions,id',
            'permissions_to_remove' => 'nullable|array',
            'permissions_to_remove.*' => 'exists:permissions,id',
            'reason' => 'required|string|max:1000',
            'expires_at' => 'nullable|date|after:now',
        ]);

        // Validate that at least one permission is being added or removed
        if (empty($request->permissions_to_add) && empty($request->permissions_to_remove)) {
            return response()->json([
                'error' => 'At least one permission must be added or removed.'
            ], 400);
        }

        // Check for permission dependencies
        $user = User::findOrFail($request->user_id);
        
        // Load only allowed user permissions for dependency validation
        $allowedUserPermissionIds = $user->userPermissions()->where('allowed', true)->pluck('permission_id');
        $allPermissions = collect($request->permissions_to_add ?? [])
            ->merge($allowedUserPermissionIds)
            ->unique()
            ->toArray();
        
        $errors = $user->validatePermissionDependencies($allPermissions);
        if (!empty($errors)) {
            return response()->json(['error' => 'Permission dependencies not satisfied: ' . implode(', ', $errors)], 400);
        }

        $changeRequest = PermissionChangeRequest::create([
            'user_id' => $request->user_id,
            'requested_by' => Auth::id(),
            'permissions_to_add' => $request->permissions_to_add,
            'permissions_to_remove' => $request->permissions_to_remove,
            'reason' => $request->reason,
            'expires_at' => $request->expires_at,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => 'Permission change request created successfully.',
            'request' => $changeRequest->load(['user', 'requestedBy']),
        ], 201);
    }

    /**
     * List permission change requests.
     */
    public function listPermissionChangeRequests(Request $request)
    {
        $query = PermissionChangeRequest::with(['user', 'requestedBy', 'approvedBy']);

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by user
        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter by requester
        if ($request->has('requested_by')) {
            $query->where('requested_by', $request->requested_by);
        }

        $requests = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json([
            'permission_change_requests' => $requests,
        ]);
    }

    /**
     * Approve a permission change request.
     */
    public function approvePermissionChangeRequest(Request $request, $requestId)
    {
        $changeRequest = PermissionChangeRequest::findOrFail($requestId);

        // Check if the request is still valid
        if (!$changeRequest->isValid()) {
            return response()->json(['error' => 'Request is no longer valid.'], 400);
        }

        DB::transaction(function () use ($changeRequest) {
            $changeRequest->approve(Auth::id());
            $changeRequest->applyChanges();
        });

        return response()->json([
            'success' => 'Permission change request approved successfully.',
        ]);
    }

    /**
     * Reject a permission change request.
     */
    public function rejectPermissionChangeRequest(Request $request, $requestId)
    {
        $changeRequest = PermissionChangeRequest::findOrFail($requestId);

        // Check if the request is still valid
        if (!$changeRequest->isValid()) {
            return response()->json(['error' => 'Request is no longer valid.'], 400);
        }

        $changeRequest->reject(Auth::id());

        return response()->json([
            'success' => 'Permission change request rejected successfully.',
        ]);
    }

    /**
     * Get details of a specific permission change request.
     */
    public function showPermissionChangeRequest($requestId)
    {
        $changeRequest = PermissionChangeRequest::with([
            'user',
            'requestedBy',
            'approvedBy',
            'permissionsToAdd',
            'permissionsToRemove'
        ])->findOrFail($requestId);

        return response()->json([
            'permission_change_request' => $changeRequest,
        ]);
    }

    /**
     * Cancel a permission change request.
     */
    public function cancelPermissionChangeRequest($requestId)
    {
        $changeRequest = PermissionChangeRequest::findOrFail($requestId);

        // Only the requester or super admin can cancel
        if ($changeRequest->requested_by !== Auth::id() && !Auth::user()->isSuperAdmin()) {
            return response()->json(['error' => 'Unauthorized to cancel this request.'], 403);
        }

        // Only pending requests can be cancelled
        if ($changeRequest->status !== 'pending') {
            return response()->json(['error' => 'Only pending requests can be cancelled.'], 400);
        }

        $changeRequest->update(['status' => 'rejected']);

        return response()->json([
            'success' => 'Permission change request cancelled successfully.',
        ]);
    }
}
