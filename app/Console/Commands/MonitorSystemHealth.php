<?php

namespace App\Console\Commands;

use App\Services\SmartCacheService;
use App\Services\StatsService;
use Illuminate\Console\Command;

class MonitorSystemHealth extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'monitor:system-health {--cache : Show cache statistics} {--growth : Show growth metrics}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitor system health including cache and growth statistics';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🩺 System Health Monitor');
        $this->line('========================');

        if ($this->option('cache') || !$this->option('growth')) {
            $this->showCacheStats();
        }

        if ($this->option('growth') || !$this->option('cache')) {
            $this->showGrowthMetrics();
        }

        $this->line('');
        $this->info('✅ Health check completed');
    }

    private function showCacheStats()
    {
        $cacheService = app(SmartCacheService::class);
        $stats = $cacheService->getCacheStats();

        $this->line('📊 Cache Statistics:');
        $this->line("   Driver: {$stats['cache_driver']}");
        $this->line("   Cache Size: {$stats['file_cache_size']}");

        $this->line('   Cache Keys Status:');
        foreach ($stats['cache_keys'] as $key => $exists) {
            $status = $exists ? '✅ Cached' : '❌ Not cached';
            $this->line("     {$key}: {$status}");
        }
    }

    private function showGrowthMetrics()
    {
        $statsService = app(StatsService::class);
        $metrics = $statsService->getGrowthMetrics();

        $this->line('📈 Growth Metrics:');

        if (isset($metrics['patients_this_month'])) {
            $this->line("   Patients this month: {$metrics['patients_this_month']}");
        }

        if (isset($metrics['appointments_this_month'])) {
            $this->line("   Appointments this month: {$metrics['appointments_this_month']}");
        }

        if (isset($metrics['avg_appointments_per_patient'])) {
            $this->line("   Avg appointments per patient: {$metrics['avg_appointments_per_patient']}");
        }

        if (isset($metrics['database_size_mb'])) {
            $this->line("   Database size: {$metrics['database_size_mb']} MB");
        }

        if (isset($metrics['growth_rate_last_3_months'])) {
            $rate = $metrics['growth_rate_last_3_months'];
            $trend = $rate > 0 ? '📈' : ($rate < 0 ? '📉' : '➡️');
            $this->line("   Growth rate (last 3 months): {$trend} {$rate}%");
        }

        if (isset($metrics['largest_tables']) && is_array($metrics['largest_tables'])) {
            $this->line('   Largest tables:');
            foreach (array_slice($metrics['largest_tables'], 0, 3) as $table) {
                $this->line("     {$table->table_name}: {$table->size_mb} MB ({$table->table_rows} rows)");
            }
        }
    }
}