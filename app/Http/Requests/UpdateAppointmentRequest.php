<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('edit-appointments') || $this->user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'department_id' => 'required|exists:departments,id',
            'appointment_date' => 'required|date',
            'status' => 'required|in:scheduled,completed,cancelled,no_show',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
            'fee' => 'required|numeric|min:0',
        ];
    }

    /**
     * Get custom messages for validation errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'The patient is required.',
            'patient_id.exists' => 'The selected patient does not exist.',
            'doctor_id.required' => 'The doctor is required.',
            'doctor_id.exists' => 'The selected doctor does not exist.',
            'department_id.required' => 'The department is required.',
            'department_id.exists' => 'The selected department does not exist.',
            'appointment_date.required' => 'The appointment date is required.',
            'appointment_date.date' => 'The appointment date must be a valid date.',
            'status.required' => 'The appointment status is required.',
            'status.in' => 'The selected status is invalid.',
            'fee.required' => 'The fee is required.',
            'fee.numeric' => 'The fee must be a number.',
            'fee.min' => 'The fee must be at least 0.',
        ];
    }
}
