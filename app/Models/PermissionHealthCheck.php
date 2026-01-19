<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PermissionHealthCheck extends Model
{
    protected $fillable = [
        'check_type',
        'status',
        'details',
        'checked_at',
    ];

    protected $casts = [
        'details' => 'array',
        'checked_at' => 'datetime',
    ];
}
