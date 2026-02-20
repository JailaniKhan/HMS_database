<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\API\BaseApiController;
use App\Models\MedicineAlert;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class AlertController extends BaseApiController
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
     * Display a listing of alerts.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $query = MedicineAlert::with(['medicine.category']);

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('type')) {
            $query->where('alert_type', $request->type);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $alerts = $query->latest()->paginate(15);

        return $this->successResponse('Alerts retrieved successfully', [
            'alerts' => $alerts
        ]);
    }

    /**
     * Get pending alerts.
     */
    public function pending(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $alerts = MedicineAlert::with(['medicine.category'])
            ->where('status', 'pending')
            ->latest()
            ->paginate(15);

        return $this->successResponse('Pending alerts retrieved successfully', [
            'alerts' => $alerts
        ]);
    }

    /**
     * Resolve an alert.
     */
    public function resolve(Request $request, MedicineAlert $alert): JsonResponse
    {
        if (!auth()->user()?->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }

        $alert->update([
            'status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => Auth::id(),
            'resolution_notes' => $request->input('notes'),
        ]);

        return $this->successResponse('Alert resolved successfully');
    }

    /**
     * Get expiry risk assessment.
     */
    public function expiryRisk(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

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

        $risk = [
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

        return $this->successResponse('Expiry risk assessment retrieved successfully', [
            'risk_assessment' => $risk
        ]);
    }
}