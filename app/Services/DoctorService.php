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
            // Create user first (without role assignment)
            $user = User::create([
                'name' => $data['full_name'],
                'username' => $data['phone_number'],
                'password' => bcrypt($data['phone_number']),
                // Doctor role removed - doctors should not have admin access
            ]);

            // Create doctor record
            $doctor = Doctor::create([
                'user_id' => $user->id,
                'doctor_id' => 'DOC' . date('Y') . str_pad(Doctor::count() + 1, 5, '0', STR_PAD_LEFT),
                'full_name' => $data['full_name'],
                'father_name' => $data['father_name'] ?? null,
                'age' => $data['age'] ?? null,
                'phone_number' => $data['phone_number'],
                'address' => $data['address'] ?? null,
                'specialization' => $data['specialization'],
                'department_id' => $data['department_id'],
                'bio' => $data['bio'] ?? null,
                'fees' => $data['fees'] ?? 0,
                'salary' => $data['salary'] ?? 0,
                'bonus' => $data['bonus'] ?? 0,
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
            'full_name' => $data['full_name'],
            'father_name' => $data['father_name'] ?? null,
            'age' => $data['age'] ?? null,
            'phone_number' => $data['phone_number'],
            'address' => $data['address'] ?? null,
            'specialization' => $data['specialization'],
            'department_id' => $data['department_id'],
            'bio' => $data['bio'] ?? null,
            'fees' => $data['fees'] ?? 0,
            'salary' => $data['salary'] ?? 0,
            'bonus' => $data['bonus'] ?? 0,
        ]);

        // Update the associated user
        if ($doctor->user) {
            $doctor->user->update([
                'name' => $data['full_name'],
                'username' => $data['phone_number'],
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