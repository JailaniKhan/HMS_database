<?php

namespace App\Http\Resources\Billing;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BillStatusHistoryResource extends JsonResource
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
            'status_from' => $this->status_from,
            'status_to' => $this->status_to,
            'field_name' => $this->field_name,
            'changed_by' => $this->changed_by,
            'reason' => $this->reason,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toISOString(),

            // Relationships
            'changed_by_user' => $this->whenLoaded('changedBy', function () {
                return [
                    'id' => $this->changedBy->id,
                    'name' => $this->changedBy->name,
                    'username' => $this->changedBy->username,
                ];
            }),

            // Computed fields
            'change_description' => $this->change_description,
        ];
    }
}
