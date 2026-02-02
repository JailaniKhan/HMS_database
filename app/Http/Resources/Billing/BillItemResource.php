<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BillItemResource extends JsonResource
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
            'item_type' => $this->item_type,
            'source_type' => $this->source_type,
            'source_id' => $this->source_id,
            'category' => $this->category,
            'item_description' => $this->item_description,
            'quantity' => $this->quantity,
            'unit_price' => number_format($this->unit_price, 2),
            'discount_amount' => number_format($this->discount_amount, 2),
            'discount_percentage' => number_format($this->discount_percentage, 2),
            'total_price' => number_format($this->total_price, 2),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),

            // Polymorphic source relationship
            'source' => $this->whenLoaded('source', function () {
                return [
                    'id' => $this->source->id,
                    'type' => class_basename($this->source),
                    'description' => $this->source->description ?? $this->source->name ?? null,
                ];
            }),

            // Computed fields
            'net_price' => number_format($this->net_price, 2),
            'has_discount' => $this->has_discount,
            'discounted_amount' => number_format($this->discounted_amount, 2),
        ];
    }
}
