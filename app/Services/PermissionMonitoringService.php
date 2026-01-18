<?php

namespace App\Services;

use App\Models\PermissionMonitoringLog;
use App\Models\PermissionHealthCheck;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class PermissionMonitoringService
{
    protected $config;

    public function __construct()
    {
        $this->config = config('permission-monitoring');
    }

    /**
     * Log a permission-related metric
     */
    public function logMetric(string $metricType, float $value = null, array $metadata = []): void
    {
        if (!$this->config['enabled']) {
            return;
        }

        PermissionMonitoringLog::create([
            'metric_type' => $metricType,
            'value' => $value,
            'metadata' => json_encode($metadata),
            'logged_at' => now(),
        ]);
    }

    /**
     * Log permission check response time
     */
    public function logPermissionCheckTime(float $responseTimeMs, array $context = []): void
    {
        $this->logMetric('permission_check_response_time', $responseTimeMs, $context);

        // Check threshold and alert if necessary
        if ($responseTimeMs > $this->config['monitoring']['metrics']['response_time_threshold_ms']) {
            app(PermissionAlertService::class)->createAlert(
                'high',
                'Slow Permission Check',
                "Permission check took {$responseTimeMs}ms, exceeding threshold.",
                ['response_time' => $responseTimeMs, 'context' => $context]
            );
        }
    }

    /**
     * Log cache performance metrics
     */
    public function logCacheMetrics(array $metrics): void
    {
        $this->logMetric('cache_hit_rate', $metrics['hit_rate'] ?? null, $metrics);

        if (isset($metrics['hit_rate']) && $metrics['hit_rate'] < $this->config['monitoring']['metrics']['cache_hit_rate_min']) {
            app(PermissionAlertService::class)->createAlert(
                'medium',
                'Low Cache Hit Rate',
                "Cache hit rate is {$metrics['hit_rate']}, below minimum threshold.",
                $metrics
            );
        }
    }

    /**
     * Log failed permission attempts
     */
    public function logFailedAttempt(array $context = []): void
    {
        $this->logMetric('failed_permission_attempt', 1, $context);

        // Check for rate limiting
        $recentFailures = $this->getRecentFailures(1); // Last minute
        if ($recentFailures >= $this->config['monitoring']['metrics']['failed_attempts_threshold']) {
            app(PermissionAlertService::class)->createAlert(
                'high',
                'High Failed Permission Attempts',
                "Detected {$recentFailures} failed attempts in the last minute.",
                ['recent_failures' => $recentFailures, 'context' => $context]
            );
        }
    }

    /**
     * Get recent failed attempts count
     */
    public function getRecentFailures(int $minutes = 1): int
    {
        return PermissionMonitoringLog::where('metric_type', 'failed_permission_attempt')
            ->where('logged_at', '>=', now()->subMinutes($minutes))
            ->count();
    }

    /**
     * Perform health checks
     */
    public function performHealthCheck(string $checkType): array
    {
        $result = [
            'status' => 'healthy',
            'details' => [],
            'checked_at' => now(),
        ];

        switch ($checkType) {
            case 'database':
                $result = $this->checkDatabaseConnectivity();
                break;
            case 'cache':
                $result = $this->checkCacheSystem();
                break;
            case 'api_endpoints':
                $result = $this->checkApiEndpoints();
                break;
        }

        PermissionHealthCheck::create([
            'check_type' => $checkType,
            'status' => $result['status'],
            'details' => json_encode($result['details']),
            'checked_at' => $result['checked_at'],
        ]);

        return $result;
    }

    /**
     * Check database connectivity
     */
    protected function checkDatabaseConnectivity(): array
    {
        try {
            $start = microtime(true);
            DB::select('SELECT 1');
            $responseTime = (microtime(true) - $start) * 1000;

            return [
                'status' => $responseTime > 1000 ? 'warning' : 'healthy',
                'details' => ['response_time_ms' => $responseTime],
                'checked_at' => now(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'critical',
                'details' => ['error' => $e->getMessage()],
                'checked_at' => now(),
            ];
        }
    }

    /**
     * Check cache system
     */
    protected function checkCacheSystem(): array
    {
        try {
            $testKey = 'permission_health_check_' . time();
            Cache::put($testKey, 'test', 10);
            $value = Cache::get($testKey);
            Cache::forget($testKey);

            return [
                'status' => $value === 'test' ? 'healthy' : 'warning',
                'details' => ['cache_working' => $value === 'test'],
                'checked_at' => now(),
            ];
        } catch (\Exception $e) {
            return [
                'status' => 'critical',
                'details' => ['error' => $e->getMessage()],
                'checked_at' => now(),
            ];
        }
    }

    /**
     * Check API endpoints (placeholder)
     */
    protected function checkApiEndpoints(): array
    {
        // This would check actual permission API endpoints
        return [
            'status' => 'healthy',
            'details' => ['endpoints_checked' => 0],
            'checked_at' => now(),
        ];
    }

    /**
     * Get monitoring statistics
     */
    public function getStatistics(Carbon $startDate = null, Carbon $endDate = null): array
    {
        $startDate = $startDate ?: now()->subDays(7);
        $endDate = $endDate ?: now();

        $stats = [
            'response_times' => $this->getAverageResponseTime($startDate, $endDate),
            'cache_performance' => $this->getCachePerformance($startDate, $endDate),
            'failed_attempts' => $this->getFailedAttemptsCount($startDate, $endDate),
            'health_status' => $this->getHealthStatus(),
        ];

        return $stats;
    }

    /**
     * Get average response time
     */
    protected function getAverageResponseTime(Carbon $start, Carbon $end): float
    {
        return PermissionMonitoringLog::where('metric_type', 'permission_check_response_time')
            ->whereBetween('logged_at', [$start, $end])
            ->avg('value') ?? 0;
    }

    /**
     * Get cache performance metrics
     */
    public function getCachePerformance(Carbon $start, Carbon $end): array
    {
        $cacheLogs = PermissionMonitoringLog::where('metric_type', 'cache_hit_rate')
            ->whereBetween('logged_at', [$start, $end])
            ->get();

        return [
            'average_hit_rate' => $cacheLogs->avg('value') ?? 0,
            'samples' => $cacheLogs->count(),
        ];
    }

    /**
     * Get failed attempts count
     */
    public function getFailedAttemptsCount(Carbon $start, Carbon $end): int
    {
        return PermissionMonitoringLog::where('metric_type', 'failed_permission_attempt')
            ->whereBetween('logged_at', [$start, $end])
            ->sum('value') ?? 0;
    }

    /**
     * Get current health status
     */
    protected function getHealthStatus(): array
    {
        $latestChecks = PermissionHealthCheck::orderBy('checked_at', 'desc')
            ->take(10)
            ->get()
            ->groupBy('check_type');

        $status = [];
        foreach ($latestChecks as $type => $checks) {
            $status[$type] = $checks->first()->status;
        }

        return $status;
    }
}
