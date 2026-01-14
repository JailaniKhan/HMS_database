<?php

namespace App\Console\Commands;

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
    protected $signature = 'db:health-check {--slow-queries : Check for slow queries}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Perform database health check and optimization suggestions';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Database Health Check...');

        // Check table sizes
        $this->checkTableSizes();

        // Check index usage
        $this->checkIndexUsage();

        // Check for missing indexes
        $this->checkMissingIndexes();

        // Performance recommendations
        $this->performanceRecommendations();

        if ($this->option('slow-queries')) {
            $this->checkSlowQueries();
        }

        $this->info('Database Health Check completed.');
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

    private function checkSlowQueries()
    {
        $this->info('Checking for slow queries (requires slow query log enabled)...');
        $this->line('Enable slow query log in MySQL config for detailed analysis.');
        $this->line('Set long_query_time = 1 in my.cnf');
    }
}