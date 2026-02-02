<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class BillRefund extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_id',
        'payment_id',
        'bill_item_id',
        'refund_amount',
        'refund_type',
        'refund_reason',
        'refund_date',
        'refund_method',
        'reference_number',
        'status',
        'requested_by',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'processed_by',
        'processed_at',
        'notes',
    ];

    protected $casts = [
        'refund_amount' => 'decimal:2',
        'refund_date' => 'datetime',
        'approved_at' => 'datetime',
        'processed_at' => 'datetime',
    ];

    /**
     * Boot method for auto-generating reference numbers
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($refund) {
            if (empty($refund->reference_number)) {
                $refund->reference_number = self::generateReferenceNumber();
            }
        });
    }

    /**
     * Generate unique reference number
     */
    public static function generateReferenceNumber(): string
    {
        $prefix = 'RFD';
        $date = now()->format('Ymd');
        $random = strtoupper(Str::random(6));
        
        return "{$prefix}-{$date}-{$random}";
    }

    /**
     * Relationships
     */
    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }

    public function payment()
    {
        return $this->belongsTo(Payment::class);
    }

    public function billItem()
    {
        return $this->belongsTo(BillItem::class);
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    /**
     * Scopes
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeProcessed($query)
    {
        return $query->where('status', 'processed');
    }

    public function scopeByBill($query, int $billId)
    {
        return $query->where('bill_id', $billId);
    }

    public function scopeByPayment($query, int $paymentId)
    {
        return $query->where('payment_id', $paymentId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('refund_date', [$startDate, $endDate]);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('refund_type', $type);
    }

    public function scopeByRequestedBy($query, int $userId)
    {
        return $query->where('requested_by', $userId);
    }

    public function scopeAwaitingApproval($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeAwaitingProcessing($query)
    {
        return $query->where('status', 'approved')
                     ->whereNull('processed_at');
    }

    /**
     * Accessors
     */
    public function getIsPendingAttribute(): bool
    {
        return $this->status === 'pending';
    }

    public function getIsApprovedAttribute(): bool
    {
        return $this->status === 'approved';
    }

    public function getIsRejectedAttribute(): bool
    {
        return $this->status === 'rejected';
    }

    public function getIsProcessedAttribute(): bool
    {
        return $this->status === 'processed';
    }

    public function getStatusLabelAttribute(): string
    {
        $labels = [
            'pending' => 'Pending Approval',
            'approved' => 'Approved',
            'rejected' => 'Rejected',
            'processed' => 'Processed',
        ];

        return $labels[$this->status] ?? ucfirst($this->status);
    }

    public function getRefundTypeLabelAttribute(): string
    {
        $labels = [
            'full' => 'Full Refund',
            'partial' => 'Partial Refund',
            'item' => 'Item Refund',
        ];

        return $labels[$this->refund_type] ?? ucfirst($this->refund_type);
    }

    public function getRefundMethodLabelAttribute(): string
    {
        $labels = [
            'cash' => 'Cash',
            'card' => 'Credit/Debit Card',
            'bank_transfer' => 'Bank Transfer',
            'check' => 'Check',
        ];

        return $labels[$this->refund_method] ?? ucfirst($this->refund_method);
    }

    public function getIsFullyRefundedAttribute(): bool
    {
        return $this->refund_type === 'full' && $this->status === 'processed';
    }

    /**
     * Approve the refund request
     */
    public function approve(?int $userId = null, ?string $notes = null): void
    {
        $this->update([
            'status' => 'approved',
            'approved_by' => $userId ?? auth()->id(),
            'approved_at' => now(),
            'notes' => $notes ? $this->notes . "\nApproval notes: {$notes}" : $this->notes,
        ]);
    }

    /**
     * Reject the refund request
     */
    public function reject(string $reason, ?int $userId = null): void
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'approved_by' => $userId ?? auth()->id(),
            'approved_at' => now(),
        ]);
    }

    /**
     * Process the refund
     */
    public function process(?int $userId = null): void
    {
        $this->update([
            'status' => 'processed',
            'processed_by' => $userId ?? auth()->id(),
            'processed_at' => now(),
        ]);

        // Update payment status if applicable
        if ($this->payment) {
            $this->payment->markAsRefunded();
        }
    }

    /**
     * Get formatted refund amount
     */
    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->refund_amount, 2);
    }
}
