<?php

namespace App\Http\Controllers\Appointment;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AppointmentController extends Controller
{
    protected AppointmentService $appointmentService;

    public function __construct(AppointmentService $appointmentService)
    {
        $this->appointmentService = $appointmentService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $appointments = $this->appointmentService->getAllAppointments();
        return Inertia::render('Appointment/Index', [
            'appointments' => $appointments
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $formData = $this->appointmentService->getAppointmentFormData();
        return Inertia::render('Appointment/Create', $formData);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'department_id' => 'required|exists:departments,id',
            'appointment_date' => 'required|date',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
            'fee' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0|max:100',
        ]);

        try {
            $appointment = $this->appointmentService->createAppointment([
                'patient_id' => $request->patient_id,
                'doctor_id' => $request->doctor_id,
                'department_id' => $request->department_id,
                'appointment_date' => $request->appointment_date,
                'reason' => $request->reason,
                'notes' => $request->notes,
                'fee' => $request->fee,
                'discount' => $request->discount ?? 0,
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
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id' => 'required|exists:doctors,id',
            'department_id' => 'required|exists:departments,id',
            'appointment_date' => 'required|date',
            'status' => 'required|in:scheduled,completed,cancelled,no_show',
            'reason' => 'nullable|string',
            'notes' => 'nullable|string',
            'fee' => 'required|numeric|min:0',
        ]);

        $this->appointmentService->updateAppointment($id, [
            'patient_id' => $request->patient_id,
            'doctor_id' => $request->doctor_id,
            'department_id' => $request->department_id,
            'appointment_date' => $request->appointment_date,
            'status' => $request->status,
            'reason' => $request->reason,
            'notes' => $request->notes,
            'fee' => $request->fee,
        ]);

        return redirect()->route('appointments.index')->with('success', 'Appointment updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        try {
            $this->appointmentService->deleteAppointment($id);
            return redirect()->route('appointments.index')->with('success', 'Appointment deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['error' => 'Failed to delete appointment: ' . $e->getMessage()]);
        }
    }
}
