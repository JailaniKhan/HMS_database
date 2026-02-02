<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInsuranceClaimRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('edit-insurance-claims') || $this->user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::in([
                    'draft',
                    'pending',
                    'submitted',
                    'under_review',
                    'approved',
                    'partial_approved',
                    'rejected',
                    'appealed',
                ]),
            ],
            'approved_amount' => [
                Rule::requiredIf(function () {
                    return in_array($this->input('status'), ['approved', 'partial_approved']);
                }),
                'nullable',
                'numeric',
                'min:0',
            ],
            'rejection_reason' => [
                Rule::requiredIf(function () {
                    return $this->input('status') === 'rejected';
                }),
                'nullable',
                'string',
            ],
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
            'status.required' => 'The claim status is required.',
            'status.in' => 'The status must be one of: draft, pending, submitted, under_review, approved, partial_approved, rejected, appealed.',
            'approved_amount.required_if' => 'The approved amount is required when status is approved or partially approved.',
            'approved_amount.numeric' => 'The approved amount must be a number.',
            'approved_amount.min' => 'The approved amount must be at least 0.',
            'rejection_reason.required_if' => 'The rejection reason is required when status is rejected.',
            'rejection_reason.string' => 'The rejection reason must be text.',
            'notes.string' => 'The notes must be text.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('approved_amount')) {
            $this->merge([
                'approved_amount' => $this->sanitizeNumeric($this->input('approved_amount')),
            ]);
        }

        // Trim whitespace from text fields
        if ($this->has('rejection_reason')) {
            $this->merge([
                'rejection_reason' => trim($this->input('rejection_reason')),
            ]);
        }

        if ($this->has('notes')) {
            $this->merge([
                'notes' => trim($this->input('notes')),
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
