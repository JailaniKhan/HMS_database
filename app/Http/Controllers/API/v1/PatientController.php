<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Services\SmartCacheService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class PatientController extends Controller
{
    protected SmartCacheService $cacheService;

    public function __construct(SmartCacheService $cacheService)
    {
        $this->cacheService = $cacheService;
    }

    /**
     * Check if user can access patients
     */
    private function authorizePatientAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-patients')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if user can modify patients
     */
    private function authorizePatientModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-patients')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Sanitize input data
     */
    private function sanitizeInput(array $data): array
    {
        return [
            'first_name' => htmlspecialchars(strip_tags($data['first_name'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'father_name' => htmlspecialchars(strip_tags($data['father_name'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'phone' => preg_replace('/[^0-9+\-\s\(\)]/', '', $data['phone'] ?? ''),
            'address' => htmlspecialchars(strip_tags($data['address'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'age' => filter_var($data['age'] ?? null, FILTER_VALIDATE_INT),
            'gender' => in_array($data['gender'] ?? '', ['male', 'female', 'other']) ? $data['gender'] : null,
            'blood_group' => $this->validateBloodGroup($data['blood_group'] ?? null),
            'emergency_contact_name' => htmlspecialchars(strip_tags($data['emergency_contact_name'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'emergency_contact_phone' => preg_replace('/[^0-9+\-\s\(\)]/', '', $data['emergency_contact_phone'] ?? ''),
            'medical_conditions' => htmlspecialchars(strip_tags($data['medical_conditions'] ?? ''), ENT_QUOTES, 'UTF-8'),
        ];
    }

    /**
     * Validate blood group
     */
    private function validateBloodGroup(?string $bloodGroup): ?string
    {
        $validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        return in_array($bloodGroup, $validGroups) ? $bloodGroup : null;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizePatientAccess();

        try {
            $perPage = filter_var($request->input('per_page', 10), FILTER_VALIDATE_INT) ?: 10;

            // Validate pagination parameters
            if ($perPage < 1 || $perPage > 100) {
                return response()->json([
                    'message' => 'Invalid per_page parameter. Must be between 1 and 100.',
                    'errors' => ['per_page' => ['Must be between 1 and 100']]
                ], 422);
            }

            $patients = Patient::with('user:id,name')
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            Log::info('Patients list retrieved', [
                'count' => $patients->total(),
                'page' => $patients->currentPage(),
                'per_page' => $perPage,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $patients->items(),
                'pagination' => [
                    'current_page' => $patients->currentPage(),
                    'last_page' => $patients->lastPage(),
                    'per_page' => $patients->perPage(),
                    'total' => $patients->total(),
                    'from' => $patients->firstItem(),
                    'to' => $patients->lastItem(),
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve patients list', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve patients',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizePatientModify();

        try {
            $validatedData = $request->validate([
                'first_name' => 'nullable|string|max:255|min:2',
                'father_name' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20|regex:/^[\+]?[0-9\s\-\(\)]+$/',
                'address' => 'nullable|string|max:500',
                'age' => 'nullable|integer|min:0|max:150',
                'gender' => 'nullable|in:male,female,other',
                'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
                'emergency_contact_name' => 'nullable|string|max:255',
                'emergency_contact_phone' => 'nullable|string|max:20',
                'medical_conditions' => 'nullable|string|max:1000',
            ]);

            // Sanitize input
            $sanitized = $this->sanitizeInput($validatedData);

            // Generate unique patient ID
            $year = date('Y');
            $lastPatient = Patient::where('patient_id', 'LIKE', 'P' . $year . '%')
                ->orderByRaw('CAST(SUBSTRING(patient_id, ' . (strlen($year) + 2) . ') AS UNSIGNED) DESC')
                ->first();

            $nextNumber = $lastPatient ? (int)substr($lastPatient->patient_id, strlen('P'.$year)) + 1 : 1;
            $patientId = 'P' . $year . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

            $patientData = [
                'patient_id' => $patientId,
                'first_name' => $sanitized['first_name'],
                'father_name' => $sanitized['father_name'],
                'phone' => $sanitized['phone'],
                'address' => $sanitized['address'],
                'age' => $sanitized['age'],
                'gender' => $sanitized['gender'],
                'blood_group' => $sanitized['blood_group'],
                'metadata' => [
                    'emergency_contact' => [
                        'name' => $sanitized['emergency_contact_name'],
                        'phone' => $sanitized['emergency_contact_phone'],
                    ],
                    'medical_conditions' => $sanitized['medical_conditions'],
                ]
            ];

            $patient = Patient::create($patientData);

            // Clear relevant caches
            $this->cacheService->clearPatientCache($patient->id);

            Log::info('Patient created via API', [
                'patient_id' => $patient->patient_id,
                'id' => $patient->id,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Patient created successfully',
                'data' => $patient->load('user:id,name')
            ], 201);

        } catch (ValidationException $e) {
            Log::warning('Patient creation validation failed', [
                'errors' => $e->errors(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Patient creation failed', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create patient',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $this->authorizePatientAccess();

        // Validate ID
        $patientId = filter_var($id, FILTER_VALIDATE_INT);
        if (!$patientId) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid patient ID'
            ], 400);
        }

        $patient = Patient::findOrFail($patientId);

        return response()->json([
            'success' => true,
            'data' => $patient
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $this->authorizePatientModify();

        // Validate ID
        $patientId = filter_var($id, FILTER_VALIDATE_INT);
        if (!$patientId) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid patient ID'
            ], 400);
        }

        $patient = Patient::findOrFail($patientId);

        $validatedData = $request->validate([
            'first_name' => 'sometimes|nullable|string|max:255',
            'father_name' => 'sometimes|nullable|string|max:255',
            'phone' => 'sometimes|nullable|string|max:20',
            'address' => 'nullable|string|max:500',
            'age' => 'sometimes|nullable|integer|min:0|max:150',
            'gender' => 'sometimes|nullable|in:male,female,other',
            'blood_group' => 'sometimes|nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);

        // Sanitize input
        $sanitized = $this->sanitizeInput($validatedData);

        $patient->update([
            'first_name' => $sanitized['first_name'],
            'father_name' => $sanitized['father_name'],
            'phone' => $sanitized['phone'],
            'address' => $sanitized['address'],
            'age' => $sanitized['age'],
            'gender' => $sanitized['gender'],
            'blood_group' => $sanitized['blood_group'],
        ]);

        Log::info('Patient updated via API', [
            'patient_id' => $patient->id,
            'user_id' => auth()->id()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Patient updated successfully',
            'data' => $patient
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $this->authorizePatientModify();

        // Check delete permission specifically
        if (!auth()->user()?->hasPermission('delete-patients')) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized to delete patients'
            ], 403);
        }

        // Validate ID
        $patientId = filter_var($id, FILTER_VALIDATE_INT);
        if (!$patientId) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid patient ID'
            ], 400);
        }

        $patient = Patient::findOrFail($patientId);
        $patient->delete();

        Log::info('Patient deleted via API', [
            'patient_id' => $patientId,
            'user_id' => auth()->id()
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Patient deleted successfully'
        ]);
    }
}