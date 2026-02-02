<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StorePaymentRequest;
use App\Http\Requests\Billing\ProcessRefundRequest;
use App\Http\Resources\Billing\PaymentResource;
use App\Http\Resources\Billing\BillRefundResource;
use App\Models\Bill;
use App\Models\Payment;
use App\Services\Billing\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Exception;

class PaymentController extends Controller
{
    /**
     * @var PaymentService
     */
    protected $paymentService;

    /**
     * Constructor with dependency injection
     */
    public function __construct(PaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Display a listing of payments for a bill.
     */
    public function index(Request $request, string $billId): JsonResponse
    {
        $this->authorize('view-payments');

        try {
            $bill = Bill::findOrFail($billId);

            $query = Payment::with(['receivedBy', 'insuranceClaim', 'refunds'])
                ->where('bill_id', $billId);

            // Apply filters
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('payment_method') && $request->payment_method) {
                $query->where('payment_method', $request->payment_method);
            }

            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('payment_date', '>=', $request->date_from);
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('payment_date', '<=', $request->date_to);
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'payment_date');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $payments = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => PaymentResource::collection($payments),
                'bill' => [
                    'id' => $bill->id,
                    'bill_number' => $bill->bill_number,
                    'total_amount' => $bill->total_amount,
                    'amount_paid' => $bill->amount_paid,
                    'balance_due' => $bill->balance_due,
                    'payment_status' => $bill->payment_status,
                ],
                'meta' => [
                    'current_page' => $payments->currentPage(),
                    'last_page' => $payments->lastPage(),
                    'per_page' => $payments->perPage(),
                    'total' => $payments->total(),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching payments', ['bill_id' => $billId, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payments: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Store a newly created payment.
     */
    public function store(StorePaymentRequest $request, string $billId): JsonResponse
    {
        $this->authorize('record-payments');

        try {
            DB::beginTransaction();

            $bill = Bill::findOrFail($billId);

            // Check if bill is voided
            if ($bill->voided_at) {
                throw new Exception('Cannot process payment for a voided bill.');
            }

            // Prepare payment data
            $paymentData = [
                'payment_method' => $request->payment_method,
                'amount' => $request->amount,
                'payment_date' => $request->payment_date,
                'transaction_id' => $request->transaction_id,
                'reference_number' => $request->reference_number,
                'card_last_four' => $request->card_last_four,
                'card_type' => $request->card_type,
                'bank_name' => $request->bank_name,
                'check_number' => $request->check_number,
                'amount_tendered' => $request->amount_tendered,
                'notes' => $request->notes,
                'received_by' => auth()->id(),
            ];

            // Process payment using service
            $result = $this->paymentService->processPayment($bill, $paymentData);

            DB::commit();

            // Load payment with relationships
            $payment = Payment::with(['receivedBy', 'insuranceClaim'])
                ->find($result['data']['payment']->id);

            return response()->json([
                'success' => true,
                'data' => [
                    'payment' => new PaymentResource($payment),
                    'change_due' => $result['data']['change_due'],
                    'bill_status' => $result['data']['bill_status'],
                    'balance_due' => $result['data']['balance_due'],
                ],
                'message' => 'Payment recorded successfully',
            ], 201);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error recording payment', ['bill_id' => $billId, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to record payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Display the specified payment.
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $this->authorize('view-payments');

        try {
            $payment = Payment::with([
                'receivedBy',
                'insuranceClaim',
                'refunds.requestedBy',
                'refunds.approvedBy',
                'refunds.processedBy',
                'bill.patient',
            ])->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => new PaymentResource($payment),
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching payment', ['payment_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Payment not found',
            ], 404);
        }
    }

    /**
     * Process a refund for a payment.
     */
    public function refund(ProcessRefundRequest $request, string $id): JsonResponse
    {
        $this->authorize('process-refunds');

        try {
            DB::beginTransaction();

            $payment = Payment::with('bill')->findOrFail($id);

            // Check if payment is completed
            if ($payment->status !== 'completed') {
                throw new Exception('Can only refund completed payments.');
            }

            // Process refund using service
            $result = $this->paymentService->processRefund(
                $payment,
                $request->refund_amount,
                $request->refund_reason
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'refund' => $result['data']['refund'],
                    'payment_status' => $result['data']['payment_status'],
                    'bill_status' => $result['data']['bill_status'],
                    'balance_due' => $result['data']['balance_due'],
                ],
                'message' => 'Refund processed successfully',
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error processing refund', ['payment_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process refund: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment statistics for a bill.
     */
    public function statistics(Request $request, string $billId): JsonResponse
    {
        $this->authorize('view-payments');

        try {
            $bill = Bill::findOrFail($billId);

            $statistics = $this->paymentService->getPaymentStatistics($bill);

            return response()->json([
                'success' => true,
                'data' => $statistics,
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching payment statistics', ['bill_id' => $billId, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payment statistics: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Void a payment.
     */
    public function void(Request $request, string $id): JsonResponse
    {
        $this->authorize('void-payments');

        try {
            $request->validate([
                'reason' => 'required|string|min:10|max:1000',
            ]);

            DB::beginTransaction();

            $payment = Payment::with('bill')->findOrFail($id);

            // Void payment using service
            $result = $this->paymentService->voidPayment($payment, $request->reason);

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => [
                    'payment' => new PaymentResource($result['data']['payment']),
                    'bill_status' => $result['data']['bill_status'],
                    'balance_due' => $result['data']['balance_due'],
                ],
                'message' => 'Payment voided successfully',
            ]);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error voiding payment', ['payment_id' => $id, 'error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to void payment: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * List all payments (admin view).
     */
    public function listAll(Request $request): JsonResponse
    {
        $this->authorize('view-all-payments');

        try {
            $query = Payment::with(['receivedBy', 'bill.patient']);

            // Apply filters
            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            if ($request->has('payment_method') && $request->payment_method) {
                $query->where('payment_method', $request->payment_method);
            }

            if ($request->has('date_from') && $request->date_from) {
                $query->whereDate('payment_date', '>=', $request->date_from);
            }

            if ($request->has('date_to') && $request->date_to) {
                $query->whereDate('payment_date', '<=', $request->date_to);
            }

            if ($request->has('received_by') && $request->received_by) {
                $query->where('received_by', $request->received_by);
            }

            if ($request->has('min_amount') && $request->min_amount) {
                $query->where('amount', '>=', $request->min_amount);
            }

            if ($request->has('max_amount') && $request->max_amount) {
                $query->where('amount', '<=', $request->max_amount);
            }

            // Apply sorting
            $sortBy = $request->get('sort_by', 'payment_date');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            $payments = $query->paginate($request->get('per_page', 15));

            return response()->json([
                'success' => true,
                'data' => PaymentResource::collection($payments),
                'meta' => [
                    'current_page' => $payments->currentPage(),
                    'last_page' => $payments->lastPage(),
                    'per_page' => $payments->perPage(),
                    'total' => $payments->total(),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching all payments', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch payments: ' . $e->getMessage(),
            ], 500);
        }
    }
}
