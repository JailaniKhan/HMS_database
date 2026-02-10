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
        
        // Build the query with filters
        $query = MedicineAlert::with('medicine');
        
        // Apply type filter
        if (!empty($filters['type'])) {
            $query->where('alert_type', $filters['type']);
        }
        
        // Apply status filter
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        // Apply severity/priority filter
        if (!empty($filters['severity'])) {
            $query->where('priority', $filters['severity']);
        }
        
        $alerts = $query->latest()->paginate(10)->withQueryString();
        
        // Calculate statistics - include dynamic checks from medicines
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
            'total' => MedicineAlert::count() + $lowStockCount + $expiringSoonCount + $expiredCount,
            'pending' => MedicineAlert::where('status', 'pending')->count() + $lowStockCount + $expiringSoonCount + $expiredCount,
            'resolved' => MedicineAlert::where('status', 'resolved')->count(),
            'critical' => MedicineAlert::where('priority', 'high')
                ->where('status', 'pending')
                ->count() + $expiredCount,
        ];
        
        return Inertia::render('Pharmacy/Alerts/Index', [
            'alerts' => $alerts,
            'filters' => $filters,
            'stats' => $stats,
        ]);
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
        
        $alert = MedicineAlert::findOrFail($id);
        
        $request->validate([
            'status' => 'required|in:pending,resolved',
        ]);
        
        $alert->update(['status' => $request->status]);
        
        return redirect()->back()->withErrors(['success' => 'Alert status updated successfully.']);
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
