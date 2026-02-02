<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class PatientInsurance extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'patient_insurances';

    protected $fillable = [
        'patient_id',
        'insurance_provider_id',
        'policy_number',
        'policy_holder_name',
        'relationship_to_patient',
        'coverage_start_date',
        'coverage_end_date',
        'co_pay_amount',
        'co_pay_percentage',
        'deductible_amount',
        'deductible_met',
        'annual_max_coverage',
        'annual_used_amount',
        'is_primary',
        'priority_order',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'coverage_start_date' => 'date',
        'coverage_end_date' => 'date',
        'co_pay_amount' => 'decimal:2',
        'co_pay_percentage' => 'decimal:2',
        'deductible_amount' => 'decimal:2',
        'deductible_met' => 'decimal:2',
        'annual_max_coverage' => 'decimal:2',
        'annual_used_amount' => 'decimal:2',
        'is_primary' => 'boolean',
        'priority_order' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Relationships
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function insuranceProvider()
    {
        return $this->belongsTo(InsuranceProvider::class);
    }

    public function insuranceClaims()
    {
        return $this->hasMany(InsuranceClaim::class);
    }

    public function bills()
    {
        return $this->hasMany(Bill::class, 'primary_insurance_id');
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function scopePrimary($query)
    {
        return $query->where('is_primary', true);
    }

    public function scopeByPatient($query, int $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    public function scopeByProvider($query, int $providerId)
    {
        return $query->where('insurance_provider_id', $providerId);
    }

    public function scopeValid($query)
    {
        return $query->where('is_active', true)
                     ->where('coverage_start_date', '<=', now())
                     ->where(function ($q) {
                         $q->whereNull('coverage_end_date')
                           ->orWhere('coverage_end_date', '>=', now());
                     });
    }

    public function scopeExpired($query)
    {
        return $query->whereNotNull('coverage_end_date')
                     ->where('coverage_end_date', '<', now());
    }

    /**
     * Accessors
     */
    public function getIsValidAttribute(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->coverage_start_date > now()) {
            return false;
        }

        if ($this->coverage_end_date && $this->coverage_end_date < now()) {
            return false;
        }

        return true;
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->coverage_end_date && $this->coverage_end_date < now();
    }

    public function getRemainingDeductibleAttribute(): float
    {
        return max(0, $this->deductible_amount - $this->deductible_met);
    }

    public function getRemainingAnnualCoverageAttribute(): float
    {
        if (is_null($this->annual_max_coverage)) {
            return PHP_FLOAT_MAX;
        }
        return max(0, $this->annual_max_coverage - $this->annual_used_amount);
    }

    public function getRelationshipLabelAttribute(): string
    {
        $labels = [
            'self' => 'Self',
            'spouse' => 'Spouse',
            'child' => 'Child',
            'parent' => 'Parent',
            'other' => 'Other',
        ];

        return $labels[$this->relationship_to_patient] ?? ucfirst($this->relationship_to_patient);
    }

    public function getProviderNameAttribute(): string
    {
        return $this->insuranceProvider?->name ?? 'Unknown Provider';
    }

    /**
     * Calculate co-pay amount for a given total
     */
    public function calculateCoPay(float $amount): float
    {
        $percentageCoPay = $amount * ($this->co_pay_percentage / 100);
        return $this->co_pay_amount + $percentageCoPay;
    }

    /**
     * Update deductible met amount
     */
    public function addToDeductibleMet(float $amount): void
    {
        $this->deductible_met += $amount;
        $this->save();
    }

    /**
     * Update annual used amount
     */
    public function addToAnnualUsed(float $amount): void
    {
        $this->annual_used_amount += $amount;
        $this->save();
    }

    /**
     * Get coverage status text
     */
    public function getCoverageStatusAttribute(): string
    {
        if (!$this->is_active) {
            return 'Inactive';
        }

        if ($this->isExpired) {
            return 'Expired';
        }

        if ($this->coverage_start_date > now()) {
            return 'Not Yet Active';
        }

        return 'Active';
    }
}
