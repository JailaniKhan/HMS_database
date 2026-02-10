<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use App\Models\Sale;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class StockController extends Controller
{
    /**
     * Display a listing of stock items with statistics.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $query = Medicine::with('category');
        
        // Apply filters
        if ($request->filled('query')) {
            $search = $request->input('query');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('medicine_id', 'like', "%{$search}%")
                  ->orWhere('manufacturer', 'like', "%{$search}%");
            });
        }
        
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }
        
        // Apply stock status filter
        if ($request->filled('stock_status')) {
            $status = $request->input('stock_status');
            switch ($status) {
                case 'in_stock':
                    $query->where('stock_quantity', '>', 0)
                          ->whereRaw('stock_quantity > reorder_level');
                    break;
                case 'low_stock':
                    $query->where('stock_quantity', '>', 0)
                          ->whereRaw('stock_quantity <= reorder_level')
                          ->whereRaw('stock_quantity > reorder_level * 0.5');
                    break;
                case 'out_of_stock':
                    $query->where('stock_quantity', '<=', 0);
                    break;
                case 'critical':
                    $query->where('stock_quantity', '>', 0)
                          ->whereRaw('stock_quantity <= reorder_level * 0.5');
                    break;
            }
        }
        
        $medicines = $query->paginate(10)->withQueryString();
        $categories = MedicineCategory::all();
        
        // Calculate statistics
        $stats = [
            'total_items' => Medicine::count(),
            'in_stock' => Medicine::where('stock_quantity', '>', 0)
                                   ->whereRaw('stock_quantity > reorder_level')
                                   ->count(),
            'low_stock' => Medicine::where('stock_quantity', '>', 0)
                                   ->whereRaw('stock_quantity <= reorder_level')
                                   ->whereRaw('stock_quantity > reorder_level * 0.5')
                                   ->count(),
            'out_of_stock' => Medicine::where('stock_quantity', '<=', 0)->count(),
            'critical_stock' => Medicine::where('stock_quantity', '>', 0)
                                       ->whereRaw('stock_quantity <= reorder_level * 0.5')
                                       ->count(),
            'total_value' => Medicine::where('stock_quantity', '>', 0)
                                     ->sum(DB::raw('stock_quantity * unit_price')),
        ];
        
        return Inertia::render('Pharmacy/Stock/Index', [
            'medicines' => $medicines,
            'categories' => $categories,
            'stats' => $stats,
            'filters' => $request->only(['query', 'category_id', 'stock_status']),
        ]);
    }

    /**
     * Display stock movements history.
     */
    public function movements(Request $request): Response
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $query = StockMovement::with(['medicine', 'user'])
            ->orderBy('created_at', 'desc');
        
        // Apply filters
        if ($request->filled('query')) {
            $search = $request->input('query');
            $query->where(function($q) use ($search) {
                $q->where('notes', 'like', "%{$search}%")
                  ->orWhere('reference_type', 'like', "%{$search}%")
                  ->orWhereHas('medicine', function($mq) use ($search) {
                      $mq->where('name', 'like', "%{$search}%");
                  });
            });
        }
        
        if ($request->filled('medicine_id')) {
            $query->where('medicine_id', $request->input('medicine_id'));
        }
        
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }
        
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        
        $movements = $query->paginate(20)->withQueryString();
        $medicines = Medicine::select('id', 'name')->get();
        
        return Inertia::render('Pharmacy/Stock/Movements', [
            'movements' => $movements,
            'medicines' => $medicines,
            'filters' => $request->only(['query', 'medicine_id', 'type', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Display stock adjustments page.
     */
    public function adjustments(Request $request): Response
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::select('id', 'name', 'medicine_id', 'stock_quantity', 'reorder_level', 'unit_price')
            ->with('category')
            ->get();
        
        // Get recent adjustments (stock movements of type 'adjustment')
        $recentAdjustments = StockMovement::with(['medicine', 'user'])
            ->where('type', 'adjustment')
            ->orWhere('reference_type', 'adjustment')
            ->orderBy('created_at', 'desc')
            ->paginate(10)
            ->withQueryString();
        
        return Inertia::render('Pharmacy/Stock/Adjustments', [
            'medicines' => $medicines,
            'recentAdjustments' => $recentAdjustments,
            'preselectedMedicineId' => $request->input('medicine_id'),
        ]);
    }

    /**
     * Process a stock adjustment.
     */
    public function adjust(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'medicine_id' => 'required|exists:medicines,id',
            'adjustment_type' => 'required|in:add,remove,set',
            'quantity' => 'required|integer|min:1',
            'reason' => 'required|string|in:purchase,damage,return,correction,donation,transfer,other',
            'notes' => 'nullable|string|max:500',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $medicine = Medicine::findOrFail($request->medicine_id);
        $previousStock = $medicine->stock_quantity;
        $quantity = (int) $request->quantity;
        
        // Calculate new stock based on adjustment type
        switch ($request->adjustment_type) {
            case 'add':
                $newStock = $previousStock + $quantity;
                break;
            case 'remove':
                $newStock = max(0, $previousStock - $quantity);
                break;
            case 'set':
                $newStock = $quantity;
                break;
            default:
                $newStock = $previousStock;
        }
        
        // Update medicine stock
        $medicine->update(['stock_quantity' => $newStock]);
        
        // Create stock movement record
        StockMovement::create([
            'medicine_id' => $medicine->id,
            'type' => 'adjustment',
            'quantity' => abs($newStock - $previousStock),
            'previous_stock' => $previousStock,
            'new_stock' => $newStock,
            'reference_type' => 'adjustment',
            'reference_id' => null,
            'notes' => $request->notes ?? "Adjustment: {$request->reason}",
            'user_id' => $user->id,
        ]);
        
        return redirect()->route('pharmacy.stock.adjustments')
            ->with('success', 'Stock adjusted successfully.');
    }

    /**
     * Display stock valuation report.
     */
    public function valuation(Request $request): Response
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::with('category')->get();
        
        $totalValue = $medicines->sum(function ($medicine) {
            return $medicine->stock_quantity * $medicine->unit_price;
        });
        
        $totalItems = $medicines->count();
        
        // Category breakdown
        $categoryBreakdown = $medicines->groupBy('category_id')
            ->map(function ($items) use ($totalValue) {
                $category = $items->first()->category;
                $itemCount = $items->count();
                $categoryValue = $items->sum(function ($item) {
                    return $item->stock_quantity * $item->unit_price;
                });

                // Handle uncategorized medicines
                if ($category === null) {
                    $category = (object) [
                        'id' => 0,
                        'name' => 'Uncategorized',
                        'description' => null,
                        'created_at' => null,
                        'updated_at' => null,
                    ];
                }

                return [
                    'category' => $category,
                    'item_count' => $itemCount,
                    'total_value' => $categoryValue,
                    'percentage' => $totalValue > 0 ? ($categoryValue / $totalValue) * 100 : 0,
                ];
            })
            ->sortByDesc('total_value')
            ->values();
        
        // Status breakdown
        $statusCounts = [
            'in_stock' => 0,
            'low_stock' => 0,
            'out_of_stock' => 0,
            'critical' => 0,
        ];
        $statusValues = [
            'in_stock' => 0,
            'low_stock' => 0,
            'out_of_stock' => 0,
            'critical' => 0,
        ];
        
        foreach ($medicines as $medicine) {
            $itemValue = $medicine->stock_quantity * $medicine->unit_price;
            
            if ($medicine->stock_quantity <= 0) {
                $statusCounts['out_of_stock']++;
                $statusValues['out_of_stock'] += $itemValue;
            } elseif ($medicine->stock_quantity <= $medicine->reorder_level * 0.5) {
                $statusCounts['critical']++;
                $statusValues['critical'] += $itemValue;
            } elseif ($medicine->stock_quantity <= $medicine->reorder_level) {
                $statusCounts['low_stock']++;
                $statusValues['low_stock'] += $itemValue;
            } else {
                $statusCounts['in_stock']++;
                $statusValues['in_stock'] += $itemValue;
            }
        }
        
        $statusBreakdown = [
            [
                'status' => 'in_stock',
                'label' => 'In Stock',
                'item_count' => $statusCounts['in_stock'],
                'total_value' => $statusValues['in_stock'],
                'percentage' => $totalValue > 0 ? ($statusValues['in_stock'] / $totalValue) * 100 : 0,
            ],
            [
                'status' => 'low_stock',
                'label' => 'Low Stock',
                'item_count' => $statusCounts['low_stock'],
                'total_value' => $statusValues['low_stock'],
                'percentage' => $totalValue > 0 ? ($statusValues['low_stock'] / $totalValue) * 100 : 0,
            ],
            [
                'status' => 'out_of_stock',
                'label' => 'Out of Stock',
                'item_count' => $statusCounts['out_of_stock'],
                'total_value' => $statusValues['out_of_stock'],
                'percentage' => $totalValue > 0 ? ($statusValues['out_of_stock'] / $totalValue) * 100 : 0,
            ],
            [
                'status' => 'critical',
                'label' => 'Critical',
                'item_count' => $statusCounts['critical'],
                'total_value' => $statusValues['critical'],
                'percentage' => $totalValue > 0 ? ($statusValues['critical'] / $totalValue) * 100 : 0,
            ],
        ];
        
        // Top valued items
        $topValuedItems = $medicines
            ->map(function ($medicine) {
                return [
                    'id' => $medicine->id,
                    'name' => $medicine->name,
                    'medicine_id' => $medicine->medicine_id,
                    'stock_quantity' => $medicine->stock_quantity,
                    'unit_price' => $medicine->unit_price,
                    'total_value' => $medicine->stock_quantity * $medicine->unit_price,
                    'category' => $medicine->category,
                ];
            })
            ->sortByDesc('total_value')
            ->take(10)
            ->values();
        
        return Inertia::render('Pharmacy/Stock/Valuation', [
            'totalValue' => $totalValue,
            'totalItems' => $totalItems,
            'categoryBreakdown' => $categoryBreakdown,
            'statusBreakdown' => $statusBreakdown,
            'topValuedItems' => $topValuedItems,
        ]);
    }

    /**
     * Export stock data.
     */
    public function export(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $query = Medicine::with('category');
        
        // Apply same filters as index
        if ($request->filled('query')) {
            $search = $request->input('query');
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('medicine_id', 'like', "%{$search}%");
            });
        }
        
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->input('category_id'));
        }
        
        if ($request->filled('stock_status')) {
            $status = $request->input('stock_status');
            switch ($status) {
                case 'in_stock':
                    $query->where('stock_quantity', '>', 0)
                          ->whereRaw('stock_quantity > reorder_level');
                    break;
                case 'low_stock':
                    $query->where('stock_quantity', '>', 0)
                          ->whereRaw('stock_quantity <= reorder_level');
                    break;
                case 'out_of_stock':
                    $query->where('stock_quantity', '<=', 0);
                    break;
                case 'critical':
                    $query->where('stock_quantity', '>', 0)
                          ->whereRaw('stock_quantity <= reorder_level * 0.5');
                    break;
            }
        }
        
        $medicines = $query->get();
        
        // Generate CSV
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="stock-report-' . now()->format('Y-m-d') . '.csv"',
        ];
        
        $callback = function() use ($medicines) {
            $file = fopen('php://output', 'w');
            
            // Headers
            fputcsv($file, ['Medicine ID', 'Name', 'Category', 'Stock Quantity', 'Reorder Level', 'Unit Price', 'Total Value', 'Status']);
            
            foreach ($medicines as $medicine) {
                $status = 'In Stock';
                if ($medicine->stock_quantity <= 0) {
                    $status = 'Out of Stock';
                } elseif ($medicine->stock_quantity <= $medicine->reorder_level * 0.5) {
                    $status = 'Critical';
                } elseif ($medicine->stock_quantity <= $medicine->reorder_level) {
                    $status = 'Low Stock';
                }
                
                fputcsv($file, [
                    $medicine->medicine_id,
                    $medicine->name,
                    $medicine->category?->name ?? 'Uncategorized',
                    $medicine->stock_quantity,
                    $medicine->reorder_level,
                    $medicine->unit_price,
                    $medicine->stock_quantity * $medicine->unit_price,
                    $status,
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }

    /**
     * Export stock movements.
     */
    public function exportMovements(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $query = StockMovement::with(['medicine', 'user'])
            ->orderBy('created_at', 'desc');
        
        // Apply filters
        if ($request->filled('medicine_id')) {
            $query->where('medicine_id', $request->input('medicine_id'));
        }
        
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }
        
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        
        $movements = $query->get();
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="stock-movements-' . now()->format('Y-m-d') . '.csv"',
        ];
        
        $callback = function() use ($movements) {
            $file = fopen('php://output', 'w');
            
            fputcsv($file, ['Date', 'Medicine', 'Type', 'Quantity', 'Previous Stock', 'New Stock', 'Reference', 'User', 'Notes']);
            
            foreach ($movements as $movement) {
                fputcsv($file, [
                    $movement->created_at->format('Y-m-d H:i:s'),
                    $movement->medicine?->name ?? 'Unknown',
                    $movement->type,
                    $movement->quantity,
                    $movement->previous_stock,
                    $movement->new_stock,
                    $movement->reference_type . ($movement->reference_id ? ' #' . $movement->reference_id : ''),
                    $movement->user?->name ?? 'System',
                    $movement->notes,
                ]);
            }
            
            fclose($file);
        };
        
        return response()->stream($callback, 200, $headers);
    }

    /**
     * Display stock report with detailed movements.
     */
    public function report(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::with('category')->get();
        
        return Inertia::render('Pharmacy/Stock/Report', [
            'medicines' => $medicines
        ]);
    }

    /**
     * Get real-time stock information via API.
     */
    public function getRealTimeStock()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::with('category')->get();
        
        return response()->json([
            'status' => 'success',
            'data' => $medicines,
            'timestamp' => now()->format('Y-m-d H:i:s')
        ]);
    }

    /**
     * Update stock for multiple medicines.
     */
    public function bulkUpdate(Request $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'items' => 'required|array',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.new_stock' => 'required|integer|min:0',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $items = $request->items;
        
        foreach ($items as $item) {
            $medicine = Medicine::find($item['medicine_id']);
            if ($medicine) {
                $previousStock = $medicine->stock_quantity;
                $newStock = $item['new_stock'];
                
                $medicine->update([
                    'stock_quantity' => $newStock,
                    'updated_at' => now(),
                ]);
                
                // Log the movement
                if ($previousStock !== $newStock) {
                    StockMovement::create([
                        'medicine_id' => $medicine->id,
                        'type' => $newStock > $previousStock ? 'in' : 'out',
                        'quantity' => abs($newStock - $previousStock),
                        'previous_stock' => $previousStock,
                        'new_stock' => $newStock,
                        'reference_type' => 'adjustment',
                        'user_id' => $user->id,
                        'notes' => 'Bulk stock update',
                    ]);
                }
            }
        }
        
        return redirect()->route('pharmacy.stock.index')->with('success', 'Stock updated successfully.');
    }

    /**
     * Get stock alert information.
     */
    public function alerts(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        // Get low stock medicines
        $lowStock = Medicine::where('stock_quantity', '<=', 10)
                    ->where('stock_quantity', '>', 0)
                    ->get();
        
        // Get expired medicines
        $expired = Medicine::whereDate('expiry_date', '<', now())
                    ->get();
        
        // Get medicines expiring soon
        $expiringSoon = Medicine::whereDate('expiry_date', '>=', now())
                        ->whereDate('expiry_date', '<=', now()->addDays(30))
                        ->get();
        
        return Inertia::render('Pharmacy/Stock/Alerts', [
            'lowStock' => $lowStock,
            'expired' => $expired,
            'expiringSoon' => $expiringSoon
        ]);
    }
}
