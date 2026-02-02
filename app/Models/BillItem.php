<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class BillItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_id',
        'item_type',
        'source_type',
        'source_id',
        'category',
        'item_description',
        'quantity',
        'unit_price',
        'discount_amount',
        'discount_percentage',
        'total_price',
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'discount_percentage' => 'decimal:2',
        'total_price' => 'decimal:2',
    ];

    /**
     * Relationships
     */
    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }

    /**
     * Polymorphic relationship to source (appointment, lab test, pharmacy, etc.)
     */
    public function source(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scopes
     */
    public function scopeByType($query, string $type)
    {
        return $query->where('item_type', $type);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    public function scopeBySource($query, string $sourceType, int $sourceId)
    {
        return $query->where('source_type', $sourceType)
                     ->where('source_id', $sourceId);
    }

    public function scopeHasDiscount($query)
    {
        return $query->where(function ($q) {
            $q->where('discount_amount', '>', 0)
              ->orWhere('discount_percentage', '>', 0);
        });
    }

    /**
     * Accessors
     */
    public function getNetPriceAttribute(): float
    {
        return $this->total_price - $this->discount_amount;
    }

    public function getHasDiscountAttribute(): bool
    {
        return $this->discount_amount > 0 || $this->discount_percentage > 0;
    }

    public function getDiscountedAmountAttribute(): float
    {
        $percentageDiscount = $this->unit_price * $this->quantity * ($this->discount_percentage / 100);
        return $this->discount_amount + $percentageDiscount;
    }

    /**
     * Calculate total price before saving
     */
    protected static function boot(): void
    {
        parent::boot();

        static::saving(function ($item) {
            $baseAmount = $item->quantity * $item->unit_price;
            $percentageDiscount = $baseAmount * ($item->discount_percentage / 100);
            $item->total_price = $baseAmount - $item->discount_amount - $percentageDiscount;
        });
    }
}
