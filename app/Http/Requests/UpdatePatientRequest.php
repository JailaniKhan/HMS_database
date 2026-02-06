<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePatientRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasPermission('edit-patients') || $this->user()->isSuperAdmin();
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $patient = $this->route('patient');

        return [
            'first_name' => 'nullable|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female,other',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'age' => 'nullable|integer|min:0|max:150',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
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
            'gender.in' => 'The gender must be male, female, or other.',
            'blood_group.in' => 'The blood group must be A+, A-, B+, B-, AB+, AB-, O+, or O-.',
            'age.integer' => 'The age must be a number.',
            'age.min' => 'The age must be at least 0.',
            'age.max' => 'The age must not be greater than 150.',
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
            'first_name' => 'first name',
            'father_name' => 'father\'s name',
            'gender' => 'gender',
            'phone' => 'phone number',
            'address' => 'address',
            'age' => 'age',
            'blood_group' => 'blood group',
        ];
    }
}
