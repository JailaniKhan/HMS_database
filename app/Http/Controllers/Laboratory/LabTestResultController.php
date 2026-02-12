<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\LabTestResult;
use App\Models\LabTest;
use App\Models\LabTestRequest;
use App\Models\Patient;
use App\Models\Bill;
use App\Services\Billing\BillItemService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LabTestResultController extends Controller
{
    protected BillItemService $billItemService;
    protected AuditLogService $auditLogService;

    public function __construct(
        BillItemService $billItemService,
        AuditLogService $auditLogService
    ) {
        $this->billItemService = $billItemService;
        $this->auditLogService = $auditLogService;
    }

    /**
     * Display a listing of the lab test results.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->isSuperAdmin() && !$user->hasPermission('view-laboratory')) {
            abort(403, 'Unauthorized access');
        }
        
        $labTestResults = LabTestResult::with('test', 'patient')
            ->latest()
            ->paginate(10)
            ->through(function ($result) {
                // Map 'test' relationship to 'labTest' for frontend compatibility
                $data = $result->toArray();
                $data['labTest'] = $data['test'] ?? null;
                unset($data['test']);
                return $data;
            });
        
        // Get filter options
        $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name')->get();
        $labTests = LabTest::select('id', 'test_code', 'name')->get();
        
        // Calculate stats
        $stats = [
            'total' => LabTestResult::count(),
            'pending' => LabTestResult::where('status', 'pending')->count(),
            'completed' => LabTestResult::where('status', 'completed')->count(),
            'verified' => LabTestResult::where('status', 'verified')->count(),
            'abnormal' => LabTestResult::where('status', 'abnormal')->count(),
            'critical' => LabTestResult::where('status', 'critical')->count(),
        ];
        
        return Inertia::render('Laboratory/LabTestResults/Index', [
            'labTestResults' => $labTestResults,
            'filters' => (object)[],
            'patients' => $patients,
            'labTests' => $labTests,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new lab test result.
     */
    public function create(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        $labTests = LabTest::all();
        $patients = Patient::all();
        
        // Get pending lab test requests for the dropdown
        $requests = \App\Models\LabTestRequest::whereIn('status', ['pending', 'in_progress'])
            ->with('patient')
            ->get()
            ->map(function ($request) {
                return [
                    'id' => $request->id,
                    'request_id' => $request->request_id,
                    'test_name' => $request->test_name,
                    'patient_id' => $request->patient_id,
                ];
            });
        
        return Inertia::render('Laboratory/LabTestResults/Create', [
            'labTests' => $labTests,
            'patients' => $patients,
            'requests' => $requests,
        ]);
    }

    /**
     * Store a newly created lab test result in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        Log::debug('LabTestResultController store - incoming request', [
            'all_data' => $request->all(),
        ]);
        
        $validator = Validator::make($request->all(), [
            'lab_test_id' => 'required|exists:lab_tests,id',
            'patient_id' => 'required|exists:patients,id',
            'performed_at' => 'required|date',
            'results' => 'required|array',
            'results.*.value' => 'required|string',
            'status' => 'required|in:pending,completed,verified',
            'notes' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            Log::warning('LabTestResultController store - validation failed', [
                'errors' => $validator->errors()->toArray(),
            ]);
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        try {
            DB::beginTransaction();

            $resultId = 'RES-' . strtoupper(uniqid());
            
            $labTestResult = LabTestResult::create([
                'result_id' => $resultId,
                'test_id' => $request->lab_test_id,
                'patient_id' => $request->patient_id,
                'performed_at' => $request->performed_at,
                'results' => json_encode($request->results),
                'status' => $request->status,
                'notes' => $request->notes,
                'performed_by' => $user->id,
            ]);

            // If test is completed or verified, add lab test fee to patient's bill
            if (in_array($request->status, ['completed', 'verified'])) {
                $this->createBillItemForLabTest($labTestResult);
            }
            
            Log::info('LabTestResultController store - created successfully', [
                'result_id' => $labTestResult->id,
                'result_id_string' => $resultId,
            ]);

            DB::commit();
            
            return redirect()->route('laboratory.lab-test-results.index')
                ->with('success', 'Lab test result created successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('LabTestResultController store - error creating result', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->back()->with('error', 'Failed to create lab test result: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified lab test result.
     */
    public function show(LabTestResult $labTestResult): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-laboratory')) {
            abort(403, 'Unauthorized access');
        }
        
        // Load relationships
        $labTestResult->load(['patient', 'test', 'performedBy']);
        
        return Inertia::render('Laboratory/LabTestResults/Show', [
            'labTestResult' => $labTestResult
        ]);
    }

    /**
     * Show the form for editing the specified lab test result.
     */
    public function edit(LabTestResult $labTestResult): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('edit-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        // Load relationships
        $labTestResult->load(['patient', 'test', 'performedBy']);
        
        $labTests = LabTest::all();
        $patients = Patient::all();
        
        return Inertia::render('Laboratory/LabTestResults/Edit', [
            'labTestResult' => $labTestResult,
            'labTests' => $labTests,
            'patients' => $patients
        ]);
    }

    /**
     * Update the specified lab test result in storage.
     */
    public function update(Request $request, LabTestResult $labTestResult): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('edit-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'lab_test_id' => 'required|exists:lab_tests,id',
            'patient_id' => 'required|exists:patients,id',
            'performed_at' => 'required|date',
            'results' => 'required|string',
            'status' => 'required|in:pending,completed,verified',
            'notes' => 'nullable|string',
            'abnormal_flags' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        try {
            DB::beginTransaction();

            $oldStatus = $labTestResult->status;
        
            $labTestResult->update([
                'lab_test_id' => $request->lab_test_id,
                'patient_id' => $request->patient_id,
                'performed_at' => $request->performed_at,
                'results' => $request->results,
                'status' => $request->status,
                'notes' => $request->notes,
                'abnormal_flags' => $request->abnormal_flags,
            ]);

            // If status changed to completed or verified, add lab test fee to patient's bill
            if (!in_array($oldStatus, ['completed', 'verified']) && in_array($request->status, ['completed', 'verified'])) {
                $this->createBillItemForLabTest($labTestResult);
            }

            DB::commit();
        
            return redirect()->route('laboratory.lab-test-results.index')->with('success', 'Lab test result updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error updating lab test result', [
                'result_id' => $labTestResult->id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->with('error', 'Failed to update lab test result: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Show the verify form for the specified lab test result.
     */
    public function verify(LabTestResult $labTestResult): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('verify-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        // Load relationships
        $labTestResult->load(['patient', 'test', 'performedBy']);
        
        return Inertia::render('Laboratory/LabTestResults/Verify', [
            'labTestResult' => $labTestResult
        ]);
    }

    /**
     * Verify the specified lab test result.
     */
    public function verifyPost(Request $request, LabTestResult $labTestResult): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('verify-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        // Check if already verified
        if ($labTestResult->status === 'verified') {
            return redirect()->back()->with('error', 'This result has already been verified.');
        }
        
        try {
            DB::beginTransaction();
            
            $labTestResult->update([
                'status' => 'verified',
                'verified_at' => now(),
                'verified_by' => $user->id,
            ]);
            
            // Log the verification
            Log::info('Lab test result verified', [
                'result_id' => $labTestResult->id,
                'verified_by' => $user->id,
            ]);

            DB::commit();
            
            return redirect()->route('laboratory.lab-test-results.index')
                ->with('success', 'Lab test result verified successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error verifying lab test result', [
                'result_id' => $labTestResult->id,
                'error' => $e->getMessage(),
            ]);
            return redirect()->back()->with('error', 'Failed to verify lab test result: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified lab test result from storage.
     */
    public function destroy(LabTestResult $labTestResult): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('delete-lab-test-results')) {
            abort(403, 'Unauthorized access');
        }
        
        $labTestResult->delete();
        
        return redirect()->route('laboratory.lab-test-results.index')
            ->with('success', 'Lab test result deleted successfully.');
    }

    /**
     * Create a bill item for the lab test fee.
     *
     * @param LabTestResult $labTestResult
     * @return void
     */
    private function createBillItemForLabTest(LabTestResult $labTestResult): void
    {
        try {
            // Load the lab test result with test and patient relationships
            $labTestResult->load('test');

            // Get the lab test cost
            $labTest = $labTestResult->test;
            if (!$labTest || $labTest->cost <= 0) {
                Log::warning('Lab test has no cost defined', [
                    'result_id' => $labTestResult->id,
                    'test_id' => $labTestResult->test_id,
                ]);
                return;
            }

            // Find or create an open bill for the patient
            $bill = Bill::where('patient_id', $labTestResult->patient_id)
                ->whereNull('voided_at')
                ->whereIn('payment_status', ['pending', 'partial'])
                ->latest()
                ->first();

            // If no open bill exists, create a new one
            if (!$bill) {
                $bill = Bill::create([
                    'patient_id' => $labTestResult->patient_id,
                    'created_by' => auth()->id(),
                    'bill_date' => now(),
                    'due_date' => now()->addDays(30),
                    'payment_status' => 'pending',
                    'status' => 'active',
                ]);

                $this->auditLogService->logActivity(
                    'Bill Created',
                    'Billing',
                    "Created new bill #{$bill->bill_number} for patient from lab test completion",
                    'info'
                );
            }

            // Check if this lab test is already billed
            $existingItem = \App\Models\BillItem::where('bill_id', $bill->id)
                ->where('source_type', LabTestResult::class)
                ->where('source_id', $labTestResult->id)
                ->first();

            if ($existingItem) {
                Log::info('Lab test fee already added to bill', [
                    'result_id' => $labTestResult->id,
                    'bill_id' => $bill->id,
                ]);
                return;
            }

            // Create bill item for lab test
            \App\Models\BillItem::create([
                'bill_id' => $bill->id,
                'item_type' => 'lab_test',
                'source_type' => LabTestResult::class,
                'source_id' => $labTestResult->id,
                'category' => 'laboratory',
                'item_description' => "Lab Test: {$labTest->name} ({$labTest->test_code})",
                'quantity' => 1,
                'unit_price' => $labTest->cost,
                'discount_amount' => 0,
                'discount_percentage' => 0,
                'total_price' => $labTest->cost,
            ]);

            // Recalculate bill totals
            $bill->recalculateTotals();

            $this->auditLogService->logActivity(
                'Lab Test Billed',
                'Laboratory',
                "Lab test result #{$labTestResult->result_id} marked as completed. Fee added to bill #{$bill->bill_number}",
                'info'
            );
        } catch (\Exception $e) {
            // Log the error but don't fail the lab test result creation/update
            Log::error('Failed to create bill item for lab test', [
                'result_id' => $labTestResult->id,
                'error' => $e->getMessage(),
            ]);

            $this->auditLogService->logActivity(
                'Lab Test Billing Failed',
                'Billing',
                "Failed to add lab test fee for result #{$labTestResult->result_id}: {$e->getMessage()}",
                'error'
            );
        }
    }
}
