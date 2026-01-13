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
     * Get audit logs for the admin dashboard
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
            // Get audit log entries
            $auditLogs = AuditLog::orderBy('logged_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'user' => $log->user_name,
                        'action' => $log->action,
                        'details' => $log->description ?? $log->action,
                        'time' => $log->logged_at->format('Y-m-d H:i:s'),
                        'severity' => $log->severity
                    ];
                })
                ->toArray();
            
            // If no audit logs exist, use fallback data
            if (empty($auditLogs)) {
                $users = User::orderBy('created_at', 'desc')->limit(4)->get();
                foreach ($users as $index => $user) {
                    $auditLogs[] = [
                        'id' => $index + 1,
                        'user' => $user->name,
                        'action' => 'Account created',
                        'details' => 'New user account created with role: ' . ($user->role ?? 'User'),
                        'time' => $user->created_at->format('Y-m-d H:i:s'),
                        'severity' => 'low'
                    ];
                }
            }
            
            return response()->json($auditLogs);
        } catch (\Exception $e) {
            Log::error('Error fetching audit logs: ' . $e->getMessage());
            return response()->json([], 500);
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