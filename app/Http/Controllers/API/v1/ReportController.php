<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\API\BaseApiController;
use App\Models\Sale;
use App\Models\Medicine;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class ReportController extends BaseApiController
{
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
     * Get dashboard statistics.
     */
    public function dashboard(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        // Date range
        $dateFrom = $request->input('date_from', now()->startOfMonth());
        $dateTo = $request->input('date_to', now()->endOfMonth());

        $stats = [
            'total_sales' => Sale::whereBetween('created_at', [$dateFrom, $dateTo])->count(),
            'total_revenue' => Sale::whereBetween('created_at', [$dateFrom, $dateTo])
                ->where('status', 'completed')
                ->sum('grand_total'),
            'total_medicines' => Medicine::count(),
            'low_stock_count' => Medicine::lowStock()->count(),
            'out_of_stock_count' => Medicine::where('stock_quantity', '<=', 0)->count(),
            'expiring_soon_count' => Medicine::expiringSoon()->count(),
            'expired_count' => Medicine::expired()->count(),
            'total_stock_value' => Medicine::sum(DB::raw('stock_quantity * cost_price')),
        ];

        return $this->successResponse('Dashboard statistics retrieved successfully', [
            'stats' => $stats,
            'date_range' => [
                'from' => $dateFrom,
                'to' => $dateTo,
            ]
        ]);
    }

    /**
     * Get sales report.
     */
    public function sales(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $query = Sale::with(['items.medicine', 'patient', 'soldBy']);

        // Apply date filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Apply other filters
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $sales = $query->latest()->paginate(20);

        // Calculate summary
        $summaryQuery = clone $query;
        $summary = [
            'total_sales' => $summaryQuery->count(),
            'total_revenue' => (clone $summaryQuery)->where('status', 'completed')->sum('grand_total'),
            'average_order_value' => $summaryQuery->count() > 0
                ? (clone $summaryQuery)->where('status', 'completed')->sum('grand_total') / $summaryQuery->count()
                : 0,
        ];

        return $this->successResponse('Sales report retrieved successfully', [
            'sales' => $sales,
            'summary' => $summary
        ]);
    }

    /**
     * Get stock report.
     */
    public function stock(Request $request): JsonResponse
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

        $medicines = $query->paginate(20);

        // Calculate stock summary
        $summary = [
            'total_medicines' => Medicine::count(),
            'in_stock' => Medicine::inStock()->count(),
            'low_stock' => Medicine::lowStock()->count(),
            'out_of_stock' => Medicine::where('stock_quantity', '<=', 0)->count(),
            'total_value' => Medicine::sum(DB::raw('stock_quantity * cost_price')),
            'total_potential_revenue' => Medicine::sum(DB::raw('stock_quantity * sale_price')),
        ];

        return $this->successResponse('Stock report retrieved successfully', [
            'medicines' => $medicines,
            'summary' => $summary
        ]);
    }

    /**
     * Get expiry report.
     */
    public function expiry(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $query = Medicine::with('category')->whereNotNull('expiry_date');

        // Apply filters
        if ($request->filled('expiry_status')) {
            switch ($request->expiry_status) {
                case 'expired':
                    $query->whereDate('expiry_date', '<', now());
                    break;
                case 'expiring_soon':
                    $query->whereDate('expiry_date', '>=', now())
                          ->whereDate('expiry_date', '<=', now()->addDays(30));
                    break;
                case 'valid':
                    $query->whereDate('expiry_date', '>', now()->addDays(30));
                    break;
            }
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $medicines = $query->paginate(20);

        // Calculate expiry summary
        $summary = [
            'expired_count' => Medicine::whereNotNull('expiry_date')->whereDate('expiry_date', '<', now())->count(),
            'expiring_soon_count' => Medicine::whereNotNull('expiry_date')
                ->whereDate('expiry_date', '>=', now())
                ->whereDate('expiry_date', '<=', now()->addDays(30))
                ->count(),
            'valid_count' => Medicine::whereNotNull('expiry_date')
                ->whereDate('expiry_date', '>', now()->addDays(30))
                ->count(),
            'expired_value' => Medicine::whereNotNull('expiry_date')
                ->whereDate('expiry_date', '<', now())
                ->sum(DB::raw('stock_quantity * cost_price')),
        ];

        return $this->successResponse('Expiry report retrieved successfully', [
            'medicines' => $medicines,
            'summary' => $summary
        ]);
    }
}