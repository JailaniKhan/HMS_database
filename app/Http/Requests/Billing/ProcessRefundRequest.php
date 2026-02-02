<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProcessRefundRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('process-refunds') || $this->user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'refund_amount' => 'required|numeric|min:0.01',
            'refund_reason' => 'required|string|min:10|max:1000',
            'refund_method' => [
                'required',
                Rule::in(['cash', 'card', 'bank_transfer', 'check']),
            ],
            'reference_number' => 'nullable|string|max:255',
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
            'refund_amount.required' => 'The refund amount is required.',
            'refund_amount.numeric' => 'The refund amount must be a number.',
            'refund_amount.min' => 'The refund amount must be at least 0.01.',
            'refund_reason.required' => 'The refund reason is required.',
            'refund_reason.string' => 'The refund reason must be text.',
            'refund_reason.min' => 'The refund reason must be at least 10 characters.',
            'refund_reason.max' => 'The refund reason may not be greater than 1000 characters.',
            'refund_method.required' => 'The refund method is required.',
            'refund_method.in' => 'The refund method must be one of: cash, card, bank_transfer, check.',
            'reference_number.max' => 'The reference number may not be greater than 255 characters.',
            'notes.string' => 'The notes must be text.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('refund_amount')) {
            $this->merge([
                'refund_amount' => $this->sanitizeNumeric($this->input('refund_amount')),
            ]);
        }

        // Trim whitespace from text fields
        if ($this->has('refund_reason')) {
            $this->merge([
                'refund_reason' => trim($this->input('refund_reason')),
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
