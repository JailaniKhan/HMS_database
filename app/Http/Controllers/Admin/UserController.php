<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RolePermission;
use App\Models\Permission;
use App\Models\UserPermission;
use App\Models\AuditLog;
use App\Models\PermissionDependency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        Log::debug('UserController index method called');

        try {
            // Verify that we can access the authenticated user
            $currentUser = \Illuminate\Support\Facades\Auth::user();
            if (!$currentUser) {
                abort(401, 'Authentication required');
            }
            
            $users = User::select('id', 'name', 'username', 'role', 'created_at', 'updated_at')
                         ->orderBy('id', 'asc') // Add explicit ordering to prevent potential issues
                         ->paginate(10);

            Log::debug('User query executed successfully', ['user_count' => $users->count()]);

            return Inertia::render('Admin/Users/Index', [
                'users' => $users,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in UserController index', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Return a safe fallback response to prevent Inertia errors
            $emptyPaginator = new \Illuminate\Pagination\LengthAwarePaginator(
                [], // Empty collection
                0,  // Total items
                10, // Per page
                1,  // Current page
                []  // Options
            );
            $emptyPaginator->withPath('/admin/users'); // Maintain the path for proper pagination links
            
            return Inertia::render('Admin/Users/Index', [
                'users' => $emptyPaginator,
            ]);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Get all available roles from role_permissions table, excluding Super Admin
        $roles = RolePermission::select('role')
                              ->distinct()
                              ->where('role', '!=', 'Super Admin')
                              ->pluck('role');

        return Inertia::render('Admin/Users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'username' => 'required|string|alpha_dash|max:255|unique:users,username',
            'password' => 'required|string|min:8|confirmed',
            'role' => [
                'required',
                'string',
                Rule::in($this->getAvailableRoles())
            ],
        ]);

        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'password' => Hash::make($request->password),
            'role' => $request->role,
        ]);

        // Removed automatic permission assignment - permissions should be assigned manually
        // through the admin panel to ensure proper access control

        return redirect()->route('admin.users.index')->with('success', 'User created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): Response
    {
        $currentUser = \Illuminate\Support\Facades\Auth::user();
        $user = User::with(['userPermissions' => function($query) {
            $query->where('user_permissions.allowed', true)->with('permission');
        }])->findOrFail($id);
        $rolePermissions = RolePermission::where('role', $user->role)->with('permission')->get();

        // Security check: Only users with view-users permission can view user details
        if (!$currentUser->isSuperAdmin() && !$currentUser->hasPermission('view-users')) {
            abort(403, 'Unauthorized to view user details');
        }

        // Check if current user can delete this user
        $canDelete = $this->canCurrentUserDelete($currentUser, $user);

        // Check if current user can edit this user
        $canEdit = $this->canCurrentUserEdit($currentUser, $user);

        return Inertia::render('Admin/Users/Show', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'isSuperAdmin' => $user->isSuperAdmin(),
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'rolePermissions' => $rolePermissions,
                'userPermissions' => $user->userPermissions->map(function ($userPermission) {
                    return [
                        'id' => $userPermission->permission->id,
                        'name' => $userPermission->permission->name,
                        'description' => $userPermission->permission->description,
                        'resource' => $userPermission->permission->resource,
                        'action' => $userPermission->permission->action,
                    ];
                }),
            ],
            'canDelete' => $canDelete,
            'canEdit' => $canEdit,
            'currentUserRole' => $currentUser->role,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $user = User::findOrFail($id);

        // Get all available roles from role_permissions table, excluding Super Admin
        $roles = RolePermission::select('role')
                              ->distinct()
                              ->where('role', '!=', 'Super Admin')
                              ->pluck('role');

        return Inertia::render('Admin/Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'username' => [
                'required',
                'string',
                'alpha_dash',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'password' => 'nullable|string|min:8|confirmed',
            'role' => [
                'required',
                'string',
                Rule::in($this->getAvailableRoles())
            ],
        ]);

        $userData = [
            'name' => $request->name,
            'username' => $request->username,
            'role' => $request->role,
        ];

        if ($request->filled('password')) {
            $userData['password'] = Hash::make($request->password);
        }

        $user->update($userData);

        return redirect()->route('admin.users.index')->with('success', 'User updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $user = User::findOrFail($id);

        // Prevent deletion of own account
        if (\Illuminate\Support\Facades\Auth::check() && $user->id == \Illuminate\Support\Facades\Auth::id()) {
            return redirect()->back()->with('error', 'You cannot delete your own account.');
        }

        // Prevent deletion of Super Admin
        if (!$user->isDeletable()) {
            return redirect()->back()->with('error', 'Super Admin accounts cannot be deleted.');
        }

        // Only Super Admin can delete Sub Super Admin accounts
        if ($user->role === 'Sub Super Admin' && !\Illuminate\Support\Facades\Auth::user()->isSuperAdmin()) {
            return redirect()->back()->with('error', 'Only Super Admin can delete Sub Super Admin accounts.');
        }

        $user->delete();

        // Log the deletion
        AuditLog::create([
            'user_id' => \Illuminate\Support\Facades\Auth::id(),
            'user_name' => \Illuminate\Support\Facades\Auth::user()->name,
            'user_role' => \Illuminate\Support\Facades\Auth::user()->role,
            'action' => 'Delete User',
            'description' => "Deleted user {$user->name} (ID: {$user->id}, Role: {$user->role})",
            'module' => 'User Management',
            'severity' => 'high',
            'response_time' => 0.1, // placeholder
            'memory_usage' => 1000000, // placeholder
            'request_method' => 'DELETE',
            'request_url' => request()->fullUrl(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'logged_at' => now(),
        ]);

        return redirect()->route('admin.users.index')->with('success', 'User deleted successfully.');
    }

    /**
     * Show the form for editing user permissions.
     */
    public function editPermissions(string $id): Response
    {
        $user = User::with(['userPermissions' => function($query) {
            $query->where('user_permissions.allowed', true)->with('permission');
        }])->findOrFail($id);

        // Get all available permissions
        $allPermissions = Permission::all();

        // Get permissions currently assigned to the user
        $userPermissionIds = $user->userPermissions->pluck('permission_id')->toArray();

        return Inertia::render('Admin/Users/EditPermissions', [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
                'isSuperAdmin' => $user->isSuperAdmin(),
            ],
            'allPermissions' => $allPermissions,
            'userPermissionIds' => $userPermissionIds,
        ]);
    }

    /**
     * Update user permissions.
     */
    public function updatePermissions(Request $request, string $id): RedirectResponse
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage();

        $currentUser = \Illuminate\Support\Facades\Auth::user();
        $user = User::findOrFail($id);

        // Authorization check
        if (!$currentUser->isSuperAdmin() && !$currentUser->hasPermission('manage-users')) {
            abort(403, 'Unauthorized to manage user permissions');
        }

        // Prevent modifying own permissions unless Super Admin
        if ($user->id === $currentUser->id && $currentUser->role !== 'Super Admin') {
            return redirect()->back()->with('error', 'Non-super admins cannot modify their own permissions.');
        }

        // Prevent modifying Super Admin permissions unless current user is Super Admin
        if ($user->role === 'Super Admin' && $currentUser->role !== 'Super Admin') {
            return redirect()->back()->with('error', 'Only Super Admin can modify Super Admin permissions.');
        }

        $request->validate([
            'permissions' => 'array',
            'permissions.*' => 'integer|exists:permissions,id'
        ]);

        // Validate permission dependencies
        $dependencyErrors = $user->validatePermissionDependencies($request->permissions ?? []);
        if (!empty($dependencyErrors)) {
            return redirect()->back()->withErrors(['permissions' => $dependencyErrors])->withInput();
        }

        // Get the permissions before the update for audit logging
        $previousPermissions = $user->userPermissions->pluck('permission_id')->toArray();

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

        // Clear permission cache for this user
        $allPermissions = \App\Models\Permission::all()->pluck('name');
        foreach ($allPermissions as $permissionName) {
            \Illuminate\Support\Facades\Cache::forget("user_permission:{$user->id}:{$permissionName}");
        }

        // Log the permission changes
        $newPermissions = $request->input('permissions', []);
        $allPermissions = \App\Models\Permission::all()->pluck('name', 'id');

        // Find added and removed permissions for audit log
        $addedPermissions = array_diff($newPermissions, $previousPermissions);
        $removedPermissions = array_diff($previousPermissions, $newPermissions);

        $description = "Updated permissions for user {$user->name} (ID: {$user->id}). ";
        if (!empty($addedPermissions)) {
            $addedPermissionNames = Permission::whereIn('id', $addedPermissions)->pluck('name')->toArray();
            $description .= "Added: " . implode(', ', $addedPermissionNames) . ". ";
        }
        if (!empty($removedPermissions)) {
            $removedPermissionNames = Permission::whereIn('id', $removedPermissions)->pluck('name')->toArray();
            $description .= "Removed: " . implode(', ', $removedPermissionNames) . ". ";
        }
        if (empty($addedPermissions) && empty($removedPermissions)) {
            $description .= "No changes made.";
        }

        // Calculate performance metrics
        $endTime = microtime(true);
        $endMemory = memory_get_usage();

        \App\Models\AuditLog::create([
            'user_id' => $currentUser->id,
            'user_name' => $currentUser->name,
            'user_role' => $currentUser->role,
            'action' => 'Update User Permissions',
            'description' => $description,
            'module' => 'User Management',
            'severity' => 'medium',
            'response_time' => round(($endTime - $startTime) * 1000, 2), // in milliseconds
            'memory_usage' => $endMemory - $startMemory,
            'request_method' => 'PUT',
            'request_url' => request()->fullUrl(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'logged_at' => now(),
        ]);

        return redirect()->route('admin.users.show', $user->id)->with('success', 'User permissions updated successfully.');
    }

    /**
     * Assign default permissions to a new user based on their role
     */
    private function assignDefaultPermissions($user, $role): void
    {
        // Define default permissions for each role
        $defaultPermissions = [
            'Reception' => ['view-patients', 'create-patients', 'view-appointments', 'create-appointments'],
            'Doctor' => ['view-patients', 'view-appointments', 'view-lab-tests', 'create-lab-tests'],
            'Pharmacy Admin' => ['view-medicines', 'create-medicines', 'view-sales'],
            'Laboratory Admin' => ['view-lab-tests', 'create-lab-tests', 'view-patients'],
            'Sub Super Admin' => ['view-users', 'manage-users', 'view-permissions'],
        ];

        // Super Admin gets all permissions implicitly, so no need to assign
        if ($role === 'Super Admin') {
            return;
        }

        // Get permission IDs for default permissions
        if (isset($defaultPermissions[$role])) {
            $permissionIds = Permission::whereIn('name', $defaultPermissions[$role])->pluck('id')->toArray();

            // Assign permissions to the user
            foreach ($permissionIds as $permissionId) {
                $user->userPermissions()->create([
                    'permission_id' => $permissionId,
                    'allowed' => true,
                ]);
            }
        }
    }

    /**
     * Check if current user can delete the target user
     */
    private function canCurrentUserDelete($currentUser, $targetUser): bool
    {
        // Cannot delete own account
        if ($currentUser->id === $targetUser->id) {
            return false;
        }

        // Super Admin can delete anyone except themselves
        if ($currentUser->isSuperAdmin()) {
            return true;
        }

        // Sub Super Admin can delete regular users but not Super Admins
        if ($currentUser->role === 'Sub Super Admin') {
            return !$targetUser->isSuperAdmin();
        }

        // Regular admins with manage-users permission can delete non-admin users
        if ($currentUser->hasPermission('manage-users')) {
            return !$targetUser->isSuperAdmin() && $targetUser->role !== 'Sub Super Admin';
        }

        return false;
    }

    /**
     * Check if current user can edit the target user
     */
    private function canCurrentUserEdit($currentUser, $targetUser): bool
    {
        // Can always edit own account
        if ($currentUser->id === $targetUser->id) {
            return true;
        }

        // Super Admin can edit anyone
        if ($currentUser->isSuperAdmin()) {
            return true;
        }

        // Sub Super Admin can edit regular users but not Super Admins
        if ($currentUser->role === 'Sub Super Admin') {
            return !$targetUser->isSuperAdmin();
        }

        // Regular admins with manage-users permission can edit non-admin users
        if ($currentUser->hasPermission('manage-users')) {
            return !$targetUser->isSuperAdmin() && $targetUser->role !== 'Sub Super Admin';
        }

        return false;
    }

    /**
     * Bulk update user permissions.
     */
    public function bulkUpdatePermissions(Request $request): \Illuminate\Http\JsonResponse
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage();

        $currentUser = \Illuminate\Support\Facades\Auth::user();

        // Authorization check
        if (!$currentUser->isSuperAdmin() && !$currentUser->hasPermission('manage-users')) {
            return response()->json(['error' => 'Unauthorized to manage user permissions'], 403);
        }

        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
            'permissions' => 'required|array',
            'permissions.*' => 'integer|exists:permissions,id',
            'operation' => 'required|in:add,remove,replace'
        ]);

        $userIds = $request->user_ids;
        $permissionIds = $request->permissions;
        $operation = $request->operation;

        $users = User::whereIn('id', $userIds)->get();
        $permissions = Permission::whereIn('id', $permissionIds)->get();

        $results = [];
        $errors = [];

        foreach ($users as $user) {
            // Prevent modifying own permissions unless Super Admin
            if ($user->id === $currentUser->id && $currentUser->role !== 'Super Admin') {
                $errors[] = "Cannot modify own permissions for user {$user->name}";
                continue;
            }

            // Prevent modifying Super Admin permissions unless current user is Super Admin
            if ($user->role === 'Super Admin' && $currentUser->role !== 'Super Admin') {
                $errors[] = "Cannot modify Super Admin permissions for user {$user->name}";
                continue;
            }

            // Get current permissions for audit logging
            $previousPermissions = $user->userPermissions->pluck('permission_id')->toArray();

            // Perform the operation
            if ($operation === 'add') {
                // Add permissions (avoid duplicates)
                foreach ($permissionIds as $permissionId) {
                    $existing = $user->userPermissions()->where('permission_id', $permissionId)->first();
                    if (!$existing) {
                        $user->userPermissions()->create([
                            'permission_id' => $permissionId,
                            'allowed' => true,
                        ]);
                    }
                }
            } elseif ($operation === 'remove') {
                // Remove specified permissions by setting allowed to false
                $user->userPermissions()->whereIn('permission_id', $permissionIds)->update(['allowed' => false]);
            } elseif ($operation === 'replace') {
                // Replace all permissions
                $user->userPermissions()->delete();
                foreach ($permissionIds as $permissionId) {
                    $user->userPermissions()->create([
                        'permission_id' => $permissionId,
                        'allowed' => true,
                    ]);
                }
            }

            // Clear permission cache
            $allPermissions = Permission::all()->pluck('name');
            foreach ($allPermissions as $permissionName) {
                \Illuminate\Support\Facades\Cache::forget("user_permission:{$user->id}:{$permissionName}");
            }

            // Log the changes
            $newPermissions = $user->userPermissions->pluck('permission_id')->toArray();
            $addedPermissions = array_diff($newPermissions, $previousPermissions);
            $removedPermissions = array_diff($previousPermissions, $newPermissions);

            $description = "Bulk {$operation} permissions for user {$user->name} (ID: {$user->id}). ";
            if (!empty($addedPermissions)) {
                $addedPermissionNames = Permission::whereIn('id', $addedPermissions)->pluck('name')->toArray();
                $description .= "Added: " . implode(', ', $addedPermissionNames) . ". ";
            }
            if (!empty($removedPermissions)) {
                $removedPermissionNames = Permission::whereIn('id', $removedPermissions)->pluck('name')->toArray();
                $description .= "Removed: " . implode(', ', $removedPermissionNames) . ". ";
            }

            $results[] = [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'success' => true,
                'added' => count($addedPermissions),
                'removed' => count($removedPermissions)
            ];

            // Calculate performance metrics
            $endTime = microtime(true);
            $endMemory = memory_get_usage();

            AuditLog::create([
                'user_id' => $currentUser->id,
                'user_name' => $currentUser->name,
                'user_role' => $currentUser->role,
                'action' => 'Bulk Update User Permissions',
                'description' => $description,
                'module' => 'User Management',
                'severity' => 'medium',
                'response_time' => round(($endTime - $startTime) * 1000, 2),
                'memory_usage' => $endMemory - $startMemory,
                'request_method' => 'POST',
                'request_url' => request()->fullUrl(),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'logged_at' => now(),
            ]);
        }

        return response()->json([
            'success' => true,
            'results' => $results,
            'errors' => $errors,
            'message' => count($results) . ' users updated successfully' . (count($errors) > 0 ? ', ' . count($errors) . ' errors' : '')
        ]);
    }

    /**
     * Get permission templates.
     */
    public function getPermissionTemplates(): \Illuminate\Http\JsonResponse
    {
        $templates = [
            'read-only-user' => [
                'name' => 'Read-Only User',
                'description' => 'Basic read-only access to essential hospital data',
                'permissions' => [
                    'view-patients', 'view-appointments', 'view-dashboard', 'view-reports'
                ]
            ],
            'power-user' => [
                'name' => 'Power User',
                'description' => 'Full access to most hospital operations except administration',
                'permissions' => [
                    'view-patients', 'create-patients', 'edit-patients', 'delete-patients',
                    'view-appointments', 'create-appointments', 'edit-appointments', 'delete-appointments',
                    'view-doctors', 'create-doctors', 'edit-doctors',
                    'view-billing', 'create-billing', 'edit-billing',
                    'view-pharmacy', 'view-medicines', 'create-medicines', 'edit-medicines',
                    'view-laboratory', 'view-lab-tests', 'create-lab-tests', 'edit-lab-tests',
                    'view-reports', 'view-dashboard'
                ]
            ],
            'department-admin' => [
                'name' => 'Department Admin',
                'description' => 'Administrative access limited to specific department operations',
                'permissions' => [
                    'view-users', 'manage-users', 'view-permissions', 'manage-permissions',
                    'view-departments', 'create-departments', 'edit-departments', 'delete-departments'
                ]
            ],
            'clinical-staff' => [
                'name' => 'Clinical Staff',
                'description' => 'Access for nurses, technicians, and other clinical support staff',
                'permissions' => [
                    'view-patients', 'create-patients', 'edit-patients',
                    'view-appointments', 'create-appointments', 'edit-appointments',
                    'view-lab-tests', 'create-lab-tests', 'edit-lab-tests',
                    'view-medicines', 'create-medicines'
                ]
            ],
            'billing-specialist' => [
                'name' => 'Billing Specialist',
                'description' => 'Specialized access for billing and financial operations',
                'permissions' => [
                    'view-billing', 'create-billing', 'edit-billing', 'delete-billing',
                    'view-reports', 'view-dashboard'
                ]
            ]
        ];

        // Convert permission names to IDs
        foreach ($templates as &$template) {
            $permissionIds = Permission::whereIn('name', $template['permissions'])->pluck('id')->toArray();
            $template['permission_ids'] = $permissionIds;
            unset($template['permissions']);
        }

        return response()->json([
            'success' => true,
            'templates' => $templates
        ]);
    }

    /**
     * Analyze permission change impact.
     */
    public function analyzePermissionImpact(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'proposed_permissions' => 'required|array',
            'proposed_permissions.*' => 'integer|exists:permissions,id'
        ]);

        $user = User::findOrFail($request->user_id);
        $proposedPermissionIds = $request->proposed_permissions;
        $currentPermissionIds = $user->userPermissions()->where('allowed', true)->pluck('permission_id')->toArray();

        // Find added and removed permissions
        $addedPermissions = array_diff($proposedPermissionIds, $currentPermissionIds);
        $removedPermissions = array_diff($currentPermissionIds, $proposedPermissionIds);

        $impact = [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->role
            ],
            'changes' => [
                'added' => Permission::whereIn('id', $addedPermissions)->get(['id', 'name', 'category', 'resource'])->toArray(),
                'removed' => Permission::whereIn('id', $removedPermissions)->get(['id', 'name', 'category', 'resource'])->toArray(),
                'unchanged' => Permission::whereIn('id', $currentPermissionIds)->whereIn('id', $proposedPermissionIds)->get(['id', 'name', 'category', 'resource'])->toArray()
            ],
            'dependency_warnings' => [],
            'security_risks' => [],
            'impact_level' => 'low'
        ];

        // Check for dependency violations
        $dependencyErrors = $user->validatePermissionDependencies($proposedPermissionIds);
        if (!empty($dependencyErrors)) {
            $impact['dependency_warnings'] = $dependencyErrors;
            $impact['impact_level'] = 'medium';
        }

        // Analyze security risks
        $highRiskPermissions = ['manage-users', 'manage-permissions', 'delete-users', 'view-server-management'];
        $addedHighRisk = Permission::whereIn('id', $addedPermissions)->whereIn('name', $highRiskPermissions)->pluck('name')->toArray();

        if (!empty($addedHighRisk)) {
            $impact['security_risks'][] = "Adding high-risk permissions: " . implode(', ', $addedHighRisk);
            $impact['impact_level'] = 'high';
        }

        // Check if removing critical permissions that other permissions depend on
        foreach ($removedPermissions as $permissionId) {
            Log::debug("Checking dependencies for permission ID: {$permissionId}");
            try {
                $dependencies = PermissionDependency::where('depends_on_permission_id', $permissionId)->with('permission')->get();
                Log::debug("Found {$dependencies->count()} dependencies for permission ID: {$permissionId}");
                if ($dependencies->count() > 0) {
                    $dependentPermissions = $dependencies->pluck('permission.name')->toArray();
                    Log::debug("Dependent permissions: " . implode(', ', $dependentPermissions));
                    $impact['dependency_warnings'][] = "Removing permission that others depend on. Affected permissions: " . implode(', ', $dependentPermissions);
                    $impact['impact_level'] = 'high';
                }
            } catch (\Exception $e) {
                Log::error("Error checking dependencies for permission ID {$permissionId}: " . $e->getMessage());
                throw $e;
            }
        }

        // Calculate permission counts by category
        $impact['category_summary'] = [
            'current' => Permission::whereIn('id', $currentPermissionIds)->selectRaw('category, COUNT(*) as count')->groupBy('category')->pluck('count', 'category')->toArray(),
            'proposed' => Permission::whereIn('id', $proposedPermissionIds)->selectRaw('category, COUNT(*) as count')->groupBy('category')->pluck('count', 'category')->toArray()
        ];

        return response()->json([
            'success' => true,
            'impact' => $impact
        ]);
    }

    /**
     * Revoke a specific permission from a user.
     */
    public function revokePermission(Request $request, string $userId, string $permissionId): RedirectResponse
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage();

        $currentUser = \Illuminate\Support\Facades\Auth::user();

        // Authorization check
        if (!$currentUser->isSuperAdmin() && !$currentUser->hasPermission('manage-users')) {
            return redirect()->back()->withErrors(['permission' => 'Unauthorized to revoke user permissions']);
        }

        // Validate parameters
        $request->merge(['user_id' => $userId, 'permission_id' => $permissionId]);
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
            'permission_id' => 'required|integer|exists:permissions,id'
        ]);

        $user = User::findOrFail($userId);
        $permission = Permission::findOrFail($permissionId);

        // Prevent modifying own permissions unless Super Admin
        if ($user->id === $currentUser->id && $currentUser->role !== 'Super Admin') {
            return redirect()->back()->withErrors(['permission' => 'Non-super admins cannot revoke their own permissions']);
        }

        // Prevent modifying Super Admin permissions unless current user is Super Admin
        if ($user->role === 'Super Admin' && $currentUser->role !== 'Super Admin') {
            return redirect()->back()->withErrors(['permission' => 'Only Super Admin can revoke Super Admin permissions']);
        }

        // Find the user permission record
        $userPermission = UserPermission::where('user_id', $user->id)
            ->where('permission_id', $permission->id)
            ->first();

        if (!$userPermission) {
            return redirect()->back()->withErrors(['permission' => 'User does not have this permission assigned']);
        }

        if (!$userPermission->allowed) {
            return redirect()->back()->withErrors(['permission' => 'Permission is already revoked']);
        }

        // Set allowed to false instead of deleting to maintain audit trail
        $userPermission->update(['allowed' => false]);

        // Clear permission cache for this user and permission
        \Illuminate\Support\Facades\Cache::forget("user_permission:{$user->id}:{$permission->name}");

        // Log the permission revocation
        $endTime = microtime(true);
        $endMemory = memory_get_usage();

        AuditLog::create([
            'user_id' => $currentUser->id,
            'user_name' => $currentUser->name,
            'user_role' => $currentUser->role,
            'action' => 'Revoke User Permission',
            'description' => "Revoked permission '{$permission->name}' from user {$user->name} (ID: {$user->id})",
            'module' => 'User Management',
            'severity' => 'medium',
            'response_time' => round(($endTime - $startTime) * 1000, 2),
            'memory_usage' => $endMemory - $startMemory,
            'request_method' => $request->method(),
            'request_url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'logged_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Permission revoked successfully');
    }

    /**
     * Override a role-based permission with a user-specific permission.
     */
    public function overrideRolePermission(Request $request, string $userId, string $permissionId): RedirectResponse
    {
        $currentUser = \Illuminate\Support\Facades\Auth::user();

        // Authorization check
        if (!$currentUser->isSuperAdmin() && !$currentUser->hasPermission('manage-users')) {
            return redirect()->back()->withErrors(['permission' => 'Unauthorized to override user permissions']);
        }

        $user = User::findOrFail($userId);
        $permission = Permission::findOrFail($permissionId);

        // Prevent modifying own permissions unless Super Admin
        if ($user->id === $currentUser->id && $currentUser->role !== 'Super Admin') {
            return redirect()->back()->withErrors(['permission' => 'Non-super admins cannot override their own permissions']);
        }

        // Prevent modifying Super Admin permissions unless current user is Super Admin
        if ($user->role === 'Super Admin' && $currentUser->role !== 'Super Admin') {
            return redirect()->back()->withErrors(['permission' => 'Only Super Admin can override Super Admin permissions']);
        }

        // Check if this permission is actually part of the user's role
        $rolePermission = RolePermission::where('role', $user->role)
            ->where('permission_id', $permission->id)
            ->first();

        if (!$rolePermission) {
            return redirect()->back()->withErrors(['permission' => 'This permission is not part of the user\'s role']);
        }

        // Create or update user-specific permission to override the role-based one
        // By default, we're creating an 'allowed' permission, but this could be extended to accept a parameter
        $user->userPermissions()->updateOrCreate(
            ['permission_id' => $permission->id],
            ['allowed' => true]
        );

        // Clear permission cache for this user and permission
        \Illuminate\Support\Facades\Cache::forget("user_permission:{$user->id}:{$permission->name}");

        // Log the permission override
        \App\Models\AuditLog::create([
            'user_id' => $currentUser->id,
            'user_name' => $currentUser->name,
            'user_role' => $currentUser->role,
            'action' => 'Override Role Permission',
            'description' => "Overrode role-based permission '{$permission->name}' for user {$user->name} (ID: {$user->id}), making it user-specific",
            'module' => 'User Management',
            'severity' => 'medium',
            'response_time' => 0.1,
            'memory_usage' => 1000000,
            'request_method' => $request->method(),
            'request_url' => $request->fullUrl(),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'logged_at' => now(),
        ]);

        return redirect()->back()->with('success', 'Role-based permission successfully overridden with user-specific permission');
    }

    /**
     * Get all available roles from the role permissions, excluding Super Admin.
     */
    private function getAvailableRoles(): array
    {
        return RolePermission::select('role')
                             ->distinct()
                             ->where('role', '!=', 'Super Admin')
                             ->pluck('role')
                             ->toArray();
    }
}
