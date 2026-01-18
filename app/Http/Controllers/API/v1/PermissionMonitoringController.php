<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Services\PermissionMonitoringService;
use App\Services\PermissionAlertService;
use App\Models\PermissionAlert;
use App\Models\PermissionMonitoringLog;
use App\Models\PermissionHealthCheck;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;

class PermissionMonitoringController extends Controller
{
    protected $monitoringService;
    protected $alertService;

    public function __construct(PermissionMonitoringService $monitoringService, PermissionAlertService $alertService)
    {
        $this->monitoringService = $monitoringService;
        $this->alertService = $alertService;
    }

    /**
     * Get monitoring dashboard data
     */
    public function dashboard(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : now()->subDays(7);
        $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : now();

        $data = [
            'statistics' => $this->monitoringService->getStatistics($startDate, $endDate),
            'active_alerts' => $this->alertService->getActiveAlerts(),
            'recent_logs' => PermissionMonitoringLog::with('user')
                ->orderBy('logged_at', 'desc')
                ->take(50)
                ->get(),
            'health_status' => PermissionHealthCheck::orderBy('checked_at', 'desc')
                ->take(10)
                ->get()
                ->groupBy('check_type')
                ->map(function ($checks) {
                    return $checks->first();
                }),
        ];

        return response()->json($data);
    }

    /**
     * Get monitoring metrics
     */
    public function metrics(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : now()->subHours(24);
        $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : now();
        $metricType = $request->get('type');

        $query = PermissionMonitoringLog::whereBetween('logged_at', [$startDate, $endDate]);

        if ($metricType) {
            $query->where('metric_type', $metricType);
        }

        $metrics = $query->orderBy('logged_at', 'asc')->get();

        // Group by hour for aggregation
        $aggregated = $metrics->groupBy(function ($item) {
            return $item->logged_at->format('Y-m-d H:00:00');
        })->map(function ($group) {
            return [
                'timestamp' => $group->first()->logged_at->toISOString(),
                'count' => $group->count(),
                'average_value' => $group->avg('value'),
                'min_value' => $group->min('value'),
                'max_value' => $group->max('value'),
            ];
        })->values();

        return response()->json([
            'metrics' => $aggregated,
            'total_count' => $metrics->count(),
            'metric_types' => PermissionMonitoringLog::distinct('metric_type')->pluck('metric_type'),
        ]);
    }

    /**
     * Get alerts
     */
    public function alerts(Request $request): JsonResponse
    {
        $status = $request->get('status', 'active');
        $alertType = $request->get('type');
        $perPage = $request->get('per_page', 20);

        $query = PermissionAlert::with('user')
            ->orderBy('created_at', 'desc');

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($alertType) {
            $query->where('alert_type', $alertType);
        }

        $alerts = $query->paginate($perPage);

        return response()->json($alerts);
    }

    /**
     * Get alert statistics
     */
    public function alertStatistics(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : now()->subDays(30);
        $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : now();

        $stats = $this->alertService->getAlertStatistics($startDate, $endDate);

        return response()->json($stats);
    }

    /**
     * Acknowledge alert
     */
    public function acknowledgeAlert(Request $request, int $alertId): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $success = $this->alertService->acknowledgeAlert($alertId, $request->user_id);

        if (!$success) {
            return response()->json(['message' => 'Alert not found'], 404);
        }

        return response()->json(['message' => 'Alert acknowledged successfully']);
    }

    /**
     * Resolve alert
     */
    public function resolveAlert(Request $request, int $alertId): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $success = $this->alertService->resolveAlert($alertId, $request->user_id);

        if (!$success) {
            return response()->json(['message' => 'Alert not found'], 404);
        }

        return response()->json(['message' => 'Alert resolved successfully']);
    }

    /**
     * Get health check status
     */
    public function healthStatus(Request $request): JsonResponse
    {
        $checkType = $request->get('type');

        if ($checkType) {
            $result = $this->monitoringService->performHealthCheck($checkType);
            return response()->json($result);
        }

        $checks = PermissionHealthCheck::orderBy('checked_at', 'desc')
            ->take(20)
            ->get()
            ->groupBy('check_type')
            ->map(function ($checks) {
                return $checks->first();
            });

        return response()->json($checks);
    }

    /**
     * Get performance reports
     */
    public function performanceReport(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : now()->subDays(30);
        $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : now();

        $report = [
            'period' => [
                'start' => $startDate->toISOString(),
                'end' => $endDate->toISOString(),
            ],
            'response_times' => [
                'average' => PermissionMonitoringLog::where('metric_type', 'permission_check_response_time')
                    ->whereBetween('logged_at', [$startDate, $endDate])
                    ->avg('value'),
                '95th_percentile' => PermissionMonitoringLog::where('metric_type', 'permission_check_response_time')
                    ->whereBetween('logged_at', [$startDate, $endDate])
                    ->orderBy('value', 'asc')
                    ->skip((int) (PermissionMonitoringLog::where('metric_type', 'permission_check_response_time')
                        ->whereBetween('logged_at', [$startDate, $endDate])
                        ->count() * 0.95))
                    ->first()->value ?? null,
                'max' => PermissionMonitoringLog::where('metric_type', 'permission_check_response_time')
                    ->whereBetween('logged_at', [$startDate, $endDate])
                    ->max('value'),
            ],
            'cache_performance' => $this->monitoringService->getCachePerformance($startDate, $endDate),
            'security_incidents' => PermissionAlert::where('alert_type', 'high')
                ->whereJsonContains('data->category', 'security')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count(),
            'failed_attempts' => $this->monitoringService->getFailedAttemptsCount($startDate, $endDate),
        ];

        return response()->json($report);
    }

    /**
     * Get compliance report
     */
    public function complianceReport(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date') ? Carbon::parse($request->get('start_date')) : now()->subDays(90);
        $endDate = $request->get('end_date') ? Carbon::parse($request->get('end_date')) : now();

        $report = [
            'period' => [
                'start' => $startDate->toISOString(),
                'end' => $endDate->toISOString(),
            ],
            'audit_logs' => [
                'total' => \App\Models\AuditLog::whereBetween('created_at', [$startDate, $endDate])->count(),
                'by_action' => \App\Models\AuditLog::whereBetween('created_at', [$startDate, $endDate])
                    ->selectRaw('action, COUNT(*) as count')
                    ->groupBy('action')
                    ->pluck('count', 'action'),
            ],
            'permission_changes' => PermissionMonitoringLog::where('metric_type', 'permission_change')
                ->whereBetween('logged_at', [$startDate, $endDate])
                ->count(),
            'security_alerts' => PermissionAlert::where('alert_type', 'high')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count(),
            'user_activity' => \App\Models\AuditLog::whereBetween('created_at', [$startDate, $endDate])
                ->distinct('user_id')
                ->count('user_id'),
        ];

        return response()->json($report);
    }

    /**
     * Manually trigger health check
     */
    public function triggerHealthCheck(Request $request): JsonResponse
    {
        $request->validate([
            'check_type' => 'required|string|in:database,cache,api_endpoints',
        ]);

        $result = $this->monitoringService->performHealthCheck($request->check_type);

        return response()->json($result);
    }
}
