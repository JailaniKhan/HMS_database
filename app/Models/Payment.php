<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_id',
        'payment_method',
        'amount',
        'payment_date',
        'transaction_id',
        'reference_number',
        'card_last_four',
        'card_type',
        'bank_name',
        'check_number',
        'amount_tendered',
        'change_due',
        'insurance_claim_id',
        'received_by',
        'notes',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'amount_tendered' => 'decimal:2',
        'change_due' => 'decimal:2',
        'payment_date' => 'datetime',
    ];

    /**
     * Boot method for auto-generating transaction IDs
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($payment) {
            if (empty($payment->transaction_id)) {
                $payment->transaction_id = self::generateTransactionId();
            }
        });
    }

    /**
     * Generate unique transaction ID
     */
    public static function generateTransactionId(): string
    {
        $prefix = 'TXN';
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

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function insuranceClaim()
    {
        return $this->belongsTo(InsuranceClaim::class, 'insurance_claim_id');
    }

    public function refunds()
    {
        return $this->hasMany(BillRefund::class, 'payment_id');
    }

    /**
     * Scopes
     */
    public function scopeByMethod($query, string $method)
    {
        return $query->where('payment_method', $method);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeRefunded($query)
    {
        return $query->where('status', 'refunded');
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('payment_date', [$startDate, $endDate]);
    }

    public function scopeCash($query)
    {
        return $query->where('payment_method', 'cash');
    }

    public function scopeCard($query)
    {
        return $query->where('payment_method', 'card');
    }

    public function scopeInsurance($query)
    {
        return $query->where('payment_method', 'insurance');
    }

    public function scopeByBill($query, int $billId)
    {
        return $query->where('bill_id', $billId);
    }

    public function scopeByReceivedBy($query, int $userId)
    {
        return $query->where('received_by', $userId);
    }

    /**
     * Accessors
     */
    public function getIsCompletedAttribute(): bool
    {
        return $this->status === 'completed';
    }

    public function getIsRefundedAttribute(): bool
    {
        return $this->status === 'refunded';
    }

    public function getIsCashPaymentAttribute(): bool
    {
        return $this->payment_method === 'cash';
    }

    public function getIsCardPaymentAttribute(): bool
    {
        return $this->payment_method === 'card';
    }

    public function getIsInsurancePaymentAttribute(): bool
    {
        return $this->payment_method === 'insurance';
    }

    public function getFormattedAmountAttribute(): string
    {
        return number_format($this->amount, 2);
    }

    public function getPaymentMethodLabelAttribute(): string
    {
        $labels = [
            'cash' => 'Cash',
            'card' => 'Credit/Debit Card',
            'insurance' => 'Insurance',
            'bank_transfer' => 'Bank Transfer',
            'mobile_money' => 'Mobile Money',
            'check' => 'Check',
        ];

        return $labels[$this->payment_method] ?? ucfirst($this->payment_method);
    }

    /**
     * Mark payment as refunded
     */
    public function markAsRefunded(): void
    {
        $this->update(['status' => 'refunded']);
    }

    /**
     * Get total refunds for this payment
     */
    public function getTotalRefundedAttribute(): float
    {
        return $this->refunds()
                    ->whereIn('status', ['approved', 'processed'])
                    ->sum('refund_amount');
    }

    /**
     * Check if payment can be refunded
     */
    public function getCanBeRefundedAttribute(): bool
    {
        return $this->status === 'completed' && 
               $this->amount > $this->total_refunded;
    }
}
