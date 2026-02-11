<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\MedicineAlert;
use App\Models\Medicine;
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
        $lowStockCount = Medicine::where('stock_quantity', '<=', 10)
            ->where('stock_quantity', '>', 0)
            ->count();
        
        $expiringSoonCount = Medicine::whereDate('expiry_date', '>=', now())
            ->whereDate('expiry_date', '<=', now()->addDays(30))
            ->where('stock_quantity', '>', 0)
            ->count();
        
        $expiredCount = Medicine::whereDate('expiry_date', '<', now())
            ->where('stock_quantity', '>', 0)
            ->count();
        
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
        
        // Run the expiry check command
        \Artisan::call('alerts:check-expiry');
        $output = \Artisan::output();
        
        return redirect()->back()->with('success', 'Alert check completed. ' . $output);
    }
}
