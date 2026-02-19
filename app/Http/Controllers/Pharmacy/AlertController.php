<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\MedicineAlert;
use App\Models\Medicine;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class AlertController extends Controller
{
    /**
     * Display a listing of the alerts.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-medicine-alerts')) {
            abort(403, 'Unauthorized access');
        }
        
        // Get filter values from request
        $filters = [
            'type' => $request->query('type', ''),
            'status' => $request->query('status', ''),
            'severity' => $request->query('severity', ''),
        ];
        
        // Get dynamic alerts from medicines (low stock, expiring, expired)
        $dynamicAlerts = $this->getDynamicAlerts($filters);
        
        // Get stored alerts from database
        $storedAlertsQuery = MedicineAlert::with('medicine');
        
        // Apply type filter
        if (!empty($filters['type'])) {
            $storedAlertsQuery->where('alert_type', $filters['type']);
        }
        
        // Apply status filter
        if (!empty($filters['status'])) {
            $storedAlertsQuery->where('status', $filters['status']);
        }
        
        // Apply severity/priority filter
        if (!empty($filters['severity'])) {
            $storedAlertsQuery->where('priority', $filters['severity']);
        }
        
        $storedAlerts = $storedAlertsQuery->latest()->get();
        
        // Merge dynamic and stored alerts
        $allAlerts = $dynamicAlerts->concat($storedAlerts);
        
        // Manual pagination for the merged collection
        $perPage = 10;
        $currentPage = $request->query('page', 1);
        $total = $allAlerts->count();
        $alerts = new \Illuminate\Pagination\LengthAwarePaginator(
            $allAlerts->forPage($currentPage, $perPage)->values(),
            $total,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );
        
        // Calculate statistics
        $stats = [
            'total' => $allAlerts->count(),
            'pending' => $allAlerts->where('status', 'pending')->count(),
            'resolved' => $storedAlerts->where('status', 'resolved')->count(),
            'critical' => $allAlerts->where('priority', 'high')->where('status', 'pending')->count() 
                + $allAlerts->where('priority', 'critical')->where('status', 'pending')->count(),
        ];
        
        return Inertia::render('Pharmacy/Alerts/Index', [
            'alerts' => $alerts,
            'filters' => $filters,
            'stats' => $stats,
        ]);
    }
    
    /**
     * Get dynamic alerts from medicine conditions.
     */
    private function getDynamicAlerts(array $filters): \Illuminate\Support\Collection
    {
        $alerts = collect();
        $id = 0;
        
        // Get expired medicines
        $expiredMedicines = Medicine::whereDate('expiry_date', '<', now())
            ->where('stock_quantity', '>', 0)
            ->get();
        
        foreach ($expiredMedicines as $medicine) {
            $alert = [
                'id' => 'expired_' . $medicine->id,
                'medicine_id' => $medicine->id,
                'alert_type' => 'expired',
                'message' => "Medicine {$medicine->name} has expired on {$medicine->expiry_date->format('Y-m-d')}",
                'priority' => 'critical',
                'status' => 'pending',
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
                'medicine' => $medicine,
            ];
            
            if (empty($filters['type']) || $filters['type'] === 'expired') {
                if (empty($filters['status']) || $filters['status'] === 'pending') {
                    if (empty($filters['severity']) || $filters['severity'] === 'critical') {
                        $alerts->push((object)$alert);
                    }
                }
            }
        }
        
        // Get medicines expiring soon (next 30 days)
        $expiringSoonMedicines = Medicine::whereDate('expiry_date', '>=', now())
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->where('stock_quantity', '>', 0)
            ->get();
        
        foreach ($expiringSoonMedicines as $medicine) {
            $daysUntilExpiry = now()->diffInDays($medicine->expiry_date, false);
            $priority = $daysUntilExpiry <= 7 ? 'high' : 'medium';
            
            $alert = [
                'id' => 'expiring_' . $medicine->id,
                'medicine_id' => $medicine->id,
                'alert_type' => 'expiring_soon',
                'message' => "Medicine {$medicine->name} is expiring soon on {$medicine->expiry_date->format('Y-m-d')} ({$daysUntilExpiry} days left)",
                'priority' => $priority,
                'status' => 'pending',
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
                'medicine' => $medicine,
            ];
            
            if (empty($filters['type']) || $filters['type'] === 'expiring_soon') {
                if (empty($filters['status']) || $filters['status'] === 'pending') {
                    if (empty($filters['severity']) || $filters['severity'] === $priority) {
                        $alerts->push((object)$alert);
                    }
                }
            }
        }
        
        // Get low stock medicines
        $lowStockMedicines = Medicine::where('stock_quantity', '<=', 10)
            ->where('stock_quantity', '>', 0)
            ->get();
        
        foreach ($lowStockMedicines as $medicine) {
            $priority = $medicine->stock_quantity <= 5 ? 'high' : 'medium';
            
            $alert = [
                'id' => 'lowstock_' . $medicine->id,
                'medicine_id' => $medicine->id,
                'alert_type' => 'low_stock',
                'message' => "Medicine {$medicine->name} is low in stock. Only {$medicine->stock_quantity} units remaining (reorder level: {$medicine->reorder_level})",
                'priority' => $priority,
                'status' => 'pending',
                'is_read' => false,
                'created_at' => now(),
                'updated_at' => now(),
                'medicine' => $medicine,
            ];
            
            if (empty($filters['type']) || $filters['type'] === 'low_stock') {
                if (empty($filters['status']) || $filters['status'] === 'pending') {
                    if (empty($filters['severity']) || $filters['severity'] === $priority) {
                        $alerts->push((object)$alert);
                    }
                }
            }
        }
        
        return $alerts;
    }

    /**
     * Display a listing of pending alerts.
     */
    public function pending(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pending-medicine-alerts')) {
            abort(403, 'Unauthorized access');
        }
        
        $alerts = MedicineAlert::with('medicine')
                    ->where('status', 'pending')
                    ->latest()
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Alerts/Pending', [
            'alerts' => $alerts
        ]);
    }

    /**
     * Display a listing of resolved alerts.
     */
    public function resolved(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-resolved-medicine-alerts')) {
            abort(403, 'Unauthorized access');
        }
        
        $alerts = MedicineAlert::with('medicine')
                    ->where('status', 'resolved')
                    ->latest()
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Alerts/Resolved', [
            'alerts' => $alerts
        ]);
    }

    /**
     * Update the status of an alert.
     */
    public function updateStatus(Request $request, $id)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('update-medicine-alerts')) {
            abort(403, 'Unauthorized access');
        }
        
        // Check if this is a dynamic alert (e.g., lowstock_2, expired_5, expiring_3)
        if (is_string($id) && (str_starts_with($id, 'lowstock_') || str_starts_with($id, 'expired_') || str_starts_with($id, 'expiring_'))) {
            // Dynamic alerts can't be resolved directly - they are based on current medicine conditions
            // The user needs to fix the underlying issue (restock, remove expired medicine, etc.)
            return redirect()->back()->with('warning', 'This is a dynamic alert based on current medicine conditions. To resolve it, please update the medicine directly (e.g., restock for low stock, or dispose of expired medicine).');
        }
        
        // For stored database alerts
        $alert = MedicineAlert::findOrFail($id);
        
        $request->validate([
            'status' => 'required|in:pending,resolved',
        ]);
        
        $alert->update(['status' => $request->status]);
        
        return redirect()->back()->with('success', 'Alert status updated successfully.');
    }

    /**
     * Manually trigger expiry alert check.
     */
    public function triggerCheck()
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('trigger-medicine-alert-check')) {
            abort(403, 'Unauthorized access');
        }
        
        $alertsCreated = 0;
        $alertsResolved = 0;
        
        // Get threshold values from config
        $lowStockThreshold = config('pharmacy.low_stock_threshold', 10);
        $expiryWarningDays = config('pharmacy.expiry_warning_days', 30);
        $expiryCriticalDays = config('pharmacy.expiry_critical_days', 7);
        
        // Check for expired medicines
        $expired = Medicine::whereDate('expiry_date', '<', now())
            ->where('stock_quantity', '>', 0)
            ->get();
        
        foreach ($expired as $medicine) {
            $alert = MedicineAlert::firstOrCreate(
                [
                    'medicine_id' => $medicine->id,
                    'alert_type' => 'expired',
                    'status' => 'pending',
                ],
                [
                    'message' => "Medicine {$medicine->name} (Batch: {$medicine->batch_number}) has expired on {$medicine->expiry_date->format('Y-m-d')}",
                    'priority' => 'critical',
                    'triggered_at' => now(),
                ]
            );
            if ($alert->wasRecentlyCreated) {
                $alertsCreated++;
            }
        }
        
        // Check for medicines expiring soon
        $expiringSoon = Medicine::whereDate('expiry_date', '>=', now())
            ->whereDate('expiry_date', '<=', now()->addDays($expiryWarningDays))
            ->where('stock_quantity', '>', 0)
            ->get();
        
        foreach ($expiringSoon as $medicine) {
            $daysUntilExpiry = now()->diffInDays($medicine->expiry_date, false);
            $priority = $daysUntilExpiry <= $expiryCriticalDays ? 'high' : 'medium';
            
            $alert = MedicineAlert::firstOrCreate(
                [
                    'medicine_id' => $medicine->id,
                    'alert_type' => 'expiring_soon',
                    'status' => 'pending',
                ],
                [
                    'message' => "Medicine {$medicine->name} (Batch: {$medicine->batch_number}) is expiring in {$daysUntilExpiry} days on {$medicine->expiry_date->format('Y-m-d')}",
                    'priority' => $priority,
                    'triggered_at' => now(),
                ]
            );
            if ($alert->wasRecentlyCreated) {
                $alertsCreated++;
            }
        }
        
        // Check for low stock medicines
        $lowStock = Medicine::where('stock_quantity', '>', 0)
            ->whereColumn('stock_quantity', '<=', 'reorder_level')
            ->get();
        
        foreach ($lowStock as $medicine) {
            $criticalPercentage = config('pharmacy.critical_stock_percentage', 50) / 100;
            $criticalThreshold = $medicine->reorder_level * $criticalPercentage;
            $priority = $medicine->stock_quantity <= $criticalThreshold ? 'critical' : 'high';
            
            $alert = MedicineAlert::firstOrCreate(
                [
                    'medicine_id' => $medicine->id,
                    'alert_type' => 'low_stock',
                    'status' => 'pending',
                ],
                [
                    'message' => "Medicine {$medicine->name} is low in stock. Current: {$medicine->stock_quantity}, Reorder Level: {$medicine->reorder_level}",
                    'priority' => $priority,
                    'triggered_at' => now(),
                ]
            );
            if ($alert->wasRecentlyCreated) {
                $alertsCreated++;
            }
        }
        
        // Check for out of stock medicines
        $outOfStock = Medicine::where('stock_quantity', '<=', 0)->get();
        
        foreach ($outOfStock as $medicine) {
            $alert = MedicineAlert::firstOrCreate(
                [
                    'medicine_id' => $medicine->id,
                    'alert_type' => 'out_of_stock',
                    'status' => 'pending',
                ],
                [
                    'message' => "Medicine {$medicine->name} is out of stock and needs immediate reordering.",
                    'priority' => 'critical',
                    'triggered_at' => now(),
                ]
            );
            if ($alert->wasRecentlyCreated) {
                $alertsCreated++;
            }
        }
        
        // Auto-resolve alerts for medicines that no longer meet alert conditions
        $resolvedExpired = MedicineAlert::where('alert_type', 'expired')
            ->where('status', 'pending')
            ->whereHas('medicine', function ($q) {
                $q->where('stock_quantity', '<=', 0)
                  ->orWhereDate('expiry_date', '>=', now());
            })
            ->update(['status' => 'resolved', 'resolved_at' => now()]);
        $alertsResolved += $resolvedExpired;
        
        $resolvedLowStock = MedicineAlert::where('alert_type', 'low_stock')
            ->where('status', 'pending')
            ->whereHas('medicine', function ($q) {
                $q->whereColumn('stock_quantity', '>', 'reorder_level');
            })
            ->update(['status' => 'resolved', 'resolved_at' => now()]);
        $alertsResolved += $resolvedLowStock;
        
        $resolvedOutOfStock = MedicineAlert::where('alert_type', 'out_of_stock')
            ->where('status', 'pending')
            ->whereHas('medicine', function ($q) {
                $q->where('stock_quantity', '>', 0);
            })
            ->update(['status' => 'resolved', 'resolved_at' => now()]);
        $alertsResolved += $resolvedOutOfStock;
        
        $message = "Alert check completed. {$alertsCreated} new alerts created";
        if ($alertsResolved > 0) {
            $message .= ", {$alertsResolved} alerts auto-resolved";
        }
        $message .= '.';
        
        return redirect()->back()->with('success', $message);
    }
    
    /**
     * Get expiry risk assessment.
     * Calculates financial risk of expiring and expired medicines.
     */
    public function expiryRiskAssessment(): array
    {
        $expired = Medicine::whereDate('expiry_date', '<', now())
            ->where('stock_quantity', '>', 0)
            ->selectRaw('SUM(stock_quantity * cost_price) as total_cost, SUM(stock_quantity * sale_price) as total_sale, COUNT(*) as item_count')
            ->first();
        
        $expiryWarningDays = config('pharmacy.expiry_warning_days', 30);
        
        $expiring30Days = Medicine::whereDate('expiry_date', '>=', now())
            ->whereDate('expiry_date', '<=', now()->addDays($expiryWarningDays))
            ->where('stock_quantity', '>', 0)
            ->selectRaw('SUM(stock_quantity * cost_price) as total_cost, SUM(stock_quantity * sale_price) as total_sale, COUNT(*) as item_count')
            ->first();
        
        $expiring60Days = Medicine::whereDate('expiry_date', '>', now()->addDays($expiryWarningDays))
            ->whereDate('expiry_date', '<=', now()->addDays(60))
            ->where('stock_quantity', '>', 0)
            ->selectRaw('SUM(stock_quantity * cost_price) as total_cost, SUM(stock_quantity * sale_price) as total_sale, COUNT(*) as item_count')
            ->first();
        
        return [
            'expired' => [
                'cost_value' => round($expired->total_cost ?? 0, 2),
                'sale_value' => round($expired->total_sale ?? 0, 2),
                'item_count' => $expired->item_count ?? 0,
            ],
            'expiring_30_days' => [
                'cost_value' => round($expiring30Days->total_cost ?? 0, 2),
                'sale_value' => round($expiring30Days->total_sale ?? 0, 2),
                'item_count' => $expiring30Days->item_count ?? 0,
            ],
            'expiring_60_days' => [
                'cost_value' => round($expiring60Days->total_cost ?? 0, 2),
                'sale_value' => round($expiring60Days->total_sale ?? 0, 2),
                'item_count' => $expiring60Days->item_count ?? 0,
            ],
            'total_risk_value' => round(($expired->total_cost ?? 0) + ($expiring30Days->total_cost ?? 0), 2),
        ];
    }
}
