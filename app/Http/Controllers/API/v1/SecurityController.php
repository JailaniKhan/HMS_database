<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SecurityController extends Controller
{
    /**
     * Update the authenticated user's password
     */
    public function updateOwnPassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();

        // Verify current password
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect'
            ], 422);
        }

        // Update password
        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        return response()->json([
            'message' => 'Password updated successfully'
        ]);
    }

    /**
     * Update another user's password (admin only)
     */
    public function updateUserPassword(Request $request, User $user): JsonResponse
    {
        $authenticatedUser = $request->user();

        // Check if the authenticated user has permission to manage users
        if (!$authenticatedUser->isSuperAdmin() && !$authenticatedUser->hasPermission('manage-users')) {
            return response()->json([
                'message' => 'Unauthorized to update other user\'s password'
            ], 403);
        }

        // Prevent updating super admin passwords unless the current user is also a super admin
        if ($user->isSuperAdmin() && !$authenticatedUser->isSuperAdmin()) {
            return response()->json([
                'message' => 'Only super admins can update other super admin accounts'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update the user's password
        $user->update([
            'password' => Hash::make($request->password)
        ]);

        return response()->json([
            'message' => 'User password updated successfully'
        ]);
    }

    /**
     * Update another user's username (admin only)
     */
    public function updateUsername(Request $request, User $user): JsonResponse
    {
        $authenticatedUser = $request->user();

        // Check if the authenticated user has permission to manage users
        if (!$authenticatedUser->isSuperAdmin() && !$authenticatedUser->hasPermission('manage-users')) {
            return response()->json([
                'message' => 'Unauthorized to update other user\'s username'
            ], 403);
        }

        // Prevent updating super admin usernames unless the current user is also a super admin
        if ($user->isSuperAdmin() && !$authenticatedUser->isSuperAdmin()) {
            return response()->json([
                'message' => 'Only super admins can update other super admin accounts'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'username' => [
                'required',
                'string',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Update the user's username
        $user->update([
            'username' => $request->username
        ]);

        return response()->json([
            'message' => 'Username updated successfully'
        ]);
    }

    /**
     * Update the authenticated user's profile
     */
    public function updateOwnProfile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $request->user()->id,
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = $request->user();
        $user->update([
            'name' => $request->name,
            'username' => $request->username,
        ]);

        return response()->json([
            'message' => 'Profile updated successfully'
        ]);
    }

    /**
     * Create a new user (admin only)
     */
    public function createUser(Request $request): JsonResponse
    {
        $authenticatedUser = $request->user();

        // Check if the authenticated user has permission to create users
        if (!$authenticatedUser->isSuperAdmin() && !$authenticatedUser->hasPermission('manage-users')) {
            return response()->json([
                'message' => 'Unauthorized to create users'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username',
            'role' => 'required|string|in:' . implode(',', $this->getAvailableRoles()),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Create the user with a default password
        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'password' => Hash::make('password123'), // Default password, should be changed immediately
            'role' => $request->role,
        ]);

        return response()->json([
            'message' => 'User created successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
            ]
        ], 201);
    }

    /**
     * Update another user's profile (admin only)
     */
    public function updateUserProfile(Request $request, User $user): JsonResponse
    {
        $authenticatedUser = $request->user();

        // Check if the authenticated user has permission to manage users
        if (!$authenticatedUser->isSuperAdmin() && !$authenticatedUser->hasPermission('manage-users')) {
            return response()->json([
                'message' => 'Unauthorized to update user profile'
            ], 403);
        }

        // Prevent updating super admin profiles unless the current user is also a super admin
        if ($user->isSuperAdmin() && !$authenticatedUser->isSuperAdmin()) {
            return response()->json([
                'message' => 'Only super admins can update other super admin accounts'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'username' => 'required|string|max:255|unique:users,username,' . $user->id,
            'role' => 'required|string|in:' . implode(',', $this->getAvailableRoles()),
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        $user->update([
            'name' => $request->name,
            'username' => $request->username,
            'role' => $request->role,
        ]);

        return response()->json([
            'message' => 'User profile updated successfully'
        ]);
    }

    /**
     * Reset another user's password (admin only)
     */
    public function resetUserPassword(Request $request, User $user): JsonResponse
    {
        $authenticatedUser = $request->user();

        // Check if the authenticated user has permission to manage users
        if (!$authenticatedUser->isSuperAdmin() && !$authenticatedUser->hasPermission('manage-users')) {
            return response()->json([
                'message' => 'Unauthorized to reset user password'
            ], 403);
        }

        // Prevent resetting super admin passwords unless the current user is also a super admin
        if ($user->isSuperAdmin() && !$authenticatedUser->isSuperAdmin()) {
            return response()->json([
                'message' => 'Only super admins can reset other super admin passwords'
            ], 403);
        }

        // Reset to default password
        $user->update([
            'password' => Hash::make('password123')
        ]);

        return response()->json([
            'message' => 'User password reset successfully'
        ]);
    }

    /**
     * Delete a user (admin only)
     */
    public function deleteUser(Request $request, User $user): JsonResponse
    {
        $authenticatedUser = $request->user();

        // Check if the authenticated user has permission to manage users
        if (!$authenticatedUser->isSuperAdmin() && !$authenticatedUser->hasPermission('manage-users')) {
            return response()->json([
                'message' => 'Unauthorized to delete users'
            ], 403);
        }

        // Prevent deleting super admin accounts unless the current user is also a super admin
        if ($user->isSuperAdmin() && !$authenticatedUser->isSuperAdmin()) {
            return response()->json([
                'message' => 'Only super admins can delete other super admin accounts'
            ], 403);
        }

        // Prevent deleting own account
        if ($user->id === $authenticatedUser->id) {
            return response()->json([
                'message' => 'Cannot delete your own account'
            ], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully'
        ]);
    }

    /**
     * Get all users for admin management (admin only)
     */
    public function getUsers(Request $request): JsonResponse
    {
        $authenticatedUser = $request->user();

        // Check if the authenticated user has permission to view users
        if (!$authenticatedUser->isSuperAdmin() && !$authenticatedUser->hasPermission('view-users')) {
            return response()->json([
                'message' => 'Unauthorized to view users'
            ], 403);
        }

        $users = User::select('id', 'name', 'username', 'role')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'username' => $user->username,
                'role' => $user->role,
            ];
        });

        return response()->json($users);
    }

    /**
     * Get available roles excluding Super Admin
     */
    private function getAvailableRoles(): array
    {
        $roles = \App\Models\RolePermission::select('role')
                             ->distinct()
                             ->where('role', '!=', 'Super Admin')
                             ->pluck('role')
                             ->toArray();
                             
        // Add fallback roles if no role permissions exist
        if (empty($roles)) {
            return ['Super Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin','Sub Super Admin'];
        }
        
        return $roles;
    }
}