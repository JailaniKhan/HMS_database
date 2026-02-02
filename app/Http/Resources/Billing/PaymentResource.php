<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
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
            'payment_method' => $this->payment_method,
            'amount' => number_format($this->amount, 2),
            'payment_date' => $this->payment_date?->toISOString(),
            'transaction_id' => $this->transaction_id,
            'reference_number' => $this->reference_number,
            'card_last_four' => $this->when($this->card_last_four, function () {
                return '****' . $this->card_last_four;
            }),
            'card_type' => $this->card_type,
            'bank_name' => $this->bank_name,
            'check_number' => $this->check_number,
            'amount_tendered' => $this->when($this->amount_tendered, function () {
                return number_format($this->amount_tendered, 2);
            }),
            'change_due' => $this->when($this->change_due, function () {
                return number_format($this->change_due, 2);
            }),
            'insurance_claim_id' => $this->insurance_claim_id,
            'received_by' => $this->received_by,
            'notes' => $this->notes,
            'status' => $this->status,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relationships
            'received_by_user' => $this->whenLoaded('receivedBy', function () {
                return [
                    'id' => $this->receivedBy->id,
                    'name' => $this->receivedBy->name,
                    'username' => $this->receivedBy->username,
                ];
            }),

            'insurance_claim' => $this->whenLoaded('insuranceClaim', function () {
                return [
                    'id' => $this->insuranceClaim->id,
                    'claim_number' => $this->insuranceClaim->claim_number,
                    'status' => $this->insuranceClaim->status,
                ];
            }),
        ];
    }
}
