<?php

namespace App\Services\Billing;

use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Appointment;
use App\Models\LabTestRequest;
use App\Models\Sale;
use App\Models\DepartmentService;
use App\Models\LabTest;
use App\Services\AuditLogService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Exception;

class BillItemService
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
     * Add consultation fee from an appointment
     *
     * @param Bill $bill
     * @param Appointment $appointment
     * @return array
     * @throws Exception
     */
    public function addFromAppointment(Bill $bill, Appointment $appointment): array
    {
        try {
            DB::beginTransaction();

            // Check if item already exists for this appointment
            $existingItem = BillItem::where('bill_id', $bill->id)
                ->where('source_type', Appointment::class)
                ->where('source_id', $appointment->id)
                ->first();

            if ($existingItem) {
                throw new Exception('Appointment fee already added to this bill.');
            }

            // Get consultation fee from appointment
            $fee = $appointment->fee ?? 0;
            $discount = $appointment->discount ?? 0;

            if ($fee <= 0) {
                throw new Exception('Appointment fee must be greater than zero.');
            }

            // Create bill item
            $billItem = BillItem::create([
                'bill_id' => $bill->id,
                'item_type' => 'consultation',
                'source_type' => Appointment::class,
                'source_id' => $appointment->id,
                'category' => 'medical',
                'item_description' => "Consultation - Dr. {$appointment->doctor->name} ({$appointment->appointment_date->format('Y-m-d H:i')})",
                'quantity' => 1,
                'unit_price' => $fee,
                'discount_amount' => $discount,
                'discount_percentage' => 0,
                'total_price' => $fee - $discount,
            ]);

            // Recalculate bill totals
            $this->calculationService->calculateTotals($bill);

            DB::commit();

            // Log the addition
            $this->auditLogService->logActivity(
                'Bill Item Added',
                'Billing',
                "Added appointment fee from appointment #{$appointment->appointment_id} to bill #{$bill->bill_number}. Amount: {$fee}",
                'info'
            );

            return [
                'success' => true,
                'data' => $billItem,
                'message' => 'Consultation fee added successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error adding appointment fee', [
                'bill_id' => $bill->id,
                'appointment_id' => $appointment->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to add appointment fee: ' . $e->getMessage());
        }
    }

    /**
     * Add lab test fee to bill
     *
     * @param Bill $bill
     * @param LabTestRequest $labTest
     * @return array
     * @throws Exception
     */
    public function addFromLabTest(Bill $bill, LabTestRequest $labTest): array
    {
        try {
            DB::beginTransaction();

            // Check if item already exists for this lab test
            $existingItem = BillItem::where('bill_id', $bill->id)
                ->where('source_type', LabTestRequest::class)
                ->where('source_id', $labTest->id)
                ->first();

            if ($existingItem) {
                throw new Exception('Lab test fee already added to this bill.');
            }

            // Get lab test cost
            $labTestModel = LabTest::where('name', $labTest->test_name)->first();
            $cost = $labTestModel ? $labTestModel->cost : 0;

            if ($cost <= 0) {
                throw new Exception('Lab test cost must be greater than zero.');
            }

            // Create bill item
            $billItem = BillItem::create([
                'bill_id' => $bill->id,
                'item_type' => 'lab_test',
                'source_type' => LabTestRequest::class,
                'source_id' => $labTest->id,
                'category' => 'laboratory',
                'item_description' => "Lab Test: {$labTest->test_name} ({$labTest->test_type})",
                'quantity' => 1,
                'unit_price' => $cost,
                'discount_amount' => 0,
                'discount_percentage' => 0,
                'total_price' => $cost,
            ]);

            // Recalculate bill totals
            $this->calculationService->calculateTotals($bill);

            DB::commit();

            // Log the addition
            $this->auditLogService->logActivity(
                'Bill Item Added',
                'Billing',
                "Added lab test fee for {$labTest->test_name} to bill #{$bill->bill_number}. Amount: {$cost}",
                'info'
            );

            return [
                'success' => true,
                'data' => $billItem,
                'message' => 'Lab test fee added successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error adding lab test fee', [
                'bill_id' => $bill->id,
                'lab_test_id' => $labTest->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to add lab test fee: ' . $e->getMessage());
        }
    }

    /**
     * Add pharmacy sale items to bill
     *
     * @param Bill $bill
     * @param Sale $sale
     * @return array
     * @throws Exception
     */
    public function addFromPharmacySale(Bill $bill, Sale $sale): array
    {
        try {
            DB::beginTransaction();

            // Check if items already exist for this sale
            $existingItems = BillItem::where('bill_id', $bill->id)
                ->where('source_type', Sale::class)
                ->where('source_id', $sale->id)
                ->count();

            if ($existingItems > 0) {
                throw new Exception('Pharmacy sale items already added to this bill.');
            }

            // Load sale items
            $sale->load('items.medicine');

            if ($sale->items->isEmpty()) {
                throw new Exception('Sale has no items.');
            }

            $billItems = [];

            foreach ($sale->items as $item) {
                $medicineName = $item->medicine ? $item->medicine->name : 'Unknown Medicine';

                $billItem = BillItem::create([
                    'bill_id' => $bill->id,
                    'item_type' => 'pharmacy',
                    'source_type' => Sale::class,
                    'source_id' => $sale->id,
                    'category' => 'pharmacy',
                    'item_description' => "Pharmacy: {$medicineName} (Qty: {$item->quantity})",
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'discount_amount' => $item->discount,
                    'discount_percentage' => 0,
                    'total_price' => $item->total_price,
                ]);

                $billItems[] = $billItem;
            }

            // Recalculate bill totals
            $this->calculationService->calculateTotals($bill);

            DB::commit();

            // Log the addition
            $this->auditLogService->logActivity(
                'Bill Items Added',
                'Billing',
                "Added {$sale->items->count()} pharmacy items from sale #{$sale->sale_id} to bill #{$bill->bill_number}. Total: {$sale->grand_total}",
                'info'
            );

            return [
                'success' => true,
                'data' => $billItems,
                'message' => 'Pharmacy sale items added successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error adding pharmacy sale items', [
                'bill_id' => $bill->id,
                'sale_id' => $sale->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to add pharmacy sale items: ' . $e->getMessage());
        }
    }

    /**
     * Add department service fee to bill
     *
     * @param Bill $bill
     * @param DepartmentService $service
     * @return array
     * @throws Exception
     */
    public function addFromDepartmentService(Bill $bill, DepartmentService $service): array
    {
        try {
            DB::beginTransaction();

            // Check if item already exists for this service
            $existingItem = BillItem::where('bill_id', $bill->id)
                ->where('source_type', DepartmentService::class)
                ->where('source_id', $service->id)
                ->first();

            if ($existingItem) {
                throw new Exception('Department service fee already added to this bill.');
            }

            // Check if service is active
            if (!$service->is_active) {
                throw new Exception('Department service is not active.');
            }

            // Get service cost
            $cost = $service->final_cost;

            if ($cost <= 0) {
                throw new Exception('Service cost must be greater than zero.');
            }

            // Create bill item
            $billItem = BillItem::create([
                'bill_id' => $bill->id,
                'item_type' => 'department_service',
                'source_type' => DepartmentService::class,
                'source_id' => $service->id,
                'category' => 'service',
                'item_description' => "Service: {$service->name} ({$service->department->name})",
                'quantity' => 1,
                'unit_price' => $service->base_cost,
                'discount_amount' => $service->base_cost * ($service->discount_percentage / 100),
                'discount_percentage' => $service->discount_percentage,
                'total_price' => $cost,
            ]);

            // Recalculate bill totals
            $this->calculationService->calculateTotals($bill);

            DB::commit();

            // Log the addition
            $this->auditLogService->logActivity(
                'Bill Item Added',
                'Billing',
                "Added department service {$service->name} to bill #{$bill->bill_number}. Amount: {$cost}",
                'info'
            );

            return [
                'success' => true,
                'data' => $billItem,
                'message' => 'Department service fee added successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error adding department service fee', [
                'bill_id' => $bill->id,
                'service_id' => $service->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to add department service fee: ' . $e->getMessage());
        }
    }

    /**
     * Add a manual item to bill
     *
     * @param Bill $bill
     * @param array $data
     * @return array
     * @throws Exception
     */
    public function addManualItem(Bill $bill, array $data): array
    {
        try {
            DB::beginTransaction();

            // Validate required fields
            $requiredFields = ['item_description', 'quantity', 'unit_price'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || empty($data[$field])) {
                    throw new Exception("Field '{$field}' is required.");
                }
            }

            // Validate numeric fields
            if ($data['quantity'] <= 0) {
                throw new Exception('Quantity must be greater than zero.');
            }

            if ($data['unit_price'] < 0) {
                throw new Exception('Unit price cannot be negative.');
            }

            // Calculate total price
            $quantity = $data['quantity'];
            $unitPrice = $data['unit_price'];
            $discountAmount = $data['discount_amount'] ?? 0;
            $discountPercentage = $data['discount_percentage'] ?? 0;

            $totalPrice = ($quantity * $unitPrice) - $discountAmount;
            if ($discountPercentage > 0) {
                $totalPrice -= ($quantity * $unitPrice) * ($discountPercentage / 100);
            }

            // Create bill item
            $billItem = BillItem::create([
                'bill_id' => $bill->id,
                'item_type' => $data['item_type'] ?? 'manual',
                'source_type' => null,
                'source_id' => null,
                'category' => $data['category'] ?? 'other',
                'item_description' => $data['item_description'],
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'discount_amount' => $discountAmount,
                'discount_percentage' => $discountPercentage,
                'total_price' => max(0, $totalPrice),
            ]);

            // Recalculate bill totals
            $this->calculationService->calculateTotals($bill);

            DB::commit();

            // Log the addition
            $this->auditLogService->logActivity(
                'Manual Bill Item Added',
                'Billing',
                "Added manual item '{$data['item_description']}' to bill #{$bill->bill_number}. Amount: {$totalPrice}",
                'info'
            );

            return [
                'success' => true,
                'data' => $billItem,
                'message' => 'Manual item added successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error adding manual bill item', [
                'bill_id' => $bill->id,
                'data' => $data,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to add manual item: ' . $e->getMessage());
        }
    }

    /**
     * Remove a bill item and recalculate totals
     *
     * @param BillItem $item
     * @return array
     * @throws Exception
     */
    public function removeItem(BillItem $item): array
    {
        try {
            DB::beginTransaction();

            $bill = $item->bill;
            $itemDescription = $item->item_description;
            $itemAmount = $item->total_price;

            // Check if bill is already paid
            if ($bill->payment_status === 'paid') {
                throw new Exception('Cannot remove items from a paid bill.');
            }

            // Delete the item
            $item->delete();

            // Recalculate bill totals
            $this->calculationService->calculateTotals($bill);

            DB::commit();

            // Log the removal
            $this->auditLogService->logActivity(
                'Bill Item Removed',
                'Billing',
                "Removed item '{$itemDescription}' from bill #{$bill->bill_number}. Amount: {$itemAmount}",
                'info'
            );

            return [
                'success' => true,
                'data' => [
                    'removed_item' => $itemDescription,
                    'amount' => $itemAmount,
                ],
                'message' => 'Bill item removed successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error removing bill item', [
                'item_id' => $item->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to remove bill item: ' . $e->getMessage());
        }
    }

    /**
     * Update bill item total and recalculate
     *
     * @param BillItem $item
     * @return array
     * @throws Exception
     */
    public function updateItemTotal(BillItem $item): array
    {
        try {
            DB::beginTransaction();

            $bill = $item->bill;

            // Check if bill is already paid
            if ($bill->payment_status === 'paid') {
                throw new Exception('Cannot update items on a paid bill.');
            }

            // Recalculate item total
            $quantity = $item->quantity;
            $unitPrice = $item->unit_price;
            $discountAmount = $item->discount_amount ?? 0;
            $discountPercentage = $item->discount_percentage ?? 0;

            $totalPrice = ($quantity * $unitPrice) - $discountAmount;
            if ($discountPercentage > 0) {
                $totalPrice -= ($quantity * $unitPrice) * ($discountPercentage / 100);
            }

            $oldTotal = $item->total_price;

            // Update item
            $item->update([
                'total_price' => max(0, $totalPrice),
            ]);

            // Recalculate bill totals
            $this->calculationService->calculateTotals($bill);

            DB::commit();

            // Log the update
            $this->auditLogService->logActivity(
                'Bill Item Updated',
                'Billing',
                "Updated item '{$item->item_description}' on bill #{$bill->bill_number}. Old total: {$oldTotal}, New total: {$totalPrice}",
                'info'
            );

            return [
                'success' => true,
                'data' => $item,
                'message' => 'Bill item updated successfully',
            ];
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Error updating bill item', [
                'item_id' => $item->id,
                'error' => $e->getMessage(),
            ]);

            throw new Exception('Failed to update bill item: ' . $e->getMessage());
        }
    }
}
