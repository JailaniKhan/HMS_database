<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\API\BaseApiController;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class DoctorController extends BaseApiController
{
    /**
     * Check if user can access doctors
     */
    private function authorizeDoctorAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-doctors')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if user can modify doctors
     */
    private function authorizeDoctorModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-doctors')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Sanitize input data
     */
    private function sanitizeInput(array $data): array
    {
        return [
            'name' => htmlspecialchars(strip_tags($data['name'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'specialization' => htmlspecialchars(strip_tags($data['specialization'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'license_number' => htmlspecialchars(strip_tags($data['license_number'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'phone' => preg_replace('/[^0-9+\-\s\(\)]/', '', $data['phone'] ?? ''),
            'department_id' => filter_var($data['department_id'] ?? null, FILTER_VALIDATE_INT),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeDoctorAccess();

        return $this->executeWithErrorHandling(function () use ($request) {
            $perPage = $this->validatePerPage($request->input('per_page', 10));
            $doctors = Doctor::with('department')->paginate($perPage);

            Log::info('Doctors list retrieved via API', [
                'count' => $doctors->total(),
                'user_id' => auth()->id()
            ]);

            return $this->paginatedResponse($doctors, 'Doctors retrieved successfully');
        }, 'Doctor list retrieval');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizeDoctorModify();

        return $this->executeWithErrorHandling(function () use ($request) {
            $validatedData = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:doctors,email',
                'phone' => 'required|string|max:20',
                'specialization' => 'required|string|max:255',
                'license_number' => 'required|string|max:255|unique:doctors,license_number',
                'department_id' => 'required|exists:departments,id',
            ]);

            $sanitized = $this->sanitizeInput($validatedData);
            $doctor = Doctor::create([
                'name' => $sanitized['name'],
                'email' => $validatedData['email'],
                'phone' => $sanitized['phone'],
                'specialization' => $sanitized['specialization'],
                'license_number' => $sanitized['license_number'],
                'department_id' => $sanitized['department_id'],
            ]);

            Log::info('Doctor created via API', [
                'doctor_id' => $doctor->id,
                'user_id' => auth()->id()
            ]);

            return $this->successResponse($doctor, 'Doctor created successfully', 201);
        }, 'Doctor creation');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $this->authorizeDoctorAccess();

        $doctorId = $this->validateId($id);
        if (!$doctorId) {
            return $this->errorResponse('Invalid doctor ID', 400);
        }

        return $this->executeWithErrorHandling(
            function () use ($doctorId) {
                $doctor = Doctor::with('department')->findOrFail($doctorId);
                return $this->successResponse($doctor);
            },
            'Doctor retrieval',
            $id
        );
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $this->authorizeDoctorModify();

        $doctorId = $this->validateId($id);
        if (!$doctorId) {
            return $this->errorResponse('Invalid doctor ID', 400);
        }

        return $this->executeWithErrorHandling(function () use ($request, $doctorId, $id) {
            $doctor = Doctor::findOrFail($doctorId);

            $validatedData = $request->validate([
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:doctors,email,' . $id,
                'phone' => 'sometimes|required|string|max:20',
                'specialization' => 'sometimes|required|string|max:255',
                'license_number' => 'sometimes|required|string|max:255|unique:doctors,license_number,' . $id,
                'department_id' => 'sometimes|required|exists:departments,id',
            ]);

            $sanitized = $this->sanitizeInput($validatedData);
            $doctor->update([
                'name' => $sanitized['name'] ?? $doctor->name,
                'email' => $validatedData['email'] ?? $doctor->email,
                'phone' => $sanitized['phone'] ?? $doctor->phone,
                'specialization' => $sanitized['specialization'] ?? $doctor->specialization,
                'license_number' => $sanitized['license_number'] ?? $doctor->license_number,
                'department_id' => $sanitized['department_id'] ?? $doctor->department_id,
            ]);

            Log::info('Doctor updated via API', [
                'doctor_id' => $doctor->id,
                'user_id' => auth()->id()
            ]);

            return $this->successResponse($doctor, 'Doctor updated successfully');
        }, 'Doctor update', $id);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $this->authorizeDoctorModify();

        if (!auth()->user()?->hasPermission('delete-doctors')) {
            return $this->unauthorizedResponse('Unauthorized to delete doctors');
        }

        $doctorId = $this->validateId($id);
        if (!$doctorId) {
            return $this->errorResponse('Invalid doctor ID', 400);
        }

        return $this->executeWithErrorHandling(function () use ($doctorId) {
            $doctor = Doctor::findOrFail($doctorId);
            $doctor->delete();

            Log::info('Doctor deleted via API', [
                'doctor_id' => $doctorId,
                'user_id' => auth()->id()
            ]);

            return $this->successResponse(null, 'Doctor deleted successfully');
        }, 'Doctor deletion', $id);
    }
}