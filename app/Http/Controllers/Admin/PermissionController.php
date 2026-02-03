<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class PermissionController extends Controller
{
    /**
     * Display a listing of permissions
     */
    public function index()
    {
        // Check if user is Super Admin to bypass authorization
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('view-permission-matrix');
        }

        // Get all permissions
        $permissions = Permission::orderBy('resource')
            ->orderBy('action')
            ->get();

        // Get all roles
        $roles = Role::orderBy('priority', 'desc')
            ->with('permissions')
            ->get();

        // Build role permissions mapping
        $rolePermissions = [];
        foreach ($roles as $role) {
            $rolePermissions[$role->name] = $role->permissions->pluck('id')->toArray();
        }

        return Inertia::render('Admin/Permissions/Index', [
            'permissions' => $permissions,
            'roles' => $roles->pluck('name')->toArray(),
            'rolePermissions' => $rolePermissions,
        ]);
    }

    /**
     * Show the form for creating a new permission
     */
    public function create()
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('create-permission');
        }

        return Inertia::render('Admin/Permissions/Create');
    }

    /**
     * Store a newly created permission
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('create-permission');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:permissions,name|max:255',
            'description' => 'nullable|string|max:1000',
            'resource' => 'required|string|max:255',
            'action' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            Permission::create([
                'name' => $request->name,
                'description' => $request->description,
                'resource' => $request->resource,
                'action' => $request->action,
            ]);

            return redirect()->route('admin.permissions.index')
                ->with('success', 'Permission created successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to create permission: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified permission
     */
    public function show(Permission $permission)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('view-permission-matrix');
        }

        $permission->load([
            'roles' => function ($query) {
                $query->orderBy('priority', 'desc');
            }
        ]);

        return Inertia::render('Admin/Permissions/Show', [
            'permission' => $permission,
        ]);
    }

    /**
     * Show the form for editing the specified permission
     */
    public function edit(Permission $permission)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('edit-permission');
        }

        return Inertia::render('Admin/Permissions/Edit', [
            'permission' => $permission,
        ]);
    }

    /**
     * Update the specified permission
     */
    public function update(Request $request, Permission $permission)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('edit-permission');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:permissions,name,' . $permission->id,
            'description' => 'nullable|string|max:1000',
            'resource' => 'required|string|max:255',
            'action' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        try {
            $permission->update([
                'name' => $request->name,
                'description' => $request->description,
                'resource' => $request->resource,
                'action' => $request->action,
            ]);

            return redirect()->route('admin.permissions.index')
                ->with('success', 'Permission updated successfully.');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to update permission: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Remove the specified permission
     */
    public function destroy(Permission $permission)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('delete-permission');
        }

        DB::beginTransaction();
        try {
            // Detach from all roles
            $permission->roles()->detach();
            
            // Delete the permission
            $permission->delete();

            DB::commit();

            return redirect()->route('admin.permissions.index')
                ->with('success', 'Permission deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete permission: ' . $e->getMessage()]);
        }
    }

    /**
     * Edit role permissions
     */
    public function editRolePermissions(Role $role)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('edit-role-permissions');
        }

        $role->load('permissions');
        
        $permissions = Permission::orderBy('resource')
            ->orderBy('action')
            ->get()
            ->groupBy('resource');

        return Inertia::render('Admin/Permissions/EditRolePermissions', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Update role permissions
     */
    public function updateRolePermissions(Request $request, Role $role)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('edit-role-permissions');
        }

        // Prevent editing Super Admin role
        if ($role->name === 'Super Admin') {
            return back()->withErrors(['error' => 'Cannot modify Super Admin role permissions.']);
        }

        $validator = Validator::make($request->all(), [
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $role->permissions()->sync($request->permissions ?? []);

            DB::commit();

            return redirect()->route('admin.permissions.index')
                ->with('success', 'Role permissions updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update role permissions: ' . $e->getMessage()]);
        }
    }

    /**
     * Reset role permissions to default
     */
    public function resetRolePermissions(Request $request, Role $role)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('edit-role-permissions');
        }

        // Prevent resetting Super Admin role
        if ($role->name === 'Super Admin') {
            return back()->withErrors(['error' => 'Cannot reset Super Admin role permissions.']);
        }

        DB::beginTransaction();
        try {
            // Detach all permissions
            $role->permissions()->detach();

            DB::commit();

            return back()->with('success', 'Role permissions reset successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to reset role permissions: ' . $e->getMessage()]);
        }
    }
}
