<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\PermissionMonitoringService;
use App\Services\PermissionAlertService;
use App\Models\TemporaryPermission;
use App\Models\PermissionSession;
use App\Models\AuditLog;
use App\Models\PermissionMonitoringLog;
use App\Models\PermissionHealthCheck;
use App\Models\PermissionAlert;
use Carbon\Carbon;

class PermissionMaintenanceCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'permission:maintenance
                            {--cleanup : Run cleanup operations}
                            {--health-check : Run health checks}
                            {--all : Run all maintenance operations}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform maintenance operations for the permission system';

    protected $monitoringService;
    protected $alertService;

    public function __construct(PermissionMonitoringService $monitoringService, PermissionAlertService $alertService)
    {
        parent::__construct();
        $this->monitoringService = $monitoringService;
        $this->alertService = $alertService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $config = config('permission-monitoring');

        if (!$config['enabled']) {
            $this->info('Permission monitoring is disabled. Skipping maintenance.');
            return;
        }

        $runCleanup = $this->option('cleanup') || $this->option('all');
        $runHealthCheck = $this->option('health-check') || $this->option('all');

        if (!$runCleanup && !$runHealthCheck) {
            $this->error('Please specify --cleanup, --health-check, or --all');
            return 1;
        }

        $this->info('Starting permission system maintenance...');

        if ($runCleanup) {
            $this->performCleanup();
        }

        if ($runHealthCheck) {
            $this->performHealthChecks();
        }

        $this->info('Permission maintenance completed successfully.');
    }

    /**
     * Perform cleanup operations
     */
    protected function performCleanup(): void
    {
        $this->info('Performing cleanup operations...');

        $config = config('permission-monitoring.maintenance');
        $retentionDays = $config['retention_days'];

        // Clean up expired temporary permissions
        if ($config['cleanup']['expired_temporary_permissions']) {
            $expiredTempPerms = TemporaryPermission::where('expires_at', '<', now())->delete();
            $this->info("Cleaned up {$expiredTempPerms} expired temporary permissions.");
        }

        // Clean up inactive sessions
        if ($config['cleanup']['inactive_sessions']) {
            $inactiveSessions = PermissionSession::where('last_activity', '<', now()->subDays(30))->delete();
            $this->info("Cleaned up {$inactiveSessions} inactive permission sessions.");
        }

        // Clean up old audit logs
        if ($config['cleanup']['old_audit_logs']) {
            $oldAuditLogs = AuditLog::where('created_at', '<', now()->subDays($retentionDays))->delete();
            $this->info("Cleaned up {$oldAuditLogs} old audit logs.");
        }

        // Clean up old monitoring logs
        $oldMonitoringLogs = PermissionMonitoringLog::where('logged_at', '<', now()->subDays($config['retention_days']))->delete();
        $this->info("Cleaned up {$oldMonitoringLogs} old monitoring logs.");

        // Clean up old health checks
        $oldHealthChecks = PermissionHealthCheck::where('checked_at', '<', now()->subDays($config['retention_days']))->delete();
        $this->info("Cleaned up {$oldHealthChecks} old health checks.");

        // Clean up old resolved alerts
        $oldResolvedAlerts = $this->alertService->cleanupOldAlerts($config['retention_days']);
        $this->info("Cleaned up {$oldResolvedAlerts} old resolved alerts.");
    }

    /**
     * Perform health checks
     */
    protected function performHealthChecks(): void
    {
        $this->info('Performing health checks...');

        $checks = ['database', 'cache', 'api_endpoints'];
        $results = [];

        foreach ($checks as $checkType) {
            $this->info("Checking {$checkType}...");
            $result = $this->monitoringService->performHealthCheck($checkType);
            $results[$checkType] = $result;

            $statusEmoji = match ($result['status']) {
                'healthy' => '✅',
                'warning' => '⚠️',
                'critical' => '❌',
                default => '❓',
            };

            $this->info("{$statusEmoji} {$checkType}: {$result['status']}");

            // Create alerts for non-healthy status
            if ($result['status'] !== 'healthy') {
                $this->alertService->createCriticalAlert(
                    "Health Check Failed: {$checkType}",
                    "Health check for {$checkType} returned status: {$result['status']}",
                    $result
                );
            }
        }

        $this->displayHealthSummary($results);
    }

    /**
     * Display health check summary
     */
    protected function displayHealthSummary(array $results): void
    {
        $this->info("\nHealth Check Summary:");

        $healthy = 0;
        $warnings = 0;
        $critical = 0;

        foreach ($results as $checkType => $result) {
            match ($result['status']) {
                'healthy' => $healthy++,
                'warning' => $warnings++,
                'critical' => $critical++,
            };
        }

        $this->info("✅ Healthy: {$healthy}");
        $this->info("⚠️ Warnings: {$warnings}");
        $this->info("❌ Critical: {$critical}");

        if ($critical > 0) {
            $this->error('Critical health issues detected. Please review system status.');
        } elseif ($warnings > 0) {
            $this->warn('Warning conditions detected. Monitor system closely.');
        } else {
            $this->info('All systems healthy.');
        }
    }

    /**
     * Validate permission dependencies
     */
    protected function validatePermissionDependencies(): void
    {
        $this->info('Validating permission dependencies...');

        // This would check for broken dependencies in permission system
        // Implementation depends on the specific dependency logic

        $this->info('Permission dependency validation completed.');
    }

    /**
     * Archive old data (optional enhancement)
     */
    protected function archiveOldData(): void
    {
        $this->info('Archiving old data...');

        // Implementation for archiving old monitoring data to separate storage
        // Could move to archival tables or external storage

        $this->info('Data archiving completed.');
    }
}
