<?php

namespace App\Http\Resources\Billing;

use App\Http\Resources\PatientResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BillResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            // Core fields
            'id' => $this->id,
            'bill_number' => $this->bill_number,
            'invoice_number' => $this->invoice_number,
            'patient_id' => $this->patient_id,
            'doctor_id' => $this->doctor_id,
            'created_by' => $this->created_by,
            'primary_insurance_id' => $this->primary_insurance_id,

            // Dates
            'bill_date' => $this->bill_date?->toISOString(),
            'due_date' => $this->due_date?->toISOString(),
            'last_payment_date' => $this->last_payment_date?->toISOString(),
            'reminder_last_sent' => $this->reminder_last_sent?->toISOString(),
            'voided_at' => $this->voided_at?->toISOString(),

            // Financial amounts
            'sub_total' => number_format($this->sub_total, 2),
            'discount' => number_format($this->discount, 2),
            'total_discount' => number_format($this->total_discount, 2),
            'tax' => number_format($this->tax, 2),
            'total_tax' => number_format($this->total_tax, 2),
            'total_amount' => number_format($this->total_amount, 2),
            'amount_paid' => number_format($this->amount_paid, 2),
            'amount_due' => number_format($this->amount_due, 2),
            'balance_due' => number_format($this->balance_due, 2),
            'insurance_claim_amount' => number_format($this->insurance_claim_amount, 2),
            'insurance_approved_amount' => $this->when($this->insurance_approved_amount, function () {
                return number_format($this->insurance_approved_amount, 2);
            }),
            'patient_responsibility' => number_format($this->patient_responsibility, 2),

            // Status fields
            'payment_status' => $this->payment_status,
            'status' => $this->status,
            'reminder_sent_count' => $this->reminder_sent_count,

            // Additional info
            'notes' => $this->notes,
            'billing_address' => $this->billing_address,
            'void_reason' => $this->void_reason,
            'voided_by' => $this->voided_by,

            // Timestamps
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relationships
            'patient' => $this->whenLoaded('patient', function () {
                return new PatientResource($this->patient);
            }),

            'doctor' => $this->whenLoaded('doctor', function () {
                return [
                    'id' => $this->doctor->id,
                    'doctor_id' => $this->doctor->doctor_id,
                    'full_name' => $this->doctor->full_name,
                    'specialization' => $this->doctor->specialization,
                ];
            }),

            'created_by_user' => $this->whenLoaded('createdBy', function () {
                return [
                    'id' => $this->createdBy->id,
                    'name' => $this->createdBy->name,
                    'username' => $this->createdBy->username,
                ];
            }),

            'items' => $this->whenLoaded('items', function () {
                return BillItemResource::collection($this->items);
            }),

            'payments' => $this->whenLoaded('payments', function () {
                return PaymentResource::collection($this->payments);
            }),

            'insurance_claims' => $this->whenLoaded('insuranceClaims', function () {
                return InsuranceClaimResource::collection($this->insuranceClaims);
            }),

            'refunds' => $this->whenLoaded('refunds', function () {
                return BillRefundResource::collection($this->refunds);
            }),

            'status_history' => $this->whenLoaded('statusHistory', function () {
                return BillStatusHistoryResource::collection($this->statusHistory);
            }),

            'primary_insurance' => $this->whenLoaded('primaryInsurance', function () {
                return [
                    'id' => $this->primaryInsurance->id,
                    'policy_number' => $this->primaryInsurance->policy_number,
                    'insurance_provider' => $this->when($this->primaryInsurance->insuranceProvider, function () {
                        return [
                            'id' => $this->primaryInsurance->insuranceProvider->id,
                            'name' => $this->primaryInsurance->insuranceProvider->name,
                            'code' => $this->primaryInsurance->insuranceProvider->code,
                        ];
                    }),
                ];
            }),

            'voided_by_user' => $this->whenLoaded('voidedBy', function () {
                return [
                    'id' => $this->voidedBy->id,
                    'name' => $this->voidedBy->name,
                    'username' => $this->voidedBy->username,
                ];
            }),

            // Computed fields
            'is_paid' => $this->is_paid,
            'is_overdue' => $this->is_overdue,
            'is_voided' => $this->is_voided,
            'remaining_balance' => number_format($this->remaining_balance, 2),
        ];
    }
}
