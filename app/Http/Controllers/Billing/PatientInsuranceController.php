<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StorePatientInsuranceRequest;
use App\Http\Resources\Billing\PatientInsuranceResource;
use App\Models\Patient;
use App\Models\PatientInsurance;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Exception;

class PatientInsuranceController extends Controller
{
    /**
     * Display a listing of patient insurances.
     */
    public function index(Request $request, string $patientId): JsonResponse
    {
        $this->authorize('view-patient-insurance');

        try {
            $patient = Patient::findOrFail($patientId);

            $query = PatientInsurance::with('insuranceProvider')
                ->where('patient_id', $patientId);

            // Apply filters
            if ($request->has('active') && $request->active !== null) {
                $request->boolean('active')
                    ? $query->active()
                    : $query->inactive();
            }

            if ($request->has('valid') && $request->valid) {
                $query->valid();
            }

            if ($request->has('expired') && $request->expired) {
                $query->expired();
            }

            if ($request->has('primary') && $request->primary) {
                $query->primary();
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'priority_order');
            $sortOrder = $request->get('sort_order', 'asc');
            $query->orderBy($sortBy, $sortOrder);

            $insurances = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => PatientInsuranceResource::collection($insurances),
                'patient' => [
                    'id' => $patient->id,
                    'patient_id' => $patient->patient_id,
                    'name' => $patient->full_name,
                ],
                'meta' => [
                    'current_page' => $insurances->currentPage(),
                    'last_page' => $insurances->lastPage(),
                    'per_page' => $insurances->perPage(),
                    'total' => $insurances->total(),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching patient insurances', ['patient_id' => $patientId, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch patient insurances: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created patient insurance.
     */
    public function store(StorePatientInsuranceRequest $request, string $patientId): JsonResponse
    {
        $this->authorize('manage-patient-insurance');

        try {
            DB::beginTransaction();

            $patient = Patient::findOrFail($patientId);

            // Check if this insurance already exists for the patient
            $existingInsurance = PatientInsurance::where('patient_id', $patientId)
                ->where('insurance_provider_id', $request->insurance_provider_id)
                ->where('policy_number', $request->policy_number)
                ->first();

            if ($existingInsurance) {
                throw new Exception('This insurance policy already exists for this patient.');
            }

            // If setting as primary, unset other primary insurances
            if ($request->is_primary) {
                PatientInsurance::where('patient_id', $patientId)
                    ->where('is_primary', true)
                    ->update(['is_primary' => false]);
            }

            // Get next priority order if not specified
            $priorityOrder = $request->priority_order ?? PatientInsurance::where('patient_id', $patientId)->max('priority_order') + 1;

            $insurance = PatientInsurance::create([
                'patient_id' => $patientId,
                'insurance_provider_id' => $request->insurance_provider_id,
                'policy_number' => $request->policy_number,
                'policy_holder_name' => $request->policy_holder_name,
                'relationship_to_patient' => $request->relationship_to_patient,
                'coverage_start_date' => $request->coverage_start_date,
                'coverage_end_date' => $request->coverage_end_date,
                'co_pay_amount' => $request->co_pay_amount ?? 0,
                'co_pay_percentage' => $request->co_pay_percentage ?? 0,
                'deductible_amount' => $request->deductible_amount ?? 0,
                'deductible_met' => $request->deductible_met ?? 0,
                'annual_max_coverage' => $request->annual_max_coverage,
                'annual_used_amount' => $request->annual_used_amount ?? 0,
                'is_primary' => $request->is_primary ?? false,
                'priority_order' => $priorityOrder,
                'is_active' => $request->is_active ?? true,
                'notes' => $request->notes,
            ]);

            DB::commit();

            // Load relationships
            $insurance->load('insuranceProvider');

            return response()->json([
                'success' => true,
                'data' => new PatientInsuranceResource($insurance),
                'message' => 'Patient insurance added successfully',
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error creating patient insurance', ['patient_id' => $patientId, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add patient insurance: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified patient insurance.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $this->authorize('view-patient-insurance');

        try {
            $insurance = PatientInsurance::with([
                'patient',
                'insuranceProvider',
                'insuranceClaims' => function ($query) {
                    $query->orderBy('created_at', 'desc')->limit(10);
                },
                'bills' => function ($query) {
                    $query->orderBy('created_at', 'desc')->limit(10);
                },
            ])->findOrFail($id);

            // Calculate coverage statistics
            $totalClaims = $insurance->insuranceClaims()->count();
            $approvedClaims = $insurance->insuranceClaims()->where('status', 'approved')->count();
            $totalClaimAmount = $insurance->insuranceClaims()->sum('claim_amount');
            $totalApprovedAmount = $insurance->insuranceClaims()->sum('approved_amount');

            return response()->json([
                'success' => true,
                'data' => new PatientInsuranceResource($insurance),
                'statistics' => [
                    'total_claims' => $totalClaims,
                    'approved_claims' => $approvedClaims,
                    'total_claim_amount' => $totalClaimAmount,
                    'total_approved_amount' => $totalApprovedAmount,
                    'approval_rate' => $totalClaims > 0
                        ? round(($approvedClaims / $totalClaims) * 100, 2)
                        : 0,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching patient insurance', ['insurance_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Patient insurance not found',
            ], 404);
        }
    }

    /**
     * Update the specified patient insurance.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $this->authorize('manage-patient-insurance');

        try {
            DB::beginTransaction();

            $insurance = PatientInsurance::findOrFail($id);

            $validated = $request->validate([
                'policy_number' => 'sometimes|string|max:100',
                'policy_holder_name' => 'sometimes|string|max:255',
                'relationship_to_patient' => 'sometimes|in:self,spouse,child,parent,other',
                'coverage_start_date' => 'sometimes|date',
                'coverage_end_date' => 'nullable|date|after:coverage_start_date',
                'co_pay_amount' => 'nullable|numeric|min:0',
                'co_pay_percentage' => 'nullable|numeric|min:0|max:100',
                'deductible_amount' => 'nullable|numeric|min:0',
                'deductible_met' => 'nullable|numeric|min:0',
                'annual_max_coverage' => 'nullable|numeric|min:0',
                'annual_used_amount' => 'nullable|numeric|min:0',
                'is_primary' => 'boolean',
                'priority_order' => 'nullable|integer|min:1',
                'is_active' => 'boolean',
                'notes' => 'nullable|string',
            ]);

            // If setting as primary, unset other primary insurances
            if (isset($validated['is_primary']) && $validated['is_primary'] && !$insurance->is_primary) {
                PatientInsurance::where('patient_id', $insurance->patient_id)
                    ->where('is_primary', true)
                    ->update(['is_primary' => false]);
            }

            $insurance->update($validated);

            DB::commit();

            // Load relationships
            $insurance->load('insuranceProvider');

            return response()->json([
                'success' => true,
                'data' => new PatientInsuranceResource($insurance),
                'message' => 'Patient insurance updated successfully',
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error updating patient insurance', ['insurance_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update patient insurance: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Remove the specified patient insurance.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->authorize('manage-patient-insurance');

        try {
            $insurance = PatientInsurance::findOrFail($id);

            // Check if insurance has claims
            $claimsCount = $insurance->insuranceClaims()->count();
            if ($claimsCount > 0) {
                throw new Exception('Cannot delete insurance with existing claims.');
            }

            // Check if insurance is used in bills
            $billsCount = $insurance->bills()->count();
            if ($billsCount > 0) {
                throw new Exception('Cannot delete insurance that is associated with bills.');
            }

            $insurance->delete();

            return response()->json([
                'success' => true,
                'message' => 'Patient insurance removed successfully',
            ]);
        } catch (Exception $e) {
            Log::error('Error deleting patient insurance', ['insurance_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to remove patient insurance: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Set insurance as primary.
     */
    public function setPrimary(Request $request, string $id): JsonResponse
    {
        $this->authorize('manage-patient-insurance');

        try {
            DB::beginTransaction();

            $insurance = PatientInsurance::findOrFail($id);

            // Unset other primary insurances for this patient
            PatientInsurance::where('patient_id', $insurance->patient_id)
                ->where('is_primary', true)
                ->update(['is_primary' => false]);

            // Set this as primary
            $insurance->update([
                'is_primary' => true,
                'priority_order' => 1,
            ]);

            // Update other insurances priority order
            PatientInsurance::where('patient_id', $insurance->patient_id)
                ->where('id', '!=', $insurance->id)
                ->increment('priority_order');

            DB::commit();

            // Load relationships
            $insurance->load('insuranceProvider');

            return response()->json([
                'success' => true,
                'data' => new PatientInsuranceResource($insurance),
                'message' => 'Insurance set as primary successfully',
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error setting primary insurance', ['insurance_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to set primary insurance: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update deductible met amount.
     */
    public function updateDeductible(Request $request, string $id): JsonResponse
    {
        $this->authorize('manage-patient-insurance');

        try {
            $request->validate([
                'amount' => 'required|numeric|min:0',
                'operation' => 'required|in:add,subtract,set',
            ]);

            $insurance = PatientInsurance::findOrFail($id);

            $amount = $request->amount;
            $operation = $request->operation;

            switch ($operation) {
                case 'add':
                    $insurance->deductible_met += $amount;
                    break;
                case 'subtract':
                    $insurance->deductible_met = max(0, $insurance->deductible_met - $amount);
                    break;
                case 'set':
                    $insurance->deductible_met = $amount;
                    break;
            }

            $insurance->save();

            return response()->json([
                'success' => true,
                'data' => [
                    'deductible_met' => $insurance->deductible_met,
                    'deductible_amount' => $insurance->deductible_amount,
                    'remaining_deductible' => $insurance->remaining_deductible,
                ],
                'message' => 'Deductible updated successfully',
            ]);
        } catch (Exception $e) {
            Log::error('Error updating deductible', ['insurance_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update deductible: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update annual used amount.
     */
    public function updateAnnualUsed(Request $request, string $id): JsonResponse
    {
        $this->authorize('manage-patient-insurance');

        try {
            $request->validate([
                'amount' => 'required|numeric|min:0',
                'operation' => 'required|in:add,subtract,set',
            ]);

            $insurance = PatientInsurance::findOrFail($id);

            $amount = $request->amount;
            $operation = $request->operation;

            switch ($operation) {
                case 'add':
                    $insurance->annual_used_amount += $amount;
                    break;
                case 'subtract':
                    $insurance->annual_used_amount = max(0, $insurance->annual_used_amount - $amount);
                    break;
                case 'set':
                    $insurance->annual_used_amount = $amount;
                    break;
            }

            $insurance->save();

            return response()->json([
                'success' => true,
                'data' => [
                    'annual_used_amount' => $insurance->annual_used_amount,
                    'annual_max_coverage' => $insurance->annual_max_coverage,
                    'remaining_annual_coverage' => $insurance->remaining_annual_coverage,
                ],
                'message' => 'Annual usage updated successfully',
            ]);
        } catch (Exception $e) {
            Log::error('Error updating annual usage', ['insurance_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update annual usage: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get insurance coverage calculation.
     */
    public function calculateCoverage(Request $request, string $id): JsonResponse
    {
        $this->authorize('view-patient-insurance');

        try {
            $request->validate([
                'amount' => 'required|numeric|min:0.01',
            ]);

            $insurance = PatientInsurance::with('insuranceProvider')->findOrFail($id);

            // Calculate coverage
            $totalAmount = $request->amount;
            $deductibleRemaining = max(0, $insurance->deductible_amount - $insurance->deductible_met);
            $deductibleApplied = min($deductibleRemaining, $totalAmount);
            $amountAfterDeductible = $totalAmount - $deductibleApplied;

            // Calculate co-pay
            $coPayAmount = 0;
            if ($insurance->co_pay_amount > 0) {
                $coPayAmount = $insurance->co_pay_amount;
            } elseif ($insurance->co_pay_percentage > 0) {
                $coPayAmount = $amountAfterDeductible * ($insurance->co_pay_percentage / 100);
            }

            // Calculate insurance coverage
            $insuranceCoverage = max(0, $amountAfterDeductible - $coPayAmount);

            // Check annual maximum
            $annualRemaining = $insurance->annual_max_coverage - $insurance->annual_used_amount;
            if ($insuranceCoverage > $annualRemaining) {
                $insuranceCoverage = $annualRemaining;
            }

            // Calculate patient responsibility
            $patientResponsibility = $totalAmount - $insuranceCoverage;

            return response()->json([
                'success' => true,
                'data' => [
                    'total_amount' => $totalAmount,
                    'deductible_applied' => $deductibleApplied,
                    'deductible_remaining' => $deductibleRemaining - $deductibleApplied,
                    'co_pay_amount' => $coPayAmount,
                    'insurance_coverage' => $insuranceCoverage,
                    'patient_responsibility' => $patientResponsibility,
                    'annual_remaining' => $annualRemaining - $insuranceCoverage,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error calculating coverage', ['insurance_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to calculate coverage: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Validate insurance for billing.
     */
    public function validateInsurance(Request $request, string $id): JsonResponse
    {
        $this->authorize('view-patient-insurance');

        try {
            $insurance = PatientInsurance::with('insuranceProvider')->findOrFail($id);

            $errors = [];
            $warnings = [];

            // Check if active
            if (!$insurance->is_active) {
                $errors[] = 'Insurance policy is not active';
            }

            // Check coverage dates
            if ($insurance->coverage_start_date && $insurance->coverage_start_date->isFuture()) {
                $errors[] = 'Insurance coverage has not started yet';
            }

            if ($insurance->coverage_end_date && $insurance->coverage_end_date->isPast()) {
                $errors[] = 'Insurance coverage has expired';
            }

            // Check provider
            if (!$insurance->insuranceProvider) {
                $errors[] = 'Insurance provider not found';
            } elseif (!$insurance->insuranceProvider->is_active) {
                $errors[] = 'Insurance provider is not active';
            }

            // Check deductible
            if ($insurance->deductible_amount > 0 && $insurance->deductible_met >= $insurance->deductible_amount) {
                $warnings[] = 'Deductible has been fully met';
            }

            // Check annual maximum
            if ($insurance->annual_max_coverage > 0) {
                $remainingCoverage = $insurance->annual_max_coverage - $insurance->annual_used_amount;
                if ($remainingCoverage <= 0) {
                    $errors[] = 'Annual maximum coverage has been reached';
                } elseif ($remainingCoverage < $insurance->annual_max_coverage * 0.1) {
                    $warnings[] = 'Annual coverage is nearly exhausted';
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'is_valid' => empty($errors),
                    'is_active' => $insurance->is_active,
                    'is_expired' => $insurance->is_expired,
                    'errors' => $errors,
                    'warnings' => $warnings,
                    'insurance' => new PatientInsuranceResource($insurance),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error validating insurance', ['insurance_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to validate insurance: ' . $e->getMessage(),
            ], 500);
        }
    }
}
