<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InsuranceClaimResource extends JsonResource
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
            'bill_id' => $this->bill_id,
            'patient_insurance_id' => $this->patient_insurance_id,
            'claim_number' => $this->claim_number,
            'claim_amount' => number_format($this->claim_amount, 2),
            'approved_amount' => $this->when($this->approved_amount, function () {
                return number_format($this->approved_amount, 2);
            }),
            'deductible_amount' => number_format($this->deductible_amount, 2),
            'co_pay_amount' => number_format($this->co_pay_amount, 2),
            'status' => $this->status,
            'status_label' => $this->status_label,
            'submission_date' => $this->submission_date?->toISOString(),
            'response_date' => $this->response_date?->toISOString(),
            'approval_date' => $this->approval_date?->toISOString(),
            'rejection_reason' => $this->rejection_reason,
            'rejection_codes' => $this->rejection_codes,
            'documents' => $this->documents,
            'notes' => $this->notes,
            'internal_notes' => $this->internal_notes,
            'submitted_by' => $this->submitted_by,
            'processed_by' => $this->processed_by,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),

            // Relationships
            'bill' => $this->whenLoaded('bill', function () {
                return [
                    'id' => $this->bill->id,
                    'bill_number' => $this->bill->bill_number,
                    'total_amount' => number_format($this->bill->total_amount, 2),
                    'patient_id' => $this->bill->patient_id,
                ];
            }),

            'patient_insurance' => $this->whenLoaded('patientInsurance', function () {
                return [
                    'id' => $this->patientInsurance->id,
                    'policy_number' => $this->patientInsurance->policy_number,
                    'insurance_provider_id' => $this->patientInsurance->insurance_provider_id,
                ];
            }),

            'submitted_by_user' => $this->whenLoaded('submittedBy', function () {
                return [
                    'id' => $this->submittedBy->id,
                    'name' => $this->submittedBy->name,
                    'username' => $this->submittedBy->username,
                ];
            }),

            'processed_by_user' => $this->whenLoaded('processedBy', function () {
                return [
                    'id' => $this->processedBy->id,
                    'name' => $this->processedBy->name,
                    'username' => $this->processedBy->username,
                ];
            }),

            // Computed fields
            'is_draft' => $this->is_draft,
            'is_submitted' => $this->is_submitted,
            'is_approved' => $this->is_approved,
            'is_partially_approved' => $this->is_partially_approved,
            'is_rejected' => $this->is_rejected,
            'patient_responsibility' => number_format($this->patient_responsibility, 2),
            'insurance_responsibility' => number_format($this->insurance_responsibility, 2),
            'days_since_submission' => $this->when($this->submission_date, function () {
                return $this->submission_date->diffInDays(now());
            }),
            'approval_rate' => $this->when($this->claim_amount > 0, function () {
                $approved = $this->approved_amount ?? 0;
                return round(($approved / $this->claim_amount) * 100, 2);
            }),
        ];
    }
}
