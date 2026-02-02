<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Http\Resources\Billing\InsuranceProviderResource;
use App\Models\InsuranceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Exception;

class InsuranceProviderController extends Controller
{
    /**
     * Display a listing of insurance providers.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('view-insurance-providers');

        try {
            $query = InsuranceProvider::withCount('patientInsurances');

            // Apply filters
            if ($request->has('active') && $request->active !== null) {
                $request->boolean('active')
                    ? $query->active()
                    : $query->inactive();
            }

            if ($request->has('search') && $request->search) {
                $query->searchByName($request->search);
            }

            if ($request->has('coverage_type') && $request->coverage_type) {
                $query->hasCoverageType($request->coverage_type);
            }

            if ($request->has('has_api') && $request->has_api) {
                $query->whereNotNull('api_endpoint');
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'name');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            $providers = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => InsuranceProviderResource::collection($providers),
                'meta' => [
                    'current_page' => $providers->currentPage(),
                    'last_page' => $providers->lastPage(),
                    'per_page' => $providers->perPage(),
                    'total' => $providers->total(),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching insurance providers', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch insurance providers: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created insurance provider.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create-insurance-providers');

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:insurance_providers',
                'code' => 'required|string|max:50|unique:insurance_providers',
                'description' => 'nullable|string|max:1000',
                'phone' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:255',
                'website' => 'nullable|url|max:255',
                'address' => 'nullable|array',
                'coverage_types' => 'nullable|array',
                'coverage_types.*' => [
                    'string',
                    Rule::in(['inpatient', 'outpatient', 'pharmacy', 'lab', 'emergency', 'dental', 'vision']),
                ],
                'max_coverage_amount' => 'nullable|numeric|min:0',
                'api_endpoint' => 'nullable|url|max:500',
                'api_key' => 'nullable|string|max:500',
                'is_active' => 'boolean',
            ]);

            $provider = InsuranceProvider::create($validated);

            return response()->json([
                'success' => true,
                'data' => new InsuranceProviderResource($provider),
                'message' => 'Insurance provider created successfully',
            ], 201);
        } catch (Exception $e) {
            Log::error('Error creating insurance provider', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create insurance provider: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified insurance provider.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $this->authorize('view-insurance-providers');

        try {
            $provider = InsuranceProvider::with([
                'patientInsurances' => function ($query) {
                    $query->with('patient')->limit(10);
                },
            ])->withCount('patientInsurances')->findOrFail($id);

            // Get statistics
            $activeInsurances = $provider->patientInsurances()
                ->where('is_active', true)
                ->count();

            $expiredInsurances = $provider->patientInsurances()
                ->where('is_active', false)
                ->orWhere(function ($query) {
                    $query->whereNotNull('coverage_end_date')
                        ->where('coverage_end_date', '<', now());
                })
                ->count();

            return response()->json([
                'success' => true,
                'data' => new InsuranceProviderResource($provider),
                'statistics' => [
                    'total_insurances' => $provider->patient_insurances_count,
                    'active_insurances' => $activeInsurances,
                    'expired_insurances' => $expiredInsurances,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching insurance provider', ['provider_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Insurance provider not found',
            ], 404);
        }
    }

    /**
     * Update the specified insurance provider.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $this->authorize('edit-insurance-providers');

        try {
            $provider = InsuranceProvider::findOrFail($id);

            $validated = $request->validate([
                'name' => [
                    'sometimes',
                    'string',
                    'max:255',
                    Rule::unique('insurance_providers')->ignore($provider->id),
                ],
                'code' => [
                    'sometimes',
                    'string',
                    'max:50',
                    Rule::unique('insurance_providers')->ignore($provider->id),
                ],
                'description' => 'nullable|string|max:1000',
                'phone' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:255',
                'website' => 'nullable|url|max:255',
                'address' => 'nullable|array',
                'coverage_types' => 'nullable|array',
                'coverage_types.*' => [
                    'string',
                    Rule::in(['inpatient', 'outpatient', 'pharmacy', 'lab', 'emergency', 'dental', 'vision']),
                ],
                'max_coverage_amount' => 'nullable|numeric|min:0',
                'api_endpoint' => 'nullable|url|max:500',
                'api_key' => 'nullable|string|max:500',
                'is_active' => 'boolean',
            ]);

            $provider->update($validated);

            return response()->json([
                'success' => true,
                'data' => new InsuranceProviderResource($provider->fresh()),
                'message' => 'Insurance provider updated successfully',
            ]);
        } catch (Exception $e) {
            Log::error('Error updating insurance provider', ['provider_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update insurance provider: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified insurance provider.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->authorize('delete-insurance-providers');

        try {
            $provider = InsuranceProvider::findOrFail($id);

            // Check if provider has active insurances
            $activeInsurances = $provider->patientInsurances()
                ->where('is_active', true)
                ->count();

            if ($activeInsurances > 0) {
                throw new Exception('Cannot delete provider with active insurance policies.');
            }

            $provider->delete();

            return response()->json([
                'success' => true,
                'message' => 'Insurance provider deleted successfully',
            ]);
        } catch (Exception $e) {
            Log::error('Error deleting insurance provider', ['provider_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete insurance provider: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get all active providers (for dropdowns).
     */
    public function activeProviders(Request $request): JsonResponse
    {
        $this->authorize('view-insurance-providers');

        try {
            $providers = InsuranceProvider::active()
                ->select('id', 'name', 'code', 'coverage_types')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $providers,
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching active providers', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch active providers: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Toggle provider active status.
     */
    public function toggleStatus(Request $request, string $id): JsonResponse
    {
        $this->authorize('edit-insurance-providers');

        try {
            $provider = InsuranceProvider::findOrFail($id);

            $provider->update([
                'is_active' => !$provider->is_active,
            ]);

            return response()->json([
                'success' => true,
                'data' => new InsuranceProviderResource($provider->fresh()),
                'message' => 'Provider status updated successfully',
            ]);
        } catch (Exception $e) {
            Log::error('Error toggling provider status', ['provider_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update provider status: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get provider statistics.
     */
    public function statistics(Request $request, string $id): JsonResponse
    {
        $this->authorize('view-insurance-providers');

        try {
            $provider = InsuranceProvider::findOrFail($id);

            // Get insurance statistics
            $totalInsurances = $provider->patientInsurances()->count();
            $activeInsurances = $provider->patientInsurances()->active()->count();
            $expiredInsurances = $provider->patientInsurances()->expired()->count();
            $primaryInsurances = $provider->patientInsurances()->primary()->count();

            // Get claims statistics
            $totalClaims = $provider->patientInsurances()
                ->withCount('insuranceClaims')
                ->get()
                ->sum('insurance_claims_count');

            $approvedClaims = 0;
            $pendingClaims = 0;
            $rejectedClaims = 0;
            $totalClaimAmount = 0;
            $totalApprovedAmount = 0;

            foreach ($provider->patientInsurances as $insurance) {
                $approvedClaims += $insurance->insuranceClaims()->where('status', 'approved')->count();
                $pendingClaims += $insurance->insuranceClaims()->pendingApproval()->count();
                $rejectedClaims += $insurance->insuranceClaims()->where('status', 'rejected')->count();
                $totalClaimAmount += $insurance->insuranceClaims()->sum('claim_amount');
                $totalApprovedAmount += $insurance->insuranceClaims()->sum('approved_amount');
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'insurances' => [
                        'total' => $totalInsurances,
                        'active' => $activeInsurances,
                        'expired' => $expiredInsurances,
                        'primary' => $primaryInsurances,
                    ],
                    'claims' => [
                        'total' => $totalClaims,
                        'approved' => $approvedClaims,
                        'pending' => $pendingClaims,
                        'rejected' => $rejectedClaims,
                        'total_claim_amount' => $totalClaimAmount,
                        'total_approved_amount' => $totalApprovedAmount,
                        'approval_rate' => $totalClaims > 0
                            ? round(($approvedClaims / $totalClaims) * 100, 2)
                            : 0,
                    ],
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching provider statistics', ['provider_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch provider statistics: ' . $e->getMessage(),
            ], 500);
        }
    }
}
