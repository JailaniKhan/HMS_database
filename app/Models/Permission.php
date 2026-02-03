<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Permission extends Model
{
    protected $fillable = [
        'name',
        'description',
        'resource',
        'action',
        'category',
        'module',
        'segregation_group',
        'requires_approval',
        'risk_level',
        'dependencies',
        'hipaa_impact',
        'is_critical',
    ];

    protected $casts = [
        'requires_approval' => 'boolean',
        'risk_level' => 'integer',
        'dependencies' => 'array',
        'is_critical' => 'boolean',
    ];

    public function rolePermissions(): HasMany
    {
        return $this->hasMany(RolePermission::class, 'permission_id');
    }

    /**
     * Get permissions that depend on this permission.
     */
    public function dependentPermissions(): HasMany
    {
        return $this->hasMany(PermissionDependency::class, 'depends_on_permission_id');
    }

    /**
     * Get permissions that this permission depends on.
     */
    public function dependencies(): HasMany
    {
        return $this->hasMany(PermissionDependency::class, 'permission_id');
    }

    /**
     * Check if this permission requires approval.
     */
    public function requiresApproval(): bool
    {
        return $this->requires_approval;
    }

    /**
     * Get risk level description.
     */
    public function getRiskLevelDescription(): string
    {
        return match($this->risk_level) {
            1 => 'Low',
            2 => 'Medium',
            3 => 'High',
            default => 'Unknown'
        };
    }

    /**
     * Scope to get critical permissions.
     */
    public function scopeCritical($query)
    {
        return $query->where('is_critical', true);
    }

    /**
     * Scope to get permissions by module.
     */
    public function scopeByModule($query, string $module)
    {
        return $query->where('module', $module);
    }

    /**
     * Scope to get permissions by segregation group.
     */
    public function scopeBySegregationGroup($query, string $group)
    {
        return $query->where('segregation_group', $group);
    }
}
