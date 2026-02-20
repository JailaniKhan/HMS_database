<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\API\BaseApiController;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PurchaseController extends BaseApiController
{
    protected InventoryService $inventoryService;

    public function __construct(InventoryService $inventoryService)
    {
        $this->inventoryService = $inventoryService;
    }

    /**
     * Check if user can access pharmacy
     */
    private function authorizePharmacyAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Display a listing of purchases.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $query = Purchase::with(['items.medicine', 'supplier', 'createdBy']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->supplier_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('purchase_id', 'like', '%' . $search . '%')
                  ->orWhereHas('supplier', function ($sq) use ($search) {
                      $sq->where('name', 'like', '%' . $search . '%');
                  });
            });
        }

        $purchases = $query->latest()->paginate(15);

        return $this->successResponse('Purchases retrieved successfully', [
            'purchases' => $purchases
        ]);
    }

    /**
     * Store a newly created purchase.
     */
    public function store(Request $request): JsonResponse
    {
        if (!auth()->user()?->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }

        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_cost' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
            'expected_delivery_date' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors());
        }

        DB::transaction(function () use ($request) {
            $purchase = Purchase::create([
                'purchase_id' => 'PUR-' . time() . '-' . rand(100, 999),
                'supplier_id' => $request->supplier_id,
                'status' => 'ordered',
                'total_amount' => collect($request->items)->sum(function ($item) {
                    return $item['quantity'] * $item['unit_cost'];
                }),
                'notes' => $request->notes,
                'expected_delivery_date' => $request->expected_delivery_date,
                'created_by' => Auth::id(),
            ]);

            foreach ($request->items as $item) {
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'medicine_id' => $item['medicine_id'],
                    'quantity_ordered' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'],
                    'total_cost' => $item['quantity'] * $item['unit_cost'],
                ]);
            }
        });

        return $this->successResponse('Purchase created successfully', [], 201);
    }

    /**
     * Display the specified purchase.
     */
    public function show(Purchase $purchase): JsonResponse
    {
        $this->authorizePharmacyAccess();

        return $this->successResponse('Purchase retrieved successfully', [
            'purchase' => $purchase->load(['items.medicine', 'supplier', 'createdBy', 'receivedBy'])
        ]);
    }

    /**
     * Receive the specified purchase.
     */
    public function receive(Request $request, Purchase $purchase): JsonResponse
    {
        if (!auth()->user()?->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }

        if ($purchase->status !== 'ordered') {
            return $this->errorResponse('Only ordered purchases can be received', 422);
        }

        $validator = Validator::make($request->all(), [
            'items' => 'required|array',
            'items.*.id' => 'required|exists:purchase_items,id',
            'items.*.quantity_received' => 'required|integer|min:0',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors());
        }

        DB::transaction(function () use ($purchase, $request) {
            foreach ($request->items as $itemData) {
                $item = PurchaseItem::find($itemData['id']);
                if ($item && $item->purchase_id === $purchase->id) {
                    $item->update([
                        'quantity_received' => $itemData['quantity_received'],
                        'received_at' => now(),
                    ]);

                    // Add stock to inventory
                    if ($itemData['quantity_received'] > 0) {
                        $this->inventoryService->addStock(
                            $item->medicine_id,
                            $itemData['quantity_received'],
                            'Purchase: ' . $purchase->purchase_id,
                            $purchase->id
                        );
                    }
                }
            }

            $purchase->update([
                'status' => 'received',
                'received_at' => now(),
                'received_by' => Auth::id(),
            ]);
        });

        return $this->successResponse('Purchase received successfully');
    }

    /**
     * Cancel the specified purchase.
     */
    public function cancel(Request $request, Purchase $purchase): JsonResponse
    {
        if (!auth()->user()?->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors());
        }

        if (!in_array($purchase->status, ['ordered', 'received'])) {
            return $this->errorResponse('Purchase cannot be cancelled', 422);
        }

        $purchase->update([
            'status' => 'cancelled',
            'notes' => ($purchase->notes ? $purchase->notes . "\n" : '') . 'Cancelled: ' . $request->reason,
        ]);

        return $this->successResponse('Purchase cancelled successfully');
    }
}