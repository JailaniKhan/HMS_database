<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;

class StoreInsuranceClaimRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('create-insurance-claims') || $this->user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'patient_insurance_id' => 'required|exists:patient_insurances,id',
            'claim_amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string|max:1000',
            'documents' => 'nullable|array',
            'documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:10240',
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
            'patient_insurance_id.required' => 'The patient insurance is required.',
            'patient_insurance_id.exists' => 'The selected insurance does not exist.',
            'claim_amount.required' => 'The claim amount is required.',
            'claim_amount.numeric' => 'The claim amount must be a number.',
            'claim_amount.min' => 'The claim amount must be at least 0.01.',
            'notes.max' => 'The notes may not be greater than 1000 characters.',
            'documents.array' => 'The documents must be an array.',
            'documents.*.file' => 'Each document must be a file.',
            'documents.*.mimes' => 'Each document must be a PDF, JPG, JPEG, or PNG file.',
            'documents.*.max' => 'Each document may not be larger than 10MB.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('claim_amount')) {
            $this->merge([
                'claim_amount' => $this->sanitizeNumeric($this->input('claim_amount')),
            ]);
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
