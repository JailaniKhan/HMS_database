<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Http\Exceptions\HttpResponseException;

class StoreBillRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasPermission('create-billing') 
            || $this->user()->isSuperAdmin();
    }

    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'nullable|exists:doctors,id',
            'bill_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:bill_date',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string|max:255',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_percentage' => 'nullable|numeric|min:0|max:100',
            'billing_address' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'patient_id.required' => 'A patient must be selected for the bill.',
            'bill_date.required' => 'Bill date is required.',
            'due_date.after_or_equal' => 'Due date must be on or after the bill date.',
            'items.required' => 'At least one bill item is required.',
        ];
    }

    protected function failedValidation(Validator $validator): void
    {
        if ($this->inertia()) {
            parent::failedValidation($validator);
            return;
        }
        
        throw new HttpResponseException(
            response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422)
        );
    }
}
