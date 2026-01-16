<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;

class AdminController extends Controller
{
    /**
     * Get recent activity logs for the admin dashboard
     */
    public function getRecentActivity(Request $request)
    {
        try {
            // Ensure user is authenticated via Sanctum
            if (!$request->user()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            
            // Check if user has permission to view admin data
            if (!$request->user()->isSuperAdmin() && !$request->user()->hasPermission('view-admin-dashboard')) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            // Get recent audit log entries
            $recentActivities = AuditLog::orderBy('logged_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'user' => $log->user_name,
                        'action' => $log->action,
                        'time' => $log->logged_at->diffForHumans(),
                        'role' => $log->user_role ?? 'Unknown',
                        'details' => $log->description,
                    ];
                })
                ->toArray();
            
            // If no audit logs exist, use fallback data
            if (empty($recentActivities)) {
                $recentUsers = User::orderBy('created_at', 'desc')->limit(4)->get();
                foreach ($recentUsers as $index => $user) {
                    $recentActivities[] = [
                        'id' => $index + 1,
                        'user' => $user->name,
                        'action' => 'User registered',
                        'time' => $user->created_at->diffForHumans(),
                        'role' => $user->role ?? 'User',
                        'details' => 'New user account created',
                    ];
                }
            }
            
            return response()->json($recentActivities);
        } catch (\Exception $e) {
            Log::error('Error fetching recent activity: ' . $e->getMessage());
            return response()->json([], 500);
        }
    }

    /**
     * Get audit logs for the admin dashboard with pagination and filtering
     */
    public function getAuditLogs(Request $request)
    {
        try {
            // Ensure user is authenticated via Sanctum
            if (!$request->user()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }

            // Check if user has permission to view audit logs
            if (!$request->user()->isSuperAdmin() && !$request->user()->hasPermission('view-audit-logs')) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $query = AuditLog::query();

            // Apply filters
            if ($request->filled('severity')) {
                $query->where('severity', $request->severity);
            }

            if ($request->filled('module')) {
                $query->where('module', $request->module);
            }

            if ($request->filled('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->filled('date_from')) {
                $query->where('logged_at', '>=', $request->date_from);
            }

            if ($request->filled('date_to')) {
                $query->where('logged_at', '<=', $request->date_to);
            }

            // For now, return simple array. Pagination can be added later.
            $auditLogs = $query->orderBy('logged_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'user' => $log->user_name,
                        'action' => $log->action,
                        'details' => $log->description ?? $log->action,
                        'time' => $log->logged_at->format('Y-m-d H:i:s'),
                        'severity' => $log->severity,
                        'module' => $log->module,
                        'response_time' => $log->response_time,
                        'memory_usage' => $log->memory_usage,
                        'ip_address' => $log->ip_address,
                        'request_method' => $log->request_method,
                        'request_url' => $log->request_url,
                    ];
                });

            return response()->json($auditLogs);
        } catch (\Exception $e) {
            Log::error('Error fetching audit logs: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch audit logs'], 500);
        }
    }

    /**
     * Get audit log analytics
     */
    public function getAuditAnalytics(Request $request)
    {
        try {
            if (!$request->user() || (!$request->user()->isSuperAdmin() && !$request->user()->hasPermission('view-audit-logs'))) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }

            $dateFrom = $request->get('date_from', now()->subDays(7));
            $dateTo = $request->get('date_to', now());

            $analytics = [
                'severity_distribution' => AuditLog::whereBetween('logged_at', [$dateFrom, $dateTo])
                    ->selectRaw('severity, COUNT(*) as count')
                    ->groupBy('severity')
                    ->pluck('count', 'severity'),

                'module_activity' => AuditLog::whereBetween('logged_at', [$dateFrom, $dateTo])
                    ->selectRaw('module, COUNT(*) as count')
                    ->groupBy('module')
                    ->orderBy('count', 'desc')
                    ->take(10)
                    ->pluck('count', 'module'),

                'peak_hours' => AuditLog::whereBetween('logged_at', [$dateFrom, $dateTo])
                    ->selectRaw('HOUR(logged_at) as hour, COUNT(*) as count')
                    ->groupBy('hour')
                    ->orderBy('hour')
                    ->pluck('count', 'hour'),

                'performance_metrics' => [
                    'avg_response_time' => AuditLog::whereBetween('logged_at', [$dateFrom, $dateTo])
                        ->whereNotNull('response_time')
                        ->avg('response_time'),
                    'max_response_time' => AuditLog::whereBetween('logged_at', [$dateFrom, $dateTo])
                        ->whereNotNull('response_time')
                        ->max('response_time'),
                    'avg_memory_usage' => AuditLog::whereBetween('logged_at', [$dateFrom, $dateTo])
                        ->whereNotNull('memory_usage')
                        ->avg('memory_usage'),
                ],

                'error_rate' => AuditLog::whereBetween('logged_at', [$dateFrom, $dateTo])
                    ->whereIn('severity', ['high', 'critical'])
                    ->count() / max(AuditLog::whereBetween('logged_at', [$dateFrom, $dateTo])->count(), 1) * 100,
            ];

            return response()->json($analytics);
        } catch (\Exception $e) {
            Log::error('Error fetching audit analytics: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch analytics'], 500);
        }
    }

    /**
     * Get system statistics for the admin dashboard
     */
    public function getStats(Request $request)
    {
        try {
            // Ensure user is authenticated via Sanctum
            if (!$request->user()) {
                return response()->json(['message' => 'Unauthenticated'], 401);
            }
            
            // Check if user has permission to view admin stats
            if (!$request->user()->isSuperAdmin() && !$request->user()->hasPermission('view-admin-dashboard')) {
                return response()->json(['message' => 'Unauthorized'], 403);
            }
            $stats = [
                'total_users' => User::count(),
                'active_sessions' => DB::table('sessions')->where('last_activity', '>', now()->subMinutes(30))->count(),
                'recent_registrations' => User::where('created_at', '>=', now()->subDays(7))->count(),
                'total_roles' => User::distinct('role')->count('role')
            ];

            return response()->json($stats);
        } catch (\Exception $e) {
            Log::error('Error fetching stats: ' . $e->getMessage());
            return response()->json([], 500);
        }
    }
}