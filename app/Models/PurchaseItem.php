<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'purchase_id',
        'medicine_id',
        'quantity',
        'cost_price',
        'sale_price',
        'total_price',
        'batch_number',
        'expiry_date',
        'notes',
    ];

    protected $casts = [
        'quantity' => 'integer',
        'cost_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'total_price' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    /**
     * Get the purchase for this item.
     */
    public function purchase()
    {
        return $this->belongsTo(Purchase::class);
    }

    /**
     * Get the medicine for this item.
     */
    public function medicine()
    {
        return $this->belongsTo(Medicine::class);
    }

    /**
     * Calculate total price.
     */
    public function calculateTotal(): float
    {
        return $this->quantity * $this->cost_price;
    }

    /**
     * Boot method to auto-calculate total.
     */
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($item) {
            $item->total_price = $item->quantity * $item->cost_price;
        });
    }
}