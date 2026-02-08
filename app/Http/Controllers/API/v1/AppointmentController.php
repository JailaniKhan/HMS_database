<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\API\BaseApiController;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Services\AppointmentService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AppointmentController extends BaseApiController
{
    protected AppointmentService $appointmentService;

    public function __construct(AppointmentService $appointmentService)
    {
        $this->appointmentService = $appointmentService;
    }

    /**
     * Check if user can access appointments
     */
    private function authorizeAppointmentAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-appointments')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if user can modify appointments
     */
    private function authorizeAppointmentModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-appointments')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAppointmentAccess();

        return $this->executeWithErrorHandling(function () use ($request) {
            $perPage = $this->validatePerPage($request->input('per_page', 10));
            $appointments = $this->appointmentService->getAllAppointments($perPage);

            Log::info('Appointments list retrieved via API', [
                'count' => $appointments->total(),
                'user_id' => auth()->id()
            ]);

            return $this->paginatedResponse(
                $appointments->setCollection(
                    AppointmentResource::collection($appointments->getCollection())->collection
                ),
                'Appointments retrieved successfully'
            );
        }, 'Appointment list retrieval');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $this->authorizeAppointmentModify();

        return $this->executeWithErrorHandling(function () use ($request) {
            $appointment = $this->appointmentService->createAppointment($request->validated());

            Log::info('Appointment created via API', [
                'appointment_id' => $appointment->id,
                'user_id' => auth()->id()
            ]);

            return $this->successResponse(
                new AppointmentResource($appointment),
                'Appointment created successfully',
                201
            );
        }, 'Appointment creation');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $this->authorizeAppointmentAccess();

        $appointmentId = $this->validateId($id);
        if (!$appointmentId) {
            return $this->errorResponse('Invalid appointment ID', 400);
        }

        return $this->executeWithErrorHandling(
            function () use ($appointmentId) {
                $appointment = $this->appointmentService->getAppointmentById($appointmentId);
                return $this->successResponse(new AppointmentResource($appointment));
            },
            'Appointment retrieval',
            $id
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateAppointmentRequest $request, string $id): JsonResponse
    {
        $this->authorizeAppointmentModify();

        $appointmentId = $this->validateId($id);
        if (!$appointmentId) {
            return $this->errorResponse('Invalid appointment ID', 400);
        }

        return $this->executeWithErrorHandling(function () use ($request, $appointmentId) {
            $appointment = $this->appointmentService->updateAppointment($appointmentId, $request->validated());

            Log::info('Appointment updated via API', [
                'appointment_id' => $appointment->id,
                'user_id' => auth()->id()
            ]);

            return $this->successResponse(
                new AppointmentResource($appointment),
                'Appointment updated successfully'
            );
        }, 'Appointment update', $id);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $this->authorizeAppointmentModify();

        if (!auth()->user()?->hasPermission('delete-appointments')) {
            return $this->unauthorizedResponse('Unauthorized to delete appointments');
        }

        $appointmentId = $this->validateId($id);
        if (!$appointmentId) {
            return $this->errorResponse('Invalid appointment ID', 400);
        }

        return $this->executeWithErrorHandling(function () use ($appointmentId) {
            $this->appointmentService->deleteAppointment($appointmentId);

            Log::info('Appointment deleted via API', [
                'appointment_id' => $appointmentId,
                'user_id' => auth()->id()
            ]);

            return $this->successResponse(null, 'Appointment deleted successfully');
        }, 'Appointment deletion', $id);
    }

    /**
     * Cancel the specified appointment.
     */
    public function cancel(string $id): JsonResponse
    {
        $this->authorizeAppointmentModify();

        $appointmentId = $this->validateId($id);
        if (!$appointmentId) {
            return $this->errorResponse('Invalid appointment ID', 400);
        }

        return $this->executeWithErrorHandling(function () use ($appointmentId) {
            $this->appointmentService->cancelAppointment($appointmentId);

            Log::info('Appointment cancelled via API', [
                'appointment_id' => $appointmentId,
                'user_id' => auth()->id()
            ]);

            return $this->successResponse(null, 'Appointment cancelled successfully');
        }, 'Appointment cancellation', $id);
    }

    /**
     * Mark the specified appointment as completed.
     */
    public function complete(string $id): JsonResponse
    {
        $this->authorizeAppointmentModify();

        $appointmentId = $this->validateId($id);
        if (!$appointmentId) {
            return $this->errorResponse('Invalid appointment ID', 400);
        }

        return $this->executeWithErrorHandling(function () use ($appointmentId) {
            $appointment = $this->appointmentService->getAppointmentById($appointmentId);
            $appointment->update(['status' => 'completed']);

            Log::info('Appointment completed via API', [
                'appointment_id' => $appointmentId,
                'user_id' => auth()->id()
            ]);

            return $this->successResponse(
                new AppointmentResource($appointment),
                'Appointment completed successfully'
            );
        }, 'Appointment completion', $id);
    }
}