<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class PerformanceMonitoringMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $startTime = microtime(true);
        $startMemory = memory_get_usage();

        $response = $next($request);

        $endTime = microtime(true);
        $endMemory = memory_get_usage();

        $executionTime = round(($endTime - $startTime) * 1000, 2); // in milliseconds
        $memoryUsed = $endMemory - $startMemory;

        // Only log for API requests and if execution time > 100ms or memory > 10MB or error response
        $shouldLog = $request->is('api/*') && (
            $executionTime > 100 ||
            $memoryUsed > 10000000 || // 10MB
            $response->getStatusCode() >= 400
        );

        if ($shouldLog) {
            $user = Auth::guard('sanctum')->user();
            $errorDetails = null;

            if ($response->getStatusCode() >= 400) {
                $errorDetails = [
                    'status_code' => $response->getStatusCode(),
                    'error_message' => $this->getErrorMessage($response),
                ];
            }

            // Determine action and module based on route
            $route = $request->route();
            $action = $route ? $route->getActionName() : 'Unknown Action';
            $module = $this->determineModule($request->path());

            AuditLog::create([
                'user_id' => $user ? $user->id : null,
                'user_name' => $user ? $user->name : 'System',
                'user_role' => $user ? $user->role : 'System',
                'action' => $this->formatAction($action, $request->method()),
                'description' => $this->generatePerformanceDescription($request, $response, $executionTime, $memoryUsed),
                'module' => $module,
                'severity' => $this->determineSeverity($response->getStatusCode(), $executionTime),
                'response_time' => $executionTime / 1000, // convert to seconds for consistency
                'memory_usage' => $memoryUsed,
                'error_details' => $errorDetails,
                'request_method' => $request->method(),
                'request_url' => $request->fullUrl(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'logged_at' => now(),
            ]);
        }

        // Add performance headers to response
        $response->headers->set('X-Response-Time', $executionTime . 'ms');
        $response->headers->set('X-Memory-Usage', $this->formatBytes($memoryUsed));

        return $response;
    }

    private function determineModule(string $path): string
    {
        if (str_contains($path, 'patients')) return 'Patients';
        if (str_contains($path, 'doctors')) return 'Doctors';
        if (str_contains($path, 'appointments')) return 'Appointments';
        if (str_contains($path, 'departments')) return 'Departments';
        if (str_contains($path, 'billing')) return 'Billing';
        if (str_contains($path, 'laboratory') || str_contains($path, 'lab')) return 'Laboratory';
        if (str_contains($path, 'pharmacy')) return 'Pharmacy';
        if (str_contains($path, 'admin')) return 'Admin';
        if (str_contains($path, 'reports')) return 'Reports';
        return 'General';
    }

    private function formatAction(string $action, string $method): string
    {
        $actionMap = [
            'GET' => 'View',
            'POST' => 'Create',
            'PUT' => 'Update',
            'DELETE' => 'Delete',
        ];

        $verb = $actionMap[$method] ?? $method;
        return $verb . ' ' . str_replace(['Controller@', 'App\\Http\\Controllers\\API\\v1\\'], '', $action);
    }

    private function generatePerformanceDescription(Request $request, Response $response, float $time, int $memory): string
    {
        $desc = "Request processed in {$time}ms using " . $this->formatBytes($memory);
        if ($response->getStatusCode() >= 400) {
            $desc .= " - Error: " . $response->getStatusCode();
        }
        return $desc;
    }

    private function determineSeverity(int $statusCode, float $executionTime): string
    {
        if ($statusCode >= 500) return 'critical';
        if ($statusCode >= 400) return 'high';
        if ($executionTime > 2000) return 'medium'; // Slow response
        return 'info';
    }

    private function getErrorMessage(Response $response): string
    {
        try {
            $content = json_decode($response->getContent(), true);
            return $content['message'] ?? 'Unknown error';
        } catch (\Exception $e) {
            return 'Error response';
        }
    }

    private function formatBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $i = 0;
        while ($bytes >= 1024 && $i < count($units) - 1) {
            $bytes /= 1024;
            $i++;
        }
        return round($bytes, 2) . ' ' . $units[$i];
    }
}