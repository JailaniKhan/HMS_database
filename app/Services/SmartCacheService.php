<?php

namespace App\Services;

use App\Models\Patient;
use App\Services\StatsService;
use Illuminate\Support\Facades\Cache;

class SmartCacheService
{
    /**
     * Get cached dashboard statistics
     * TTL: 5 minutes - balances freshness with performance
     */
    public function getDashboardStats()
    {
        return Cache::remember('dashboard_stats', 300, function () { // 5 minutes
            return app(StatsService::class)->getDailyPatientStats();
        });
    }

    /**
     * Get patient with recent appointments (cached)
     * TTL: 15 minutes - patient data changes moderately
     */
    public function getPatientWithAppointments(int $patientId)
    {
        $cacheKey = "patient_{$patientId}_with_appts";

        return Cache::remember($cacheKey, 900, function () use ($patientId) { // 15 minutes
            return Patient::with(['appointments' => function ($q) {
                $q->where('appointment_date', '>', now()->subMonths(6))
                  ->orderBy('appointment_date', 'desc');
            }])->find($patientId);
        });
    }

    /**
     * Get doctor list with basic info (cached)
     * TTL: 1 hour - doctor info changes infrequently
     */
    public function getDoctorsList()
    {
        return Cache::remember('doctors_list', 3600, function () { // 1 hour
            return \App\Models\Doctor::select('id', 'first_name', 'last_name', 'specialization', 'status')
                ->where('status', 'active')
                ->orderBy('last_name')
                ->get();
        });
    }

    /**
     * Get department list (cached)
     * TTL: 2 hours - department data is very stable
     */
    public function getDepartmentsList()
    {
        return Cache::remember('departments_list', 7200, function () { // 2 hours
            return \App\Models\Department::select('id', 'name', 'description')
                ->orderBy('name')
                ->get();
        });
    }

    /**
     * Clear patient cache when updated
     */
    public function clearPatientCache(int $patientId)
    {
        Cache::forget("patient_{$patientId}_with_appts");
    }

    /**
     * Clear all dashboard caches
     */
    public function clearDashboardCache()
    {
        Cache::forget('dashboard_stats');
    }

    /**
     * Get cached growth metrics (longer cache since less frequent updates)
     * TTL: 4 hours - growth metrics don't need real-time updates
     */
    public function getGrowthMetrics()
    {
        return Cache::remember('growth_metrics', 14400, function () { // 4 hours
            return app(StatsService::class)->getGrowthMetrics();
        });
    }

    /**
     * Get current cache statistics for monitoring
     */
    public function getCacheStats(): array
    {
        return [
            'cache_driver' => config('cache.default'),
            'cache_keys' => [
                'dashboard_stats' => Cache::has('dashboard_stats'),
                'doctors_list' => Cache::has('doctors_list'),
                'departments_list' => Cache::has('departments_list'),
                'growth_metrics' => Cache::has('growth_metrics'),
            ],
            'file_cache_size' => $this->getFileCacheSize(),
        ];
    }

    /**
     * Get file cache directory size (for file-based caching)
     */
    private function getFileCacheSize(): string
    {
        $cachePath = storage_path('framework/cache/data');
        if (!file_exists($cachePath)) {
            return '0 B';
        }

        $size = 0;
        $files = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($cachePath));

        foreach ($files as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $this->formatBytes($size);
    }

    /**
     * Format bytes to human readable format
     */
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