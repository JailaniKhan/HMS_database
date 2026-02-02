<?php

namespace App\Services\Billing;

use App\Models\Bill;
use App\Models\Payment;
use App\Models\BillRefund;
use App\Models\BillStatusHistory;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Exception;
use Illuminate\Validation\ValidationException;

class PaymentService
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
     * Valid payment methods
     */
    protected const VALID_PAYMENT_METHODS = [
        'cash',
        'credit_card',
        'debit_card',
        'check',
        'bank_transfer',
        'insurance',
        'online',
    ];

    /**
     * Valid payment statuses
     */
    protected const VALID_PAYMENT_STATUSES = [
        'pending',
        'completed',
        'failed',
        'refunded',
        'cancelled',
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
     * Process a payment and update bill
     *
     * @param Bill $bill
     * @param array $data
     * @return array
     * @throws Exception
     * @throws ValidationException
     */
    public function processPayment(Bill $bill, array $data): array
    {
        try {
            DB::beginTransaction();

            // Validate payment data
            $this->validatePayment($data);

            // Check if bill is voided
            if ($bill->voided_at) {
                throw new Exception('Cannot process payment for a voided bill.');
            }

            $amount = $data['amount'];
            $paymentMethod = $data['payment_method'];

            // Check if payment amount is valid
            if ($amount <= 0) {
                throw new Exception('Payment amount must be greater than zero.');
            }

            // Check if payment exceeds balance
            if ($amount > $bill->balance_due) {
                throw new Exception('Payment amount exceeds the balance due.');
            }

            // Calculate change for cash payments
            $changeDue = 0;
            $amountTendered = $data['amount_tendered'] ?? null;

            if ($paymentMethod === 'cash' && $amountTendered !== null) {
                $changeDue = $this->calculateChange($amountTendered, $amount);
            }

            // Create payment record
            $paymentData = [
                'bill_id' => $bill->id,
                'payment_method' => $paymentMethod,
                'amount' => $amount,
                'payment_date' => $data['payment_date'] ?? now(),
                'reference_number' => $data['reference_number'] ?? null,
                'card_last_four' => $data['card_last_four'] ?? null,
                'card_type' => $data['card_type'] ?? null,
                'bank_name' => $data['bank_name'] ?? null,
                'check_number' => $data['check_number'] ?? null,
                'amount_tendered' => $amountTendered,
                'change_due' => $changeDue,
                'insurance_claim_id' => $data['insurance_claim_id'] ?? null,
                'received_by' => $data['received_by'] ?? auth()->id(),
                'notes' => $data['notes'] ?? null,
                'status' => 'completed',
            ];

            $payment = Payment::create($paymentData);

            // Update bill balance and status
            $this->calculationService->updateBalanceDue($bill);
            $this->updateBillStatus($bill);

            // Update last payment date
            $bill->update(['last_payment_date' => now()]);

            // Create status history entry
            BillStatusHistory::create([
                'bill_id' => $bill->id,
                'status' => $bill->payment_status,
                'changed_by' => auth()->id(),
                'notes' => "Payment of {$amount} received via {$paymentMethod}",
            ]);

            DB::commit();

            // Log the payment
            $this->auditLogService->logActivity(
                'Payment Processed',
                'Billing',
                "Processed payment of {$amount} for bill #{$bill->bill_number} via {$paymentMethod}. Transaction: {$payment->transaction_id}",
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'payment' => $payment,
                    'change_due' => $changeDue,
                    'bill_status' => $bill->payment_status,
                    'balance_due' => $bill->balance_due,
                ],
                'message' => 'Payment processed successfully',
            ];
        } catch (ValidationException $e) {
            DB::rollBack();
            throw $e;
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error processing payment', [
                'bill_id' => $bill->id,
                'data' => $data,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to process payment: ' . $e->getMessage());
        }
    }

    /**
     * Process a refund for a payment
     *
     * @param Payment $payment
     * @param float $amount
     * @param string $reason
     * @return array
     * @throws Exception
     */
    public function processRefund(Payment $payment, float $amount, string $reason): array
    {
        try {
            DB::beginTransaction();

            // Check if payment is completed
            if ($payment->status !== 'completed') {
                throw new Exception('Can only refund completed payments.');
            }

            // Check if refund amount is valid
            if ($amount <= 0) {
                throw new Exception('Refund amount must be greater than zero.');
            }

            // Check if refund amount exceeds payment amount
            if ($amount > $payment->amount) {
                throw new Exception('Refund amount cannot exceed the original payment amount.');
            }

            // Check existing refunds
            $existingRefunds = $payment->refunds->where('status', 'completed')->sum('refund_amount');
            $availableForRefund = $payment->amount - $existingRefunds;

            if ($amount > $availableForRefund) {
                throw new Exception("Only {$availableForRefund} is available for refund.");
            }

            $bill = $payment->bill;

            // Create refund record
            $refund = BillRefund::create([
                'bill_id' => $bill->id,
                'payment_id' => $payment->id,
                'refund_amount' => $amount,
                'refund_type' => 'partial',
                'refund_reason' => $reason,
                'refund_date' => now(),
                'refund_method' => $payment->payment_method,
                'status' => 'completed',
                'requested_by' => auth()->id(),
                'processed_by' => auth()->id(),
                'processed_at' => now(),
            ]);

            // Update payment status if fully refunded
            $totalRefunded = $existingRefunds + $amount;
            if ($totalRefunded >= $payment->amount) {
                $payment->update(['status' => 'refunded']);
            }

            // Update bill balance
            $this->calculationService->updateBalanceDue($bill);
            $this->updateBillStatus($bill);

            // Create status history entry
            BillStatusHistory::create([
                'bill_id' => $bill->id,
                'status' => $bill->payment_status,
                'changed_by' => auth()->id(),
                'notes' => "Refund of {$amount} processed. Reason: {$reason}",
            ]);

            DB::commit();

            // Log the refund
            $this->auditLogService->logActivity(
                'Payment Refunded',
                'Billing',
                "Processed refund of {$amount} for payment #{$payment->transaction_id}. Reason: {$reason}",
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'refund' => $refund,
                    'payment_status' => $payment->status,
                    'bill_status' => $bill->payment_status,
                    'balance_due' => $bill->balance_due,
                ],
                'message' => 'Refund processed successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error processing refund', [
                'payment_id' => $payment->id,
                'amount' => $amount,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to process refund: ' . $e->getMessage());
        }
    }

    /**
     * Update bill payment status based on balance
     *
     * @param Bill $bill
     * @return string
     */
    public function updateBillStatus(Bill $bill): string
    {
        $oldStatus = $bill->payment_status;
        $newStatus = $oldStatus;

        if ($bill->balance_due <= 0 && $bill->amount_paid >= $bill->total_amount) {
            $newStatus = 'paid';
        } elseif ($bill->amount_paid > 0 && $bill->balance_due > 0) {
            $newStatus = 'partial';
        } elseif ($bill->amount_paid <= 0) {
            $newStatus = 'pending';
        }

        if ($newStatus !== $oldStatus) {
            $bill->update(['payment_status' => $newStatus]);

            // Log status change
            $this->auditLogService->logActivity(
                'Bill Status Updated',
                'Billing',
                "Bill #{$bill->bill_number} status changed from {$oldStatus} to {$newStatus}",
                'info'
            );
        }

        return $newStatus;
    }

    /**
     * Validate payment data
     *
     * @param array $data
     * @return array
     * @throws ValidationException
     */
    public function validatePayment(array $data): array
    {
        $validator = Validator::make($data, [
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:' . implode(',', self::VALID_PAYMENT_METHODS),
            'payment_date' => 'nullable|date',
            'reference_number' => 'nullable|string|max:255',
            'card_last_four' => 'nullable|string|size:4',
            'card_type' => 'nullable|string|max:50',
            'bank_name' => 'nullable|string|max:255',
            'check_number' => 'nullable|string|max:255',
            'amount_tendered' => 'nullable|numeric|min:0',
            'insurance_claim_id' => 'nullable|integer|exists:insurance_claims,id',
            'received_by' => 'nullable|integer|exists:users,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $validator->validated();
    }

    /**
     * Calculate change for cash payments
     *
     * @param float $amountTendered
     * @param float $amountDue
     * @return float
     * @throws Exception
     */
    public function calculateChange(float $amountTendered, float $amountDue): float
    {
        if ($amountTendered < $amountDue) {
            throw new Exception('Amount tendered is less than amount due.');
        }

        $change = $amountTendered - $amountDue;

        return round($change, 2);
    }

    /**
     * Get payment statistics for a bill
     *
     * @param Bill $bill
     * @return array
     */
    public function getPaymentStatistics(Bill $bill): array
    {
        $payments = $bill->payments()->where('status', 'completed')->get();

        return [
            'total_payments' => $payments->count(),
            'total_paid' => $payments->sum('amount'),
            'last_payment_date' => $payments->max('payment_date'),
            'payment_methods' => $payments->pluck('payment_method')->unique()->values()->toArray(),
            'refund_amount' => $bill->refunds->where('status', 'completed')->sum('refund_amount'),
        ];
    }

    /**
     * Void a payment
     *
     * @param Payment $payment
     * @param string $reason
     * @return array
     * @throws Exception
     */
    public function voidPayment(Payment $payment, string $reason): array
    {
        try {
            DB::beginTransaction();

            if ($payment->status === 'voided') {
                throw new Exception('Payment is already voided.');
            }

            $bill = $payment->bill;

            // Update payment status
            $payment->update(['status' => 'voided']);

            // Update bill balance
            $this->calculationService->updateBalanceDue($bill);
            $this->updateBillStatus($bill);

            // Create status history entry
            BillStatusHistory::create([
                'bill_id' => $bill->id,
                'status' => $bill->payment_status,
                'changed_by' => auth()->id(),
                'notes' => "Payment voided. Reason: {$reason}",
            ]);

            DB::commit();

            // Log the void
            $this->auditLogService->logActivity(
                'Payment Voided',
                'Billing',
                "Voided payment #{$payment->transaction_id} for bill #{$bill->bill_number}. Reason: {$reason}",
                'warning'
            );

            return [
                'success' => true,
                'data' => [
                    'payment' => $payment,
                    'bill_status' => $bill->payment_status,
                    'balance_due' => $bill->balance_due,
                ],
                'message' => 'Payment voided successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error voiding payment', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to void payment: ' . $e->getMessage());
        }
    }
}
