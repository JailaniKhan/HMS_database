<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLabTestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('create-lab-test-requests');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'patient_id' => ['required', 'integer', 'exists:patients,id'],
            'doctor_id' => ['required', 'integer', 'exists:doctors,id'],
            'department_id' => ['nullable', 'exists:departments,id'],
            'test_name' => ['required', 'string', 'max:255'],
            'test_type' => ['required', 'string', Rule::in(['routine', 'urgent', 'stat'])],
            'scheduled_at' => ['required', 'date', 'after_or_equal:today'],
            'notes' => ['nullable', 'string'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'Please select a patient.',
            'patient_id.exists' => 'The selected patient does not exist.',
            'doctor_id.required' => 'Please select a doctor.',
            'doctor_id.exists' => 'The selected doctor does not exist.',
            'department_id.exists' => 'The selected department does not exist.',
            'test_name.required' => 'Please enter the test name.',
            'test_name.max' => 'The test name must not exceed 255 characters.',
            'test_type.required' => 'Please select the test type.',
            'test_type.in' => 'The test type must be routine, urgent, or stat.',
            'scheduled_at.required' => 'Please select a scheduled date.',
            'scheduled_at.after_or_equal' => 'The scheduled date must be today or later.',
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
            'doctor_id' => 'doctor',
            'department_id' => 'department',
            'test_name' => 'test name',
            'test_type' => 'test type',
            'scheduled_at' => 'scheduled date',
            'notes' => 'notes',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        // Set the created_by field to the current user
        $this->merge([
            'created_by' => $this->user()->id,
            'status' => 'pending',
        ]);
    }
}
