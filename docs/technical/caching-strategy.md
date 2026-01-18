# Caching Strategy: Permission Management System

## Overview

The permission management system implements a multi-layer caching strategy to optimize performance while maintaining data consistency and security. This document outlines the caching architecture, implementation details, and maintenance procedures.

## Cache Architecture

### Cache Layers

#### 1. Application-Level Cache (Primary)
- **Technology**: Laravel Cache (Redis/Memory/File)
- **Purpose**: Permission check results and computed authorization data
- **TTL**: 15 minutes (900 seconds) default
- **Invalidation**: Selective cache clearing based on changes

#### 2. Database Query Cache (Secondary)
- **Technology**: MySQL Query Cache (if enabled)
- **Purpose**: Frequently executed permission queries
- **Scope**: Automatic query result caching

#### 3. Object Cache (Application)
- **Technology**: Laravel's model caching
- **Purpose**: User objects and permission relationships
- **TTL**: Varies by object type

### Cache Key Strategy

#### Permission Check Keys
```
user_permission:{user_id}:{permission_name}
```
- **Example**: `user_permission:123:edit-users`
- **TTL**: 15 minutes
- **Invalidation**: When user permissions change

#### Role Permission Keys
```
role_permissions:{role_name}
```
- **Example**: `role_permissions:Super Admin`
- **TTL**: 30 minutes
- **Invalidation**: When role permissions are modified

#### User Permission Override Keys
```
user_permission_overrides:{user_id}
```
- **Example**: `user_permission_overrides:123`
- **TTL**: 10 minutes
- **Invalidation**: When user-specific permissions change

#### Temporary Permission Keys
```
user_temp_permissions:{user_id}:{permission_name}
```
- **Example**: `user_temp_permissions:123:delete-users`
- **TTL**: Expires at permission expiration time
- **Invalidation**: When temporary permission expires or is revoked

## Cache Implementation

### Permission Check Caching

```php
public function hasPermission($permissionName): bool
{
    $cacheKey = "user_permission:{$this->id}:{$permissionName}";

    return Cache::remember($cacheKey, 900, function () use ($permissionName) {
        return $this->calculatePermission($permissionName);
    });
}
```

### Cache-Aware Permission Calculation

```php
private function calculatePermission($permissionName): bool
{
    // Super admin bypass
    if ($this->role === 'Super Admin') {
        return true;
    }

    // Check user-specific overrides (cached separately)
    $userOverride = $this->getUserPermissionOverride($permissionName);
    if ($userOverride !== null) {
        return $userOverride;
    }

    // Check role permissions (cached at role level)
    $roleHasPermission = $this->roleHasPermission($permissionName);
    if ($roleHasPermission) {
        return true;
    }

    // Check temporary permissions (time-sensitive caching)
    return $this->hasActiveTemporaryPermission($permissionName);
}
```

## Cache Invalidation Strategy

### Event-Driven Invalidation

#### Permission Change Events
```php
class PermissionChanged
{
    public $userId;
    public $permissionName;
    public $action; // 'granted', 'revoked', 'modified'

    public function __construct($userId, $permissionName, $action)
    {
        $this->userId = $userId;
        $this->permissionName = $permissionName;
        $this->action = $action;
    }
}
```

#### Cache Invalidation Listener
```php
class ClearPermissionCache
{
    public function handle(PermissionChanged $event)
    {
        $cacheKey = "user_permission:{$event->userId}:{$event->permissionName}";
        Cache::forget($cacheKey);

        // Also clear related caches
        $this->clearRelatedCaches($event->userId);
    }

    private function clearRelatedCaches($userId)
    {
        // Clear user's permission override cache
        Cache::forget("user_permission_overrides:{$userId}");

        // Clear any bulk permission caches
        Cache::forget("user_all_permissions:{$userId}");
    }
}
```

### Bulk Invalidation Scenarios

#### Role Permission Changes
```php
public function updateRolePermissions($role, $permissions)
{
    // Update database
    RolePermission::where('role', $role)->delete();
    foreach ($permissions as $permissionId) {
        RolePermission::create(['role' => $role, 'permission_id' => $permissionId]);
    }

    // Invalidate all caches for users with this role
    $this->invalidateRoleCaches($role);
}

private function invalidateRoleCaches($role)
{
    // Clear role permission cache
    Cache::forget("role_permissions:{$role}");

    // Find all users with this role and clear their caches
    $users = User::where('role', $role)->pluck('id');
    foreach ($users as $userId) {
        Cache::forget("user_permission:*:{$userId}:*"); // Pattern invalidation
    }
}
```

#### Temporary Permission Expiration
```php
// Scheduled job to clean expired permissions
public function cleanExpiredPermissions()
{
    $expiredPermissions = TemporaryPermission::where('expires_at', '<', now())
        ->where('is_active', true)
        ->get();

    foreach ($expiredPermissions as $permission) {
        // Deactivate permission
        $permission->update(['is_active' => false]);

        // Clear related caches
        Cache::forget("user_temp_permissions:{$permission->user_id}:{$permission->permission->name}");
        Cache::forget("user_permission:{$permission->user_id}:{$permission->permission->name}");
    }
}
```

## Cache Performance Optimization

### Cache Warming Strategy

#### On-Demand Warming
```php
public function warmUserPermissionCache($userId)
{
    $user = User::find($userId);
    $permissions = Permission::all();

    foreach ($permissions as $permission) {
        $cacheKey = "user_permission:{$userId}:{$permission->name}";
        $hasPermission = $user->calculatePermission($permission->name);

        Cache::put($cacheKey, $hasPermission, 900);
    }
}
```

#### Background Warming
```php
// Queue job for cache warming
dispatch(new WarmPermissionCache($userId))
    ->onQueue('cache-warming')
    ->delay(now()->addSeconds(30)); // Delay to avoid immediate load
```

### Cache Compression

#### Large Dataset Compression
```php
public function getCompressedUserPermissions($userId)
{
    $permissions = Cache::remember("user_all_permissions:{$userId}", 1800, function () use ($userId) {
        return User::find($userId)->getAllPermissions();
    });

    // Compress if dataset is large
    if (strlen(json_encode($permissions)) > 10000) {
        return gzcompress(json_encode($permissions));
    }

    return $permissions;
}
```

### Cache Partitioning

#### User-Based Partitioning
```php
private function getCachePartition($userId)
{
    // Distribute users across cache partitions
    $partition = $userId % 10; // 10 partitions
    return "permission_cache_{$partition}";
}

public function partitionedCache($key, $ttl, $callback)
{
    $partition = $this->getCachePartition(extractUserId($key));
    return Cache::store($partition)->remember($key, $ttl, $callback);
}
```

## Cache Monitoring and Analytics

### Cache Hit/Miss Metrics

#### Monitoring Implementation
```php
class CacheMetrics
{
    public static function recordCacheAccess($key, $hit)
    {
        $metric = $hit ? 'cache.hit' : 'cache.miss';
        $tags = ['key_pattern' => self::extractPattern($key)];

        metrics()->increment($metric, 1, $tags);
    }

    public static function getCacheHitRate()
    {
        $hits = metrics()->get('cache.hit', 'sum', '1h');
        $misses = metrics()->get('cache.miss', 'sum', '1h');

        return $hits / ($hits + $misses);
    }
}
```

#### Performance Dashboards
- Real-time cache hit rates
- Cache size and memory usage
- Invalidation frequency
- Slow cache operations

### Cache Health Checks

#### Automated Health Monitoring
```php
public function checkCacheHealth()
{
    $checks = [
        'redis_connection' => $this->checkRedisConnection(),
        'cache_write' => $this->checkCacheWrite(),
        'cache_read' => $this->checkCacheRead(),
        'memory_usage' => $this->checkMemoryUsage(),
        'hit_rate' => $this->checkHitRate(),
    ];

    $unhealthy = array_filter($checks, fn($check) => !$check['healthy']);

    if (!empty($unhealthy)) {
        Log::warning('Cache health issues detected', $unhealthy);
        // Send alerts
    }

    return $checks;
}
```

## Cache Configuration

### Environment-Based Configuration

```php
// config/permission-cache.php
return [
    'default_ttl' => env('PERMISSION_CACHE_TTL', 900), // 15 minutes

    'cache_store' => env('PERMISSION_CACHE_STORE', 'redis'),

    'partitioning' => [
        'enabled' => env('CACHE_PARTITIONING_ENABLED', false),
        'partitions' => env('CACHE_PARTITIONS', 10),
    ],

    'monitoring' => [
        'enabled' => env('CACHE_MONITORING_ENABLED', true),
        'metrics_driver' => env('CACHE_METRICS_DRIVER', 'prometheus'),
    ],

    'warming' => [
        'enabled' => env('CACHE_WARMING_ENABLED', true),
        'queue' => env('CACHE_WARMING_QUEUE', 'cache-warming'),
    ],
];
```

### Cache Store Selection

#### Redis (Recommended for Production)
```php
'redis' => [
    'client' => env('REDIS_CLIENT', 'phpredis'),
    'options' => [
        'cluster' => env('REDIS_CLUSTER', 'redis'),
        'prefix' => env('REDIS_PREFIX', 'permission:'),
    ],
    'default' => [
        'url' => env('REDIS_URL'),
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'password' => env('REDIS_PASSWORD'),
        'port' => env('REDIS_PORT', 6379),
        'database' => env('REDIS_PERMISSION_DB', 1),
    ],
],
```

#### File Cache (Development)
```php
'file' => [
    'driver' => 'file',
    'path' => storage_path('framework/cache/permission'),
    'permission_ttl' => 900,
],
```

## Maintenance Procedures

### Regular Cache Maintenance

#### Daily Tasks
```bash
# Clear expired cache entries
php artisan cache:clear-expired

# Warm frequently accessed caches
php artisan permission:cache-warm

# Generate cache performance report
php artisan permission:cache-report
```

#### Weekly Tasks
```bash
# Analyze cache usage patterns
php artisan permission:cache-analyze

# Optimize cache configuration
php artisan permission:cache-optimize

# Backup cache configuration
php artisan config:cache-backup
```

### Emergency Cache Operations

#### Cache Flush Procedures
```php
// Emergency cache flush
public function emergencyCacheFlush()
{
    // Log the flush operation
    Log::critical('Emergency cache flush initiated', [
        'reason' => 'Manual intervention required',
        'timestamp' => now(),
    ]);

    // Flush all permission caches
    Cache::store('redis')->flush();

    // Notify administrators
    Notification::send(
        User::where('role', 'Super Admin')->get(),
        new CacheFlushedNotification()
    );
}
```

#### Cache Recovery
```php
public function recoverCache()
{
    // Warm critical caches first
    $this->warmCriticalCaches();

    // Gradually warm less critical caches
    dispatch(new WarmAllCaches())->delay(now()->addMinutes(5));

    // Monitor recovery progress
    $this->monitorCacheRecovery();
}
```

## Troubleshooting Cache Issues

### Common Problems and Solutions

#### Cache Inconsistency
**Symptoms**: Users have wrong permissions after changes
**Solution**:
```php
// Force cache invalidation
$user->clearPermissionCache();
Cache::tags(['permissions'])->flush();
```

#### Cache Performance Degradation
**Symptoms**: Slow permission checks, high memory usage
**Solutions**:
- Reduce TTL values
- Implement cache partitioning
- Add more Redis instances
- Review cache key patterns

#### Cache Stampede
**Symptoms**: High database load during cache misses
**Solutions**:
- Implement cache warming
- Use mutex locks for cache regeneration
- Stagger cache expiration times

### Debugging Tools

#### Cache Debug Commands
```bash
# View cache contents
php artisan tinker
>>> Cache::store('redis')->keys('permission:*')

# Monitor cache operations
php artisan permission:cache-monitor

# Simulate cache failures
php artisan permission:cache-stress-test
```

#### Logging Cache Operations
```php
config('logging.channels.cache' => [
    'driver' => 'single',
    'path' => storage_path('logs/cache.log'),
    'level' => 'debug',
]);

Log::channel('cache')->info('Cache operation', [
    'operation' => 'get',
    'key' => $key,
    'hit' => $hit,
    'duration' => $duration,
]);
```

## Scaling Considerations

### Horizontal Scaling

#### Cache Distribution
- Redis Cluster for multi-node caching
- Cache partitioning by user ID ranges
- Consistent hashing for cache key distribution

#### Cache Replication
- Master-slave replication for read-heavy workloads
- Multi-region replication for global deployments
- Automatic failover handling

### Performance Benchmarks

#### Target Performance Metrics
- **Cache Hit Rate**: >95%
- **Average Response Time**: <50ms for cached requests
- **Memory Usage**: <1GB per 1000 active users
- **Cache Invalidation Latency**: <100ms

#### Monitoring Thresholds
- Alert when hit rate drops below 90%
- Alert when memory usage exceeds 80%
- Alert when invalidation takes longer than 200ms

This caching strategy ensures optimal performance while maintaining data consistency and providing robust monitoring capabilities for the permission management system.
