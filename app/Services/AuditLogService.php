<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogService
{
    /**
     * Log an activity to the audit log
     */
    public function logActivity(string $action, string $module, string $description = '', string $severity = 'info'): void
    {
        $user = Auth::user();
        
        AuditLog::create([
            'user_id' => $user ? $user->id : null,
            'user_name' => $user ? $user->name : 'Guest',
            'user_role' => $user ? $user->role : 'Guest',
            'action' => $action,
            'description' => $description,
            'module' => $module,
            'severity' => $severity,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Log a user login event
     */
    public function logLogin(): void
    {
        $this->logActivity(
            'User Login',
            'Authentication',
            'User successfully logged in',
            'info'
        );
    }

    /**
     * Log a user logout event
     */
    public function logLogout(): void
    {
        $this->logActivity(
            'User Logout',
            'Authentication',
            'User logged out',
            'info'
        );
    }

    /**
     * Log a failed login attempt
     */
    public function logFailedLogin(string $username): void
    {
        $this->logActivity(
            'Failed Login Attempt',
            'Authentication',
            "Failed login attempt for username: {$username}",
            'warning'
        );
    }

    /**
     * Log a permission denied event
     */
    public function logPermissionDenied(string $permission): void
    {
        $user = Auth::user();
        $this->logActivity(
            'Permission Denied',
            'Authorization',
            "User {$user->name} was denied access to {$permission}",
            'warning'
        );
    }

    /**
     * Log a record creation event
     */
    public function logCreation(string $recordType, string $recordName): void
    {
        $this->logActivity(
            "Create {$recordType}",
            $recordType,
            "Created new {$recordType}: {$recordName}",
            'info'
        );
    }

    /**
     * Log a record update event
     */
    public function logUpdate(string $recordType, string $recordName): void
    {
        $this->logActivity(
            "Update {$recordType}",
            $recordType,
            "Updated {$recordType}: {$recordName}",
            'info'
        );
    }

    /**
     * Log a record deletion event
     */
    public function logDeletion(string $recordType, string $recordName): void
    {
        $this->logActivity(
            "Delete {$recordType}",
            $recordType,
            "Deleted {$recordType}: {$recordName}",
            'warning'
        );
    }
}