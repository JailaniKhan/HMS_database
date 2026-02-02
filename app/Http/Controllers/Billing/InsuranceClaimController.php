<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StoreInsuranceClaimRequest;
use App\Http\Requests\Billing\UpdateInsuranceClaimRequest;
use App\Http\Resources\Billing\InsuranceClaimResource;
use App\Models\Bill;
use App\Models\InsuranceClaim;
use App\Models\PatientInsurance;
use App\Services\Billing\InsuranceClaimService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\JsonResponse;
use Exception;

class InsuranceClaimController extends Controller
{
    /**
     * @var InsuranceClaimService
     */
    protected $claimService;

    /**
     * Constructor with dependency injection
     */
    public function __construct(InsuranceClaimService $claimService)
    {
        $this->claimService = $claimService;
    }

    /**
     * Display a listing of insurance claims.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('view-insurance-claims');

        try {
            $query = InsuranceClaim::with([
                'bill.patient',
                'patientInsurance.insuranceProvider',
                'submittedBy',
                'processedBy',
            ]);

            // Apply filters
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('bill_id') && $request->bill_id) {
                $query->where('bill_id', $request->bill_id);
            }

            if ($request->has('patient_insurance_id') && $request->patient_insurance_id) {
                $query->where('patient_insurance_id', $request->patient_insurance_id);
            }

            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('submission_date', '>=', $request->date_from);
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('submission_date', '<=', $request->date_to);
            }

            if ($request->has('pending') && $request->pending) {
                $query->pendingApproval();
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $claims = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => InsuranceClaimResource::collection($claims),
                'meta' => [
                    'current_page' => $claims->currentPage(),
                    'last_page' => $claims->lastPage(),
                    'per_page' => $claims->perPage(),
                    'total' => $claims->total(),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching insurance claims', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch insurance claims: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created insurance claim.
     */
    public function store(StoreInsuranceClaimRequest $request, string $billId): JsonResponse
    {
        $this->authorize('create-insurance-claims');

        try {
            DB::beginTransaction();

            $bill = Bill::findOrFail($billId);

            // Check if bill already has a pending claim
            $existingClaim = InsuranceClaim::where('bill_id', $billId)
                ->whereIn('status', ['draft', 'pending', 'submitted', 'under_review'])
                ->first();

            if ($existingClaim) {
                throw new Exception('Bill already has a pending insurance claim.');
            }

            // Get patient insurance
            $patientInsurance = PatientInsurance::findOrFail($request->patient_insurance_id);

            // Create claim
            $claim = InsuranceClaim::create([
                'bill_id' => $billId,
                'patient_insurance_id' => $request->patient_insurance_id,
                'claim_amount' => $request->claim_amount,
                'notes' => $request->notes,
                'status' => 'draft',
            ]);

            // Handle document uploads
            if ($request->hasFile('documents')) {
                $documents = [];
                foreach ($request->file('documents') as $document) {
                    $path = $document->store('insurance_claims/' . $claim->id, 'private');
                    $documents[] = [
                        'name' => $document->getClientOriginalName(),
                        'path' => $path,
                        'size' => $document->getSize(),
                        'mime_type' => $document->getMimeType(),
                    ];
                }
                $claim->update(['documents' => $documents]);
            }

            DB::commit();

            // Load relationships
            $claim->load(['bill.patient', 'patientInsurance.insuranceProvider', 'submittedBy']);

            return response()->json([
                'success' => true,
                'data' => new InsuranceClaimResource($claim),
                'message' => 'Insurance claim created successfully',
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error creating insurance claim', ['bill_id' => $billId, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create insurance claim: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified insurance claim.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $this->authorize('view-insurance-claims');

        try {
            $claim = InsuranceClaim::with([
                'bill.patient',
                'bill.items',
                'bill.payments',
                'patientInsurance.insuranceProvider',
                'submittedBy',
                'processedBy',
                'payments',
            ])->findOrFail($id);

            // Calculate coverage details
            $coverage = null;
            if ($claim->patientInsurance) {
                try {
                    $coverage = $this->claimService->calculateCoverage(
                        $claim->patientInsurance,
                        $claim->claim_amount
                    );
                } catch (Exception $e) {
                    Log::warning('Could not calculate coverage', ['claim_id' => $id, 'error' => $e->getMessage()]);
                }
            }

            return response()->json([
                'success' => true,
                'data' => new InsuranceClaimResource($claim),
                'coverage' => $coverage,
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching insurance claim', ['claim_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Insurance claim not found',
            ], 404);
        }
    }

    /**
     * Update the specified insurance claim.
     */
    public function update(UpdateInsuranceClaimRequest $request, string $id): JsonResponse
    {
        $this->authorize('edit-insurance-claims');

        try {
            DB::beginTransaction();

            $claim = InsuranceClaim::findOrFail($id);

            // Check if claim can be updated
            if (in_array($claim->status, ['approved', 'rejected', 'closed'])) {
                throw new Exception('Cannot update a finalized claim.');
            }

            $updateData = [
                'status' => $request->status,
            ];

            // Add approved amount if status is approved or partially approved
            if (in_array($request->status, ['approved', 'partial_approved'])) {
                $updateData['approved_amount'] = $request->approved_amount;
                $updateData['approval_date'] = now();
                $updateData['processed_by'] = auth()->id();
            }

            // Add rejection reason if status is rejected
            if ($request->status === 'rejected') {
                $updateData['rejection_reason'] = $request->rejection_reason;
                $updateData['processed_by'] = auth()->id();
            }

            if ($request->has('notes')) {
                $updateData['notes'] = $request->notes;
            }

            $claim->update($updateData);

            // Process the response if status changed to approved/rejected
            if (in_array($request->status, ['approved', 'partial_approved', 'rejected'])) {
                $responseData = [
                    'status' => $request->status === 'partial_approved' ? 'partially_approved' : $request->status,
                    'approved_amount' => $request->approved_amount ?? 0,
                    'rejection_reason' => $request->rejection_reason ?? null,
                    'notes' => $request->notes ?? null,
                ];

                $this->claimService->processResponse($claim, $responseData);
            }

            DB::commit();

            // Load relationships
            $claim->load(['bill.patient', 'patientInsurance.insuranceProvider', 'submittedBy', 'processedBy']);

            return response()->json([
                'success' => true,
                'data' => new InsuranceClaimResource($claim),
                'message' => 'Insurance claim updated successfully',
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error updating insurance claim', ['claim_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update insurance claim: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Submit claim to insurance provider.
     */
    public function submitToProvider(Request $request, string $id): JsonResponse
    {
        $this->authorize('submit-insurance-claims');

        try {
            $claim = InsuranceClaim::with(['bill', 'patientInsurance.insuranceProvider'])->findOrFail($id);

            // Check if claim can be submitted
            if (!in_array($claim->status, ['draft', 'pending'])) {
                throw new Exception('Claim cannot be submitted in current status: ' . $claim->status);
            }

            // Submit claim using service
            $result = $this->claimService->submitClaim($claim);

            return response()->json([
                'success' => true,
                'data' => new InsuranceClaimResource($claim->fresh()),
                'coverage' => $result['data']['coverage'] ?? null,
                'message' => 'Insurance claim submitted successfully',
            ]);
        } catch (Exception $e) {
            Log::error('Error submitting insurance claim', ['claim_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit insurance claim: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Check claim status with insurance provider.
     */
    public function getClaimStatus(Request $request, string $id): JsonResponse
    {
        $this->authorize('view-insurance-claims');

        try {
            $claim = InsuranceClaim::with(['bill', 'patientInsurance.insuranceProvider'])->findOrFail($id);

            // Validate claim
            $validation = $this->claimService->validateClaim($claim);

            // Get coverage calculation
            $coverage = null;
            try {
                $coverage = $this->claimService->calculateCoverage(
                    $claim->patientInsurance,
                    $claim->claim_amount
                );
            } catch (Exception $e) {
                Log::warning('Could not calculate coverage', ['claim_id' => $id, 'error' => $e->getMessage()]);
            }

            // Generate claim documents
            $documents = null;
            try {
                $documents = $this->claimService->generateClaimDocuments($claim);
            } catch (Exception $e) {
                Log::warning('Could not generate claim documents', ['claim_id' => $id, 'error' => $e->getMessage()]);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'claim' => new InsuranceClaimResource($claim),
                    'validation' => $validation,
                    'coverage' => $coverage,
                    'documents' => $documents,
                    'days_since_submission' => $claim->submission_date
                        ? $claim->submission_date->diffInDays(now())
                        : null,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error checking claim status', ['claim_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to check claim status: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Upload documents to an existing claim.
     */
    public function uploadDocuments(Request $request, string $id): JsonResponse
    {
        $this->authorize('edit-insurance-claims');

        try {
            $request->validate([
                'documents' => 'required|array',
                'documents.*' => 'file|mimes:pdf,jpg,jpeg,png|max:10240',
            ]);

            $claim = InsuranceClaim::findOrFail($id);

            // Check if claim can be updated
            if (in_array($claim->status, ['approved', 'rejected', 'closed'])) {
                throw new Exception('Cannot upload documents to a finalized claim.');
            }

            $existingDocuments = $claim->documents ?? [];

            foreach ($request->file('documents') as $document) {
                $path = $document->store('insurance_claims/' . $claim->id, 'private');
                $existingDocuments[] = [
                    'name' => $document->getClientOriginalName(),
                    'path' => $path,
                    'size' => $document->getSize(),
                    'mime_type' => $document->getMimeType(),
                    'uploaded_at' => now()->toISOString(),
                ];
            }

            $claim->update(['documents' => $existingDocuments]);

            return response()->json([
                'success' => true,
                'data' => new InsuranceClaimResource($claim->fresh()),
                'message' => 'Documents uploaded successfully',
            ]);
        } catch (Exception $e) {
            Log::error('Error uploading documents', ['claim_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to upload documents: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download claim document.
     */
    public function downloadDocument(Request $request, string $id, string $documentIndex): JsonResponse
    {
        $this->authorize('view-insurance-claims');

        try {
            $claim = InsuranceClaim::findOrFail($id);
            $documents = $claim->documents ?? [];

            if (!isset($documents[$documentIndex])) {
                throw new Exception('Document not found.');
            }

            $document = $documents[$documentIndex];

            if (!Storage::disk('private')->exists($document['path'])) {
                throw new Exception('Document file not found.');
            }

            $content = Storage::disk('private')->get($document['path']);

            return response()->json([
                'success' => true,
                'data' => [
                    'content' => base64_encode($content),
                    'filename' => $document['name'],
                    'mime_type' => $document['mime_type'],
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error downloading document', ['claim_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to download document: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete an insurance claim.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->authorize('delete-insurance-claims');

        try {
            $claim = InsuranceClaim::findOrFail($id);

            // Check if claim can be deleted
            if (in_array($claim->status, ['approved', 'partial_approved'])) {
                throw new Exception('Cannot delete an approved claim.');
            }

            // Delete associated documents
            if (!empty($claim->documents)) {
                foreach ($claim->documents as $document) {
                    if (isset($document['path']) && Storage::disk('private')->exists($document['path'])) {
                        Storage::disk('private')->delete($document['path']);
                    }
                }
            }

            $claim->delete();

            return response()->json([
                'success' => true,
                'message' => 'Insurance claim deleted successfully',
            ]);
        } catch (Exception $e) {
            Log::error('Error deleting insurance claim', ['claim_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete insurance claim: ' . $e->getMessage(),
            ], 500);
        }
    }
}
