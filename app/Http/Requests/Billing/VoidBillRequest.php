<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;

class VoidBillRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('void-bills') || $this->user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'void_reason' => 'required|string|min:10|max:1000',
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
            'void_reason.required' => 'A reason for voiding the bill is required.',
            'void_reason.string' => 'The void reason must be text.',
            'void_reason.min' => 'The void reason must be at least 10 characters to provide sufficient detail.',
            'void_reason.max' => 'The void reason may not be greater than 1000 characters.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('void_reason')) {
            $this->merge([
                'void_reason' => trim($this->input('void_reason')),
            ]);
        }
    }
}
