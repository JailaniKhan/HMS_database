<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\MedicineAlert;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Display the reports dashboard.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        // Calculate dashboard stats
        $stats = [
            'totalSales' => Sale::count(),
            'totalRevenue' => Sale::where('status', 'completed')->sum('grand_total'),
            'totalMedicines' => Medicine::count(),
            'lowStockCount' => Medicine::where('quantity', '<=', 10)->where('quantity', '>', 0)->count(),
            'expiringSoonCount' => Medicine::whereNotNull('expiry_date')
                ->where('expiry_date', '<=', now()->addDays(30))
                ->where('expiry_date', '>=', now())
                ->count(),
            'expiredCount' => Medicine::whereNotNull('expiry_date')
                ->where('expiry_date', '<', now())
                ->count(),
        ];
        
        return Inertia::render('Pharmacy/Reports/Index', [
            'stats' => $stats,
        ]);
    }

    /**
     * Display the sales report.
     */
    public function sales(Request $request): Response
    {
        $user = Auth::user();
        
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $query = Sale::with(['items.medicine', 'patient', 'soldBy']);
        
        // Apply date filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        
        // Apply payment method filter
        if ($request->filled('payment_method')) {
            $query->where('payment_method', $request->payment_method);
        }
        
        // Apply status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        
        $sales = $query->latest()->paginate(15)->withQueryString();
        
        // Calculate summary statistics
        $summaryQuery = Sale::query();
        if ($request->filled('date_from')) {
            $summaryQuery->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $summaryQuery->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('payment_method')) {
            $summaryQuery->where('payment_method', $request->payment_method);
        }
        if ($request->filled('status')) {
            $summaryQuery->where('status', $request->status);
        }
        
        $totalSales = $summaryQuery->count();
        $totalRevenue = (clone $summaryQuery)->where('status', 'completed')->sum('grand_total');
        $averageOrderValue = $totalSales > 0 ? $totalRevenue / $totalSales : 0;
        $totalItems = (clone $summaryQuery)->withCount('items')->get()->sum('items_count');
        
        // Payment method breakdown
        $paymentBreakdown = (clone $summaryQuery)
            ->where('status', 'completed')
            ->select('payment_method', DB::raw('SUM(grand_total) as total'))
            ->groupBy('payment_method')
            ->pluck('total', 'payment_method')
            ->toArray();
        
        // Daily sales for chart
        $dailySales = (clone $summaryQuery)
            ->where('created_at', '>=', now()->subDays(30))
            ->select(
                DB::raw('DATE(created_at) as date'),
                DB::raw('COUNT(*) as sales'),
                DB::raw('SUM(grand_total) as revenue')
            )
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->toArray();
        
        return Inertia::render('Pharmacy/Reports/SalesReport', [
            'sales' => $sales,
            'filters' => [
                'date_from' => $request->query('date_from', ''),
                'date_to' => $request->query('date_to', ''),
                'payment_method' => $request->query('payment_method', ''),
                'status' => $request->query('status', ''),
            ],
            'summary' => [
                'totalSales' => $totalSales,
                'totalRevenue' => $totalRevenue,
                'averageOrderValue' => $averageOrderValue,
                'totalItems' => $totalItems,
                'paymentBreakdown' => $paymentBreakdown,
                'dailySales' => $dailySales,
            ],
        ]);
    }

    /**
     * Display the stock report.
     */
    public function stock(Request $request): Response
    {
        $user = Auth::user();
        
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $query = Medicine::with('category');
        
        // Apply search filter
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('medicine_id', 'like', '%' . $searchTerm . '%');
            });
        }
        
        // Apply stock status filter
        if ($request->filled('stock_status')) {
            switch ($request->stock_status) {
                case 'in_stock':
                    $query->where('quantity', '>', 10); // More than low stock threshold
                    break;
                case 'low_stock':
                    $query->where('quantity', '>', 0)
                          ->where('quantity', '<=', 10);
                    break;
                case 'out_of_stock':
                    $query->where('quantity', '<=', 0);
                    break;
            }
        }
        
        // Apply category filter
        if ($request->filled('category')) {
            $query->where('category_id', $request->category);
        }
        
        $medicines = $query->paginate(15)->withQueryString();
        
        // Calculate summary statistics
        $totalMedicines = Medicine::count();
        $totalValue = Medicine::select(DB::raw('SUM(stock_quantity * unit_price) as total'))->value('total') ?? 0;
        $lowStockCount = Medicine::where('stock_quantity', '>', 0)
            ->whereColumn('stock_quantity', '<=', 'reorder_level')
            ->count();
        $outOfStockCount = Medicine::where('stock_quantity', '<=', 0)->count();
        
        // Category breakdown
        $categoryBreakdown = MedicineCategory::withCount('medicines')
            ->with(['medicines' => function ($q) {
                $q->select(DB::raw('SUM(stock_quantity * unit_price) as value'));
            }])
            ->get()
            ->map(function ($category) {
                return [
                    'name' => $category->name,
                    'count' => $category->medicines_count,
                    'value' => $category->medicines->sum(function ($m) {
                        return $m->stock_quantity * $m->unit_price;
                    }),
                ];
            })
            ->toArray();
        
        $categories = MedicineCategory::select('id', 'name')->orderBy('name')->get();
        
        return Inertia::render('Pharmacy/Reports/StockReport', [
            'medicines' => $medicines,
            'filters' => [
                'stock_status' => $request->query('stock_status', ''),
                'category' => $request->query('category', ''),
                'search' => $request->query('search', ''),
            ],
            'summary' => [
                'totalMedicines' => $totalMedicines,
                'totalValue' => $totalValue,
                'lowStockCount' => $lowStockCount,
                'outOfStockCount' => $outOfStockCount,
                'categoryBreakdown' => $categoryBreakdown,
            ],
            'categories' => $categories,
        ]);
    }

    /**
     * Display the expiry report.
     */
    public function expiry(Request $request): Response
    {
        $user = Auth::user();
        
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $query = Medicine::with('category')->whereNotNull('expiry_date');
        
        // Apply search filter
        if ($request->filled('search')) {
            $searchTerm = $request->search;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('medicine_id', 'like', '%' . $searchTerm . '%')
                  ->orWhere('batch_number', 'like', '%' . $searchTerm . '%');
            });
        }
        
        // Apply expiry status filter
        if ($request->filled('expiry_status')) {
            switch ($request->expiry_status) {
                case 'expired':
                    $query->where('expiry_date', '<', now());
                    break;
                case 'critical':
                    $query->where('expiry_date', '>=', now())
                          ->where('expiry_date', '<=', now()->addDays(7));
                    break;
                case 'warning':
                    $query->where('expiry_date', '>=', now())
                          ->where('expiry_date', '<=', now()->addDays(30));
                    break;
                case 'good':
                    $query->where('expiry_date', '>', now()->addDays(30));
                    break;
            }
        }
        
        // Apply days until expiry filter
        if ($request->filled('days_until_expiry')) {
            if ($request->days_until_expiry === 'expired') {
                $query->where('expiry_date', '<', now());
            } else {
                $days = (int) $request->days_until_expiry;
                $query->where('expiry_date', '>=', now())
                      ->where('expiry_date', '<=', now()->addDays($days));
            }
        }
        
        $medicines = $query->paginate(15)->withQueryString();
        
        // Get active expiry alerts
        $alerts = MedicineAlert::with('medicine')
            ->whereIn('alert_type', ['expired', 'expiring_soon'])
            ->where('status', 'pending')
            ->latest()
            ->get();
        
        // Calculate summary statistics
        $now = now();
        $expiredCount = Medicine::whereNotNull('expiry_date')->where('expiry_date', '<', $now)->count();
        $expiringSoonCount = Medicine::whereNotNull('expiry_date')
            ->where('expiry_date', '>=', $now)
            ->where('expiry_date', '<=', $now->copy()->addDays(7))
            ->count();
        $expiring30Days = Medicine::whereNotNull('expiry_date')
            ->where('expiry_date', '>=', $now)
            ->where('expiry_date', '<=', $now->copy()->addDays(30))
            ->count();
        $expiring60Days = Medicine::whereNotNull('expiry_date')
            ->where('expiry_date', '>=', $now)
            ->where('expiry_date', '<=', $now->copy()->addDays(60))
            ->count();
        $expiring90Days = Medicine::whereNotNull('expiry_date')
            ->where('expiry_date', '>=', $now)
            ->where('expiry_date', '<=', $now->copy()->addDays(90))
            ->count();
        
        // Calculate value at risk (expired + expiring within 30 days)
        $totalValueAtRisk = Medicine::whereNotNull('expiry_date')
            ->where(function ($q) use ($now) {
                $q->where('expiry_date', '<', $now)
                  ->orWhere('expiry_date', '<=', $now->copy()->addDays(30));
            })
            ->select(DB::raw('SUM(stock_quantity * unit_price) as total'))
            ->value('total') ?? 0;
        
        return Inertia::render('Pharmacy/Reports/ExpiryReport', [
            'medicines' => $medicines,
            'alerts' => $alerts,
            'filters' => [
                'expiry_status' => $request->query('expiry_status', ''),
                'days_until_expiry' => $request->query('days_until_expiry', ''),
                'search' => $request->query('search', ''),
            ],
            'summary' => [
                'totalExpiring' => $expiring90Days,
                'expiredCount' => $expiredCount,
                'expiringSoonCount' => $expiringSoonCount,
                'expiring30Days' => $expiring30Days,
                'expiring60Days' => $expiring60Days,
                'expiring90Days' => $expiring90Days,
                'totalValueAtRisk' => $totalValueAtRisk,
            ],
        ]);
    }

    /**
     * Delete all expired medicines.
     */
    public function deleteExpired(Request $request): \Illuminate\Http\RedirectResponse
    {
        $user = Auth::user();
        
        if (!$user->hasPermission('delete-medicine')) {
            abort(403, 'Unauthorized access');
        }
        
        $deletedCount = Medicine::where('expiry_date', '<', now())->delete();
        
        return redirect()->back()->with('success', "Successfully deleted {$deletedCount} expired medicine(ies).");
    }
}
