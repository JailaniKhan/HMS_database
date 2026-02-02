<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StoreBillRequest;
use App\Http\Requests\Billing\UpdateBillRequest;
use App\Http\Requests\Billing\VoidBillRequest;
use App\Http\Resources\Billing\BillResource;
use App\Http\Resources\Billing\BillItemResource;
use App\Http\Resources\Billing\PaymentResource;
use App\Http\Resources\Billing\InsuranceClaimResource;
use App\Http\Resources\Billing\BillRefundResource;
use App\Http\Resources\Billing\BillStatusHistoryResource;
use App\Http\Resources\PatientResource;
use App\Models\Bill;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\DepartmentService;
use App\Models\PatientInsurance;
use App\Services\Billing\BillItemService;
use App\Services\Billing\BillCalculationService;
use App\Services\Billing\InvoiceGenerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Exception;

class BillController extends Controller
{
    /**
     * @var BillItemService
     */
    protected $billItemService;

    /**
     * @var BillCalculationService
     */
    protected $calculationService;

    /**
     * @var InvoiceGenerationService
     */
    protected $invoiceService;

    /**
     * Constructor with dependency injection
     */
    public function __construct(
        BillItemService $billItemService,
        BillCalculationService $calculationService,
        InvoiceGenerationService $invoiceService
    ) {
        $this->billItemService = $billItemService;
        $this->calculationService = $calculationService;
        $this->invoiceService = $invoiceService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response|JsonResponse
    {
        // Permission check is handled by the check.permission middleware on the route
        // No additional authorization needed here

        try {
            $query = Bill::with(['patient', 'doctor', 'createdBy']);

            // Apply filters
            if ($request->has('status') && $request->status) {
                $query->where('payment_status', $request->status);
            }

            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('bill_date', '>=', $request->date_from);
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('bill_date', '<=', $request->date_to);
            }

            if ($request->has('patient_id') && $request->patient_id) {
                $query->where('patient_id', $request->patient_id);
            }

            if ($request->has('min_amount') && $request->min_amount) {
                $query->where('total_amount', '>=', $request->min_amount);
            }

            if ($request->has('max_amount') && $request->max_amount) {
                $query->where('total_amount', '<=', $request->max_amount);
            }

            if ($request->has('overdue') && $request->overdue) {
                $query->overdue();
            }

            if ($request->has('voided') && $request->voided) {
                $query->voided();
            } else {
                $query->active();
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $bills = $query->paginate($request->get('per_page', 15));

            // Check if API request
            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'data' => BillResource::collection($bills),
                    'meta' => [
                        'current_page' => $bills->currentPage(),
                        'last_page' => $bills->lastPage(),
                        'per_page' => $bills->perPage(),
                        'total' => $bills->total(),
                    ],
                ]);
            }

            return Inertia::render('Billing/Index', [
                'bills' => BillResource::collection($bills),
                'filters' => $request->only(['status', 'date_from', 'date_to', 'patient_id', 'min_amount', 'max_amount']),
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching bills', ['error' => $e->getMessage()]);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch bills: ' . $e->getMessage(),
                ], 500);
            }

            return Inertia::render('Billing/Index', [
                'bills' => [],
                'error' => 'Failed to fetch bills: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request): Response|JsonResponse
    {
        // Permission check is handled by the check.permission middleware on the route

        try {
            $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name', 'phone')->get();
            $doctors = Doctor::select('id', 'doctor_id', 'full_name', 'specialization')->get();
            $services = DepartmentService::active()->with('department')->get();

            // Load patient insurances if patient_id is provided
            $patientInsurances = [];
            if ($request->has('patient_id')) {
                $patientInsurances = PatientInsurance::byPatient($request->patient_id)
                    ->valid()
                    ->with('insuranceProvider')
                    ->get();
            }

            $data = [
                'patients' => $patients,
                'doctors' => $doctors,
                'services' => $services,
                'patient_insurances' => $patientInsurances,
            ];

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'data' => $data,
                ]);
            }

            return Inertia::render('Billing/Create', $data);
        } catch (Exception $e) {
            Log::error('Error loading bill creation data', ['error' => $e->getMessage()]);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to load creation data: ' . $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->with('error', 'Failed to load creation data: ' . $e->getMessage());
        }
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreBillRequest $request): RedirectResponse|JsonResponse
    {
        // Permission check is handled by the check.permission middleware on the route

        try {
            DB::beginTransaction();

            // Create bill
            $bill = Bill::create([
                'patient_id' => $request->patient_id,
                'doctor_id' => $request->doctor_id,
                'created_by' => auth()->id(),
                'bill_date' => $request->bill_date,
                'due_date' => $request->due_date,
                'notes' => $request->notes,
                'billing_address' => $request->billing_address,
                'primary_insurance_id' => $request->primary_insurance_id,
            ]);

            // Add bill items
            if ($request->has('items') && is_array($request->items)) {
                foreach ($request->items as $itemData) {
                    $this->billItemService->addManualItem($bill, $itemData);
                }
            }

            // Calculate totals
            $this->calculationService->calculateTotals($bill);

            // Handle insurance if provided
            if ($request->primary_insurance_id) {
                $insurance = PatientInsurance::find($request->primary_insurance_id);
                if ($insurance) {
                    $this->calculationService->calculateInsuranceCoverage($bill, $insurance);
                }
            }

            DB::commit();

            // Load relationships for response
            $bill->load(['patient', 'doctor', 'items', 'primaryInsurance']);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'data' => new BillResource($bill),
                    'message' => 'Bill created successfully',
                ], 201);
            }

            return redirect()->route('billing.index')->with('success', 'Bill created successfully.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error creating bill', ['error' => $e->getMessage()]);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to create bill: ' . $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to create bill: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, string $id): Response|JsonResponse
    {
        // Permission check is handled by the check.permission middleware on the route

        try {
            $bill = Bill::with([
                'patient',
                'doctor',
                'createdBy',
                'items',
                'payments.receivedBy',
                'insuranceClaims.patientInsurance.insuranceProvider',
                'refunds',
                'statusHistory.changedBy',
                'primaryInsurance.insuranceProvider',
            ])->findOrFail($id);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'data' => new BillResource($bill),
                ]);
            }

            return Inertia::render('Billing/Show', [
                'bill' => new BillResource($bill),
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching bill', ['bill_id' => $id, 'error' => $e->getMessage()]);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Bill not found',
                ], 404);
            }

            return redirect()->route('billing.index')->with('error', 'Bill not found');
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, string $id): Response|JsonResponse
    {
        // Permission check is handled by the check.permission middleware on the route

        try {
            $bill = Bill::with(['patient', 'doctor', 'items', 'primaryInsurance'])->findOrFail($id);

            // Check if bill can be edited
            if ($bill->payment_status === 'paid') {
                throw new Exception('Cannot edit a fully paid bill.');
            }

            if ($bill->voided_at) {
                throw new Exception('Cannot edit a voided bill.');
            }

            $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name', 'phone')->get();
            $doctors = Doctor::select('id', 'doctor_id', 'full_name', 'specialization')->get();
            $services = DepartmentService::active()->with('department')->get();
            $patientInsurances = PatientInsurance::byPatient($bill->patient_id)
                ->valid()
                ->with('insuranceProvider')
                ->get();

            $data = [
                'bill' => new BillResource($bill),
                'patients' => $patients,
                'doctors' => $doctors,
                'services' => $services,
                'patient_insurances' => $patientInsurances,
            ];

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'data' => $data,
                ]);
            }

            return Inertia::render('Billing/Edit', $data);
        } catch (Exception $e) {
            Log::error('Error loading bill edit data', ['bill_id' => $id, 'error' => $e->getMessage()]);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->with('error', $e->getMessage());
        }
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateBillRequest $request, string $id): RedirectResponse|JsonResponse
    {
        // Permission check is handled by the check.permission middleware on the route

        try {
            DB::beginTransaction();

            $bill = Bill::findOrFail($id);

            // Update bill details
            $updateData = [];
            if ($request->has('patient_id')) {
                $updateData['patient_id'] = $request->patient_id;
            }
            if ($request->has('doctor_id')) {
                $updateData['doctor_id'] = $request->doctor_id;
            }
            if ($request->has('bill_date')) {
                $updateData['bill_date'] = $request->bill_date;
            }
            if ($request->has('due_date')) {
                $updateData['due_date'] = $request->due_date;
            }
            if ($request->has('notes')) {
                $updateData['notes'] = $request->notes;
            }
            if ($request->has('billing_address')) {
                $updateData['billing_address'] = $request->billing_address;
            }
            if ($request->has('primary_insurance_id')) {
                $updateData['primary_insurance_id'] = $request->primary_insurance_id;
            }

            $bill->update($updateData);

            // Update items if provided
            if ($request->has('items') && is_array($request->items)) {
                // Remove existing items
                $bill->items()->delete();

                // Add new items
                foreach ($request->items as $itemData) {
                    $this->billItemService->addManualItem($bill, $itemData);
                }

                // Recalculate totals
                $this->calculationService->calculateTotals($bill);
            }

            // Recalculate insurance if insurance changed
            if ($request->has('primary_insurance_id') && $request->primary_insurance_id) {
                $insurance = PatientInsurance::find($request->primary_insurance_id);
                if ($insurance) {
                    $this->calculationService->calculateInsuranceCoverage($bill, $insurance);
                }
            }

            DB::commit();

            // Load relationships for response
            $bill->load(['patient', 'doctor', 'items', 'primaryInsurance']);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'data' => new BillResource($bill),
                    'message' => 'Bill updated successfully',
                ]);
            }

            return redirect()->route('billing.index')->with('success', 'Bill updated successfully.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error updating bill', ['bill_id' => $id, 'error' => $e->getMessage()]);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update bill: ' . $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to update bill: ' . $e->getMessage()]);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, string $id): RedirectResponse|JsonResponse
    {
        // Permission check is handled by the check.permission middleware on the route

        try {
            DB::beginTransaction();

            $bill = Bill::findOrFail($id);

            // Check if bill has payments
            if ($bill->payments()->where('status', 'completed')->count() > 0) {
                throw new Exception('Cannot delete a bill with completed payments.');
            }

            // Soft delete the bill
            $bill->delete();

            DB::commit();

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'message' => 'Bill deleted successfully',
                ]);
            }

            return redirect()->route('billing.index')->with('success', 'Bill deleted successfully.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error deleting bill', ['bill_id' => $id, 'error' => $e->getMessage()]);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete bill: ' . $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->withErrors(['error' => 'Failed to delete bill: ' . $e->getMessage()]);
        }
    }

    /**
     * Void a bill.
     */
    public function void(VoidBillRequest $request, string $id): RedirectResponse|JsonResponse
    {
        $this->authorize('void-billing');

        try {
            DB::beginTransaction();

            $bill = Bill::findOrFail($id);

            // Check if bill is already voided
            if ($bill->voided_at) {
                throw new Exception('Bill is already voided.');
            }

            // Void the bill
            $bill->update([
                'voided_at' => now(),
                'voided_by' => auth()->id(),
                'void_reason' => $request->void_reason,
                'status' => 'voided',
            ]);

            // Record status change
            $bill->recordStatusChange('status', $bill->payment_status, 'voided', $request->void_reason);

            DB::commit();

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => true,
                    'data' => new BillResource($bill),
                    'message' => 'Bill voided successfully',
                ]);
            }

            return redirect()->route('billing.index')->with('success', 'Bill voided successfully.');
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error voiding bill', ['bill_id' => $id, 'error' => $e->getMessage()]);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to void bill: ' . $e->getMessage(),
                ], 500);
            }

            return redirect()->back()->withErrors(['error' => 'Failed to void bill: ' . $e->getMessage()]);
        }
    }

    /**
     * Generate invoice PDF for a bill.
     */
    public function generateInvoice(Request $request, string $id): JsonResponse
    {
        $this->authorize('view-billing');

        try {
            $bill = Bill::findOrFail($id);

            $result = $this->invoiceService->generatePDF($bill);

            if ($request->wantsJson() || $request->is('api/*')) {
                return response()->json($result);
            }

            // For web, return download URL
            return response()->json([
                'success' => true,
                'download_url' => $result['data']['url'],
            ]);
        } catch (Exception $e) {
            Log::error('Error generating invoice', ['bill_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate invoice: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send payment reminder for a bill.
     */
    public function sendReminder(Request $request, string $id): JsonResponse
    {
        $this->authorize('manage-billing');

        try {
            $bill = Bill::with('patient')->findOrFail($id);

            // Check if bill is paid or voided
            if ($bill->payment_status === 'paid') {
                throw new Exception('Cannot send reminder for a paid bill.');
            }

            if ($bill->voided_at) {
                throw new Exception('Cannot send reminder for a voided bill.');
            }

            // Update reminder count
            $bill->increment('reminder_sent_count');
            $bill->update(['reminder_last_sent' => now()]);

            // TODO: Implement actual email/SMS sending logic here
            // For now, just log the reminder
            Log::info('Payment reminder sent', [
                'bill_id' => $bill->id,
                'patient_id' => $bill->patient_id,
                'reminder_count' => $bill->reminder_sent_count,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment reminder sent successfully',
                'data' => [
                    'reminder_sent_count' => $bill->reminder_sent_count,
                    'reminder_last_sent' => $bill->reminder_last_sent,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error sending reminder', ['bill_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send reminder: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get patient data for AJAX loading.
     */
    public function getPatientData(Request $request, string $patientId): JsonResponse
    {
        $this->authorize('view-billing');

        try {
            $patient = Patient::with([
                'insurances' => function ($query) {
                    $query->valid()->with('insuranceProvider');
                },
            ])->findOrFail($patientId);

            // Get recent bills for this patient
            $recentBills = Bill::byPatient($patientId)
                ->with('items')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            // Get outstanding balance
            $outstandingBalance = Bill::byPatient($patientId)
                ->active()
                ->where('payment_status', '!=', 'paid')
                ->sum('balance_due');

            return response()->json([
                'success' => true,
                'data' => [
                    'patient' => new PatientResource($patient),
                    'insurances' => $patient->insurances,
                    'recent_bills' => BillResource::collection($recentBills),
                    'outstanding_balance' => $outstandingBalance,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching patient data', ['patient_id' => $patientId, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch patient data: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download invoice PDF.
     */
    public function downloadInvoice(Request $request, string $id): JsonResponse
    {
        $this->authorize('view-billing');

        try {
            $bill = Bill::findOrFail($id);

            $result = $this->invoiceService->streamPDF($bill);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'content' => base64_encode($result['data']['content']),
                        'filename' => $result['data']['filename'],
                        'mime_type' => $result['data']['mime_type'],
                    ],
                ]);
            }

            throw new Exception('Failed to generate invoice');
        } catch (Exception $e) {
            Log::error('Error downloading invoice', ['bill_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to download invoice: ' . $e->getMessage(),
            ], 500);
        }
    }
}
