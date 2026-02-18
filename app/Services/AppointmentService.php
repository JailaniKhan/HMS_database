<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Department;
use App\Models\DepartmentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AppointmentService
{
    /**
     * Get all appointments with related data
     */
    public function getAllAppointments($perPage = 10, bool $todayOnly = false)
    {
        $query = Appointment::with(['patient', 'doctor', 'department', 'services'])
            ->latest();

        if ($todayOnly) {
            $query->whereDate('appointment_date', today());
        }

        return $query->paginate($perPage)
            ->through(function ($appointment) {
                return $this->transformAppointment($appointment);
            });
    }

    /**
     * Get appointment by ID with related data
     */
    public function getAppointmentById($id)
    {
        $appointment = Appointment::with(['patient', 'doctor', 'department', 'services'])->findOrFail($id);
        return $this->transformAppointment($appointment);
    }

    /**
     * Get all related data needed for appointment forms
     * Optimized to load only necessary fields for performance
     */
    public function getAppointmentFormData()
    {
        return [
            'patients' => Patient::select('id', 'first_name', 'father_name', 'patient_id')
                ->orderBy('first_name')
                ->get()
                ->map(function($patient) {
                    return [
                        'id' => $patient->id,
                        'patient_id' => $patient->patient_id,
                        'full_name' => trim($patient->first_name),
                    ];
                }),
            'doctors' => Doctor::select('id', 'doctor_id', 'full_name', 'specialization', 'fees', 'department_id')
                ->where('status', 'active')
                ->orderBy('full_name')
                ->get()
                ->map(function($doctor) {
                    return [
                        'id' => $doctor->id,
                        'doctor_id' => $doctor->doctor_id,
                        'full_name' => $doctor->full_name,
                        'specialization' => $doctor->specialization,
                        'fees' => $doctor->fees,
                        'department_id' => $doctor->department_id,
                    ];
                }),
            'departments' => Department::select('id', 'name')
                ->with(['services' => function($query) {
                    $query->select('id', 'department_id', 'name', 'base_cost', 'is_active')
                        ->where('is_active', true);
                }])
                ->orderBy('name')
                ->get(),
        ];
    }

    /**
     * Create a new appointment with services
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

            // Calculate fee based on services or use doctor's fee
            $fee = $data['fee'] ?? 0;
            $discount = $data['discount'] ?? 0;
            
            // If services are provided, calculate total from services
            if (!empty($data['services'])) {
                $fee = 0;
                $discount = 0;
                foreach ($data['services'] as $service) {
                    $fee += $service['custom_cost'];
                    $discount += ($service['custom_cost'] * $service['discount_percentage'] / 100);
                }
            }

            $appointment = Appointment::create([
                'appointment_id' => 'APPT' . date('Y') . str_pad($nextId, 5, '0', STR_PAD_LEFT),
                'daily_sequence' => $this->getNextDailySequence($data['doctor_id'], $data['appointment_date']),
                'patient_id' => $data['patient_id'],
                'doctor_id' => $data['doctor_id'],
                'department_id' => $data['department_id'],
                'appointment_date' => $data['appointment_date'],
                'status' => $data['status'] ?? 'completed',
                'reason' => $data['reason'] ?? null,
                'notes' => $data['notes'] ?? null,
                'fee' => $fee,
                'discount' => $discount,
            ]);

            // Attach services if provided
            if (!empty($data['services'])) {
                $this->attachServices($appointment, $data['services']);
            }

            DB::commit();
            
            return $appointment->load('services');
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Attach services to appointment
     */
    private function attachServices(Appointment $appointment, array $services): void
    {
        Log::info('Attaching services to appointment', [
            'appointment_id' => $appointment->id,
            'services_count' => count($services),
            'services_data' => $services,
        ]);
        
        $attachData = [];
        
        foreach ($services as $service) {
            $customCost = $service['custom_cost'];
            $discountPercentage = $service['discount_percentage'] ?? 0;
            $discountAmount = $customCost * ($discountPercentage / 100);
            $finalCost = round($customCost - $discountAmount, 2);
            
            $attachData[$service['department_service_id']] = [
                'custom_cost' => $customCost,
                'discount_percentage' => $discountPercentage,
                'final_cost' => $finalCost,
            ];
        }
        
        Log::info('Services attach data prepared', [
            'attach_data' => $attachData,
        ]);
        
        $appointment->services()->attach($attachData);
        
        // Verify services were attached
        $attachedServices = $appointment->services()->get();
        Log::info('Services after attach', [
            'count' => $attachedServices->count(),
            'services' => $attachedServices->toArray(),
        ]);
    }

    /**
     * Get the next daily sequence number for a doctor on a specific date
     */
    private function getNextDailySequence(?int $doctorId, string $appointmentDate): int
    {
        // If no doctor is selected, return 0 (for department-only appointments)
        if ($doctorId === null) {
            return 0;
        }
        
        // Extract just the date part if datetime is provided
        $date = substr($appointmentDate, 0, 10);
        
        // Count existing appointments for this doctor on this date
        $count = Appointment::where('doctor_id', $doctorId)
            ->whereDate('appointment_date', $date)
            ->count();
        
        return $count + 1;
    }

    /**
     * Update an existing appointment
     */
    public function updateAppointment($id, array $data)
    {
        $appointment = Appointment::findOrFail($id);
        
        $updateData = [
            'patient_id' => $data['patient_id'],
            'doctor_id' => $data['doctor_id'],
            'appointment_date' => $data['appointment_date'],
            'status' => $data['status'],
            'reason' => $data['reason'] ?? null,
        ];

        // Add fee and discount if provided
        if (isset($data['fee'])) {
            $updateData['fee'] = $data['fee'];
        }
        if (isset($data['discount'])) {
            $updateData['discount'] = $data['discount'];
        }

        $appointment->update($updateData);

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
     * Transform appointment data for frontend consumption
     */
    private function transformAppointment($appointment)
    {
        $appointmentArray = $appointment->toArray();
        
        // Eager load services relationship
        $appointment->load('services');
        
        // Extract date and time from appointment_date
        $date = $appointment->appointment_date;
        $appointmentArray['appointment_date'] = $date->format('Y-m-d');
        $appointmentArray['appointment_time'] = $date->format('H:i');
        
        // Include daily sequence if available
        $appointmentArray['daily_sequence'] = $appointment->daily_sequence;
        
        // Include grand_total if services exist (for print modal determination)
        $appointmentArray['grand_total'] = $appointment->grand_total;
        
        // Include services in the response for print modal
        if ($appointment->services && $appointment->services->isNotEmpty()) {
            $appointmentArray['services'] = $appointment->services->map(function ($service) {
                return [
                    'id' => $service->id,
                    'name' => $service->name,
                    'pivot' => [
                        'custom_cost' => $service->pivot->custom_cost,
                        'discount_percentage' => $service->pivot->discount_percentage,
                        'final_cost' => $service->pivot->final_cost,
                    ],
                ];
            })->toArray();
        } else {
            $appointmentArray['services'] = [];
        }
        
        // Transform patient data
        if ($appointment->patient) {
            $appointmentArray['patient'] = [
                'id' => $appointment->patient->id,
                'patient_id' => $appointment->patient->patient_id,
                'full_name' => trim($appointment->patient->first_name . ' '),
            ];
        }
        
        // Transform doctor data
        if ($appointment->doctor) {
            $appointmentArray['doctor'] = [
                'id' => $appointment->doctor->id,
                'doctor_id' => $appointment->doctor->doctor_id,
                'full_name' => $appointment->doctor->full_name,
                'specialization' => $appointment->doctor->specialization,
            ];
        }

        // Transform department data (shown when no doctor is assigned)
        if ($appointment->department) {
            $appointmentArray['department'] = [
                'id' => $appointment->department->id,
                'name' => $appointment->department->name,
            ];
        } else {
            $appointmentArray['department'] = null;
        }
        
        return $appointmentArray;
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