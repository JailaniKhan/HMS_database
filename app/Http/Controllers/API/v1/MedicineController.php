<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\API\BaseApiController;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class MedicineController extends BaseApiController
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
     * Check if user can modify medicines
     */
    private function authorizeMedicineModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Display a listing of medicines.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $query = Medicine::with('category');

        // Apply filters
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%' . $search . '%')
                  ->orWhere('medicine_id', 'like', '%' . $search . '%')
                  ->orWhere('manufacturer', 'like', '%' . $search . '%');
            });
        }

        if ($request->filled('stock_status')) {
            switch ($request->stock_status) {
                case 'low_stock':
                    $query->lowStock();
                    break;
                case 'out_of_stock':
                    $query->where('stock_quantity', '<=', 0);
                    break;
                case 'in_stock':
                    $query->inStock();
                    break;
            }
        }

        if ($request->filled('expiry_status')) {
            switch ($request->expiry_status) {
                case 'expired':
                    $query->expired();
                    break;
                case 'expiring_soon':
                    $query->expiringSoon();
                    break;
            }
        }

        $medicines = $query->paginate(15);

        return $this->successResponse([
            'medicines' => $medicines
        ], 'Medicines retrieved successfully');
    }

    /**
     * Store a newly created medicine.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizeMedicineModify();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'medicine_code' => 'required|string|max:100|unique:medicines,medicine_code',
            'medicine_id' => 'required|string|max:100|unique:medicines,medicine_id',
            'category_id' => 'required|exists:medicine_categories,id',
            'cost_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'manufacturer' => 'required|string|max:255',
            'expiry_date' => 'required|date',
            'batch_number' => 'required|string|max:100',
            'description' => 'nullable|string',
            'strength' => 'nullable|string',
            'barcode' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors()->toArray());
        }

        DB::transaction(function () use ($request) {
            Medicine::create($request->all());
        });

        return $this->successResponse([], 'Medicine created successfully', 201);
    }

    /**
     * Display the specified medicine.
     */
    public function show(Medicine $medicine): JsonResponse
    {
        $this->authorizePharmacyAccess();

        return $this->successResponse([
            'medicine' => $medicine->load('category')
        ], 'Medicine retrieved successfully');
    }

    /**
     * Update the specified medicine.
     */
    public function update(Request $request, Medicine $medicine): JsonResponse
    {
        $this->authorizeMedicineModify();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'medicine_id' => 'required|string|max:100|unique:medicines,medicine_id,' . $medicine->id,
            'category_id' => 'required|exists:medicine_categories,id',
            'cost_price' => 'required|numeric|min:0',
            'sale_price' => 'required|numeric|min:0',
            'stock_quantity' => 'required|integer|min:0',
            'reorder_level' => 'required|integer|min:0',
            'manufacturer' => 'required|string|max:255',
            'expiry_date' => 'required|date',
            'batch_number' => 'required|string|max:100',
            'description' => 'nullable|string',
            'strength' => 'nullable|string',
            'barcode' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors()->toArray());
        }

        DB::transaction(function () use ($medicine, $request) {
            $medicine->update($request->all());
        });

        return $this->successResponse('Medicine updated successfully');
    }

    /**
     * Remove the specified medicine.
     */
    public function destroy(Medicine $medicine): JsonResponse
    {
        if (!auth()->user()?->hasPermission('delete-medicines')) {
            abort(403, 'Unauthorized access');
        }

        DB::transaction(function () use ($medicine) {
            $medicine->delete();
        });

        return $this->successResponse('Medicine deleted successfully');
    }

    /**
     * Get stock history for a medicine.
     */
    public function stockHistory(Medicine $medicine): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $history = $medicine->stockMovements()
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return $this->successResponse([
            'history' => $history
        ], 'Stock history retrieved successfully');
    }

    /**
     * Adjust stock for a medicine.
     */
    public function adjustStock(Request $request, Medicine $medicine): JsonResponse
    {
        $this->authorizeMedicineModify();

        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer',
            'reason' => 'required|string|max:255',
            'type' => 'required|in:add,subtract,set',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors()->toArray());
        }

        $quantity = $request->quantity;
        $reason = $request->reason;
        $type = $request->type;

        switch ($type) {
            case 'add':
                $this->inventoryService->addStock($medicine->id, $quantity, $reason);
                break;
            case 'subtract':
                $this->inventoryService->deductStock($medicine->id, abs($quantity), $reason);
                break;
            case 'set':
                $this->inventoryService->setStockLevel($medicine->id, $quantity, $reason);
                break;
        }

        return $this->successResponse('Stock adjusted successfully');
    }
}