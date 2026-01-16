<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ArchiveOldAuditLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'audit:archive {--days=90 : Number of days to keep logs}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Archive audit logs older than specified days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $days = $this->option('days');
        $cutoffDate = now()->subDays($days);

        $this->info("Archiving audit logs older than {$days} days ({$cutoffDate->format('Y-m-d')})");

        // Count logs to be archived
        $count = \App\Models\AuditLog::where('logged_at', '<', $cutoffDate)->count();

        if ($count === 0) {
            $this->info('No logs to archive.');
            return;
        }

        $this->info("Found {$count} logs to archive.");

        // Soft delete the old logs (they remain archived but not in active queries)
        // In production, implement proper archiving to separate table
        $deleted = \App\Models\AuditLog::where('logged_at', '<', $cutoffDate)->delete();

        $this->info("Archived {$deleted} audit logs successfully.");
    }
}
