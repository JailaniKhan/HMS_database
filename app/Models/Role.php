<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Role extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'is_system',
        'priority',
        'parent_role_id',
        'reporting_structure',
        'module_access',
        'data_visibility_scope',
        'user_management_capabilities',
        'system_configuration_access',
        'reporting_permissions',
        'role_specific_limitations',
    ];

    protected $casts = [
        'is_system' => 'boolean',
        'priority' => 'integer',
        'module_access' => 'array',
        'data_visibility_scope' => 'array',
        'user_management_capabilities' => 'array',
        'system_configuration_access' => 'array',
        'reporting_permissions' => 'array',
        'role_specific_limitations' => 'array',
    ];

    /**
     * Get users with this role.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get parent role (supervisor).
     */
    public function parentRole()
    {
        return $this->belongsTo(self::class, 'parent_role_id');
    }

    /**
     * Get subordinate roles.
     */
    public function subordinateRoles(): HasMany
    {
        return $this->hasMany(self::class, 'parent_role_id');
    }

    /**
     * Get reporting relationships where this role is supervisor.
     */
    public function supervisorRelationships(): HasMany
    {
        return $this->hasMany(RoleReportingRelationship::class, 'supervisor_role_id');
    }

    /**
     * Get reporting relationships where this role is subordinate.
     */
    public function subordinateRelationships(): HasMany
    {
        return $this->hasMany(RoleReportingRelationship::class, 'subordinate_role_id');
    }

    /**
     * Get permissions for this role through the normalized mapping table.
     */
    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'role_permission_mappings')
                    ->withTimestamps();
    }

    /**
     * Check if this role has a specific permission.
     */
    public function hasPermission(string $permissionName): bool
    {
        return $this->permissions()->where('name', $permissionName)->exists();
    }

    /**
     * Get all permissions for this role including inherited permissions.
     */
    public function getAllPermissions(): array
    {
        $permissions = $this->permissions->pluck('name')->toArray();
        
        // Include parent role permissions if exists
        if ($this->parentRole) {
            $parentPermissions = $this->parentRole->getAllPermissions();
            $permissions = array_unique(array_merge($permissions, $parentPermissions));
        }
        
        return $permissions;
    }

    /**
     * Check if this role can manage users.
     */
    public function canManageUsers(): bool
    {
        return $this->user_management_capabilities && 
               in_array('manage_users', $this->user_management_capabilities);
    }

    /**
     * Check if this role has system configuration access.
     */
    public function hasSystemConfigurationAccess(): bool
    {
        return $this->system_configuration_access && 
               count($this->system_configuration_access) > 0;
    }

    /**
     * Get role hierarchy level.
     */
    public function getHierarchyLevel(): int
    {
        if ($this->parentRole) {
            return $this->parentRole->getHierarchyLevel() + 1;
        }
        return 1;
    }

    /**
     * Check if this role is in the same segregation group as another role.
     */
    public function isInSameSegregationGroup(self $otherRole): bool
    {
        // Implementation depends on business rules
        return $this->priority === $otherRole->priority;
    }

    /**
     * Check if this is a system role that cannot be deleted.
     */
    public function isSystemRole(): bool
    {
        return $this->is_system;
    }

    /**
     * Scope to get only system roles.
     */
    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }

    /**
     * Scope to get non-system roles.
     */
    public function scopeCustom($query)
    {
        return $query->where('is_system', false);
    }

    /**
     * Get role by slug.
     */
    public static function findBySlug(string $slug): ?self
    {
        return static::where('slug', $slug)->first();
    }

    /**
     * Scope to get roles by priority level.
     */
    public function scopeByPriority($query, int $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope to get roles with parent relationships.
     */
    public function scopeWithHierarchy($query)
    {
        return $query->with(['parentRole', 'subordinateRoles']);
    }

    /**
     * Get all subordinate roles recursively.
     */
    public function getAllSubordinates(): array
    {
        $subordinates = [];
        
        foreach ($this->subordinateRoles as $subordinate) {
            $subordinates[] = $subordinate;
            $subordinates = array_merge($subordinates, $subordinate->getAllSubordinates());
        }
        
        return $subordinates;
    }
}
