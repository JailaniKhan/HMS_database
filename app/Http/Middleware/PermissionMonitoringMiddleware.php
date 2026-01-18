<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\PermissionMonitoringService;
use App\Services\PermissionAlertService;
use Symfony\Component\HttpFoundation\Response;

class PermissionMonitoringMiddleware
{
    protected $monitoringService;
    protected $alertService;

    public function __construct(PermissionMonitoringService $monitoringService, PermissionAlertService $alertService)
    {
        $this->monitoringService = $monitoringService;
        $this->alertService = $alertService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);

        // Track permission check attempts
        $user = Auth::user();
        $permissionCheckData = [
            'user_id' => $user ? $user->id : null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'endpoint' => $request->path(),
            'method' => $request->method(),
        ];

        $response = $next($request);

        $endTime = microtime(true);
        $executionTime = round(($endTime - $startTime) * 1000, 2); // in milliseconds

        // Log permission check performance
        $this->monitoringService->logPermissionCheckTime($executionTime, $permissionCheckData);

        // Check for permission-related errors (403, 401)
        if ($response->getStatusCode() === 403) {
            // Permission denied - log as failed attempt
            $this->monitoringService->logFailedAttempt(array_merge($permissionCheckData, [
                'error_type' => 'permission_denied',
                'status_code' => 403,
            ]));

            // Check if this looks like suspicious activity
            $this->checkForSuspiciousActivity($request, $user);
        } elseif ($response->getStatusCode() === 401) {
            // Unauthorized - could be authentication issue
            $this->monitoringService->logFailedAttempt(array_merge($permissionCheckData, [
                'error_type' => 'unauthorized',
                'status_code' => 401,
            ]));
        }

        // Log successful permission checks (for audit trail)
        if ($response->getStatusCode() === 200 && str_contains($request->path(), 'permissions')) {
            $this->monitoringService->logMetric('permission_check_success', 1, $permissionCheckData);
        }

        // Add monitoring headers
        $response->headers->set('X-Permission-Response-Time', $executionTime . 'ms');

        return $response;
    }

    /**
     * Check for suspicious permission activity
     */
    protected function checkForSuspiciousActivity(Request $request, $user): void
    {
        // Check for rapid permission failures from same IP
        $recentFailures = $this->monitoringService->getRecentFailures(5); // Last 5 minutes

        if ($recentFailures >= 5) {
            $this->alertService->createSecurityAlert(
                'Suspicious Permission Activity Detected',
                "Multiple permission failures detected from IP {$request->ip()}",
                [
                    'ip_address' => $request->ip(),
                    'user_id' => $user ? $user->id : null,
                    'recent_failures' => $recentFailures,
                    'time_window' => '5 minutes',
                ]
            );
        }

        // Check for permission checks on non-existent resources (could indicate scanning)
        if ($this->isLikelyScanning($request)) {
            $this->alertService->createSecurityAlert(
                'Potential Permission Scanning',
                "Suspicious permission check pattern detected",
                [
                    'ip_address' => $request->ip(),
                    'endpoint' => $request->path(),
                    'user_id' => $user ? $user->id : null,
                ]
            );
        }
    }

    /**
     * Determine if the request pattern looks like scanning
     */
    protected function isLikelyScanning(Request $request): bool
    {
        // This is a simple heuristic - in a real implementation,
        // you might use more sophisticated pattern recognition
        $path = $request->path();

        // Check for sequential IDs or common scanning patterns
        if (preg_match('/\/\d{4,}/', $path)) { // Long numeric sequences
            return true;
        }

        // Check for common admin/scanning endpoints
        $suspiciousPatterns = [
            'admin/',
            'config',
            'backup',
            'install',
            'setup',
            'test',
        ];

        foreach ($suspiciousPatterns as $pattern) {
            if (str_contains(strtolower($path), $pattern)) {
                return true;
            }
        }

        return false;
    }
}
