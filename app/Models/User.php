<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Support\Facades\Cache;
use App\Models\Patient;
use App\Models\PermissionDependency;
use App\Models\TemporaryPermission;
use App\Models\Role;
use App\Traits\HasPermissions;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasApiTokens, HasPermissions;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'password',
        'role',
        'role_id',
        'failed_login_attempts',
        'locked_until',
        'last_login_at',
        'last_login_ip',
        'password_changed_at',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'locked_until' => 'datetime',
            'last_login_at' => 'datetime',
            'password_changed_at' => 'datetime',
            'failed_login_attempts' => 'integer',
        ];
    }

    /**
     * Check if user has any of the given roles.
     */
    public function hasAnyRole($roles): bool
    {
        if (is_array($roles)) {
            // Check both legacy role string and new role relationship
            if (in_array($this->role, $roles)) {
                return true;
            }
            
            // Check normalized role
            if ($this->roleModel) {
                return in_array($this->roleModel->name, $roles) 
                    || in_array($this->roleModel->slug, $roles);
            }
            
            return false;
        }

        return $this->role === $roles 
            || ($this->roleModel && ($this->roleModel->name === $roles || $this->roleModel->slug === $roles));
    }

    /**
     * Get the role model relationship.
     */
    public function roleModel()
    {
        return $this->belongsTo(Role::class, 'role_id');
    }

    /**
     * Get reporting relationships for this user's role.
     */
    public function getRoleReportingRelationships()
    {
        if ($this->roleModel) {
            return $this->roleModel->supervisorRelationships;
        }
        return collect();
    }

    /**
     * Get subordinate roles for this user's role.
     */
    public function getSubordinateRoles()
    {
        if ($this->roleModel) {
            return $this->roleModel->getAllSubordinates();
        }
        return [];
    }

    /**
     * Check if user can manage another user based on role hierarchy.
     */
    public function canManageUser(self $otherUser): bool
    {
        if ($this->isSuperAdmin()) {
            return true;
        }

        if (!$this->roleModel || !$otherUser->roleModel) {
            return false;
        }

        // Check if this user's role is higher in hierarchy
        $subordinates = $this->getSubordinateRoles();
        return in_array($otherUser->roleModel->id, array_column($subordinates, 'id'));
    }

    public function patients()
    {
        return $this->hasMany(Patient::class);
    }

    public function rolePermissions()
    {
        return $this->hasManyThrough(RolePermission::class, Permission::class, 'id', 'permission_id');
    }

    public function userPermissions()
    {
        return $this->hasMany(UserPermission::class);
    }

    public function temporaryPermissions()
    {
        return $this->hasMany(TemporaryPermission::class);
    }

    /**
     * Check if the user is deletable
     * Super Admin is immutable and cannot be deleted
     */
    public function isDeletable(): bool
    {
        return !$this->isSuperAdmin();
    }

    /**
     * Check if the account is locked.
     */
    public function isLocked(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }

    /**
     * Unlock the account.
     */
    public function unlock(): bool
    {
        return $this->update([
            'failed_login_attempts' => 0,
            'locked_until' => null,
        ]);
    }

    /**
     * Check if password needs to be changed (e.g., older than 90 days).
     */
    public function passwordNeedsChange(int $maxAgeDays = 90): bool
    {
        if (!$this->password_changed_at) {
            return true;
        }

        return $this->password_changed_at->addDays($maxAgeDays)->isPast();
    }

    /**
     * Validate permission dependencies for a set of permissions
     */
    public function validatePermissionDependencies(array $permissionIds): array
    {
        $errors = [];
        $currentPermissions = collect($permissionIds);

        foreach ($permissionIds as $permissionId) {
            $dependencies = PermissionDependency::where('permission_id', $permissionId)
                ->with('dependsOnPermission')
                ->get();

            foreach ($dependencies as $dependency) {
                if (!$currentPermissions->contains($dependency->depends_on_permission_id)) {
                    $errors[] = "Permission '{$dependency->permission->name}' requires '{$dependency->dependsOnPermission->name}'";
                }
            }
        }

        return $errors;
    }

    /**
     * Get audit logs for this user.
     */
    public function auditLogs()
    {
        return $this->hasMany(AuditLog::class);
    }
}
