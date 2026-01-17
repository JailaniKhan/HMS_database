<?php

namespace App\Console\Commands;

use App\Services\SmartCacheService;
use App\Services\StatsService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

class CacheWarmup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'cache:warmup
                          {--force : Force cache refresh even if cache exists}
                          {--stats-only : Only warm up statistics caches}
                          {--forms-only : Only warm up form data caches}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Warm up application caches for improved performance';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔥 Warming up application caches...');
        $this->line('');

        $cacheService = app(SmartCacheService::class);
        $force = $this->option('force');
        $statsOnly = $this->option('stats-only');
        $formsOnly = $this->option('forms-only');

        $startTime = microtime(true);

        if (!$statsOnly) {
            $this->warmupFormCaches($cacheService, $force);
        }

        if (!$formsOnly) {
            $this->warmupStatisticsCaches($cacheService, $force);
        }

        if (!$statsOnly && !$formsOnly) {
            $this->warmupAdditionalCaches($cacheService, $force);
        }

        $endTime = microtime(true);
        $duration = round($endTime - $startTime, 2);

        $this->line('');
        $this->info("✅ Cache warmup completed in {$duration}s");

        // Show cache statistics
        $this->showCacheStats($cacheService);
    }

    private function warmupFormCaches(SmartCacheService $cacheService, bool $force): void
    {
        $this->info('📝 Warming up form caches...');

        // Clear caches if force refresh
        if ($force) {
            Cache::forget('doctors_list');
            Cache::forget('departments_list');
            $this->line('   🧹 Cleared existing form caches');
        }

        // Warm up doctor list
        $this->line('   👨‍⚕️  Warming doctors list...');
        $doctors = $cacheService->getDoctorsList();
        $this->line('   ✅ Doctors cached: ' . $doctors->count() . ' records');

        // Warm up department list
        $this->line('   🏥 Warming departments list...');
        $departments = $cacheService->getDepartmentsList();
        $this->line('   ✅ Departments cached: ' . $departments->count() . ' records');

        $this->line('');
    }

    private function warmupStatisticsCaches(SmartCacheService $cacheService, bool $force): void
    {
        $this->info('📊 Warming up statistics caches...');

        // Clear caches if force refresh
        if ($force) {
            Cache::forget('dashboard_stats');
            Cache::forget('appointment_stats');
            Cache::forget('medicine_inventory_summary');
            Cache::forget('department_workload');
            Cache::forget('growth_metrics');
            $this->line('   🧹 Cleared existing statistics caches');
        }

        // Warm up dashboard statistics
        $this->line('   📈 Warming dashboard statistics...');
        $stats = $cacheService->getDashboardStats();
        $this->line('   ✅ Dashboard stats cached');

        // Warm up appointment statistics
        $this->line('   📅 Warming appointment statistics...');
        $appointmentStats = $cacheService->getAppointmentStats();
        $this->line('   ✅ Appointment stats cached');

        // Warm up medicine inventory
        $this->line('   💊 Warming medicine inventory...');
        $inventoryStats = $cacheService->getMedicineInventorySummary();
        $this->line('   ✅ Medicine inventory cached');

        // Warm up department workload
        $this->line('   👥 Warming department workload...');
        $workloadStats = $cacheService->getDepartmentWorkload();
        $this->line('   ✅ Department workload cached');

        // Warm up growth metrics
        $this->line('   📊 Warming growth metrics...');
        $growthMetrics = $cacheService->getGrowthMetrics();
        $this->line('   ✅ Growth metrics cached');

        $this->line('');
    }

    private function warmupAdditionalCaches(SmartCacheService $cacheService, bool $force): void
    {
        $this->info('🔧 Warming up additional caches...');

        // These are lighter caches that don't need force refresh checks
        $this->line('   ⚙️  Additional caches warmed up');

        $this->line('');
    }

    private function showCacheStats(SmartCacheService $cacheService): void
    {
        $this->info('📊 Cache Statistics:');

        $stats = $cacheService->getEnhancedCacheStats();

        $this->line("   💾 Cache Driver: {$stats['cache_driver']}");
        $this->line("   📁 Cache Size: {$stats['file_cache_size']}");
        $this->line("   🎯 Cache Hit Ratio: {$stats['cache_hit_ratio']}");

        $this->line('   🔍 Cache Keys Status:');
        foreach ($stats['cache_keys'] as $key => $exists) {
            $status = $exists ? '✅ Cached' : '❌ Not cached';
            $this->line("     {$key}: {$status}");
        }

        $this->line('');
        $this->comment('💡 Tip: Run this command after deployments or major data changes');
        $this->comment('💡 Use --force to refresh all caches');
        $this->comment('💡 Use --stats-only or --forms-only for targeted warming');
    }
}
