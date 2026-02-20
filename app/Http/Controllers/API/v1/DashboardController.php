<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\API\BaseApiController;
use App\Models\Sale;
use App\Models\Medicine;
use App\Models\MedicineAlert;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DashboardController extends BaseApiController
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
    public function stats(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        // Calculate key metrics
        $stats = [
            'total_medicines' => Medicine::count(),
            'total_stock_quantity' => Medicine::sum('stock_quantity'),
            'low_stock_medicines' => Medicine::lowStock()->count(),
            'out_of_stock_medicines' => Medicine::where('stock_quantity', '<=', 0)->count(),
            'expiring_soon_medicines' => Medicine::expiringSoon()->count(),
            'expired_medicines' => Medicine::expired()->count(),
            'total_stock_value' => Medicine::sum(DB::raw('stock_quantity * cost_price')),
            'today_sales' => Sale::whereDate('created_at', today())->count(),
            'today_revenue' => Sale::whereDate('created_at', today())
                ->where('status', 'completed')
                ->sum('grand_total'),
            'month_sales' => Sale::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->count(),
            'month_revenue' => Sale::whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->where('status', 'completed')
                ->sum('grand_total'),
        ];

        return $this->successResponse('Dashboard statistics retrieved successfully', [
            'stats' => $stats
        ]);
    }

    /**
     * Get recent activities.
     */
    public function recentActivities(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $limit = $request->input('limit', 10);

        // Get recent sales
        $recentSales = Sale::with(['patient', 'soldBy'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'type' => 'sale',
                    'description' => 'Sale #' . $sale->sale_id . ' - ' . $sale->grand_total . ' AFN',
                    'user' => $sale->soldBy->name,
                    'created_at' => $sale->created_at,
                ];
            });

        // Get recent alerts
        $recentAlerts = MedicineAlert::with(['medicine'])
            ->latest()
            ->limit($limit)
            ->get()
            ->map(function ($alert) {
                return [
                    'id' => $alert->id,
                    'type' => 'alert',
                    'description' => ucfirst($alert->alert_type) . ' alert for ' . $alert->medicine->name,
                    'user' => 'System',
                    'created_at' => $alert->created_at,
                ];
            });

        // Combine and sort by created_at
        $activities = collect([...$recentSales, ...$recentAlerts])
            ->sortByDesc('created_at')
            ->take($limit)
            ->values();

        return $this->successResponse('Recent activities retrieved successfully', [
            'activities' => $activities
        ]);
    }
}