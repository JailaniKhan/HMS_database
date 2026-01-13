<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\Patient;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, TwoFactorAuthenticatable, HasApiTokens;

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
        ];
    }

    public function hasAnyRole($roles): bool
    {
        if (is_array($roles)) {
            return in_array($this->role, $roles);
        }
        
        return $this->role === $roles;
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
    
    public function hasPermission($permissionName): bool
    {
        // Debug: Log permission check
      
        
        // Super admin check: Hospital Admin has all permissions
        if ($this->role === 'Hospital Admin') {
           
            return true;
        }
        
        // First, check if there's a specific user permission override
        $userPermission = $this->userPermissions()
            ->whereHas('permission', function ($query) use ($permissionName) {
                $query->where('name', $permissionName);
            })
            ->first();
        
        if ($userPermission) {
        
            
            // If there's a specific user permission, return its allowed status
            return $userPermission->allowed;
        }
        
        // If no specific user permission exists, fall back to role-based permissions
        $rolePermissionExists = RolePermission::where('role', $this->role)
            ->whereHas('permission', function ($query) use ($permissionName) {
                $query->where('name', $permissionName);
            })
            ->exists();
        
        if ($rolePermissionExists) {
           
            return true;
        }
        
    
        return false;
    }
    
    public function hasAnyPermission($permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        
        return false;
    }
    
    public function hasAllPermissions($permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Check if the user is a super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'Hospital Admin';
    }
}
