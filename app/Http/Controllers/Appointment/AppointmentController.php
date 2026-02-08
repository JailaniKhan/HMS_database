<?php

namespace App\Http\Controllers\Appointment;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Bill;
use App\Services\AppointmentService;
use App\Services\Billing\BillItemService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    protected AppointmentService $appointmentService;
    protected BillItemService $billItemService;
    protected AuditLogService $auditLogService;

    public function __construct(
        AppointmentService $appointmentService,
        BillItemService $billItemService,
        AuditLogService $auditLogService
    ) {
        $this->appointmentService = $appointmentService;
        $this->billItemService = $billItemService;
        $this->auditLogService = $auditLogService;
    }

    /**
     * Check if the current user can access appointments
     */
    private function authorizeAppointmentAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-appointments')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if the current user can modify appointments
     */
    private function authorizeAppointmentModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-appointments')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Sanitize input data to prevent XSS
     */
    private function sanitizeInput(array $data): array
    {
        return [
            'reason' => htmlspecialchars(strip_tags($data['reason'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'notes' => htmlspecialchars(strip_tags($data['notes'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'patient_id' => filter_var($data['patient_id'] ?? null, FILTER_VALIDATE_INT),
            'doctor_id' => filter_var($data['doctor_id'] ?? null, FILTER_VALIDATE_INT),
            'department_id' => filter_var($data['department_id'] ?? null, FILTER_VALIDATE_INT),
            'fee' => filter_var($data['fee'] ?? 0, FILTER_VALIDATE_FLOAT),
            'discount' => filter_var($data['discount'] ?? 0, FILTER_VALIDATE_FLOAT),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $this->authorizeAppointmentAccess();
        
        $appointments = $this->appointmentService->getAllAppointments(50);
        return Inertia::render('Appointment/Index', [
            'appointments' => $appointments
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $this->authorizeAppointmentModify();
        
        $formData = $this->appointmentService->getAppointmentFormData();
        return Inertia::render('Appointment/Create', $formData);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorizeAppointmentModify();
        
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'department_id' => 'required|exists:departments,id',
            'appointment_date' => 'required|date',
            'reason' => 'nullable|string|max:1000',
            'notes' => 'nullable|string|max:5000',
            'fee' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
        ]);

        // Sanitize input data
        $sanitized = $this->sanitizeInput($validated);

        try {
            $appointment = $this->appointmentService->createAppointment([
                'patient_id' => $sanitized['patient_id'],
                'doctor_id' => $sanitized['doctor_id'],
                'department_id' => $sanitized['department_id'],
                'appointment_date' => $validated['appointment_date'],
                'reason' => $sanitized['reason'],
                'notes' => $sanitized['notes'],
                'fee' => $sanitized['fee'],
                'discount' => $sanitized['discount'],
            ]);

            return redirect()->route('appointments.index')->with('success', 'Appointment created successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to create appointment: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): Response
    {
        $this->authorizeAppointmentAccess();
        
        $appointment = $this->appointmentService->getAppointmentById($id);
        return Inertia::render('Appointment/Show', [
            'appointment' => $appointment
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $this->authorizeAppointmentModify();
        
        $appointment = $this->appointmentService->getAppointmentById($id);
        $formData = $this->appointmentService->getAppointmentFormData();
        return Inertia::render('Appointment/Edit', [
            'appointment' => $appointment,
            ...$formData
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $this->authorizeAppointmentModify();
        
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'appointment_date' => 'required|date',
            'appointment_time' => 'required',
            'status' => 'required|in:scheduled,completed,cancelled,no_show,rescheduled',
            'reason' => 'nullable|string|max:1000',
            'fee' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
        ]);

        // Sanitize input data
        $sanitized = $this->sanitizeInput($validated);

        // Combine date and time
        $appointmentDateTime = $validated['appointment_date'] . ' ' . $validated['appointment_time'];

        try {
            DB::beginTransaction();

            $appointment = $this->appointmentService->updateAppointment($id, [
                'patient_id' => $sanitized['patient_id'],
                'doctor_id' => $sanitized['doctor_id'],
                'appointment_date' => $appointmentDateTime,
                'status' => $validated['status'],
                'reason' => $sanitized['reason'],
                'fee' => $sanitized['fee'],
                'discount' => $sanitized['discount'],
            ]);

            // If appointment is marked as completed, create bill item for consultation fee
            if ($validated['status'] === 'completed' && $appointment->fee > 0) {
                $this->createBillItemForAppointment($appointment);
            }

            DB::commit();

            return redirect()->route('appointments.index')->with('success', 'Appointment updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating appointment', [
                'appointment_id' => $id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to update appointment: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $this->authorizeAppointmentModify();
        
        // Require specific delete permission
        if (!auth()->user()?->hasPermission('delete-appointments')) {
            abort(403, 'Unauthorized access');
        }
        
        try {
            $this->appointmentService->deleteAppointment($id);
            return redirect()->route('appointments.index')->with('success', 'Appointment deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to delete appointment: ' . $e->getMessage()]);
        }
    }

    /**
     * Create a bill item for the appointment consultation fee.
     *
     * @param Appointment $appointment
     * @return void
     */
    private function createBillItemForAppointment(Appointment $appointment): void
    {
        try {
            // Load the appointment with doctor relationship
            $appointment->load('doctor');

            // Find or create an open bill for the patient
            $bill = Bill::where('patient_id', $appointment->patient_id)
                ->whereNull('voided_at')
                ->whereIn('payment_status', ['pending', 'partial'])
                ->latest()
                ->first();

            // If no open bill exists, create a new one
            if (!$bill) {
                $bill = Bill::create([
                    'patient_id' => $appointment->patient_id,
                    'doctor_id' => $appointment->doctor_id,
                    'created_by' => auth()->id(),
                    'bill_date' => now(),
                    'due_date' => now()->addDays(30),
                    'payment_status' => 'pending',
                    'status' => 'active',
                ]);

                $this->auditLogService->logActivity(
                    'Bill Created',
                    'Billing',
                    "Created new bill #{$bill->bill_number} for patient from appointment completion",
                    'info'
                );
            }

            // Add the appointment fee to the bill
            $this->billItemService->addFromAppointment($bill, $appointment);

            $this->auditLogService->logActivity(
                'Appointment Completed',
                'Appointment',
                "Appointment #{$appointment->appointment_id} marked as completed. Consultation fee added to bill #{$bill->bill_number}",
                'info'
            );
        } catch (\Exception $e) {
            // Log the error but don't fail the appointment update
            Log::error('Failed to create bill item for appointment', [
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);

            $this->auditLogService->logActivity(
                'Bill Item Creation Failed',
                'Billing',
                "Failed to add appointment fee for appointment #{$appointment->appointment_id}: {$e->getMessage()}",
                'error'
            );
        }
    }
}