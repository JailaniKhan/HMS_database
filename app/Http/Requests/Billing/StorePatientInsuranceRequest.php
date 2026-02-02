<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePatientInsuranceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('manage-patient-insurance') || $this->user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'insurance_provider_id' => 'required|exists:insurance_providers,id',
            'policy_number' => 'required|string|max:100',
            'policy_holder_name' => 'required|string|max:255',
            'relationship_to_patient' => [
                'required',
                Rule::in(['self', 'spouse', 'child', 'parent', 'other']),
            ],
            'coverage_start_date' => 'required|date',
            'coverage_end_date' => 'nullable|date|after:coverage_start_date',
            'co_pay_amount' => 'nullable|numeric|min:0',
            'co_pay_percentage' => 'nullable|numeric|min:0|max:100',
            'deductible_amount' => 'nullable|numeric|min:0',
            'annual_max_coverage' => 'nullable|numeric|min:0',
            'is_primary' => 'boolean',
            'notes' => 'nullable|string',
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
            'insurance_provider_id.required' => 'The insurance provider is required.',
            'insurance_provider_id.exists' => 'The selected insurance provider does not exist.',
            'policy_number.required' => 'The policy number is required.',
            'policy_number.max' => 'The policy number may not be greater than 100 characters.',
            'policy_holder_name.required' => 'The policy holder name is required.',
            'policy_holder_name.max' => 'The policy holder name may not be greater than 255 characters.',
            'relationship_to_patient.required' => 'The relationship to patient is required.',
            'relationship_to_patient.in' => 'The relationship must be one of: self, spouse, child, parent, other.',
            'coverage_start_date.required' => 'The coverage start date is required.',
            'coverage_start_date.date' => 'The coverage start date must be a valid date.',
            'coverage_end_date.date' => 'The coverage end date must be a valid date.',
            'coverage_end_date.after' => 'The coverage end date must be after the coverage start date.',
            'co_pay_amount.numeric' => 'The co-pay amount must be a number.',
            'co_pay_amount.min' => 'The co-pay amount must be at least 0.',
            'co_pay_percentage.numeric' => 'The co-pay percentage must be a number.',
            'co_pay_percentage.min' => 'The co-pay percentage must be at least 0.',
            'co_pay_percentage.max' => 'The co-pay percentage may not be greater than 100.',
            'deductible_amount.numeric' => 'The deductible amount must be a number.',
            'deductible_amount.min' => 'The deductible amount must be at least 0.',
            'annual_max_coverage.numeric' => 'The annual maximum coverage must be a number.',
            'annual_max_coverage.min' => 'The annual maximum coverage must be at least 0.',
            'is_primary.boolean' => 'The primary flag must be true or false.',
            'notes.string' => 'The notes must be text.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $numericFields = ['co_pay_amount', 'co_pay_percentage', 'deductible_amount', 'annual_max_coverage'];

        foreach ($numericFields as $field) {
            if ($this->has($field)) {
                $this->merge([
                    $field => $this->sanitizeNumeric($this->input($field)),
                ]);
            }
        }

        // Normalize boolean field
        if ($this->has('is_primary')) {
            $this->merge([
                'is_primary' => filter_var($this->input('is_primary'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE),
            ]);
        }

        // Trim text fields
        $textFields = ['policy_number', 'policy_holder_name', 'notes'];
        foreach ($textFields as $field) {
            if ($this->has($field) && is_string($this->input($field))) {
                $this->merge([
                    $field => trim($this->input($field)),
                ]);
            }
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
