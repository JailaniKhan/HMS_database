<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\MedicineCategory;
use App\Models\SalesItem;
use App\Models\MedicineAlert;

class Medicine extends Model
{
    use HasFactory;
    protected $fillable = [
        'medicine_id',
        'medicine_code',
        'name',
        'description',
        'manufacturer',
        'chemical_name',
        'category',
        'form',
        'strength',
        'cost_price',
        'sale_price',
        'unit_price',
        'price',
        'quantity',
        'stock_quantity',
        'reorder_level',
        'expiry_date',
        'batch_number',
        'status',
        'side_effects',
        'instructions',
        'category_id',
        'unit',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'price' => 'decimal:2',
        'quantity' => 'integer',
        'stock_quantity' => 'integer',
        'reorder_level' => 'integer',
        'expiry_date' => 'date',
    ];

    protected $appends = ['dosage_form'];

    public function category()
    {
        return $this->belongsTo(MedicineCategory::class, 'category_id');
    }

    public function salesItems()
    {
        return $this->hasMany(SalesItem::class);
    }

    public function alerts()
    {
        return $this->hasMany(MedicineAlert::class);
    }

    /**
     * Get the dosage form attribute.
     * Maps the 'form' database column to 'dosage_form' for API/frontend compatibility.
     */
    public function getDosageFormAttribute(): ?string
    {
        return $this->attributes['form'] ?? null;
    }

    /**
     * Set the dosage form attribute.
     * Maps 'dosage_form' to the 'form' database column.
     */
    public function setDosageFormAttribute(?string $value): void
    {
        $this->attributes['form'] = $value;
    }

    /**
     * Get the profit margin percentage.
     * Calculates the profit margin based on cost price and sale price.
     */
    public function getProfitMarginAttribute(): float
    {
        if (($this->cost_price ?? 0) <= 0) {
            return 0;
        }
        return round((($this->sale_price - $this->cost_price) / $this->cost_price) * 100, 2);
    }

    /**
     * Get the profit per unit.
     * Calculates the absolute profit per unit sold.
     */
    public function getProfitPerUnitAttribute(): float
    {
        return round(($this->sale_price ?? 0) - ($this->cost_price ?? 0), 2);
    }

    /**
     * Get the total stock value at cost price.
     * Used for inventory valuation at purchase cost.
     */
    public function getStockValueAtCostAttribute(): float
    {
        return round(($this->stock_quantity ?? 0) * ($this->cost_price ?? 0), 2);
    }

    /**
     * Get the total stock value at sale price.
     * Used for potential revenue calculation.
     */
    public function getStockValueAtSaleAttribute(): float
    {
        return round(($this->stock_quantity ?? 0) * ($this->sale_price ?? 0), 2);
    }

    /**
     * Get the potential profit from current stock.
     * Difference between sale value and cost value.
     */
    public function getPotentialProfitAttribute(): float
    {
        return round($this->stock_value_at_sale - $this->stock_value_at_cost, 2);
    }

    /**
     * Check if the medicine is low on stock.
     * Compares current stock against reorder level.
     */
    public function isLowStock(): bool
    {
        return $this->stock_quantity > 0 && $this->stock_quantity <= $this->reorder_level;
    }

    /**
     * Check if the medicine is out of stock.
     */
    public function isOutOfStock(): bool
    {
        return $this->stock_quantity <= 0;
    }

    /**
     * Check if the medicine is critically low on stock.
     * Stock is at or below 50% of reorder level.
     */
    public function isCriticalStock(): bool
    {
        return $this->stock_quantity > 0 && $this->stock_quantity <= ($this->reorder_level * 0.5);
    }

    /**
     * Check if the medicine is expired.
     */
    public function isExpired(): bool
    {
        return $this->expiry_date && now()->isAfter($this->expiry_date);
    }

    /**
     * Check if the medicine is expiring soon.
     * Within the specified number of days (default 30).
     */
    public function isExpiringSoon(int $days = 30): bool
    {
        if (!$this->expiry_date) {
            return false;
        }
        return now()->isBefore($this->expiry_date) 
            && now()->addDays($days)->isAfter($this->expiry_date);
    }

    /**
     * Get days until expiry.
     * Returns negative for expired medicines.
     */
    public function getDaysUntilExpiryAttribute(): int
    {
        if (!$this->expiry_date) {
            return PHP_INT_MAX;
        }
        return (int) now()->diffInDays($this->expiry_date, false);
    }

    /**
     * Get the stock status.
     * Returns: 'in-stock', 'low-stock', 'critical', or 'out-of-stock'.
     */
    public function getStockStatusAttribute(): string
    {
        if ($this->stock_quantity <= 0) {
            return 'out-of-stock';
        }
        if ($this->stock_quantity <= $this->reorder_level * 0.5) {
            return 'critical';
        }
        if ($this->stock_quantity <= $this->reorder_level) {
            return 'low-stock';
        }
        return 'in-stock';
    }

    /**
     * Get the expiry status.
     * Returns: 'valid', 'expiring-soon', or 'expired'.
     */
    public function getExpiryStatusAttribute(): string
    {
        if (!$this->expiry_date) {
            return 'valid';
        }
        if (now()->isAfter($this->expiry_date)) {
            return 'expired';
        }
        if (now()->addDays(30)->isAfter($this->expiry_date)) {
            return 'expiring-soon';
        }
        return 'valid';
    }

    /**
     * Scope for in-stock medicines.
     */
    public function scopeInStock($query)
    {
        return $query->where('stock_quantity', '>', 0);
    }

    /**
     * Scope for low stock medicines.
     */
    public function scopeLowStock($query)
    {
        return $query->where('stock_quantity', '>', 0)
            ->whereColumn('stock_quantity', '<=', 'reorder_level');
    }

    /**
     * Scope for expired medicines.
     */
    public function scopeExpired($query)
    {
        return $query->whereDate('expiry_date', '<', now());
    }

    /**
     * Scope for expiring soon medicines.
     */
    public function scopeExpiringSoon($query, int $days = 30)
    {
        return $query->whereDate('expiry_date', '>=', now())
            ->whereDate('expiry_date', '<=', now()->addDays($days));
    }
}
