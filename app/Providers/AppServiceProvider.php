<?php

namespace App\Providers;

use App\Services\SmartCacheService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Register Billing Services
        $this->app->singleton(\App\Services\Billing\BillItemService::class, function ($app) {
            return new \App\Services\Billing\BillItemService(
                $app->make(\App\Services\AuditLogService::class),
                $app->make(\App\Services\Billing\BillCalculationService::class)
            );
        });

        $this->app->singleton(\App\Services\Billing\BillCalculationService::class, function ($app) {
            return new \App\Services\Billing\BillCalculationService(
                $app->make(\App\Services\AuditLogService::class)
            );
        });

        $this->app->singleton(\App\Services\Billing\PaymentService::class, function ($app) {
            return new \App\Services\Billing\PaymentService(
                $app->make(\App\Services\AuditLogService::class),
                $app->make(\App\Services\Billing\BillCalculationService::class)
            );
        });

        $this->app->singleton(\App\Services\Billing\InvoiceGenerationService::class, function ($app) {
            return new \App\Services\Billing\InvoiceGenerationService(
                $app->make(\App\Services\AuditLogService::class)
            );
        });

        $this->app->singleton(\App\Services\Billing\InsuranceClaimService::class, function ($app) {
            return new \App\Services\Billing\InsuranceClaimService(
                $app->make(\App\Services\AuditLogService::class),
                $app->make(\App\Services\Billing\BillCalculationService::class)
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Warm up critical caches on application boot
        $this->warmupCriticalCaches();
    }

    /**
     * Warm up critical caches that are needed immediately
     * Only runs in production or when CACHE_WARMUP_ON_BOOT is true
     */
    private function warmupCriticalCaches(): void
    {
        // Only warm up if explicitly enabled or in production
        if (!config('app.cache_warmup_on_boot', false) && app()->environment() !== 'production') {
            return;
        }

        // Use a background process or defer to avoid blocking boot
        if (function_exists('pcntl_fork') && config('app.cache_warmup_async', true)) {
            // Fork process for async cache warming
            $pid = pcntl_fork();

            if ($pid === 0) {
                // Child process - do the cache warming
                $this->performCacheWarming();
                exit(0);
            }
        } else {
            // Synchronous warming (fallback)
            $this->performCacheWarming();
        }
    }

    /**
     * Perform the actual cache warming
     */
    private function performCacheWarming(): void
    {
        try {
            $cacheService = app(SmartCacheService::class);

            // Warm up only the most critical caches to avoid slowing down boot
            $cacheService->getDepartmentsList(); // Always needed for forms
            $cacheService->getDoctorsList();     // Frequently accessed

            // Optional: warm up stats if configured
            if (config('app.warmup_stats_on_boot', false)) {
                $cacheService->getDashboardStats();
            }

        } catch (\Exception $e) {
            // Log error but don't fail application boot
            logger()->warning('Cache warmup failed during application boot', [
                'error' => $e->getMessage()
            ]);
        }
    }
}
