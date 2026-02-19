<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\StockMovement;
use App\Models\MedicineAlert;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the pharmacy dashboard.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }

        // Get dashboard statistics
        $stats = $this->getDashboardStats();
        
        // Get recent activities
        $recentActivities = $this->getRecentActivities();
        
        // Get low stock medicines (stock_quantity <= 10)
        $lowStockMedicines = Medicine::where('stock_quantity', '>', 0)
            ->where('stock_quantity', '<=', 10)
            ->orderBy('stock_quantity', 'asc')
            ->limit(5)
            ->get(['id', 'name', 'stock_quantity as quantity']);
        
        // Get expiring medicines (within 30 days)
        $expiringMedicines = Medicine::whereDate('expiry_date', '>=', now())
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->orderBy('expiry_date', 'asc')
            ->limit(5)
            ->get(['id', 'name', 'expiry_date'])
            ->map(function ($medicine) {
                $expiryDate = \Carbon\Carbon::parse($medicine->expiry_date);
                $medicine->daysUntilExpiry = now()->diffInDays($expiryDate, false);
                return $medicine;
            });

        return Inertia::render('Pharmacy/Dashboard', [
            'stats' => $stats,
            'recentActivities' => $recentActivities,
            'lowStockMedicines' => $lowStockMedicines,
            'expiringMedicines' => $expiringMedicines,
        ]);
    }

    /**
     * Get dashboard statistics
     */
    private function getDashboardStats(): array
    {
        $today = now()->startOfDay();
        
        // Valid sale statuses for revenue calculation (exclude voided, cancelled, refunded)
        $validStatuses = ['completed', 'pending'];
        
        // Total medicines count
        $totalMedicines = Medicine::count();
        
        // Total stock quantity (sum of all medicine stock)
        $totalStockQuantity = Medicine::sum('stock_quantity');
        
        // Today's sales count (only completed sales)
        $todaySales = Sale::whereDate('created_at', $today)
            ->whereIn('status', $validStatuses)
            ->count();
        
        // Today's revenue (only completed/pending sales)
        $todayRevenue = Sale::whereDate('created_at', $today)
            ->whereIn('status', $validStatuses)
            ->sum('grand_total');
        
        // Total revenue (all time, only completed/pending sales)
        $totalRevenue = Sale::whereIn('status', $validStatuses)
            ->sum('grand_total');
        
        // Calculate Today's Profit - 30% profit margin on revenue
        // This is a simplified calculation: Profit = Revenue * 0.30 (30% margin)
        $todayProfit = $todayRevenue * 0.30;
        
        // Calculate Total Profit - 30% profit margin on revenue
        $totalProfit = $totalRevenue * 0.30;
        
        // Low stock count (stock_quantity <= 10)
        $lowStockCount = Medicine::where('stock_quantity', '>', 0)
            ->where('stock_quantity', '<=', 10)
            ->count();
        
        // Expiring soon count (within 30 days)
        $expiringSoonCount = Medicine::whereDate('expiry_date', '>=', now())
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->count();
        
        // Critical alerts count (out of stock + expired)
        $outOfStockCount = Medicine::where('stock_quantity', '<=', 0)->count();
        $expiredCount = Medicine::whereDate('expiry_date', '<', now())->count();
        $criticalAlerts = $outOfStockCount + $expiredCount;

        return [
            'totalMedicines' => $totalMedicines,
            'totalStockQuantity' => $totalStockQuantity,
            'todaySales' => $todaySales,
            'todayRevenue' => $todayRevenue,
            'todayProfit' => $todayProfit,
            'totalRevenue' => $totalRevenue,
            'totalProfit' => $totalProfit,
            'lowStockCount' => $lowStockCount,
            'expiringSoonCount' => $expiringSoonCount,
            'criticalAlerts' => $criticalAlerts,
        ];
    }

    /**
     * Get recent activities
     */
    private function getRecentActivities(): array
    {
        $activities = [];

        // Recent sales
        $recentSales = Sale::with('soldBy')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'type' => 'sale',
                    'description' => "Sale #{$sale->sale_id} - " . number_format($sale->total_amount, 2),
                    'user' => $sale->soldBy->name ?? 'Unknown',
                    'created_at' => $sale->created_at->toISOString(),
                ];
            });

        $activities = array_merge($activities, $recentSales->toArray());

        // Sort by created_at descending
        usort($activities, function ($a, $b) {
            return strtotime($b['created_at']) - strtotime($a['created_at']);
        });

        return array_slice($activities, 0, 10);
    }
}
