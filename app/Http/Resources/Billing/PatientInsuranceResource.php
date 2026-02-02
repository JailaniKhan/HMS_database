<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientInsuranceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'patient_id' => $this->patient_id,
            'insurance_provider_id' => $this->insurance_provider_id,
            'policy_number' => $this->policy_number,
            'policy_holder_name' => $this->policy_holder_name,
            'relationship_to_patient' => $this->relationship_to_patient,
            'relationship_label' => $this->relationship_label,
            'coverage_start_date' => $this->coverage_start_date?->toISOString(),
            'coverage_end_date' => $this->coverage_end_date?->toISOString(),
            'co_pay_amount' => number_format($this->co_pay_amount, 2),
            'co_pay_percentage' => number_format($this->co_pay_percentage, 2),
            'deductible_amount' => number_format($this->deductible_amount, 2),
            'deductible_met' => number_format($this->deductible_met, 2),
            'annual_max_coverage' => $this->when($this->annual_max_coverage, function () {
                return number_format($this->annual_max_coverage, 2);
            }),
            'annual_used_amount' => number_format($this->annual_used_amount, 2),
            'is_primary' => $this->is_primary,
            'priority_order' => $this->priority_order,
            'is_active' => $this->is_active,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),

            // Relationships
            'patient' => $this->whenLoaded('patient', function () {
                return [
                    'id' => $this->patient->id,
                    'patient_id' => $this->patient->patient_id,
                    'name' => $this->patient->full_name ?? $this->patient->name,
                    'phone' => $this->patient->phone,
                    'email' => $this->patient->email,
                ];
            }),

            'insurance_provider' => $this->whenLoaded('insuranceProvider', function () {
                return [
                    'id' => $this->insuranceProvider->id,
                    'name' => $this->insuranceProvider->name,
                    'code' => $this->insuranceProvider->code,
                ];
            }),

            // Computed fields
            'is_valid' => $this->is_valid,
            'is_expired' => $this->is_expired,
            'remaining_deductible' => number_format($this->remaining_deductible, 2),
            'remaining_annual_coverage' => $this->annual_max_coverage
                ? number_format($this->remaining_annual_coverage, 2)
                : null,
        ];
    }
}
