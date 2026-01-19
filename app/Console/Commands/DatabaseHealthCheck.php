<?php

namespace App\Console\Commands;

use App\Services\DatabaseErrorHandler;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DatabaseHealthCheck extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:health-check
                          {--slow-queries : Check for slow queries}
                          {--performance : Show performance metrics}
                          {--connections : Check connection health}
                          {--optimize : Run optimization suggestions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform comprehensive database health check and optimization';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Starting Comprehensive Database Health Check...');
        $this->line('');

        // Check connection health
        if ($this->option('connections') || !$this->option('slow-queries') && !$this->option('performance')) {
            $this->checkConnectionHealth();
        }

        // Check table sizes and structure
        $this->checkTableSizes();

        // Check index usage and effectiveness
        $this->checkIndexUsage();

        // Check for missing indexes
        $this->checkMissingIndexes();

        // Performance metrics
        if ($this->option('performance') || !$this->option('slow-queries') && !$this->option('connections')) {
            $this->showPerformanceMetrics();
        }

        // Performance recommendations
        $this->performanceRecommendations();

        if ($this->option('slow-queries')) {
            $this->checkSlowQueries();
        }

        if ($this->option('optimize')) {
            $this->runOptimizations();
        }

        $this->line('');
        $this->info('✅ Database Health Check completed.');
    }

    private function checkTableSizes()
    {
        $tables = DB::select("
            SELECT table_name,
                   ROUND((data_length + index_length) / 1024 / 1024, 2) AS size_mb,
                   table_rows
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            ORDER BY (data_length + index_length) DESC
        ");

        $this->info('Table Sizes:');
        foreach ($tables as $table) {
            $this->line("{$table->table_name}: {$table->size_mb} MB, {$table->table_rows} rows");
        }
    }

    private function checkIndexUsage()
    {
        $tables = ['users', 'patients', 'doctors', 'appointments', 'bills'];

        $this->info('Index Information:');
        foreach ($tables as $table) {
            $indexes = DB::select("SHOW INDEX FROM $table");
            $this->line("$table: " . count($indexes) . " indexes");
        }
    }

    private function checkMissingIndexes()
    {
        $this->info('Checking for potential missing indexes...');

        // Check foreign keys without indexes
        $fkWithoutIndex = DB::select("
            SELECT
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME NOT IN (
                SELECT TABLE_NAME
                FROM information_schema.STATISTICS
                WHERE INDEX_NAME != 'PRIMARY'
                AND TABLE_SCHEMA = DATABASE()
            )
        ");

        if (!empty($fkWithoutIndex)) {
            $this->warn('Foreign keys without indexes:');
            foreach ($fkWithoutIndex as $fk) {
                $this->line("{$fk->TABLE_NAME}.{$fk->COLUMN_NAME} -> {$fk->REFERENCED_TABLE_NAME}.{$fk->REFERENCED_COLUMN_NAME}");
            }
        }
    }

    private function performanceRecommendations()
    {
        $this->info('Performance Recommendations:');
        $this->line('- Consider partitioning large tables (appointments, bills) by date');
        $this->line('- Archive old data (appointments > 2 years, bills > 5 years)');
        $this->line('- Use EXPLAIN on slow queries to identify bottlenecks');
        $this->line('- Consider read replicas if read load is high');
        $this->line('- Optimize query patterns with eager loading');
    }

    private function checkConnectionHealth()
    {
        $this->info('🔗 Connection Health Check:');

        $handler = app(DatabaseErrorHandler::class);
        $isConnected = $handler->checkConnection();

        if ($isConnected) {
            $this->line('   ✅ Database connection: Healthy');
        } else {
            $this->error('   ❌ Database connection: Failed');
            return;
        }

        $metrics = $handler->getPerformanceMetrics();
        $this->line("   📊 Active connections: {$metrics['active_connections'] ?? 'N/A'}");
        $this->line("   📈 Query log count: {$metrics['query_log_count'] ?? 'N/A'}");
        $this->line("   🐌 Slow queries (>100ms): {$metrics['slow_queries'] ?? 'N/A'}");

        $this->line('');
    }

    private function showPerformanceMetrics()
    {
        $this->info('📊 Performance Metrics:');

        $handler = app(DatabaseErrorHandler::class);
        $metrics = $handler->getPerformanceMetrics();

        $this->line("   🔄 Connection Status: " . ($metrics['connection_status'] ? '✅ Healthy' : '❌ Issues'));
        $this->line("   📊 Query Count: {$metrics['query_log_count']}");
        $this->line("   🐌 Slow Queries: {$metrics['slow_queries']}");

        // Check MySQL status if available
        try {
            $status = DB::select('SHOW PROCESSLIST');
            $this->line("   👥 Active MySQL Threads: " . count($status));

            $waitingQueries = collect($status)->where('Command', 'Query')->count();
            $this->line("   ⏳ Waiting Queries: {$waitingQueries}");
        } catch (\Exception $e) {
            $this->warn("   ⚠️  Could not retrieve MySQL process list: " . $e->getMessage());
        }

        $this->line('');
    }

    private function runOptimizations()
    {
        $this->info('🔧 Running Database Optimizations:');

        if ($this->confirm('Analyze and optimize tables? This may take some time.')) {
            $tables = ['users', 'patients', 'doctors', 'appointments', 'bills', 'medicines'];
            $bar = $this->output->createProgressBar(count($tables));

            $this->line('Optimizing tables...');
            $bar->start();

            foreach ($tables as $table) {
                try {
                    DB::statement("OPTIMIZE TABLE {$table}");
                    $bar->advance();
                } catch (\Exception $e) {
                    $this->warn("Failed to optimize {$table}: " . $e->getMessage());
                }
            }

            $bar->finish();
            $this->line('');
            $this->info('✅ Table optimization completed.');
        }

        $this->line('');
    }

    private function checkSlowQueries()
    {
        $this->info('🐌 Slow Query Analysis:');

        // Check if slow query log is enabled
        try {
            $variables = DB::select("SHOW VARIABLES LIKE 'slow_query_log%'");
            $slowLogEnabled = collect($variables)->firstWhere('Variable_name', 'slow_query_log');

            if ($slowLogEnabled && $slowLogEnabled->Value === 'ON') {
                $this->line('   ✅ Slow query log is enabled');

                $logFile = collect($variables)->firstWhere('Variable_name', 'slow_query_log_file');
                if ($logFile) {
                    $this->line("   📁 Log file: {$logFile->Value}");
                }

                $longQueryTime = collect($variables)->firstWhere('Variable_name', 'long_query_time');
                if ($longQueryTime) {
                    $this->line("   ⏱️  Long query threshold: {$longQueryTime->Value}s");
                }
            } else {
                $this->warn('   ⚠️  Slow query log is not enabled');
                $this->line('   💡 Enable with: SET GLOBAL slow_query_log = \'ON\';');
                $this->line('   💡 Set threshold: SET GLOBAL long_query_time = 1;');
            }
        } catch (\Exception $e) {
            $this->warn("   ⚠️  Could not check slow query log status: " . $e->getMessage());
        }

        $this->line('');
    }
}
