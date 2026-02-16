<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DepartmentService extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_id',
        'name',
        'description',
        'base_cost',
        'fee_percentage',
        'discount_percentage',
        'is_active',
    ];

    protected $casts = [
        'base_cost' => 'decimal:2',
        'fee_percentage' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = ['final_cost'];

    /**
     * Get the department that owns the service.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Calculate the final cost of the service.
     */
    public function getFinalCostAttribute(): float
    {
        $feeAmount = $this->base_cost * ($this->fee_percentage / 100);
        $discountAmount = $this->base_cost * ($this->discount_percentage / 100);
        
        return round($this->base_cost + $feeAmount - $discountAmount, 2);
    }

    /**
     * Scope a query to only include active services.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}
