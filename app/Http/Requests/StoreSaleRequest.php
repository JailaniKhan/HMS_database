<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Validator;

class StoreSaleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'patient_id' => ['nullable', 'exists:patients,id'],
            'prescription_id' => ['nullable', 'exists:prescriptions,id'],
            'payment_method' => ['required', 'in:cash,card,insurance,credit'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'discount_amount' => ['nullable', 'numeric', 'min:0'],
            'discount_percentage' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'tax_amount' => ['nullable', 'numeric', 'min:0'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.medicine_id' => ['required', 'exists:medicines,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    /**
     * Configure the validator instance.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $this->validateDiscount($validator);
            $this->validateStockAvailability($validator);
        });
    }

    /**
     * Validate that discount doesn't exceed subtotal.
     */
    protected function validateDiscount($validator): void
    {
        $items = $this->input('items', []);
        $discountAmount = $this->input('discount_amount', 0);

        if (empty($items) || $discountAmount <= 0) {
            return;
        }

        $subtotal = collect($items)->sum(function ($item) {
            $itemTotal = ($item['quantity'] ?? 0) * ($item['unit_price'] ?? 0);
            $itemDiscount = $item['discount'] ?? 0;
            return $itemTotal * (1 - $itemDiscount / 100);
        });

        if ($discountAmount > $subtotal) {
            $validator->errors()->add(
                'discount_amount',
                'Discount cannot exceed subtotal (' . number_format($subtotal, 2) . ').'
            );
        }
    }

    /**
     * Validate stock availability for all items.
     */
    protected function validateStockAvailability($validator): void
    {
        $items = $this->input('items', []);

        foreach ($items as $index => $item) {
            $medicine = \App\Models\Medicine::find($item['medicine_id'] ?? null);

            if (!$medicine) {
                continue;
            }

            $requestedQty = $item['quantity'] ?? 0;
            $availableQty = $medicine->stock_quantity;

            if ($requestedQty > $availableQty) {
                $validator->errors()->add(
                    "items.{$index}.quantity",
                    "Insufficient stock for {$medicine->name}. Available: {$availableQty}, Requested: {$requestedQty}."
                );
            }
        }
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'payment_method.required' => 'Please select a payment method.',
            'payment_method.in' => 'Invalid payment method selected.',
            'items.required' => 'At least one item is required.',
            'items.min' => 'At least one item is required.',
            'items.*.medicine_id.required' => 'Medicine is required for each item.',
            'items.*.medicine_id.exists' => 'Selected medicine does not exist.',
            'items.*.quantity.required' => 'Quantity is required for each item.',
            'items.*.quantity.min' => 'Quantity must be at least 1.',
            'items.*.unit_price.required' => 'Unit price is required for each item.',
            'items.*.unit_price.min' => 'Unit price cannot be negative.',
            'items.*.discount.max' => 'Item discount cannot exceed 100%.',
            'discount_percentage.max' => 'Discount percentage cannot exceed 100%.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'patient_id' => 'patient',
            'prescription_id' => 'prescription',
            'payment_method' => 'payment method',
            'discount_amount' => 'discount amount',
            'discount_percentage' => 'discount percentage',
            'tax_amount' => 'tax amount',
            'items.*.medicine_id' => 'medicine',
            'items.*.quantity' => 'quantity',
            'items.*.unit_price' => 'unit price',
            'items.*.discount' => 'item discount',
        ];
    }
}