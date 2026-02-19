<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'contact_person',
        'email',
        'phone',
        'address',
        'tax_number',
        'notes',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get the purchases for this supplier.
     */
    public function purchases()
    {
        return $this->hasMany(Purchase::class);
    }

    /**
     * Get total purchase amount from this supplier.
     */
    public function getTotalPurchaseAmountAttribute(): float
    {
        return $this->purchases()->where('status', '!=', 'cancelled')->sum('total_amount');
    }

    /**
     * Get total purchases count.
     */
    public function getTotalPurchasesCountAttribute(): int
    {
        return $this->purchases()->where('status', '!=', 'cancelled')->count();
    }

    /**
     * Scope for active suppliers.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }
}