<?php

namespace App\Services\Billing;

use App\Models\Bill;
use App\Models\BillingSetting;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Exception;
use PDF;

class InvoiceGenerationService
{
    /**
     * @var AuditLogService
     */
    protected $auditLogService;

    /**
     * Invoice storage path
     */
    protected const INVOICE_STORAGE_PATH = 'invoices/';

    /**
     * Constructor with dependency injection
     */
    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Generate PDF invoice for a bill
     *
     * @param Bill $bill
     * @return array
     * @throws Exception
     */
    public function generatePDF(Bill $bill): array
    {
        try {
            DB::beginTransaction();

            // Load bill relationships
            $bill->load(['patient', 'doctor', 'items', 'payments', 'primaryInsurance.insuranceProvider']);

            // Generate invoice number if not exists
            if (empty($bill->invoice_number)) {
                $invoiceNumber = $this->generateInvoiceNumber();
                $bill->update(['invoice_number' => $invoiceNumber]);
            }

            // Get template data
            $templateData = $this->getInvoiceTemplate($bill);

            // Generate PDF
            $pdf = PDF::loadView('invoices.template', $templateData);

            // Set PDF options
            $pdf->setPaper('a4', 'portrait');
            $pdf->setOptions([
                'dpi' => 150,
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
            ]);

            // Generate filename
            $filename = $this->generateInvoiceFilename($bill);
            $filepath = self::INVOICE_STORAGE_PATH . $filename;

            // Store PDF
            Storage::disk('local')->put($filepath, $pdf->output());

            DB::commit();

            // Log the generation
            $this->auditLogService->logActivity(
                'Invoice Generated',
                'Billing',
                "Generated PDF invoice for bill #{$bill->bill_number}. Invoice: {$bill->invoice_number}",
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'bill_id' => $bill->id,
                    'invoice_number' => $bill->invoice_number,
                    'filename' => $filename,
                    'filepath' => $filepath,
                    'url' => Storage::disk('local')->url($filepath),
                ],
                'message' => 'Invoice generated successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error generating invoice PDF', [
                'bill_id' => $bill->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw new Exception('Failed to generate invoice PDF: ' . $e->getMessage());
        }
    }

    /**
     * Generate unique invoice number
     *
     * @return string
     */
    public function generateInvoiceNumber(): string
    {
        $prefix = 'INV';
        $date = now()->format('Ymd');
        $random = strtoupper(Str::random(6));
        $sequence = $this->getNextInvoiceSequence();

        return "{$prefix}-{$date}-{$sequence}-{$random}";
    }

    /**
     * Email invoice to patient
     *
     * @param Bill $bill
     * @param string $email
     * @return array
     * @throws Exception
     */
    public function emailInvoice(Bill $bill, string $email): array
    {
        try {
            // Validate email
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email address provided.');
            }

            // Generate PDF if not exists
            $filename = $this->generateInvoiceFilename($bill);
            $filepath = self::INVOICE_STORAGE_PATH . $filename;

            if (!Storage::disk('local')->exists($filepath)) {
                $this->generatePDF($bill);
            }

            // Get template data for email
            $templateData = $this->getInvoiceTemplate($bill);

            // Send email
            \Mail::send('emails.invoice', $templateData, function ($message) use ($email, $bill, $filepath) {
                $message->to($email)
                    ->subject("Invoice #{$bill->invoice_number} - {$bill->patient->full_name}")
                    ->attach(Storage::disk('local')->path($filepath), [
                        'as' => "Invoice-{$bill->invoice_number}.pdf",
                        'mime' => 'application/pdf',
                    ]);
            });

            // Log the email
            $this->auditLogService->logActivity(
                'Invoice Emailed',
                'Billing',
                "Emailed invoice #{$bill->invoice_number} to {$email}",
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'bill_id' => $bill->id,
                    'invoice_number' => $bill->invoice_number,
                    'email' => $email,
                    'sent_at' => now()->toDateTimeString(),
                ],
                'message' => 'Invoice emailed successfully',
            ];
        } catch (Exception $e) {
            Log::error('Error emailing invoice', [
                'bill_id' => $bill->id,
                'email' => $email,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to email invoice: ' . $e->getMessage());
        }
    }

    /**
     * Get invoice template data
     *
     * @param Bill $bill
     * @return array
     */
    public function getInvoiceTemplate(Bill $bill): array
    {
        // Get billing settings
        $settings = BillingSetting::getAllSettings();

        // Load relationships if not loaded
        if (!$bill->relationLoaded('patient')) {
            $bill->load('patient');
        }
        if (!$bill->relationLoaded('doctor')) {
            $bill->load('doctor');
        }
        if (!$bill->relationLoaded('items')) {
            $bill->load('items');
        }
        if (!$bill->relationLoaded('payments')) {
            $bill->load('payments');
        }
        if (!$bill->relationLoaded('primaryInsurance')) {
            $bill->load('primaryInsurance.insuranceProvider');
        }

        // Calculate totals
        $subtotal = $bill->sub_total;
        $discount = $bill->total_discount;
        $tax = $bill->total_tax;
        $total = $bill->total_amount;
        $amountPaid = $bill->amount_paid;
        $balanceDue = $bill->balance_due;

        // Prepare items
        $items = $bill->items->map(function ($item) {
            return [
                'description' => $item->item_description,
                'category' => $item->category,
                'quantity' => $item->quantity,
                'unit_price' => $item->unit_price,
                'discount' => $item->discount_amount + ($item->unit_price * $item->quantity * $item->discount_percentage / 100),
                'total' => $item->total_price,
            ];
        });

        // Prepare payments
        $payments = $bill->payments->where('status', 'completed')->map(function ($payment) {
            return [
                'date' => $payment->payment_date->format('Y-m-d'),
                'method' => $this->formatPaymentMethod($payment->payment_method),
                'amount' => $payment->amount,
                'transaction_id' => $payment->transaction_id,
            ];
        });

        return [
            'invoice' => [
                'number' => $bill->invoice_number,
                'bill_number' => $bill->bill_number,
                'date' => $bill->bill_date->format('Y-m-d'),
                'due_date' => $bill->due_date?->format('Y-m-d'),
                'status' => $bill->payment_status,
            ],
            'hospital' => [
                'name' => $settings['hospital_name'] ?? 'Hospital Management System',
                'address' => $settings['hospital_address'] ?? '',
                'phone' => $settings['hospital_phone'] ?? '',
                'email' => $settings['hospital_email'] ?? '',
                'logo' => $settings['hospital_logo'] ?? null,
            ],
            'patient' => [
                'name' => $bill->patient->full_name,
                'id' => $bill->patient->patient_id,
                'address' => $bill->patient->address,
                'phone' => $bill->patient->phone,
            ],
            'doctor' => $bill->doctor ? [
                'name' => $bill->doctor->name,
                'specialization' => $bill->doctor->specialization ?? null,
            ] : null,
            'insurance' => $bill->primaryInsurance ? [
                'provider' => $bill->primaryInsurance->insuranceProvider->name,
                'policy_number' => $bill->primaryInsurance->policy_number,
                'claim_amount' => $bill->insurance_claim_amount,
                'approved_amount' => $bill->insurance_approved_amount,
            ] : null,
            'items' => $items,
            'summary' => [
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'total' => $total,
                'amount_paid' => $amountPaid,
                'balance_due' => $balanceDue,
            ],
            'payments' => $payments,
            'notes' => $bill->notes,
        ];
    }

    /**
     * Stream PDF for download
     *
     * @param Bill $bill
     * @return array
     * @throws Exception
     */
    public function streamPDF(Bill $bill): array
    {
        try {
            // Generate PDF if not exists
            $filename = $this->generateInvoiceFilename($bill);
            $filepath = self::INVOICE_STORAGE_PATH . $filename;

            if (!Storage::disk('local')->exists($filepath)) {
                $this->generatePDF($bill);
            }

            // Get file content
            $content = Storage::disk('local')->get($filepath);

            // Log the download
            $this->auditLogService->logActivity(
                'Invoice Downloaded',
                'Billing',
                "Downloaded invoice #{$bill->invoice_number} for bill #{$bill->bill_number}",
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'content' => $content,
                    'filename' => "Invoice-{$bill->invoice_number}.pdf",
                    'mime_type' => 'application/pdf',
                ],
                'message' => 'Invoice ready for download',
            ];
        } catch (Exception $e) {
            Log::error('Error streaming invoice PDF', [
                'bill_id' => $bill->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to stream invoice: ' . $e->getMessage());
        }
    }

    /**
     * Generate invoice filename
     *
     * @param Bill $bill
     * @return string
     */
    protected function generateInvoiceFilename(Bill $bill): string
    {
        $safeInvoiceNumber = preg_replace('/[^a-zA-Z0-9_-]/', '_', $bill->invoice_number ?? $bill->bill_number);
        return "{$safeInvoiceNumber}.pdf";
    }

    /**
     * Get next invoice sequence number
     *
     * @return string
     */
    protected function getNextInvoiceSequence(): string
    {
        $today = now()->format('Ymd');
        $count = Bill::whereDate('created_at', today())->count() + 1;
        return str_pad((string) $count, 4, '0', STR_PAD_LEFT);
    }

    /**
     * Format payment method for display
     *
     * @param string $method
     * @return string
     */
    protected function formatPaymentMethod(string $method): string
    {
        $methods = [
            'cash' => 'Cash',
            'credit_card' => 'Credit Card',
            'debit_card' => 'Debit Card',
            'check' => 'Check',
            'bank_transfer' => 'Bank Transfer',
            'insurance' => 'Insurance',
            'online' => 'Online Payment',
        ];

        return $methods[$method] ?? ucfirst(str_replace('_', ' ', $method));
    }

    /**
     * Preview invoice without saving
     *
     * @param Bill $bill
     * @return array
     * @throws Exception
     */
    public function previewInvoice(Bill $bill): array
    {
        try {
            // Load bill relationships
            $bill->load(['patient', 'doctor', 'items', 'payments', 'primaryInsurance.insuranceProvider']);

            // Get template data
            $templateData = $this->getInvoiceTemplate($bill);

            // Generate PDF
            $pdf = PDF::loadView('invoices.template', $templateData);

            return [
                'success' => true,
                'data' => [
                    'content' => base64_encode($pdf->output()),
                    'template_data' => $templateData,
                ],
                'message' => 'Invoice preview generated',
            ];
        } catch (Exception $e) {
            Log::error('Error previewing invoice', [
                'bill_id' => $bill->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to preview invoice: ' . $e->getMessage());
        }
    }

    /**
     * Delete stored invoice PDF
     *
     * @param Bill $bill
     * @return array
     * @throws Exception
     */
    public function deleteInvoicePDF(Bill $bill): array
    {
        try {
            $filename = $this->generateInvoiceFilename($bill);
            $filepath = self::INVOICE_STORAGE_PATH . $filename;

            if (Storage::disk('local')->exists($filepath)) {
                Storage::disk('local')->delete($filepath);

                // Log the deletion
                $this->auditLogService->logActivity(
                    'Invoice Deleted',
                    'Billing',
                    "Deleted invoice PDF for bill #{$bill->bill_number}",
                    'info'
                );

                return [
                    'success' => true,
                    'message' => 'Invoice PDF deleted successfully',
                ];
            }

            return [
                'success' => true,
                'message' => 'Invoice PDF not found',
            ];
        } catch (Exception $e) {
            Log::error('Error deleting invoice PDF', [
                'bill_id' => $bill->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to delete invoice PDF: ' . $e->getMessage());
        }
    }
}
