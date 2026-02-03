<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class RoleController extends Controller
{
    /**
     * Display a listing of roles
     */
    public function index()
    {
        // Check if user is Super Admin to bypass authorization
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('view-roles');
        }

        $roles = Role::withCount('users')
            ->with(['permissions' => function ($query) {
                $query->select('permissions.id', 'permissions.name', 'permissions.description');
            }])
            ->orderBy('priority', 'desc')
            ->get();

        return Inertia::render('Admin/Roles/Index', [
            'roles' => $roles,
        ]);
    }

    /**
     * Show the form for creating a new role
     */
    public function create()
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('create-role');
        }

        $permissions = Permission::orderBy('resource')
            ->orderBy('action')
            ->get()
            ->groupBy('resource');

        return Inertia::render('Admin/Roles/Create', [
            'permissions' => $permissions,
        ]);
    }

    /**
     * Store a newly created role
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('create-role');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|unique:roles,name|max:255',
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'priority' => 'required|integer|min:0|max:100',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $role = Role::create([
                'name' => $request->name,
                'display_name' => $request->display_name,
                'description' => $request->description,
                'priority' => $request->priority,
            ]);

            if ($request->has('permissions')) {
                $role->permissions()->sync($request->permissions);
            }

            DB::commit();

            return redirect()->route('admin.roles.index')
                ->with('success', 'Role created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to create role: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified role
     */
    public function show(Role $role)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('view-roles');
        }

        $role->load([
            'permissions',
            'users' => function ($query) {
                $query->select('users.id', 'users.name', 'users.username')
                    ->limit(10);
            }
        ]);

        $role->loadCount('users');

        return Inertia::render('Admin/Roles/Show', [
            'role' => $role,
        ]);
    }

    /**
     * Show the form for editing the specified role
     */
    public function edit(Role $role)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('edit-role');
        }

        $role->load('permissions');
        
        $permissions = Permission::orderBy('resource')
            ->orderBy('action')
            ->get()
            ->groupBy('resource');

        return Inertia::render('Admin/Roles/Edit', [
            'role' => $role,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Update the specified role
     */
    public function update(Request $request, Role $role)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('edit-role');
        }

        // Prevent editing Super Admin role
        if ($role->name === 'Super Admin') {
            return back()->withErrors(['error' => 'Cannot modify Super Admin role.']);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:roles,name,' . $role->id,
            'display_name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'priority' => 'required|integer|min:0|max:100',
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }

        DB::beginTransaction();
        try {
            $role->update([
                'name' => $request->name,
                'display_name' => $request->display_name,
                'description' => $request->description,
                'priority' => $request->priority,
            ]);

            if ($request->has('permissions')) {
                $role->permissions()->sync($request->permissions);
            }

            DB::commit();

            return redirect()->route('admin.roles.index')
                ->with('success', 'Role updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to update role: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Remove the specified role
     */
    public function destroy(Role $role)
    {
        $user = Auth::user();
        if (!$user->isSuperAdmin()) {
            $this->authorize('delete-role');
        }

        // Prevent deleting Super Admin role
        if ($role->name === 'Super Admin') {
            return back()->withErrors(['error' => 'Cannot delete Super Admin role.']);
        }

        // Check if role has users
        if ($role->users()->count() > 0) {
            return back()->withErrors(['error' => 'Cannot delete role with assigned users.']);
        }

        DB::beginTransaction();
        try {
            $role->permissions()->detach();
            $role->delete();

            DB::commit();

            return redirect()->route('admin.roles.index')
                ->with('success', 'Role deleted successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => 'Failed to delete role: ' . $e->getMessage()]);
        }
    }
}
