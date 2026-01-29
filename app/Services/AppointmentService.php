<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Department;
use Illuminate\Support\Facades\DB;

class AppointmentService
{
    /**
     * Get all appointments with related data
     */
    public function getAllAppointments($perPage = 10)
    {
        return Appointment::with('patient', 'doctor', 'department')->paginate($perPage);
    }

    /**
     * Get appointment by ID with related data
     */
    public function getAppointmentById($id)
    {
        return Appointment::with('patient', 'doctor', 'department')->findOrFail($id);
    }

    /**
     * Get all related data needed for appointment forms
     * Optimized to load only necessary fields for performance
     */
    public function getAppointmentFormData()
    {
        return [
            'patients' => Patient::select('id', 'first_name', 'father_name', 'patient_id')
                ->orderBy('father_name')
                ->get(),
            'doctors' => Doctor::select('id', 'full_name', 'specialization', 'fees')
                ->where('status', 'active')
                ->orderBy('full_name')
                ->get(),
            'departments' => Department::select('id', 'name')
                ->orderBy('name')
                ->get(),
        ];
    }

    /**
     * Create a new appointment
     */
    public function createAppointment(array $data)
    {
        DB::beginTransaction();

        try {
            // Generate appointment ID using database auto-increment for thread safety
            $nextId = DB::selectOne("
                SELECT AUTO_INCREMENT as next_id
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = 'appointments'
            ")->next_id ?? 1;

            $appointment = Appointment::create([
                'appointment_id' => 'APPT' . date('Y') . str_pad($nextId, 5, '0', STR_PAD_LEFT),
                'patient_id' => $data['patient_id'],
                'doctor_id' => $data['doctor_id'],
                'department_id' => $data['department_id'],
                'appointment_date' => $data['appointment_date'],
                'reason' => $data['reason'] ?? null,
                'notes' => $data['notes'] ?? null,
                'fee' => $data['fee'],
                'discount' => $data['discount'] ?? 0,
            ]);

            DB::commit();
            
            return $appointment;
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update an existing appointment
     */
    public function updateAppointment($id, array $data)
    {
        $appointment = Appointment::findOrFail($id);
        
        $appointment->update([
            'patient_id' => $data['patient_id'],
            'doctor_id' => $data['doctor_id'],
            'department_id' => $data['department_id'],
            'appointment_date' => $data['appointment_date'],
            'status' => $data['status'],
            'reason' => $data['reason'] ?? null,
            'notes' => $data['notes'] ?? null,
            'fee' => $data['fee'],
        ]);

        return $appointment;
    }

    /**
     * Delete an appointment
     */
    public function deleteAppointment($id)
    {
        $appointment = Appointment::findOrFail($id);
        return $appointment->delete();
    }

    /**
     * Cancel an appointment
     */
    public function cancelAppointment($id)
    {
        $appointment = Appointment::findOrFail($id);
        $appointment->status = 'cancelled';
        return $appointment->save();
    }
}