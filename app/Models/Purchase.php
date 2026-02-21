<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Purchase extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'purchase_number',
        'invoice_number',
        'company',
        'supplier_id',
        'purchase_date',
        'subtotal',
        'tax',
        'discount',
        'total_amount',
        'status',
        'payment_status',
        'amount_paid',
        'notes',
        'created_by',
        'received_at',
        'received_by',
    ];

    protected $casts = [
        'purchase_date' => 'date',
        'subtotal' => 'decimal:2',
        'tax' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'received_at' => 'datetime',
    ];

    /**
     * Generate a unique purchase number.
     */
    public static function generatePurchaseNumber(): string
    {
        $prefix = 'PUR';
        $date = now()->format('Ymd');
        $lastPurchase = self::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();

        if ($lastPurchase) {
            $lastNumber = (int) substr($lastPurchase->purchase_number, -4);
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }

        return $prefix . '-' . $date . '-' . $newNumber;
    }

    /**
     * Get the supplier for this purchase.
     */
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    /**
     * Get the items for this purchase.
     */
    public function items()
    {
        return $this->hasMany(PurchaseItem::class);
    }

    /**
     * Get the user who created this purchase.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the user who received this purchase.
     */
    public function receiver()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    /**
     * Calculate the total amount.
     */
    public function calculateTotal(): void
    {
        $this->subtotal = $this->items->sum('total_price');
        $this->total_amount = $this->subtotal + $this->tax - $this->discount;
    }

    /**
     * Check if purchase can be edited.
     */
    public function canBeEdited(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Check if purchase can be cancelled.
     */
    public function canBeCancelled(): bool
    {
        return in_array($this->status, ['pending', 'received']);
    }

    /**
     * Check if purchase can be received.
     */
    public function canBeReceived(): bool
    {
        return $this->status === 'pending';
    }

    /**
     * Scope for filtering by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for filtering by supplier.
     */
    public function scopeBySupplier($query, int $supplierId)
    {
        return $query->where('supplier_id', $supplierId);
    }

    /**
     * Scope for date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('purchase_date', [$startDate, $endDate]);
    }
}