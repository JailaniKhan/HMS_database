<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\API\BaseApiController;
use App\Models\StockMovement;
use App\Models\Medicine;
use App\Services\InventoryService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class StockController extends BaseApiController
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
     * Display stock overview.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $query = Medicine::with('category');

        // Apply filters
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
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

        $medicines = $query->paginate(15);

        // Calculate summary statistics
        $stats = [
            'total_medicines' => Medicine::count(),
            'in_stock' => Medicine::inStock()->count(),
            'low_stock' => Medicine::lowStock()->count(),
            'out_of_stock' => Medicine::where('stock_quantity', '<=', 0)->count(),
            'total_value' => Medicine::sum(\DB::raw('stock_quantity * cost_price')),
        ];

        return $this->successResponse('Stock overview retrieved successfully', [
            'medicines' => $medicines,
            'stats' => $stats
        ]);
    }

    /**
     * Get stock movements.
     */
    public function movements(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $query = StockMovement::with(['medicine', 'user']);

        // Apply filters
        if ($request->filled('medicine_id')) {
            $query->where('medicine_id', $request->medicine_id);
        }

        if ($request->filled('type')) {
            $query->where('movement_type', $request->type);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $movements = $query->latest()->paginate(20);

        return $this->successResponse('Stock movements retrieved successfully', [
            'movements' => $movements
        ]);
    }

    /**
     * Adjust stock.
     */
    public function adjust(Request $request): JsonResponse
    {
        if (!auth()->user()?->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }

        $validator = Validator::make($request->all(), [
            'medicine_id' => 'required|exists:medicines,id',
            'quantity' => 'required|integer',
            'reason' => 'required|string|max:255',
            'type' => 'required|in:add,subtract,set',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors());
        }

        $medicineId = $request->medicine_id;
        $quantity = $request->quantity;
        $reason = $request->reason;
        $type = $request->type;

        try {
            switch ($type) {
                case 'add':
                    $this->inventoryService->addStock($medicineId, $quantity, $reason, null, Auth::id());
                    break;
                case 'subtract':
                    $this->inventoryService->deductStock($medicineId, abs($quantity), $reason, null, Auth::id());
                    break;
                case 'set':
                    $this->inventoryService->setStockLevel($medicineId, $quantity, $reason, Auth::id());
                    break;
            }

            return $this->successResponse('Stock adjusted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to adjust stock: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get stock valuation.
     */
    public function valuation(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $query = Medicine::query();

        // Apply filters
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $medicines = $query->get();

        $valuation = $medicines->map(function ($medicine) {
            return [
                'id' => $medicine->id,
                'name' => $medicine->name,
                'stock_quantity' => $medicine->stock_quantity,
                'cost_price' => $medicine->cost_price,
                'sale_price' => $medicine->sale_price,
                'cost_value' => $medicine->stock_value_at_cost,
                'sale_value' => $medicine->stock_value_at_sale,
                'potential_profit' => $medicine->potential_profit,
            ];
        });

        $totals = [
            'total_cost_value' => $valuation->sum('cost_value'),
            'total_sale_value' => $valuation->sum('sale_value'),
            'total_potential_profit' => $valuation->sum('potential_profit'),
        ];

        return $this->successResponse('Stock valuation retrieved successfully', [
            'valuation' => $valuation,
            'totals' => $totals
        ]);
    }

    /**
     * Get stock alerts.
     */
    public function alerts(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $lowStock = Medicine::lowStock()->with('category')->get();
        $outOfStock = Medicine::where('stock_quantity', '<=', 0)->with('category')->get();
        $expiringSoon = Medicine::expiringSoon()->with('category')->get();
        $expired = Medicine::expired()->with('category')->get();

        $alerts = [
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
            'expiring_soon' => $expiringSoon,
            'expired' => $expired,
        ];

        return $this->successResponse('Stock alerts retrieved successfully', [
            'alerts' => $alerts,
            'summary' => [
                'low_stock_count' => $lowStock->count(),
                'out_of_stock_count' => $outOfStock->count(),
                'expiring_soon_count' => $expiringSoon->count(),
                'expired_count' => $expired->count(),
            ]
        ]);
    }
}