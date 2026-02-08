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

        // Generate a secure random temporary password
        $tempPassword = $this->generateSecurePassword();
        
        $user = User::create([
            'name' => $request->name,
            'username' => $request->username,
            'password' => Hash::make($tempPassword),
            'role' => $request->role,
            'password_change_required' => true, // Flag to force password change on first login
        ]);
        
        // TODO: Send email to user with temporary password
        // Mail::to($user->email)->send(new NewUserWelcome($user, $tempPassword));

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

        // Protect Super Admin accounts
        if ($user->isSuperAdmin()) {
            // Only allow changing name and username, never role
            if ($request->has('role') && $request->role !== $user->role) {
                return response()->json([
                    'message' => 'Super Admin roles are protected and cannot be changed'
                ], 403);
            }

            // Still prevent non-super admins from editing super admin details
            if (!$authenticatedUser->isSuperAdmin()) {
                return response()->json([
                    'message' => 'Only super admins can update other super admin accounts'
                ], 403);
            }
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

        // Generate a secure random temporary password
        $tempPassword = $this->generateSecurePassword();
        
        $user->update([
            'password' => Hash::make($tempPassword),
            'password_change_required' => true, // Force password change on next login
        ]);
        
        // TODO: Send email to user with temporary password
        // Mail::to($user->email)->send(new PasswordResetNotification($user, $tempPassword));

        return response()->json([
            'message' => 'User password reset successfully. A temporary password has been generated and should be sent to the user.',
            'note' => 'User must change password on next login'
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

        // Prevent deleting super admin accounts entirely for security
        if ($user->isSuperAdmin()) {
            return response()->json([
                'message' => 'Super Admin accounts are protected and cannot be deleted for system integrity'
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

        $adminRoles = ['Super Admin', 'Sub Super Admin', 'Reception Admin', 'Laboratory Admin', 'Pharmacy Admin'];
$users = User::select('id', 'name', 'username', 'role')
            ->whereIn('role', $adminRoles)
            ->get()
            ->map(function ($user) {
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
     * Generate a cryptographically secure random password
     */
    private function generateSecurePassword(int $length = 16): string
    {
        $lowercase = 'abcdefghijklmnopqrstuvwxyz';
        $uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $numbers = '0123456789';
        $special = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        
        $all = $lowercase . $uppercase . $numbers . $special;
        $password = '';
        
        // Ensure at least one of each character type
        $password .= $lowercase[random_int(0, strlen($lowercase) - 1)];
        $password .= $uppercase[random_int(0, strlen($uppercase) - 1)];
        $password .= $numbers[random_int(0, strlen($numbers) - 1)];
        $password .= $special[random_int(0, strlen($special) - 1)];
        
        // Fill the rest randomly
        for ($i = 4; $i < $length; $i++) {
            $password .= $all[random_int(0, strlen($all) - 1)];
        }
        
        // Shuffle the password
        return str_shuffle($password);
    }

    /**
     * Get available roles excluding Super Admin
     */
    private function getAvailableRoles(): array
    {
        $roles = \App\Models\Role::query()
            ->where('name', '!=', 'Super Admin')
            ->pluck('name')
            ->toArray();
                             
        // Add fallback roles if no roles exist in database
        if (empty($roles)) {
            return ['Reception Admin', 'Pharmacy Admin', 'Laboratory Admin', 'Sub Super Admin'];
        }
        
        return $roles;
    }
}