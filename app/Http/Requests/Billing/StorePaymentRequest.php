<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePaymentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('record-payments') || $this->user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'payment_method' => [
                'required',
                Rule::in(['cash', 'card', 'insurance', 'bank_transfer', 'mobile_money', 'check']),
            ],
            'amount' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'transaction_id' => [
                Rule::requiredIf(function () {
                    return in_array($this->input('payment_method'), ['card', 'bank_transfer', 'mobile_money']);
                }),
                'nullable',
                'string',
                'max:255',
            ],
            'reference_number' => 'nullable|string|max:255',
            'card_last_four' => [
                Rule::requiredIf(function () {
                    return $this->input('payment_method') === 'card';
                }),
                'nullable',
                'digits:4',
            ],
            'card_type' => [
                Rule::requiredIf(function () {
                    return $this->input('payment_method') === 'card';
                }),
                'nullable',
                Rule::in(['visa', 'mastercard', 'amex', 'discover']),
            ],
            'bank_name' => [
                Rule::requiredIf(function () {
                    return $this->input('payment_method') === 'bank_transfer';
                }),
                'nullable',
                'string',
                'max:255',
            ],
            'check_number' => [
                Rule::requiredIf(function () {
                    return $this->input('payment_method') === 'check';
                }),
                'nullable',
                'string',
                'max:255',
            ],
            'amount_tendered' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
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
            'payment_method.required' => 'The payment method is required.',
            'payment_method.in' => 'The payment method must be one of: cash, card, insurance, bank_transfer, mobile_money, check.',
            'amount.required' => 'The payment amount is required.',
            'amount.numeric' => 'The payment amount must be a number.',
            'amount.min' => 'The payment amount must be at least 0.01.',
            'payment_date.required' => 'The payment date is required.',
            'payment_date.date' => 'The payment date must be a valid date.',
            'transaction_id.required_if' => 'The transaction ID is required for card, bank transfer, and mobile money payments.',
            'transaction_id.max' => 'The transaction ID may not be greater than 255 characters.',
            'reference_number.max' => 'The reference number may not be greater than 255 characters.',
            'card_last_four.required_if' => 'The last four digits of the card are required for card payments.',
            'card_last_four.digits' => 'The card last four digits must be exactly 4 digits.',
            'card_type.required_if' => 'The card type is required for card payments.',
            'card_type.in' => 'The card type must be one of: visa, mastercard, amex, discover.',
            'bank_name.required_if' => 'The bank name is required for bank transfer payments.',
            'bank_name.max' => 'The bank name may not be greater than 255 characters.',
            'check_number.required_if' => 'The check number is required for check payments.',
            'check_number.max' => 'The check number may not be greater than 255 characters.',
            'amount_tendered.numeric' => 'The amount tendered must be a number.',
            'amount_tendered.min' => 'The amount tendered must be at least 0.',
            'notes.max' => 'The notes may not be greater than 1000 characters.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('amount')) {
            $this->merge([
                'amount' => $this->sanitizeNumeric($this->input('amount')),
            ]);
        }

        if ($this->has('amount_tendered')) {
            $this->merge([
                'amount_tendered' => $this->sanitizeNumeric($this->input('amount_tendered')),
            ]);
        }

        // Normalize card last four digits
        if ($this->has('card_last_four')) {
            $cardLastFour = preg_replace('/\D/', '', $this->input('card_last_four'));
            $this->merge(['card_last_four' => $cardLastFour]);
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
