<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRequest;
use App\Models\Sale;
use App\Models\SalesItem;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\Patient;
use App\Services\SalesService;
use App\Services\InventoryService;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class SalesController extends Controller
{
    protected $salesService;
    protected $inventoryService;
    protected $auditLogService;

    public function __construct(
        SalesService $salesService,
        InventoryService $inventoryService,
        AuditLogService $auditLogService
    ) {
        $this->salesService = $salesService;
        $this->inventoryService = $inventoryService;
        $this->auditLogService = $auditLogService;
    }

    /**
     * Display a listing of the sales.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }

        // Determine view type (today, monthly, yearly)
        $view = $request->query('view', 'today');
        $isSuperAdmin = $user->isSuperAdmin();

        // Set date range based on view
        $now = now();
        switch ($view) {
            case 'yearly':
                $year = $request->query('year', $now->year);
                $dateFrom = "{$year}-01-01";
                $dateTo = "{$year}-12-31";
                $periodLabel = "Year {$year}";
                break;
            case 'monthly':
                $year = $request->query('year', $now->year);
                $month = $request->query('month', $now->month);
                $dateFrom = "{$year}-{$month}-01";
                $dateTo = date('Y-m-t', strtotime("{$year}-{$month}-01"));
                $periodLabel = date('F Y', strtotime("{$year}-{$month}-01"));
                break;
            default: // today
                $dateFrom = $now->toDateString();
                $dateTo = $now->toDateString();
                $periodLabel = 'Today';
                $view = 'today';
                break;
        }

        // Build query
        $query = Sale::with(['items.medicine', 'patient', 'soldBy'])
            ->withCount('items');

        // Apply date range
        $query->whereDate('created_at', '>=', $dateFrom)
              ->whereDate('created_at', '<=', $dateTo);

        // Apply search filter
        if ($request->filled('query')) {
            $searchTerm = $request->input('query');
            $query->where(function ($q) use ($searchTerm) {
                $q->where('sale_id', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('patient', function ($pq) use ($searchTerm) {
                      $pq->where('first_name', 'like', '%' . $searchTerm . '%')
                         ->orWhere('father_name', 'like', '%' . $searchTerm . '%')
                         ->orWhere('patient_id', 'like', '%' . $searchTerm . '%');
                  })
                  ->orWhereHas('soldBy', function ($sq) use ($searchTerm) {
                      $sq->where('name', 'like', '%' . $searchTerm . '%');
                  });
            });
        }

        // Apply category filter
        if ($request->filled('category') && $request->category !== 'all') {
            $query->whereHas('items.medicine.category', function ($cq) use ($request) {
                $cq->where('name', $request->category);
            });
        }

        // Pagination
        $perPage = 15;
        $sales = $query->latest()->paginate($perPage)->withQueryString();

        // Transform sales data for the dashboard
        $salesData = $sales->map(function ($sale) {
            return [
                'id' => $sale->id,
                'sale_id' => $sale->sale_id,
                'sale_date' => $sale->created_at->toISOString(),
                'status' => $sale->status,
                'patient' => $sale->patient ? [
                    'id' => $sale->patient->id,
                    'name' => $sale->patient->first_name . ' ' . $sale->patient->father_name,
                ] : null,
                'pharmacist' => $sale->soldBy ? [
                    'id' => $sale->soldBy->id,
                    'name' => $sale->soldBy->name,
                ] : null,
                'products' => $sale->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->medicine->name,
                        'quantity' => $item->quantity,
                        'unit_price' => $item->unit_price,
                        'discount_percentage' => $item->discount_percentage ?? 0,
                        'final_price' => $item->total_price,
                    ];
                }),
                'products_count' => $sale->items->count(),
                'grand_total' => $sale->grand_total,
                'fee' => $sale->tax_amount ?? 0,
                'discount' => $sale->discount_amount ?? 0,
            ];
        });

        // Calculate summary statistics
        $summaryQuery = Sale::whereDate('created_at', '>=', $dateFrom)
                           ->whereDate('created_at', '<=', $dateTo);

        $summary = [
            'total_revenue' => (float) $summaryQuery->where('status', 'completed')->sum('grand_total'),
            'yearly_revenue' => (float) Sale::whereYear('created_at', $now->year)
                                          ->where('status', 'completed')->sum('grand_total'),
            'total_sales' => $summaryQuery->count(),
            'completed_count' => $summaryQuery->where('status', 'completed')->count(),
            'cancelled_count' => $summaryQuery->where('status', 'cancelled')->count(),
            'pending_count' => $summaryQuery->where('status', 'pending')->count(),
            'refunded_count' => $summaryQuery->where('status', 'refunded')->count(),
        ];

        // Get categories for filter
        $categories = MedicineCategory::select('id', 'name')
            ->whereHas('medicines', function ($q) {
                $q->where('quantity', '>', 0);
            })
            ->get()
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                ];
            });

        // Navigation logic
        $navigation = [
            'can_go_next' => false,
            'can_go_prev' => false,
            'next_params' => [],
            'prev_params' => [],
        ];

        if ($view === 'today') {
            $currentDate = $now->toDateString();
            $prevDate = $now->copy()->subDay()->toDateString();
            $nextDate = $now->copy()->addDay()->toDateString();

            $navigation['can_go_prev'] = true;
            $navigation['can_go_next'] = $nextDate <= $now->toDateString();
            $navigation['prev_params'] = ['view' => 'today', 'day' => $now->copy()->subDay()->day, 'month' => $now->copy()->subDay()->month, 'year' => $now->copy()->subDay()->year];
            if ($navigation['can_go_next']) {
                $navigation['next_params'] = ['view' => 'today', 'day' => $now->copy()->addDay()->day, 'month' => $now->copy()->addDay()->month, 'year' => $now->copy()->addDay()->year];
            }
        } elseif ($view === 'monthly') {
            $currentMonth = $now->month;
            $currentYear = $now->year;
            $prevMonth = $currentMonth - 1;
            $prevYear = $currentYear;
            if ($prevMonth < 1) {
                $prevMonth = 12;
                $prevYear--;
            }
            $nextMonth = $currentMonth + 1;
            $nextYear = $currentYear;
            if ($nextMonth > 12) {
                $nextMonth = 1;
                $nextYear++;
            }

            $navigation['can_go_prev'] = true;
            $navigation['can_go_next'] = ($nextYear < $now->year) || ($nextYear === $now->year && $nextMonth <= $now->month);
            $navigation['prev_params'] = ['view' => 'monthly', 'month' => $prevMonth, 'year' => $prevYear];
            if ($navigation['can_go_next']) {
                $navigation['next_params'] = ['view' => 'monthly', 'month' => $nextMonth, 'year' => $nextYear];
            }
        } elseif ($view === 'yearly') {
            $currentYear = $now->year;
            $navigation['can_go_prev'] = true;
            $navigation['can_go_next'] = ($request->query('year', $now->year) + 1) <= $now->year;
            $navigation['prev_params'] = ['view' => 'yearly', 'year' => $request->query('year', $now->year) - 1];
            if ($navigation['can_go_next']) {
                $navigation['next_params'] = ['view' => 'yearly', 'year' => $request->query('year', $now->year) + 1];
            }
        }

        return Inertia::render('Pharmacy/Sales/SalesDashboard', [
            'sales' => $salesData,
            'filters' => [
                'view' => $view,
                'year' => $request->query('year', $now->year),
                'month' => $request->query('month', $now->month),
                'day' => $request->query('day', $now->day),
            ],
            'summary' => $summary,
            'categories' => $categories,
            'navigation' => $navigation,
            'is_super_admin' => $isSuperAdmin,
            'period_label' => $periodLabel,
            'pagination' => [
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
                'per_page' => $sales->perPage(),
                'total' => $sales->total(),
                'from' => $sales->firstItem(),
                'to' => $sales->lastItem(),
                'has_more_pages' => $sales->hasMorePages(),
            ],
        ]);
    }

    /**
     * Display the sales dashboard.
     */
    public function dashboard(Request $request): Response
    {
        // Simply call the index method with dashboard-specific parameters
        return $this->index($request);
    }

    /**
     * Show the form for creating a new sale.
     */
    public function create(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-sales')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::where('quantity', '>', 0)
            ->with('category')
            ->get();
        
        $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name', 'phone')
            ->orderBy('first_name')
            ->get();
        
        // Get tax rate from settings (default to 0)
        $taxRate = config('pharmacy.tax_rate', 0);
        
        return Inertia::render('Pharmacy/Sales/Create', [
            'medicines' => $medicines,
            'patients' => $patients,
            'taxRate' => $taxRate,
        ]);
    }

    /**
     * Show the dispense form for prescription sales.
     */
    public function dispense(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-sales')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::where('quantity', '>', 0)
            ->with('category')
            ->get();
        
        $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name', 'phone')
            ->orderBy('first_name')
            ->get();
        
        // Get pending prescriptions - only if table exists
        $prescriptions = [];
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('prescriptions')) {
                $prescriptions = \App\Models\Prescription::where('status', 'pending')
                    ->with(['patient', 'doctor', 'items.medicine'])
                    ->get();
            }
        } catch (\Exception $e) {
            // Prescriptions table doesn't exist, return empty array
            $prescriptions = [];
        }
        
        // Get tax rate from settings (default to 0)
        $taxRate = config('pharmacy.tax_rate', 0);
        
        return Inertia::render('Pharmacy/Sales/Dispense', [
            'medicines' => $medicines,
            'patients' => $patients,
            'prescriptions' => $prescriptions,
            'taxRate' => $taxRate,
        ]);
    }

    /**
     * Store a newly created sale in storage.
     */
    public function store(StoreSaleRequest $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-sales')) {
            abort(403, 'Unauthorized access');
        }
        
        $validated = $request->validated();
        
        // Debug logging
        Log::info('Sale creation started', [
            'user_id' => $user->id,
            'items_count' => count($validated['items'] ?? []),
            'payment_method' => $validated['payment_method'] ?? 'none',
        ]);
        
        try {
            DB::beginTransaction();
            
            // Process the sale using SalesService
            $sale = $this->salesService->processSale($validated, $user->id);
            
            // Debug logging
            Log::info('Sale processed successfully', [
                'sale_id' => $sale->id,
                'sale_code' => $sale->sale_id,
            ]);
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Create Sale',
                'Pharmacy',
                "Created sale {$sale->sale_id} for " . ($sale->patient ? $sale->patient->full_name : 'walk-in customer'),
                'info'
            );

            DB::commit();
            
            Log::info('Sale transaction committed', ['sale_id' => $sale->id]);
            
            return redirect()->route('pharmacy.sales.receipt', $sale->id)
                ->with('success', 'Sale completed successfully.');
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log the error with full stack trace
            Log::error('Sale creation failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'validated_data' => $validated,
            ]);
            
            // Log the error
            $this->auditLogService->logActivity(
                'Sale Failed',
                'Pharmacy',
                "Failed to create sale: {$e->getMessage()}",
                'error'
            );
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to process sale: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified sale.
     */
    public function show($id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $sale = Sale::with(['items.medicine', 'patient', 'soldBy'])->findOrFail($id);
        
        // Build timeline
        $timeline = [];
        
        // Add creation event
        $timeline[] = [
            'id' => 1,
            'action' => 'Sale Created',
            'description' => 'Sale was created and processed',
            'created_at' => $sale->created_at,
            'user' => $sale->soldBy,
        ];
        
        // Add void event if applicable
        if ($sale->status === 'cancelled' || $sale->status === 'refunded') {
            $timeline[] = [
                'id' => 2,
                'action' => 'Sale ' . ucfirst($sale->status),
                'description' => $sale->void_reason ?? 'Sale was ' . $sale->status,
                'created_at' => $sale->updated_at,
                'user' => null,
            ];
        }
        
        return Inertia::render('Pharmacy/Sales/Show', [
            'sale' => $sale,
            'timeline' => $timeline,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        // Sales should not be editable after creation to maintain transaction integrity
        abort(404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // Sales should not be editable after creation to maintain transaction integrity
        abort(404);
    }

    /**
     * Void the specified sale.
     */
    public function void(string $id)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('delete-sales')) {
            abort(403, 'Unauthorized access');
        }
        
        try {
            DB::beginTransaction();
            
            $sale = Sale::findOrFail($id);
            
            // Restore stock for voided sale
            $this->salesService->restoreStock($sale);
            
            // Mark sale as cancelled
            $sale->update([
                'status' => 'cancelled',
                'voided_by' => $user->id,
                'voided_at' => now(),
            ]);
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Void Sale',
                'Pharmacy',
                "Voided sale {$sale->sale_id}",
                'warning'
            );
            
            DB::commit();
            
            return redirect()->route('pharmacy.sales.index')
                ->with('success', 'Sale voided successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to void sale: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the receipt for the specified sale.
     */
    public function receipt(string $id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $sale = Sale::with(['items.medicine', 'patient', 'soldBy'])->findOrFail($id);
        
        return Inertia::render('Pharmacy/Sales/Receipt', [
            'sale' => $sale,
        ]);
    }

    /**
     * Print the receipt for the specified sale.
     */
    public function printReceipt(string $id)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $sale = Sale::with(['items.medicine', 'patient', 'soldBy'])->findOrFail($id);
        
        return Inertia::render('Pharmacy/Sales/PrintReceipt', [
            'sale' => $sale,
        ]);
    }

    /**
     * Export sales data.
     */
    public function export(Request $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $query = Sale::with(['items.medicine', 'patient', 'soldBy']);
        
        // Apply filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        
        $sales = $query->latest()->get();
        
        // Generate CSV or Excel export
        $filename = 'pharmacy_sales_' . now()->format('Y_m_d_H_i_s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"$filename\"",
        ];
        
        $callback = function () use ($sales) {
            $file = fopen('php://output', 'w');
            
            // Header row
            fputcsv($file, [
                'Sale ID',
                'Date',
                'Patient',
                'Items',
                'Subtotal',
                'Discount',
                'Total',
                'Payment Method',
                'Status',
                'Sold By',
            ]);
            
            // Data rows
            foreach ($sales as $sale) {
                $items = $sale->items->map(function ($item) {
                    return $item->medicine->name . ' (x' . $item->quantity . ')';
                })->implode(', ');
                
                fputcsv($file, [
                    $sale->sale_id,
                    $sale->created_at->format('Y-m-d H:i:s'),
                    $sale->patient ? $sale->patient->full_name : 'Walk-in Customer',
                    $items,
                    $sale->subtotal,
                    $sale->discount_amount ?? 0,
                    $sale->grand_total,
                    $sale->payment_method,
                    $sale->status,
                    $sale->soldBy ? $sale->soldBy->name : 'N/A',
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }

}
