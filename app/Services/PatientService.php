<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PatientService
{
    /**
     * Get all patients with pagination
     */
    public function getAllPatients($perPage = 10)
    {
        return Patient::with('user')->paginate($perPage);
    }

    /**
     * Get patient by ID
     */
    public function getPatientById($id)
    {
        return Patient::with('user')->findOrFail($id);
    }

    /**
     * Create a new patient
     */
    public function createPatient(array $data)
    {
        DB::beginTransaction();
        
        try {
            // Create user first
            $user = User::create([
                'name' => $data['name'],
                'username' => $data['email'], // Using email as username
                'password' => bcrypt($data['phone']), // Using phone as default password
                'role' => 'Patient',
            ]);

            // Create patient record
            $patient = Patient::create([
                'user_id' => $user->id,
                'patient_id' => 'PAT' . date('Y') . str_pad(Patient::count() + 1, 5, '0', STR_PAD_LEFT),
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'address' => $data['address'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'gender' => $data['gender'] ?? null,
                'emergency_contact_name' => $data['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $data['emergency_contact_phone'] ?? null,
            ]);

            DB::commit();
            
            return $patient;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing patient
     */
    public function updatePatient($id, array $data)
    {
        $patient = Patient::findOrFail($id);
        
        $patient->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'address' => $data['address'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'emergency_contact_name' => $data['emergency_contact_name'] ?? null,
            'emergency_contact_phone' => $data['emergency_contact_phone'] ?? null,
        ]);

        // Update the associated user
        if ($patient->user) {
            $patient->user->update([
                'name' => $data['name'],
                'username' => $data['email'],
            ]);
        }

        return $patient;
    }

    /**
     * Delete a patient
     */
    public function deletePatient($id)
    {
        $patient = Patient::findOrFail($id);
        return $patient->delete();
    }
}