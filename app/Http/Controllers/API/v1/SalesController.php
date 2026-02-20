<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\API\BaseApiController;
use App\Models\Sale;
use App\Models\SalesItem;
use App\Services\SalesService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class SalesController extends BaseApiController
{
    protected SalesService $salesService;

    public function __construct(SalesService $salesService)
    {
        $this->salesService = $salesService;
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
     * Display a listing of sales.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $query = Sale::with(['items.medicine', 'patient', 'soldBy']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
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
                $q->where('sale_id', 'like', '%' . $search . '%')
                  ->orWhereHas('patient', function ($pq) use ($search) {
                      $pq->where('first_name', 'like', '%' . $search . '%')
                         ->orWhere('patient_id', 'like', '%' . $search . '%');
                  });
            });
        }

        $sales = $query->latest()->paginate(15);

        return $this->successResponse('Sales retrieved successfully', [
            'sales' => $sales
        ]);
    }

    /**
     * Store a newly created sale.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $validator = Validator::make($request->all(), [
            'patient_id' => 'nullable|exists:patients,id',
            'prescription_id' => 'nullable|exists:prescriptions,id',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount' => 'nullable|numeric|min:0|max:100',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,card,bank_transfer,insurance',
            'notes' => 'nullable|string',
            'is_prescription_sale' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors());
        }

        try {
            $sale = $this->salesService->processSale($request->all(), Auth::id());

            return $this->successResponse('Sale created successfully', [
                'sale' => $sale->load(['items.medicine', 'patient', 'soldBy'])
            ], 201);
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to process sale: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Display the specified sale.
     */
    public function show(Sale $sale): JsonResponse
    {
        $this->authorizePharmacyAccess();

        return $this->successResponse('Sale retrieved successfully', [
            'sale' => $sale->load(['items.medicine', 'patient', 'soldBy'])
        ]);
    }

    /**
     * Void the specified sale.
     */
    public function void(Request $request, Sale $sale): JsonResponse
    {
        if (!auth()->user()?->hasPermission('edit-sales')) {
            abort(403, 'Unauthorized access');
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors());
        }

        if ($sale->status !== 'completed') {
            return $this->errorResponse('Only completed sales can be voided', 422);
        }

        try {
            $this->salesService->voidSale($sale, $request->reason, Auth::id());

            return $this->successResponse('Sale voided successfully');
        } catch (\Exception $e) {
            return $this->errorResponse('Failed to void sale: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get receipt for the specified sale.
     */
    public function receipt(Sale $sale): JsonResponse
    {
        $this->authorizePharmacyAccess();

        // Generate receipt data
        $receipt = [
            'sale_id' => $sale->sale_id,
            'date' => $sale->created_at->format('Y-m-d H:i:s'),
            'customer' => $sale->patient ? $sale->patient->full_name : 'Walk-in Customer',
            'items' => $sale->items->map(function ($item) {
                return [
                    'medicine' => $item->medicine->name,
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'total' => $item->total_price,
                    'discount' => $item->discount,
                ];
            }),
            'subtotal' => $sale->total_amount,
            'discount' => $sale->discount,
            'tax' => $sale->tax,
            'total' => $sale->grand_total,
            'payment_method' => $sale->payment_method,
            'sold_by' => $sale->soldBy->name,
        ];

        return $this->successResponse('Receipt generated successfully', [
            'receipt' => $receipt
        ]);
    }

    /**
     * Get items for the specified sale.
     */
    public function items(Sale $sale): JsonResponse
    {
        $this->authorizePharmacyAccess();

        return $this->successResponse('Sale items retrieved successfully', [
            'items' => $sale->items()->with('medicine')->get()
        ]);
    }
}