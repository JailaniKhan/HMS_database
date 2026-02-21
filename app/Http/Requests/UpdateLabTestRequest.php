<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLabTestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('edit-lab-test-requests');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $labTestRequest = $this->route('labTestRequest');

        return [
            'patient_id' => ['sometimes', 'required', 'integer', 'exists:patients,id'],
            'doctor_id' => ['sometimes', 'required', 'integer', 'exists:doctors,id'],
            'department_id' => ['sometimes', 'nullable', 'exists:departments,id'],
            'test_name' => ['sometimes', 'required', 'string', 'max:255'],
            'test_type' => ['sometimes', 'required', 'string', Rule::in(['routine', 'urgent', 'stat'])],
            'status' => ['sometimes', 'required', 'string', Rule::in(['pending', 'in_progress', 'completed', 'cancelled'])],
            'scheduled_at' => ['sometimes', 'required', 'date'],
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
            'status.required' => 'Please select a status.',
            'status.in' => 'The status must be pending, in progress, completed, or cancelled.',
            'scheduled_at.required' => 'Please select a scheduled date.',
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
            'status' => 'status',
            'scheduled_at' => 'scheduled date',
            'notes' => 'notes',
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
            $labTestRequest = $this->route('labTestRequest');
            
            if ($this->has('status') && $labTestRequest) {
                $newStatus = $this->input('status');
                
                // Check if the status transition is valid
                if (!$labTestRequest->canTransitionTo($newStatus)) {
                    $validator->errors()->add('status', "Cannot transition from {$labTestRequest->status} to {$newStatus}");
                }

                // Check permissions for specific status transitions
                $user = $this->user();
                
                if (in_array($newStatus, ['in_progress', 'completed']) && !$user->hasPermission('process-lab-test-requests')) {
                    $validator->errors()->add('status', 'You do not have permission to change to this status');
                }

                if ($newStatus === 'cancelled' && !$user->hasPermission('delete-lab-test-requests')) {
                    $validator->errors()->add('status', 'You do not have permission to cancel lab test requests');
                }
            }
        });
    }
}
