<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;

class Bill extends Model
{
    use HasFactory;

    protected $fillable = [
        'bill_number',
        'invoice_number',
        'patient_id',
        'doctor_id',
        'created_by',
        'primary_insurance_id',
        'bill_date',
        'due_date',
        'sub_total',
        'discount',
        'total_discount',
        'tax',
        'total_tax',
        'total_amount',
        'amount_paid',
        'amount_due',
        'balance_due',
        'insurance_claim_amount',
        'insurance_approved_amount',
        'patient_responsibility',
        'payment_status',
        'status',
        'notes',
        'billing_address',
        'last_payment_date',
        'reminder_sent_count',
        'reminder_last_sent',
        'voided_at',
        'voided_by',
        'void_reason',
    ];

    protected $casts = [
        'bill_date' => 'date',
        'due_date' => 'date',
        'sub_total' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_discount' => 'decimal:2',
        'tax' => 'decimal:2',
        'total_tax' => 'decimal:2',
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'amount_due' => 'decimal:2',
        'balance_due' => 'decimal:2',
        'insurance_claim_amount' => 'decimal:2',
        'insurance_approved_amount' => 'decimal:2',
        'patient_responsibility' => 'decimal:2',
        'billing_address' => 'array',
        'last_payment_date' => 'datetime',
        'reminder_last_sent' => 'datetime',
        'voided_at' => 'datetime',
    ];

    /**
     * Boot method for auto-generating bill numbers
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($bill) {
            if (empty($bill->bill_number)) {
                $bill->bill_number = self::generateBillNumber();
            }
        });
    }

    /**
     * Generate unique bill number
     */
    public static function generateBillNumber(): string
    {
        $prefix = 'BL';
        $date = now()->format('Ymd');
        $random = strtoupper(Str::random(4));
        
        return "{$prefix}-{$date}-{$random}";
    }

    /**
     * Relationships
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function primaryInsurance()
    {
        return $this->belongsTo(PatientInsurance::class, 'primary_insurance_id');
    }

    public function voidedBy()
    {
        return $this->belongsTo(User::class, 'voided_by');
    }

    public function items()
    {
        return $this->hasMany(BillItem::class);
    }

    public function payments()
    {
        return $this->hasMany(Payment::class);
    }

    public function insuranceClaims()
    {
        return $this->hasMany(InsuranceClaim::class);
    }

    public function refunds()
    {
        return $this->hasMany(BillRefund::class);
    }

    public function statusHistory()
    {
        return $this->hasMany(BillStatusHistory::class);
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('payment_status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    public function scopePartial($query)
    {
        return $query->where('payment_status', 'partial');
    }

    public function scopeOverdue($query)
    {
        return $query->where('due_date', '<', now())
                     ->where('payment_status', '!=', 'paid')
                     ->whereNull('voided_at');
    }

    public function scopeVoided($query)
    {
        return $query->whereNotNull('voided_at');
    }

    public function scopeActive($query)
    {
        return $query->whereNull('voided_at');
    }

    public function scopeByPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('bill_date', [$startDate, $endDate]);
    }

    public function scopeHasInsurance($query)
    {
        return $query->whereNotNull('primary_insurance_id')
                     ->where('insurance_claim_amount', '>', 0);
    }

    /**
     * Accessors
     */
    public function getIsPaidAttribute(): bool
    {
        return $this->payment_status === 'paid';
    }

    public function getIsOverdueAttribute(): bool
    {
        return $this->due_date && $this->due_date->isPast() && !$this->isPaid;
    }

    public function getIsVoidedAttribute(): bool
    {
        return !is_null($this->voided_at);
    }

    public function getRemainingBalanceAttribute()
    {
        return $this->balance_due;
    }

    /**
     * Calculate totals from items
     */
    public function recalculateTotals(): void
    {
        $subTotal = $this->items()->sum('total_price');
        $this->sub_total = $subTotal;
        $this->total_amount = $subTotal - $this->total_discount + $this->total_tax;
        $this->balance_due = $this->total_amount - $this->amount_paid;
        $this->save();
    }

    /**
     * Record status change in history
     */
    public function recordStatusChange(string $field, $from, $to, ?string $reason = null, ?int $userId = null): void
    {
        $this->statusHistory()->create([
            'status_from' => $from,
            'status_to' => $to,
            'field_name' => $field,
            'changed_by' => $userId ?? auth()->id(),
            'reason' => $reason,
            'created_at' => now(),
        ]);
    }
}
