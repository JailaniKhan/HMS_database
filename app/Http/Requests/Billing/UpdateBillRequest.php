<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Bill;

class UpdateBillRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('edit-bills') || $this->user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $billId = $this->route('bill')?->id ?? $this->route('id');

        return [
            'patient_id' => 'nullable|exists:patients,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'bill_date' => 'nullable|date',
            'due_date' => 'nullable|date|after_or_equal:bill_date',
            'notes' => 'nullable|string|max:1000',
            'billing_address' => 'nullable|array',
            'items' => 'nullable|array|min:1',
            'items.*.item_type' => [
                'required_with:items',
                Rule::in(['appointment', 'lab_test', 'pharmacy', 'department_service', 'manual']),
            ],
            'items.*.item_description' => 'required_with:items|string|max:255',
            'items.*.quantity' => 'required_with:items|integer|min:1',
            'items.*.unit_price' => 'required_with:items|numeric|min:0',
            'items.*.discount_amount' => 'nullable|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
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
            'patient_id.exists' => 'The selected patient does not exist.',
            'doctor_id.exists' => 'The selected doctor does not exist.',
            'bill_date.date' => 'The bill date must be a valid date.',
            'due_date.date' => 'The due date must be a valid date.',
            'due_date.after_or_equal' => 'The due date must be on or after the bill date.',
            'notes.max' => 'The notes may not be greater than 1000 characters.',
            'items.array' => 'The items must be an array.',
            'items.min' => 'At least one bill item is required when items are provided.',
            'items.*.item_type.required_with' => 'The item type is required when items are provided.',
            'items.*.item_type.in' => 'The item type must be one of: appointment, lab_test, pharmacy, department_service, manual.',
            'items.*.item_description.required_with' => 'The item description is required when items are provided.',
            'items.*.item_description.max' => 'The item description may not be greater than 255 characters.',
            'items.*.quantity.required_with' => 'The quantity is required when items are provided.',
            'items.*.quantity.integer' => 'The quantity must be a whole number.',
            'items.*.quantity.min' => 'The quantity must be at least 1.',
            'items.*.unit_price.required_with' => 'The unit price is required when items are provided.',
            'items.*.unit_price.numeric' => 'The unit price must be a number.',
            'items.*.unit_price.min' => 'The unit price must be at least 0.',
            'items.*.discount_amount.numeric' => 'The discount amount must be a number.',
            'items.*.discount_amount.min' => 'The discount amount must be at least 0.',
            'items.*.discount_percentage.numeric' => 'The discount percentage must be a number.',
            'items.*.discount_percentage.min' => 'The discount percentage must be at least 0.',
            'items.*.discount_percentage.max' => 'The discount percentage may not be greater than 100.',
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param \Illuminate\Validation\Validator $validator
     * @return void
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $billId = $this->route('bill')?->id ?? $this->route('id');
            
            if ($billId) {
                $bill = Bill::find($billId);
                
                if ($bill && $bill->payment_status === 'paid') {
                    $validator->errors()->add('bill', 'Cannot modify a bill that has been fully paid.');
                }
                
                if ($bill && $bill->status === 'void') {
                    $validator->errors()->add('bill', 'Cannot modify a voided bill.');
                }
            }
        });
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
