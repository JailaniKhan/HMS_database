<?php

namespace App\Services\Billing;

use App\Models\InsuranceClaim;
use App\Models\PatientInsurance;
use App\Models\Bill;
use App\Models\Payment;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Exception;
use Illuminate\Validation\ValidationException;

class InsuranceClaimService
{
    /**
     * @var AuditLogService
     */
    protected $auditLogService;

    /**
     * @var BillCalculationService
     */
    protected $calculationService;

    /**
     * Valid claim statuses
     */
    protected const VALID_CLAIM_STATUSES = [
        'draft',
        'submitted',
        'pending',
        'approved',
        'partially_approved',
        'rejected',
        'appealed',
        'closed',
    ];

    /**
     * Constructor with dependency injection
     */
    public function __construct(
        AuditLogService $auditLogService,
        BillCalculationService $calculationService
    ) {
        $this->auditLogService = $auditLogService;
        $this->calculationService = $calculationService;
    }

    /**
     * Submit a claim to insurance
     *
     * @param InsuranceClaim $claim
     * @return array
     * @throws Exception
     */
    public function submitClaim(InsuranceClaim $claim): array
    {
        try {
            DB::beginTransaction();

            // Validate claim before submission
            $validation = $this->validateClaim($claim);
            if (!$validation['valid']) {
                throw new Exception('Claim validation failed: ' . implode(', ', $validation['errors']));
            }

            // Check if claim is already submitted
            if (in_array($claim->status, ['submitted', 'pending', 'approved', 'partially_approved'])) {
                throw new Exception('Claim has already been submitted.');
            }

            $bill = $claim->bill;
            $patientInsurance = $claim->patientInsurance;

            // Calculate coverage
            $coverage = $this->calculateCoverage($patientInsurance, $claim->claim_amount);

            // Update claim with submission details
            $claim->update([
                'status' => 'submitted',
                'submission_date' => now(),
                'submitted_by' => auth()->id(),
            ]);

            // Update bill with insurance information
            $bill->update([
                'primary_insurance_id' => $patientInsurance->id,
                'insurance_claim_amount' => $claim->claim_amount,
                'patient_responsibility' => $coverage['patient_responsibility'],
            ]);

            DB::commit();

            // Log the submission
            $this->auditLogService->logActivity(
                'Insurance Claim Submitted',
                'Insurance',
                "Submitted claim #{$claim->claim_number} for bill #{$bill->bill_number}. Amount: {$claim->claim_amount}",
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'claim' => $claim,
                    'coverage' => $coverage,
                ],
                'message' => 'Insurance claim submitted successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error submitting insurance claim', [
                'claim_id' => $claim->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to submit insurance claim: ' . $e->getMessage());
        }
    }

    /**
     * Process insurance response
     *
     * @param InsuranceClaim $claim
     * @param array $response
     * @return array
     * @throws Exception
     */
    public function processResponse(InsuranceClaim $claim, array $response): array
    {
        try {
            DB::beginTransaction();

            // Validate response data
            $validator = Validator::make($response, [
                'status' => 'required|string|in:approved,partially_approved,rejected',
                'approved_amount' => 'required_if:status,approved,partially_approved|numeric|min:0',
                'deductible_amount' => 'nullable|numeric|min:0',
                'co_pay_amount' => 'nullable|numeric|min:0',
                'rejection_reason' => 'required_if:status,rejected|nullable|string',
                'rejection_codes' => 'nullable|array',
                'response_date' => 'nullable|date',
                'notes' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                throw new ValidationException($validator);
            }

            $status = $response['status'];
            $bill = $claim->bill;

            // Update claim based on response
            $updateData = [
                'status' => $status,
                'response_date' => $response['response_date'] ?? now(),
                'processed_by' => auth()->id(),
                'notes' => $response['notes'] ?? $claim->notes,
            ];

            if ($status === 'approved' || $status === 'partially_approved') {
                $updateData['approved_amount'] = $response['approved_amount'];
                $updateData['deductible_amount'] = $response['deductible_amount'] ?? 0;
                $updateData['co_pay_amount'] = $response['co_pay_amount'] ?? 0;
                $updateData['approval_date'] = now();

                // Update bill with approved amount
                $bill->update([
                    'insurance_approved_amount' => $response['approved_amount'],
                ]);

                // Create payment record for approved amount
                if ($response['approved_amount'] > 0) {
                    Payment::create([
                        'bill_id' => $bill->id,
                        'payment_method' => 'insurance',
                        'amount' => $response['approved_amount'],
                        'payment_date' => now(),
                        'insurance_claim_id' => $claim->id,
                        'received_by' => auth()->id(),
                        'notes' => "Insurance payment for claim #{$claim->claim_number}",
                        'status' => 'completed',
                    ]);

                    // Update bill balance
                    $this->calculationService->updateBalanceDue($bill);
                }
            } elseif ($status === 'rejected') {
                $updateData['rejection_reason'] = $response['rejection_reason'];
                $updateData['rejection_codes'] = $response['rejection_codes'] ?? [];
            }

            $claim->update($updateData);

            DB::commit();

            // Log the response processing
            $this->auditLogService->logActivity(
                'Insurance Response Processed',
                'Insurance',
                "Processed {$status} response for claim #{$claim->claim_number}. Approved amount: " . ($response['approved_amount'] ?? 0),
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'claim' => $claim,
                    'bill_status' => $bill->payment_status,
                    'balance_due' => $bill->balance_due,
                ],
                'message' => 'Insurance response processed successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error processing insurance response', [
                'claim_id' => $claim->id,
                'response' => $response,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to process insurance response: ' . $e->getMessage());
        }
    }

    /**
     * Calculate patient/insurance split for a given amount
     *
     * @param PatientInsurance $insurance
     * @param float $amount
     * @return array
     * @throws Exception
     */
    public function calculateCoverage(PatientInsurance $insurance, float $amount): array
    {
        try {
            // Check if insurance is active
            if (!$insurance->is_active) {
                throw new Exception('Insurance policy is not active.');
            }

            // Check coverage dates
            if ($insurance->coverage_end_date && $insurance->coverage_end_date->isPast()) {
                throw new Exception('Insurance coverage has expired.');
            }

            if ($insurance->coverage_start_date && $insurance->coverage_start_date->isFuture()) {
                throw new Exception('Insurance coverage has not started yet.');
            }

            $provider = $insurance->insuranceProvider;
            if (!$provider || !$provider->is_active) {
                throw new Exception('Insurance provider is not active.');
            }

            // Calculate deductible
            $deductibleRemaining = max(0, $insurance->deductible_amount - $insurance->deductible_met);
            $deductibleApplied = min($deductibleRemaining, $amount);
            $amountAfterDeductible = $amount - $deductibleApplied;

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
            $patientResponsibility = $amount - $insuranceCoverage;

            return [
                'total_amount' => $amount,
                'deductible_applied' => $deductibleApplied,
                'deductible_remaining' => $deductibleRemaining - $deductibleApplied,
                'co_pay_amount' => $coPayAmount,
                'insurance_coverage' => $insuranceCoverage,
                'patient_responsibility' => $patientResponsibility,
                'annual_remaining' => $annualRemaining - $insuranceCoverage,
            ];
        } catch (Exception $e) {
            Log::error('Error calculating coverage', [
                'insurance_id' => $insurance->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to calculate coverage: ' . $e->getMessage());
        }
    }

    /**
     * Validate claim data
     *
     * @param InsuranceClaim $claim
     * @return array
     */
    public function validateClaim(InsuranceClaim $claim): array
    {
        $errors = [];

        // Check if bill exists
        if (!$claim->bill) {
            $errors[] = 'Bill not found';
        }

        // Check if patient insurance exists
        if (!$claim->patientInsurance) {
            $errors[] = 'Patient insurance not found';
        } else {
            $insurance = $claim->patientInsurance;

            // Check if insurance is active
            if (!$insurance->is_active) {
                $errors[] = 'Insurance policy is not active';
            }

            // Check coverage dates
            if ($insurance->coverage_end_date && $insurance->coverage_end_date->isPast()) {
                $errors[] = 'Insurance coverage has expired';
            }

            // Check provider
            $provider = $insurance->insuranceProvider;
            if (!$provider || !$provider->is_active) {
                $errors[] = 'Insurance provider is not active';
            }
        }

        // Check claim amount
        if ($claim->claim_amount <= 0) {
            $errors[] = 'Claim amount must be greater than zero';
        }

        // Check if claim amount exceeds bill total
        if ($claim->bill && $claim->claim_amount > $claim->bill->total_amount) {
            $errors[] = 'Claim amount cannot exceed bill total';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * Generate claim documents
     *
     * @param InsuranceClaim $claim
     * @return array
     * @throws Exception
     */
    public function generateClaimDocuments(InsuranceClaim $claim): array
    {
        try {
            $bill = $claim->bill;
            $patient = $bill->patient;
            $insurance = $claim->patientInsurance;
            $provider = $insurance->insuranceProvider;

            // Generate document data
            $documents = [
                'claim_form' => [
                    'title' => 'Insurance Claim Form',
                    'claim_number' => $claim->claim_number,
                    'submission_date' => $claim->submission_date?->format('Y-m-d'),
                    'provider_name' => $provider->name,
                    'provider_code' => $provider->code,
                ],
                'patient_info' => [
                    'patient_name' => $patient->full_name,
                    'patient_id' => $patient->patient_id,
                    'policy_number' => $insurance->policy_number,
                    'policy_holder_name' => $insurance->policy_holder_name,
                    'relationship' => $insurance->relationship_to_patient,
                ],
                'bill_info' => [
                    'bill_number' => $bill->bill_number,
                    'bill_date' => $bill->bill_date->format('Y-m-d'),
                    'sub_total' => $bill->sub_total,
                    'discount' => $bill->total_discount,
                    'tax' => $bill->total_tax,
                    'total_amount' => $bill->total_amount,
                ],
                'items' => $bill->items->map(function ($item) {
                    return [
                        'description' => $item->item_description,
                        'category' => $item->category,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'total' => $item->total_price,
                    ];
                })->toArray(),
                'claim_summary' => [
                    'claim_amount' => $claim->claim_amount,
                    'deductible_amount' => $insurance->deductible_amount,
                    'deductible_met' => $insurance->deductible_met,
                    'co_pay_amount' => $insurance->co_pay_amount,
                    'co_pay_percentage' => $insurance->co_pay_percentage,
                ],
            ];

            // Update claim with documents
            $claim->update([
                'documents' => $documents,
            ]);

            // Log document generation
            $this->auditLogService->logActivity(
                'Claim Documents Generated',
                'Insurance',
                "Generated documents for claim #{$claim->claim_number}",
                'info'
            );

            return [
                'success' => true,
                'data' => $documents,
                'message' => 'Claim documents generated successfully',
            ];
        } catch (Exception $e) {
            Log::error('Error generating claim documents', [
                'claim_id' => $claim->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to generate claim documents: ' . $e->getMessage());
        }
    }

    /**
     * Appeal a rejected claim
     *
     * @param InsuranceClaim $claim
     * @param string $reason
     * @param array $supportingDocuments
     * @return array
     * @throws Exception
     */
    public function appealClaim(InsuranceClaim $claim, string $reason, array $supportingDocuments = []): array
    {
        try {
            DB::beginTransaction();

            if ($claim->status !== 'rejected') {
                throw new Exception('Only rejected claims can be appealed.');
            }

            $claim->update([
                'status' => 'appealed',
                'internal_notes' => $claim->internal_notes . "\nAppeal submitted: {$reason}",
            ]);

            // Add supporting documents if provided
            if (!empty($supportingDocuments)) {
                $documents = $claim->documents ?? [];
                $documents['appeal_documents'] = $supportingDocuments;
                $claim->update(['documents' => $documents]);
            }

            DB::commit();

            // Log the appeal
            $this->auditLogService->logActivity(
                'Claim Appealed',
                'Insurance',
                "Submitted appeal for claim #{$claim->claim_number}. Reason: {$reason}",
                'info'
            );

            return [
                'success' => true,
                'data' => $claim,
                'message' => 'Claim appeal submitted successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error appealing claim', [
                'claim_id' => $claim->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to appeal claim: ' . $e->getMessage());
        }
    }

    /**
     * Get claim statistics
     *
     * @param int $patientInsuranceId
     * @return array
     */
    public function getClaimStatistics(int $patientInsuranceId): array
    {
        $claims = InsuranceClaim::where('patient_insurance_id', $patientInsuranceId)->get();

        return [
            'total_claims' => $claims->count(),
            'total_claimed' => $claims->sum('claim_amount'),
            'total_approved' => $claims->whereIn('status', ['approved', 'partially_approved'])->sum('approved_amount'),
            'by_status' => [
                'draft' => $claims->where('status', 'draft')->count(),
                'submitted' => $claims->where('status', 'submitted')->count(),
                'pending' => $claims->where('status', 'pending')->count(),
                'approved' => $claims->where('status', 'approved')->count(),
                'partially_approved' => $claims->where('status', 'partially_approved')->count(),
                'rejected' => $claims->where('status', 'rejected')->count(),
                'appealed' => $claims->where('status', 'appealed')->count(),
            ],
        ];
    }
}
