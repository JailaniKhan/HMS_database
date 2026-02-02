<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreBillRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('create-bills') || $this->user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'bill_date' => 'required|date',
            'due_date' => 'nullable|date|after_or_equal:bill_date',
            'notes' => 'nullable|string|max:1000',
            'billing_address' => 'nullable|array',
            'items' => 'required|array|min:1',
            'items.*.item_type' => [
                'required',
                Rule::in(['appointment', 'lab_test', 'pharmacy', 'department_service', 'manual']),
            ],
            'items.*.item_description' => 'required|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'primary_insurance_id' => 'nullable|exists:patient_insurances,id',
        ];
    }

    /**
     * Get custom messages for validation errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'The patient is required.',
            'patient_id.exists' => 'The selected patient does not exist.',
            'doctor_id.exists' => 'The selected doctor does not exist.',
            'bill_date.required' => 'The bill date is required.',
            'bill_date.date' => 'The bill date must be a valid date.',
            'due_date.date' => 'The due date must be a valid date.',
            'due_date.after_or_equal' => 'The due date must be on or after the bill date.',
            'notes.max' => 'The notes may not be greater than 1000 characters.',
            'items.required' => 'At least one bill item is required.',
            'items.array' => 'The items must be an array.',
            'items.min' => 'At least one bill item is required.',
            'items.*.item_type.required' => 'The item type is required.',
            'items.*.item_type.in' => 'The item type must be one of: appointment, lab_test, pharmacy, department_service, manual.',
            'items.*.item_description.required' => 'The item description is required.',
            'items.*.item_description.max' => 'The item description may not be greater than 255 characters.',
            'items.*.quantity.required' => 'The quantity is required.',
            'items.*.quantity.integer' => 'The quantity must be a whole number.',
            'items.*.quantity.min' => 'The quantity must be at least 1.',
            'items.*.unit_price.required' => 'The unit price is required.',
            'items.*.unit_price.numeric' => 'The unit price must be a number.',
            'items.*.unit_price.min' => 'The unit price must be at least 0.',
            'items.*.discount_amount.numeric' => 'The discount amount must be a number.',
            'items.*.discount_amount.min' => 'The discount amount must be at least 0.',
            'items.*.discount_percentage.numeric' => 'The discount percentage must be a number.',
            'items.*.discount_percentage.min' => 'The discount percentage must be at least 0.',
            'items.*.discount_percentage.max' => 'The discount percentage may not be greater than 100.',
            'primary_insurance_id.exists' => 'The selected insurance does not exist.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('items') && is_array($this->items)) {
            $items = $this->items;
            foreach ($items as $key => $item) {
                if (isset($item['unit_price'])) {
                    $items[$key]['unit_price'] = $this->sanitizeNumeric($item['unit_price']);
                }
                if (isset($item['discount_amount'])) {
                    $items[$key]['discount_amount'] = $this->sanitizeNumeric($item['discount_amount']);
                }
                if (isset($item['discount_percentage'])) {
                    $items[$key]['discount_percentage'] = $this->sanitizeNumeric($item['discount_percentage']);
                }
            }
            $this->merge(['items' => $items]);
        }
    }

    /**
     * Sanitize numeric values by removing currency symbols and formatting.
     *
     * @param mixed $value
     * @return float|null
     */
    private function sanitizeNumeric($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        return (float) preg_replace('/[^\d.-]/', '', (string) $value);
    }
}
