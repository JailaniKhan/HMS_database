<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RoleReportingRelationship extends Model
{
    protected $fillable = [
        'supervisor_role_id',
        'subordinate_role_id',
        'relationship_type',
        'description',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the supervisor role.
     */
    public function supervisorRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'supervisor_role_id');
    }

    /**
     * Get the subordinate role.
     */
    public function subordinateRole(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'subordinate_role_id');
    }

    /**
     * Scope to get active relationships only.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
