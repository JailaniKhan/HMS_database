<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BillRefundResource extends JsonResource
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
            'payment_id' => $this->payment_id,
            'bill_item_id' => $this->bill_item_id,
            'refund_amount' => number_format($this->refund_amount, 2),
            'refund_type' => $this->refund_type,
            'refund_type_label' => $this->refund_type_label,
            'refund_reason' => $this->refund_reason,
            'refund_date' => $this->refund_date?->toISOString(),
            'refund_method' => $this->refund_method,
            'refund_method_label' => $this->refund_method_label,
            'reference_number' => $this->reference_number,
            'status' => $this->status,
            'status_label' => $this->status_label,
            'requested_by' => $this->requested_by,
            'approved_by' => $this->approved_by,
            'approved_at' => $this->approved_at?->toISOString(),
            'rejection_reason' => $this->rejection_reason,
            'processed_by' => $this->processed_by,
            'processed_at' => $this->processed_at?->toISOString(),
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Relationships
            'bill' => $this->whenLoaded('bill', function () {
                return [
                    'id' => $this->bill->id,
                    'bill_number' => $this->bill->bill_number,
                    'patient_id' => $this->bill->patient_id,
                    'total_amount' => number_format($this->bill->total_amount, 2),
                ];
            }),

            'payment' => $this->whenLoaded('payment', function () {
                return [
                    'id' => $this->payment->id,
                    'transaction_id' => $this->payment->transaction_id,
                    'amount' => number_format($this->payment->amount, 2),
                    'payment_method' => $this->payment->payment_method,
                ];
            }),

            'bill_item' => $this->whenLoaded('billItem', function () {
                return [
                    'id' => $this->billItem->id,
                    'item_description' => $this->billItem->item_description,
                    'total_price' => number_format($this->billItem->total_price, 2),
                ];
            }),

            'requested_by_user' => $this->whenLoaded('requestedBy', function () {
                return [
                    'id' => $this->requestedBy->id,
                    'name' => $this->requestedBy->name,
                    'username' => $this->requestedBy->username,
                ];
            }),

            'approved_by_user' => $this->whenLoaded('approvedBy', function () {
                return [
                    'id' => $this->approvedBy->id,
                    'name' => $this->approvedBy->name,
                    'username' => $this->approvedBy->username,
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
            'is_pending' => $this->is_pending,
            'is_approved' => $this->is_approved,
            'is_rejected' => $this->is_rejected,
            'is_processed' => $this->is_processed,
        ];
    }
}
