<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class InsuranceClaim extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'bill_id',
        'patient_insurance_id',
        'claim_number',
        'claim_amount',
        'approved_amount',
        'deductible_amount',
        'co_pay_amount',
        'status',
        'submission_date',
        'response_date',
        'approval_date',
        'rejection_reason',
        'rejection_codes',
        'documents',
        'notes',
        'internal_notes',
        'submitted_by',
        'processed_by',
    ];

    protected $casts = [
        'claim_amount' => 'decimal:2',
        'approved_amount' => 'decimal:2',
        'deductible_amount' => 'decimal:2',
        'co_pay_amount' => 'decimal:2',
        'submission_date' => 'date',
        'response_date' => 'date',
        'approval_date' => 'date',
        'rejection_codes' => 'array',
        'documents' => 'array',
    ];

    /**
     * Boot method for auto-generating claim numbers
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($claim) {
            if (empty($claim->claim_number)) {
                $claim->claim_number = self::generateClaimNumber();
            }
        });
    }

    /**
     * Generate unique claim number
     */
    public static function generateClaimNumber(): string
    {
        $prefix = 'CLM';
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

    public function patientInsurance()
    {
        return $this->belongsTo(PatientInsurance::class);
    }

    public function submittedBy()
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }

    public function processedBy()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function payments()
    {
        return $this->hasMany(Payment::class, 'insurance_claim_id');
    }

    /**
     * Scopes
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', 'submitted');
    }

    public function scopeUnderReview($query)
    {
        return $query->where('status', 'under_review');
    }

    public function scopeApproved($query)
    {
        return $query->whereIn('status', ['approved', 'partial_approved']);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeByBill($query, int $billId)
    {
        return $query->where('bill_id', $billId);
    }

    public function scopeByPatientInsurance($query, int $insuranceId)
    {
        return $query->where('patient_insurance_id', $insuranceId);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('submission_date', [$startDate, $endDate]);
    }

    public function scopePendingApproval($query)
    {
        return $query->whereIn('status', ['submitted', 'under_review']);
    }

    /**
     * Accessors
     */
    public function getIsDraftAttribute(): bool
    {
        return $this->status === 'draft';
    }

    public function getIsSubmittedAttribute(): bool
    {
        return in_array($this->status, ['submitted', 'under_review']);
    }

    public function getIsApprovedAttribute(): bool
    {
        return $this->status === 'approved';
    }

    public function getIsPartiallyApprovedAttribute(): bool
    {
        return $this->status === 'partial_approved';
    }

    public function getIsRejectedAttribute(): bool
    {
        return $this->status === 'rejected';
    }

    public function getStatusLabelAttribute(): string
    {
        $labels = [
            'draft' => 'Draft',
            'pending' => 'Pending',
            'submitted' => 'Submitted',
            'under_review' => 'Under Review',
            'approved' => 'Approved',
            'partial_approved' => 'Partially Approved',
            'rejected' => 'Rejected',
            'appealed' => 'Appealed',
        ];

        return $labels[$this->status] ?? ucfirst($this->status);
    }

    public function getPatientResponsibilityAttribute(): float
    {
        $approved = $this->approved_amount ?? 0;
        return $this->claim_amount - $approved + $this->deductible_amount + $this->co_pay_amount;
    }

    public function getInsuranceResponsibilityAttribute(): float
    {
        return $this->approved_amount ?? 0;
    }

    /**
     * Submit the claim
     */
    public function submit(?int $userId = null): void
    {
        $this->update([
            'status' => 'submitted',
            'submission_date' => now(),
            'submitted_by' => $userId ?? auth()->id(),
        ]);
    }

    /**
     * Approve the claim
     */
    public function approve(float $approvedAmount, ?int $userId = null): void
    {
        $status = $approvedAmount < $this->claim_amount ? 'partial_approved' : 'approved';
        
        $this->update([
            'status' => $status,
            'approved_amount' => $approvedAmount,
            'approval_date' => now(),
            'response_date' => now(),
            'processed_by' => $userId ?? auth()->id(),
        ]);
    }

    /**
     * Reject the claim
     */
    public function reject(string $reason, array $codes = [], ?int $userId = null): void
    {
        $this->update([
            'status' => 'rejected',
            'rejection_reason' => $reason,
            'rejection_codes' => $codes,
            'response_date' => now(),
            'processed_by' => $userId ?? auth()->id(),
        ]);
    }

    /**
     * Mark as under review
     */
    public function markUnderReview(?int $userId = null): void
    {
        $this->update([
            'status' => 'under_review',
            'processed_by' => $userId ?? auth()->id(),
        ]);
    }

    /**
     * Get total payments received for this claim
     */
    public function getTotalPaymentsAttribute(): float
    {
        return $this->payments()
                    ->where('status', 'completed')
                    ->sum('amount');
    }
}
