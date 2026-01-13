<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Services\AppointmentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 10);
        $appointments = $this->appointmentService->getAllAppointments($perPage);
        
        return response()->json([
            'data' => AppointmentResource::collection($appointments),
            'pagination' => [
                'current_page' => $appointments->currentPage(),
                'last_page' => $appointments->lastPage(),
                'per_page' => $appointments->perPage(),
                'total' => $appointments->total(),
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $appointment = $this->appointmentService->createAppointment($request->validated());

        return response()->json([
            'message' => 'Appointment created successfully',
            'data' => new AppointmentResource($appointment)
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $appointment = $this->appointmentService->getAppointmentById($id);

        return response()->json([
            'data' => new AppointmentResource($appointment)
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAppointmentRequest $request, string $id): JsonResponse
    {
        $appointment = $this->appointmentService->updateAppointment($id, $request->validated());

        return response()->json([
            'message' => 'Appointment updated successfully',
            'data' => new AppointmentResource($appointment)
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $this->appointmentService->deleteAppointment($id);

        return response()->json([
            'message' => 'Appointment deleted successfully'
        ]);
    }

    /**
     * Cancel the specified appointment.
     */
    public function cancel(string $id): JsonResponse
    {
        $this->appointmentService->cancelAppointment($id);

        return response()->json([
            'message' => 'Appointment cancelled successfully'
        ]);
    }

    /**
     * Mark the specified appointment as completed.
     */
    public function complete(string $id): JsonResponse
    {
        $appointment = $this->appointmentService->getAppointmentById($id);
        $appointment->update(['status' => 'completed']);

        return response()->json([
            'message' => 'Appointment completed successfully',
            'data' => new AppointmentResource($appointment)
        ]);
    }
}