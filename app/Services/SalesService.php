<?php

namespace App\Services;

use App\Models\Sale;
use App\Models\SalesItem;
use App\Models\Medicine;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SalesService
{
    protected $inventoryService;
    protected $auditLogService;

    public function __construct(
        InventoryService $inventoryService,
        AuditLogService $auditLogService
    ) {
        $this->inventoryService = $inventoryService;
        $this->auditLogService = $auditLogService;
    }

    /**
     * Process a new sale transaction.
     *
     * @param array $data
     * @param int $userId
     * @return Sale
     * @throws \Exception
     */
    public function processSale(array $data, int $userId): Sale
    {
        return DB::transaction(function () use ($data, $userId) {
            // Validate stock availability
            $this->validateStock($data['items']);

            // Calculate totals
            $totals = $this->calculateTotals(
                $data['items'],
                $data['discount_amount'] ?? 0,
                $data['tax_amount'] ?? 0
            );

            // Generate invoice number
            $invoiceNumber = $this->generateInvoiceNumber();

            // Create sale record
            $sale = Sale::create([
                'sale_id' => $invoiceNumber,
                'patient_id' => $data['patient_id'] ?? null,
                'prescription_id' => $data['prescription_id'] ?? null,
                'sold_by' => $userId,
                'total_amount' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'tax' => $totals['tax'],
                'grand_total' => $totals['total'],
                'payment_method' => $data['payment_method'],
                'status' => 'completed',
                'notes' => $data['notes'] ?? null,
                'is_prescription_sale' => $data['is_prescription_sale'] ?? false,
            ]);

            // Create sales items and deduct stock
            foreach ($data['items'] as $item) {
                $medicine = Medicine::findOrFail($item['medicine_id']);

                // Create sales item with cost_price for profit calculation
                SalesItem::create([
                    'sale_id' => $sale->id,
                    'medicine_id' => $item['medicine_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'cost_price' => $medicine->cost_price ?? 0, // Store cost price at time of sale
                    'total_price' => $item['quantity'] * $item['unit_price'],
                    'discount' => $item['discount'] ?? 0,
                ]);

                // Deduct stock
                $this->inventoryService->deductStock(
                    $item['medicine_id'],
                    $item['quantity'],
                    'Sale: ' . $invoiceNumber,
                    $sale->id
                );

                // If this is a prescription sale, update the prescription item dispensed quantity
                if (!empty($data['prescription_id'])) {
                    $this->updatePrescriptionItemDispensed(
                        $data['prescription_id'],
                        $item['medicine_id'],
                        $item['quantity']
                    );
                }
            }

            // Log the sale creation
            $logMessage = $sale->is_prescription_sale
                ? "Prescription {$invoiceNumber} dispensed successfully with " . count($data['items']) . " items"
                : "Sale {$invoiceNumber} processed successfully with " . count($data['items']) . " items";
            
            $this->auditLogService->logActivity(
                $sale->is_prescription_sale ? 'Prescription Dispensed' : 'Sale Processed',
                'Pharmacy',
                $logMessage,
                'info'
            );

            return $sale->fresh(['items.medicine', 'patient', 'soldBy', 'prescription']);
        });
    }

    /**
     * Update prescription item dispensed quantity.
     *
     * @param int $prescriptionId
     * @param int $medicineId
     * @param int $quantity
     * @return void
     */
    protected function updatePrescriptionItemDispensed(int $prescriptionId, int $medicineId, int $quantity): void
    {
        $prescriptionItem = \App\Models\PrescriptionItem::where('prescription_id', $prescriptionId)
            ->where('medicine_id', $medicineId)
            ->first();

        if ($prescriptionItem) {
            $prescriptionItem->dispense($quantity);
        }
    }

    /**
     * Calculate sale totals including subtotal, discount, tax, and grand total.
     * Supports tax exemption for specific categories.
     *
     * @param array $items
     * @param float $discount
     * @param float $taxRate
     * @param array $taxExemptCategories Array of category IDs that are tax exempt
     * @return array
     */
    public function calculateTotals(array $items, float $discount = 0, float $taxRate = 0, array $taxExemptCategories = []): array
    {
        $subtotal = 0;
        $taxableAmount = 0;

        foreach ($items as $item) {
            $medicine = Medicine::find($item['medicine_id']);
            $itemTotal = $item['quantity'] * $item['unit_price'];
            
            // Apply item-level discount if present
            if (isset($item['discount']) && $item['discount'] > 0) {
                $itemTotal = $itemTotal * (1 - ($item['discount'] / 100));
            }
            
            $subtotal += $itemTotal;
            
            // Check if item is taxable (not in exempt categories)
            if ($medicine && !in_array($medicine->category_id, $taxExemptCategories)) {
                $taxableAmount += $itemTotal;
            }
        }

        // Get tax rate from config if not provided
        if ($taxRate <= 0) {
            $taxRate = config('pharmacy.tax_rate', 0);
        }

        // Calculate tax only on taxable amount
        $tax = $taxableAmount * ($taxRate / 100);

        // Ensure discount doesn't exceed subtotal
        $discount = min($discount, $subtotal);

        // Calculate grand total
        $total = $subtotal - $discount + $tax;

        return [
            'subtotal' => round($subtotal, 2),
            'discount' => round($discount, 2),
            'tax' => round($tax, 2),
            'taxable_amount' => round($taxableAmount, 2),
            'tax_exempt_amount' => round($subtotal - $taxableAmount, 2),
            'tax_rate' => $taxRate,
            'total' => round($total, 2),
        ];
    }

    /**
     * Validate that all items have sufficient stock.
     *
     * @param array $items
     * @throws \Exception
     */
    public function validateStock(array $items): void
    {
        $errors = [];

        foreach ($items as $item) {
            $medicine = Medicine::find($item['medicine_id']);
            
            if (!$medicine) {
                $errors[] = "Medicine ID {$item['medicine_id']} not found";
                continue;
            }

            if ($medicine->stock_quantity < $item['quantity']) {
                $errors[] = "Insufficient stock for {$medicine->name}. Available: {$medicine->stock_quantity}, Requested: {$item['quantity']}";
            }
        }

        if (!empty($errors)) {
            throw new \Exception(implode(', ', $errors));
        }
    }

    /**
     * Deduct stock for a sale.
     *
     * @param Sale $sale
     * @throws \Exception
     */
    public function deductStock(Sale $sale): void
    {
        foreach ($sale->items as $item) {
            $this->inventoryService->deductStock(
                $item->medicine_id,
                $item->quantity,
                'Sale: ' . $sale->sale_id,
                $sale->id
            );
        }
    }

    /**
     * Restore stock for a voided sale.
     *
     * @param Sale $sale
     * @throws \Exception
     */
    public function restoreStock(Sale $sale): void
    {
        foreach ($sale->items as $item) {
            $this->inventoryService->restoreStock(
                $item->medicine_id,
                $item->quantity,
                'Sale voided: ' . $sale->sale_id,
                $sale->id
            );
        }
    }

    /**
     * Generate a unique invoice number.
     *
     * @return string
     */
    public function generateInvoiceNumber(): string
    {
        $prefix = 'INV';
        $date = now()->format('Ymd');
        
        // Get the last sale ID for today
        $lastSale = Sale::whereDate('created_at', today())
            ->orderBy('id', 'desc')
            ->first();
        
        $sequence = $lastSale ? (int) substr($lastSale->sale_id, -4) + 1 : 1;
        
        return sprintf('%s-%s-%04d', $prefix, $date, $sequence);
    }

    /**
     * Generate receipt data for a sale.
     *
     * @param Sale $sale
     * @return array
     */
    public function generateReceipt(Sale $sale): array
    {
        return [
            'sale' => $sale->load(['items.medicine', 'patient', 'soldBy']),
            'pharmacy' => [
                'name' => config('pharmacy.name', 'Hospital Pharmacy'),
                'address' => config('pharmacy.address', '123 Medical Center Drive'),
                'phone' => config('pharmacy.phone', '+1 (555) 123-4567'),
                'email' => config('pharmacy.email', 'pharmacy@hospital.com'),
                'license' => config('pharmacy.license', ''),
            ],
            'generated_at' => now()->toDateTimeString(),
        ];
    }

    /**
     * Get sales statistics for a date range.
     *
     * @param string $startDate
     * @param string $endDate
     * @return array
     */
    public function getSalesStats(string $startDate, string $endDate): array
    {
        $sales = Sale::whereBetween('created_at', [$startDate, $endDate])
            ->where('status', 'completed')
            ->get();

        return [
            'total_sales' => $sales->count(),
            'total_revenue' => $sales->sum('grand_total'),
            'total_discount' => $sales->sum('discount'),
            'total_tax' => $sales->sum('tax'),
            'average_sale_value' => $sales->avg('grand_total'),
            'items_sold' => SalesItem::whereHas('sale', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate])
                  ->where('status', 'completed');
            })->sum('quantity'),
        ];
    }

    /**
     * Void a sale transaction.
     *
     * @param Sale $sale
     * @param string $reason
     * @param int $userId
     * @return bool
     * @throws \Exception
     */
    public function voidSale(Sale $sale, string $reason, int $userId): bool
    {
        return DB::transaction(function () use ($sale, $reason, $userId) {
            if ($sale->status !== 'completed') {
                throw new \Exception('Only completed sales can be voided');
            }

            // Restore stock
            $this->restoreStock($sale);

            // Update sale status
            $sale->update([
                'status' => 'voided',
                'notes' => ($sale->notes ? $sale->notes . "\n" : '') . "Voided: {$reason}",
            ]);

            // Log the void action
            $this->auditLogService->logActivity(
                'Sale Voided',
                'Sales',
                "Sale {$sale->sale_id} voided by user {$userId}. Reason: {$reason}",
                'warning'
            );

            return true;
        });
    }

    /**
     * Get top selling medicines for a date range.
     *
     * @param string $startDate
     * @param string $endDate
     * @param int $limit
     * @return array
     */
    public function getTopSellingMedicines(string $startDate, string $endDate, int $limit = 10): array
    {
        return SalesItem::select('medicine_id', DB::raw('SUM(quantity) as total_quantity'), DB::raw('SUM(total_price) as total_revenue'))
            ->whereHas('sale', function ($q) use ($startDate, $endDate) {
                $q->whereBetween('created_at', [$startDate, $endDate])
                  ->where('status', 'completed');
            })
            ->with('medicine')
            ->groupBy('medicine_id')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get()
            ->toArray();
    }
}
