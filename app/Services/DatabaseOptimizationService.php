<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Database\QueryException;

class DatabaseOptimizationService
{
    /**
     * Cache prefix for database optimization
     */
    protected const CACHE_PREFIX = 'db_optimization_';

    /**
     * Cache TTL in minutes
     */
    protected const CACHE_TTL = 60;

    /**
     * Optimize a query with caching and pagination
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param array $pagination
     * @param string|null $cacheKey
     * @param int|null $cacheTTL
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function optimizeQuery($query, array $pagination = [], ?string $cacheKey = null, ?int $cacheTTL = null)
    {
        $page = $pagination['page'] ?? 1;
        $perPage = $pagination['perPage'] ?? 15;
        $cacheTTL = $cacheTTL ?? self::CACHE_TTL;

        // Build cache key if provided
        $finalCacheKey = $cacheKey ? self::CACHE_PREFIX . $cacheKey . "_page_{$page}_per_page_{$perPage}" : null;

        if ($finalCacheKey && Cache::has($finalCacheKey)) {
            return Cache::get($finalCacheKey);
        }

        try {
            // Apply eager loading to prevent N+1 queries
            $query = $this->applyEagerLoading($query);
            
            // Apply query optimization
            $query = $this->optimizeQueryStructure($query);
            
            // Execute with pagination
            $results = $query->paginate($perPage, ['*'], 'page', $page);

            // Cache the results if cache key is provided
            if ($finalCacheKey) {
                Cache::put($finalCacheKey, $results, now()->addMinutes($cacheTTL));
            }

            return $results;

        } catch (QueryException $e) {
            Log::error('Database query optimization failed', [
                'error' => $e->getMessage(),
                'query' => $query->toSql(),
                'bindings' => $query->getBindings()
            ]);

            // Fallback to non-optimized query
            return $query->paginate($perPage);
        }
    }

    /**
     * Apply eager loading to prevent N+1 queries
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function applyEagerLoading($query)
    {
        $model = $query->getModel();
        $table = $model->getTable();

        // Define common relationships to eager load based on the model
        $eagerLoads = $this->getEagerLoadsForTable($table);

        if (!empty($eagerLoads)) {
            $query->with($eagerLoads);
        }

        return $query;
    }

    /**
     * Get eager loads for specific tables
     *
     * @param string $table
     * @return array
     */
    protected function getEagerLoadsForTable(string $table): array
    {
        $eagerLoads = [];

        switch ($table) {
            case 'appointments':
                $eagerLoads = ['patient', 'doctor', 'department'];
                break;
            case 'medical_records':
                $eagerLoads = ['patient', 'doctor'];
                break;
            case 'bills':
                $eagerLoads = ['patient', 'items'];
                break;
            case 'lab_tests':
                $eagerLoads = ['patient', 'doctor', 'results'];
                break;
            case 'medicines':
                $eagerLoads = ['category', 'alerts'];
                break;
            case 'sales':
                $eagerLoads = ['patient', 'items.medicine'];
                break;
            case 'users':
                $eagerLoads = ['permissions', 'roles'];
                break;
        }

        return $eagerLoads;
    }

    /**
     * Optimize query structure
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function optimizeQueryStructure($query)
    {
        // Remove unnecessary select statements
        if (!$query->getQuery()->columns) {
            $query->select('*');
        }

        // Optimize orderBy clauses
        $query = $this->optimizeOrderBy($query);

        // Apply query hints where appropriate
        $query = $this->applyQueryHints($query);

        return $query;
    }

    /**
     * Optimize ORDER BY clauses
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function optimizeOrderBy($query)
    {
        $orders = $query->getQuery()->orders;

        if (empty($orders)) {
            // Add default ordering for better performance
            $model = $query->getModel();
            $query->orderBy($model->getTable() . '.' . $model->getKeyName(), 'desc');
        }

        return $query;
    }

    /**
     * Apply query hints for performance
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    protected function applyQueryHints($query)
    {
        // For MySQL, we can use query hints
        if (config('database.default') === 'mysql') {
            $query->from(DB::raw($query->getModel()->getTable() . ' USE INDEX(primary)'));
        }

        return $query;
    }

    /**
     * Get query execution statistics
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return array
     */
    public function getQueryStatistics($query): array
    {
        $startTime = microtime(true);
        
        try {
            $count = $query->count();
            $executionTime = microtime(true) - $startTime;

            return [
                'execution_time' => round($executionTime * 1000, 2), // in milliseconds
                'row_count' => $count,
                'query' => $query->toSql(),
                'bindings' => $query->getBindings(),
                'optimized' => true
            ];
        } catch (QueryException $e) {
            return [
                'execution_time' => 0,
                'row_count' => 0,
                'query' => $query->toSql(),
                'bindings' => $query->getBindings(),
                'optimized' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Clear cache for a specific key pattern
     *
     * @param string $pattern
     * @return bool
     */
    public function clearCache(string $pattern): bool
    {
        try {
            $keys = Cache::getRedis()->keys(self::CACHE_PREFIX . $pattern . '*');
            
            if (!empty($keys)) {
                Cache::getRedis()->del($keys);
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Failed to clear cache', ['error' => $e->getMessage()]);
            return false;
        }
    }

    /**
     * Get database connection statistics
     *
     * @return array
     */
    public function getDatabaseStatistics(): array
    {
        try {
            $connection = DB::connection();
            $pdo = $connection->getPdo();

            // Get connection statistics
            $stats = [];

            if (config('database.default') === 'mysql') {
                $result = $pdo->query('SHOW STATUS LIKE "Threads_connected"');
                $stats['active_connections'] = $result->fetchColumn(1);

                $result = $pdo->query('SHOW STATUS LIKE "Max_used_connections"');
                $stats['max_used_connections'] = $result->fetchColumn(1);

                $result = $pdo->query('SHOW STATUS LIKE "Innodb_buffer_pool_read_requests"');
                $stats['buffer_pool_read_requests'] = $result->fetchColumn(1);

                $result = $pdo->query('SHOW STATUS LIKE "Innodb_buffer_pool_reads"');
                $stats['buffer_pool_reads'] = $result->fetchColumn(1);

                if ($stats['buffer_pool_read_requests'] > 0) {
                    $stats['buffer_pool_hit_ratio'] = round(
                        (1 - ($stats['buffer_pool_reads'] / $stats['buffer_pool_read_requests'])) * 100, 2
                    );
                } else {
                    $stats['buffer_pool_hit_ratio'] = 0;
                }
            }

            return $stats;
        } catch (\Exception $e) {
            Log::error('Failed to get database statistics', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Optimize database tables
     *
     * @param array|null $tables
     * @return array
     */
    public function optimizeTables(?array $tables = null): array
    {
        $results = [];

        try {
            if (is_null($tables)) {
                // Get all tables
                $tables = DB::connection()->getDoctrineSchemaManager()->listTableNames();
            }

            foreach ($tables as $table) {
                try {
                    DB::statement("OPTIMIZE TABLE {$table}");
                    $results[$table] = ['status' => 'optimized', 'success' => true];
                } catch (QueryException $e) {
                    $results[$table] = ['status' => 'failed', 'error' => $e->getMessage(), 'success' => false];
                }
            }

            return $results;
        } catch (\Exception $e) {
            Log::error('Failed to optimize tables', ['error' => $e->getMessage()]);
            return ['error' => $e->getMessage()];
        }
    }

    /**
     * Analyze slow queries
     *
     * @param int $limit
     * @return array
     */
    public function analyzeSlowQueries(int $limit = 10): array
    {
        try {
            if (config('database.default') === 'mysql') {
                $result = DB::select("
                    SELECT 
                        query_time,
                        lock_time,
                        rows_sent,
                        rows_examined,
                        sql_text
                    FROM mysql.slow_log 
                    ORDER BY query_time DESC 
                    LIMIT {$limit}
                ");

                return $result;
            }

            return [];
        } catch (\Exception $e) {
            Log::error('Failed to analyze slow queries', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Get index usage statistics
     *
     * @param string|null $table
     * @return array
     */
    public function getIndexUsage(?string $table = null): array
    {
        try {
            if (config('database.default') === 'mysql') {
                $whereClause = $table ? "WHERE TABLE_NAME = '{$table}'" : '';
                
                $result = DB::select("
                    SELECT 
                        TABLE_NAME,
                        INDEX_NAME,
                        CARDINALITY,
                        SUB_PART,
                        NULLABLE
                    FROM information_schema.STATISTICS 
                    {$whereClause}
                    ORDER BY TABLE_NAME, INDEX_NAME
                ");

                return $result;
            }

            return [];
        } catch (\Exception $e) {
            Log::error('Failed to get index usage', ['error' => $e->getMessage()]);
            return [];
        }
    }
}