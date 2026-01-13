<?php

namespace App\Services;

use App\Models\Doctor;
use App\Models\User;
use App\Models\Department;
use Illuminate\Support\Facades\DB;

class DoctorService
{
    /**
     * Get all doctors with related data
     */
    public function getAllDoctors($perPage = 10)
    {
        return Doctor::with('user', 'department')->paginate($perPage);
    }

    /**
     * Get doctor by ID
     */
    public function getDoctorById($id)
    {
        return Doctor::with('user', 'department')->findOrFail($id);
    }

    /**
     * Get all related data needed for doctor forms
     */
    public function getDoctorFormData()
    {
        return [
            'departments' => Department::all(),
        ];
    }

    /**
     * Create a new doctor
     */
    public function createDoctor(array $data)
    {
        DB::beginTransaction();
        
        try {
            // Create user first
            $user = User::create([
                'name' => $data['name'],
                'username' => $data['email'],
                'password' => bcrypt($data['phone']),
                'role' => 'Doctor',
            ]);

            // Create doctor record
            $doctor = Doctor::create([
                'user_id' => $user->id,
                'doctor_id' => 'DOC' . date('Y') . str_pad(Doctor::count() + 1, 5, '0', STR_PAD_LEFT),
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'address' => $data['address'] ?? null,
                'date_of_birth' => $data['date_of_birth'] ?? null,
                'gender' => $data['gender'] ?? null,
                'specialization' => $data['specialization'],
                'department_id' => $data['department_id'],
                'license_number' => $data['license_number'] ?? null,
                'bio' => $data['bio'] ?? null,
            ]);

            DB::commit();
            
            return $doctor;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing doctor
     */
    public function updateDoctor($id, array $data)
    {
        $doctor = Doctor::findOrFail($id);
        
        $doctor->update([
            'name' => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'address' => $data['address'] ?? null,
            'date_of_birth' => $data['date_of_birth'] ?? null,
            'gender' => $data['gender'] ?? null,
            'specialization' => $data['specialization'],
            'department_id' => $data['department_id'],
            'license_number' => $data['license_number'] ?? null,
            'bio' => $data['bio'] ?? null,
        ]);

        // Update the associated user
        if ($doctor->user) {
            $doctor->user->update([
                'name' => $data['name'],
                'username' => $data['email'],
            ]);
        }

        return $doctor;
    }

    /**
     * Delete a doctor
     */
    public function deleteDoctor($id)
    {
        $doctor = Doctor::findOrFail($id);
        return $doctor->delete();
    }
}