<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\DashboardService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct(DashboardService $dashboardService)
    {
        $this->dashboardService = $dashboardService;
    }

    /**
     * Display the main dashboard with comprehensive statistics.
     */
    public function index(Request $request): Response
    {
        try {
            $user = Auth::user();

            // Check if user has permission to view dashboard
            if (!$user->hasPermission('view-dashboard')) {
                abort(403, 'Unauthorized access');
            }

            // Get period from request (today, week, month, year)
            $period = $request->input('period', 'today');

            // Validate period
            $validPeriods = ['today', 'week', 'month', 'year'];
            if (!in_array($period, $validPeriods)) {
                $period = 'today';
            }

            // Get comprehensive dashboard data
            $dashboardData = $this->dashboardService->getDashboardStats($period);
            
            // Get admin activities and stats for admin users
            $adminData = [];
            try {
                if ($user->isSuperAdmin() || $user->hasPermission('view-admin-activities')) {
                    $adminData = [
                        'admin_activities' => $this->dashboardService->getAdminActivities(20),
                        'admin_stats' => $this->dashboardService->getAdminStats(),
                    ];
                }
            } catch (\Exception $e) {
                Log::warning('Admin data fetch failed: ' . $e->getMessage());
                $adminData = [];
            }
            
            // Debug: Log what we're sending to the frontend
            Log::info('DashboardController - Data being sent:', [
                'summary' => $dashboardData['summary'] ?? 'missing',
                'patients_total' => $dashboardData['patients']['total'] ?? 'missing',
                'has_data' => !empty($dashboardData['summary']['total_patients']),
            ]);

            return Inertia::render('Dashboard', array_merge($dashboardData, $adminData));
        } catch (\Exception $e) {
            Log::error('Dashboard index error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'user_id' => Auth::id(),
            ]);

            // Return dashboard with default/empty data on error
            return Inertia::render('Dashboard', [
                'summary' => [
                    'total_patients' => 0,
                    'new_patients' => 0,
                    'total_doctors' => 0,
                    'total_departments' => 0,
                    'total_appointments' => 0,
                    'completed_appointments' => 0,
                    'total_revenue' => 0,
                    'appointment_revenue' => 0,
                    'pharmacy_revenue' => 0,
                    'pending_bills' => 0,
                    'outstanding_amount' => 0,
                ],
                'patients' => [
                    'total' => 0,
                    'new_today' => 0,
                    'new_this_period' => 0,
                    'gender_distribution' => [],
                    'age_distribution' => [],
                    'blood_group_distribution' => [],
                ],
                'appointments' => [
                    'total' => 0,
                    'by_status' => [],
                    'by_department' => [],
                    'today_schedule' => [],
                    'upcoming_count' => 0,
                ],
                'financial' => [
                    'total_revenue' => 0,
                    'appointment_revenue' => 0,
                    'pharmacy_revenue' => 0,
                    'bill_revenue' => 0,
                    'payment_methods' => [],
                    'outstanding_bills' => 0,
                    'outstanding_amount' => 0,
                    'aging' => [
                        'current' => 0,
                        '30_60' => 0,
                        '60_90' => 0,
                        '90_plus' => 0,
                    ],
                    'avg_bill_amount' => 0,
                ],
                'pharmacy' => [
                    'today_sales' => 0,
                    'today_revenue' => 0,
                    'period_revenue' => 0,
                    'low_stock_count' => 0,
                    'expiring_count' => 0,
                    'expired_count' => 0,
                    'total_medicines' => 0,
                    'top_medicines' => [],
                    'pending_prescriptions' => 0,
                ],
                'laboratory' => [
                    'total_today' => 0,
                    'completed_today' => 0,
                    'pending_count' => 0,
                    'by_status' => [],
                    'pending_tests' => [],
                ],
                'departments' => [
                    'total' => 0,
                    'departments' => [],
                ],
                'recent_activities' => [],
                'trends' => [
                    'daily' => [],
                    'monthly' => [],
                ],
                'period' => 'today',
                'last_updated' => now()->toIso8601String(),
                'error' => 'Unable to load dashboard data. Please try again later.',
            ]);
        }
    }

    /**
     * Get dashboard data as JSON for API consumption.
     */
    public function data(Request $request): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user->hasPermission('view-dashboard')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            $period = $request->input('period', 'today');
            $validPeriods = ['today', 'week', 'month', 'year'];
            if (!in_array($period, $validPeriods)) {
                $period = 'today';
            }

            $dashboardData = $this->dashboardService->getDashboardStats($period);

            return response()->json($dashboardData);
        } catch (\Exception $e) {
            Log::error('Dashboard API error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch dashboard data'], 500);
        }
    }

    /**
     * Get real-time dashboard stats for WebSocket updates.
     */
    public function realtime(): \Illuminate\Http\JsonResponse
    {
        try {
            $user = Auth::user();

            if (!$user->hasPermission('view-dashboard')) {
                return response()->json(['error' => 'Unauthorized'], 403);
            }

            // Get only summary stats for real-time updates
            $stats = $this->dashboardService->getDashboardStats('today');

            return response()->json([
                'summary' => $stats['summary'],
                'last_updated' => $stats['last_updated'],
            ]);
        } catch (\Exception $e) {
            Log::error('Dashboard realtime error: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch realtime data'], 500);
        }
    }
}