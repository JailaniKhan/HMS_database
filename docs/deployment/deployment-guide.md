# Deployment Guide: Enhanced Permission Management System

## Overview

This guide provides step-by-step instructions for deploying the enhanced permission management system to production environments. The deployment includes new features for temporary permissions, approval workflows, anomaly detection, and advanced security measures.

## Prerequisites

### System Requirements

- **PHP**: 8.1 or higher
- **Laravel**: 10.x or higher
- **Database**: MySQL 8.0+ or PostgreSQL 13+
- **Redis**: 6.0+ (recommended for caching)
- **Node.js**: 16+ (for frontend assets)

### Required Extensions

```bash
# PHP Extensions
php-mysql
php-pgsql
php-redis
php-gd
php-mbstring
php-xml
php-curl
```

### Environment Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-org/hms-permission-system.git
   cd hms-permission-system
   ```

2. **Install Dependencies**
   ```bash
   composer install --no-dev --optimize-autoloader
   npm install --production
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with production values
   ```

## Database Migration

### Pre-Deployment Preparation

1. **Backup Existing Database**
   ```bash
   mysqldump -u username -p database_name > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Verify Current Schema**
   ```sql
   -- Check existing permission-related tables
   SHOW TABLES LIKE '%permission%';
   SHOW TABLES LIKE '%role%';
   SHOW TABLES LIKE '%user%';
   ```

3. **Test Migration in Staging**
   ```bash
   # Run migration in staging environment first
   php artisan migrate --seed
   ```

### Migration Steps

#### Phase 1: Core Permission Tables

1. **Run Initial Migrations**
   ```bash
   php artisan migrate --step
   ```

2. **Verify Table Creation**
   ```sql
   SHOW TABLES WHERE Tables_in_your_database LIKE '%permission%';
   ```

3. **Check Foreign Key Constraints**
   ```sql
   SELECT
       TABLE_NAME,
       COLUMN_NAME,
       CONSTRAINT_NAME,
       REFERENCED_TABLE_NAME,
       REFERENCED_COLUMN_NAME
   FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
   WHERE REFERENCED_TABLE_SCHEMA = 'your_database'
   AND TABLE_NAME LIKE '%permission%';
   ```

#### Phase 2: Enhanced Features

1. **Run Feature Migrations**
   ```bash
   # Temporary permissions
   php artisan migrate --path=database/migrations/2026_01_18_085717_create_temporary_permissions_table.php

   # Permission dependencies
   php artisan migrate --path=database/migrations/2026_01_18_084257_create_permission_dependencies_table.php

   # Session tracking
   php artisan migrate --path=database/migrations/2026_01_18_09_create_permission_sessions_table.php

   # Audit tables
   php artisan migrate --path=database/migrations/2026_01_18_10_create_audit_logs_table.php
   ```

2. **Run Seeders**
   ```bash
   php artisan db:seed --class=PermissionSeeder
   php artisan db:seed --class=RolePermissionSeeder
   ```

#### Phase 3: Security Features

1. **IP Restrictions Table**
   ```bash
   php artisan migrate --path=database/migrations/2026_01_18_11_create_permission_ip_restrictions_table.php
   ```

2. **Security Configurations**
   ```bash
   php artisan config:publish permission-security
   ```

### Post-Migration Verification

#### Data Integrity Checks

1. **Verify Permission Data**
   ```sql
   SELECT COUNT(*) as total_permissions FROM permissions;
   SELECT COUNT(*) as total_role_permissions FROM role_permissions;
   SELECT COUNT(*) as total_user_permissions FROM user_permissions;
   ```

2. **Check Foreign Key Integrity**
   ```sql
   -- Find orphaned records
   SELECT up.* FROM user_permissions up
   LEFT JOIN users u ON up.user_id = u.id
   WHERE u.id IS NULL;

   SELECT rp.* FROM role_permissions rp
   LEFT JOIN permissions p ON rp.permission_id = p.id
   WHERE p.id IS NULL;
   ```

3. **Validate Permission Dependencies**
   ```sql
   SELECT pd.*, p1.name as permission_name, p2.name as depends_on_name
   FROM permission_dependencies pd
   JOIN permissions p1 ON pd.permission_id = p1.id
   JOIN permissions p2 ON pd.depends_on_permission_id = p2.id;
   ```

## Configuration Setup

### Environment Variables

```bash
# Database
DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_DATABASE=hms_permissions
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password

# Redis (for caching)
REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password
REDIS_PORT=6379
REDIS_PERMISSION_DB=1

# Permission System
PERMISSION_CACHE_TTL=900
PERMISSION_RATE_LIMIT_ATTEMPTS=100
PERMISSION_RATE_LIMIT_DECAY=1
PERMISSION_IP_RESTRICTION_ENABLED=true
PERMISSION_SESSION_TRACKING_ENABLED=true

# Security
APP_KEY=base64:your-app-key
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### Security Configuration

1. **Generate Application Key**
   ```bash
   php artisan key:generate
   ```

2. **Set Encryption Key**
   ```bash
   php artisan key:generate --key=encryption
   ```

3. **Configure CORS**
   ```php
   // config/cors.php
   'allowed_origins' => ['https://your-domain.com'],
   'allowed_headers' => ['*'],
   'allowed_methods' => ['*'],
   'supports_credentials' => true,
   ```

## Cache Configuration

### Redis Setup

1. **Install and Configure Redis**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server
   sudo systemctl enable redis-server
   sudo systemctl start redis-server

   # Configure Redis
   sudo nano /etc/redis/redis.conf
   # Set appropriate memory limits and persistence
   ```

2. **Laravel Cache Configuration**
   ```php
   // config/cache.php
   'stores' => [
       'redis' => [
           'driver' => 'redis',
           'connection' => 'permission-cache',
           'lock_connection' => 'default',
       ],
   ],

   'permission-cache' => [
       'ttl' => env('PERMISSION_CACHE_TTL', 900),
       'prefix' => 'permission:',
   ],
   ```

### Cache Warming

1. **Initial Cache Warm**
   ```bash
   php artisan permission:cache-warm
   ```

2. **Schedule Regular Warming**
   ```php
   // app/Console/Kernel.php
   protected function schedule(Schedule $schedule)
   {
       $schedule->command('permission:cache-warm')
                ->hourly()
                ->withoutOverlapping();
   }
   ```

## Security Implementation

### IP Restrictions Setup

1. **Configure Trusted IPs**
   ```bash
   php artisan permission:ip-allow 192.168.1.0/24 "Office network"
   php artisan permission:ip-allow 10.0.0.0/8 "VPN network"
   ```

2. **Block Known Bad IPs**
   ```bash
   php artisan permission:ip-block 192.0.2.1 "Known malicious IP"
   ```

### Rate Limiting Configuration

```php
// config/permission.php
'rate_limiting' => [
    'default' => [
        'attempts' => env('PERMISSION_RATE_LIMIT_ATTEMPTS', 100),
        'decay_minutes' => env('PERMISSION_RATE_LIMIT_DECAY', 1),
    ],
    'sensitive_operations' => [
        'attempts' => 10,
        'decay_minutes' => 1,
    ],
],
```

### Audit Logging Setup

1. **Configure Log Channels**
   ```php
   // config/logging.php
   'channels' => [
       'permission-audit' => [
           'driver' => 'daily',
           'path' => storage_path('logs/permission-audit.log'),
           'level' => 'info',
           'days' => 90,
       ],
   ],
   ```

2. **Test Audit Logging**
   ```bash
   php artisan permission:audit-test
   ```

## Queue Configuration

### Background Job Setup

1. **Configure Queue Driver**
   ```bash
   # .env
   QUEUE_CONNECTION=database  # or redis
   ```

2. **Create Queue Tables**
   ```bash
   php artisan queue:table
   php artisan migrate
   ```

3. **Start Queue Worker**
   ```bash
   php artisan queue:work --queue=permission-audit,permission-cache
   ```

4. **Supervisor Configuration**
   ```ini
   [program:hms-permission-queues]
   process_name=%(program_name)s_%(process_num)02d
   command=php /path/to/artisan queue:work --queue=permission-audit,permission-cache --sleep=3 --tries=3
   directory=/path/to/hms
   autostart=true
   autorestart=true
   numprocs=2
   user=www-data
   redirect_stderr=true
   stdout_logfile=/var/log/supervisor/hms-permission-queues.log
   ```

## Frontend Deployment

### Asset Compilation

1. **Build Assets**
   ```bash
   npm run build
   ```

2. **Optimize Assets**
   ```bash
   npm run production
   ```

3. **Version Assets** (for cache busting)
   ```php
   // config/app.php
   'asset_url' => env('ASSET_URL', 'https://cdn.your-domain.com'),
   ```

### API Documentation

1. **Generate OpenAPI Spec**
   ```bash
   php artisan permission:generate-api-docs
   ```

2. **Publish API Documentation**
   ```bash
   php artisan vendor:publish --provider="L5Swagger\ServiceProvider"
   php artisan l5-swagger:generate
   ```

## Testing and Verification

### Pre-Production Testing

1. **Run Test Suite**
   ```bash
   php artisan test
   ```

2. **Load Testing**
   ```bash
   # Using Apache Bench
   ab -n 1000 -c 10 https://your-domain.com/api/v1/admin/permissions/temporary-permissions

   # Using Artillery
   artillery quick --count 50 --num 10 https://your-domain.com/api/v1/admin/permissions/check-temporary-permission
   ```

3. **Security Testing**
   ```bash
   # SQL Injection testing
   sqlmap -u "https://your-domain.com/api/v1/admin/permissions/change-requests" --data="user_id=1"

   # XSS testing
   # Use OWASP ZAP or Burp Suite
   ```

### Functional Verification

1. **Permission Check Test**
   ```bash
   # Test permission granting
   curl -X POST https://your-domain.com/api/v1/admin/permissions/grant-temporary \
        -H "Authorization: Bearer {token}" \
        -H "Content-Type: application/json" \
        -d '{
          "user_id": 1,
          "permission_id": 1,
          "expires_at": "2024-12-31T23:59:59Z",
          "reason": "Deployment verification"
        }'
   ```

2. **Approval Workflow Test**
   ```bash
   # Create permission change request
   curl -X POST https://your-domain.com/api/v1/admin/permissions/change-requests \
        -H "Authorization: Bearer {token}" \
        -H "Content-Type: application/json" \
        -d '{
          "user_id": 2,
          "permissions_to_add": [1, 2],
          "reason": "Test approval workflow"
        }'

   # Approve request
   curl -X POST https://your-domain.com/api/v1/admin/permissions/change-requests/1/approve \
        -H "Authorization: Bearer {token}"
   ```

3. **Cache Performance Test**
   ```bash
   # Check cache hit rate
   php artisan permission:cache-stats

   # Verify cache invalidation
   php artisan permission:cache-clear-user 1
   ```

## Monitoring Setup

### Application Monitoring

1. **Laravel Telescope** (for development)
   ```bash
   php artisan telescope:install
   php artisan migrate
   ```

2. **Production Monitoring**
   - Set up New Relic or DataDog APM
   - Configure error tracking (Sentry/Bugsnag)
   - Implement custom metrics collection

### Database Monitoring

1. **Query Performance**
   ```sql
   -- Enable slow query log
   SET GLOBAL slow_query_log = 'ON';
   SET GLOBAL long_query_time = 1; -- Log queries taking longer than 1 second
   ```

2. **Connection Pool Monitoring**
   ```bash
   # Monitor database connections
   php artisan tinker
   >>> DB::select('SHOW PROCESSLIST');
   ```

### Cache Monitoring

1. **Redis Monitoring**
   ```bash
   # Redis CLI monitoring
   redis-cli monitor

   # Cache statistics
   redis-cli info stats
   ```

2. **Application Cache Metrics**
   ```php
   // Add to monitoring dashboard
   Cache::store('redis')->get('permission:hit_rate');
   Cache::store('redis')->get('permission:total_requests');
   ```

## Rollback Procedures

### Database Rollback

1. **Migration Rollback**
   ```bash
   # Rollback last migration
   php artisan migrate:rollback

   # Rollback specific migration
   php artisan migrate:rollback --step=3

   # Reset to clean state (dangerous!)
   php artisan migrate:reset
   ```

2. **Data Recovery**
   ```bash
   # Restore from backup
   mysql -u username -p database_name < backup_file.sql
   ```

### Application Rollback

1. **Code Rollback**
   ```bash
   git checkout previous-commit-hash
   composer install --no-dev
   npm run production
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

2. **Cache Flush**
   ```bash
   php artisan cache:clear
   php artisan permission:cache-clear-all
   ```

### Feature Flags

Implement feature flags for gradual rollout:

```php
// config/features.php
'temporary_permissions' => env('FEATURE_TEMPORARY_PERMISSIONS', true),
'approval_workflow' => env('FEATURE_APPROVAL_WORKFLOW', true),
'anomaly_detection' => env('FEATURE_ANOMALY_DETECTION', true),
```

## Post-Deployment Verification

### Health Checks

1. **Application Health**
   ```bash
   curl https://your-domain.com/health
   ```

2. **Database Connectivity**
   ```bash
   php artisan tinker
   >>> DB::connection()->getPdo();
   ```

3. **Cache Connectivity**
   ```bash
   php artisan tinker
   >>> Cache::store('redis')->get('test');
   ```

### Functional Tests

1. **API Endpoints**
   ```bash
   # Test all permission endpoints
   ./vendor/bin/phpunit tests/Feature/PermissionManagementTest.php
   ./vendor/bin/phpunit tests/Feature/TemporaryPermissionTest.php
   ./vendor/bin/phpunit tests/Feature/PermissionApprovalWorkflowTest.php
   ```

2. **Performance Benchmarks**
   ```bash
   # Run performance tests
   ./vendor/bin/phpunit tests/Feature/PermissionPerformanceTest.php
   ```

3. **Security Tests**
   ```bash
   # Run security test suite
   ./vendor/bin/phpunit tests/Feature/PermissionSecurityTest.php
   ```

## Maintenance Procedures

### Regular Maintenance Tasks

1. **Daily Tasks**
   ```bash
   # Clean expired temporary permissions
   php artisan permission:cleanup-expired

   # Update cache statistics
   php artisan permission:cache-stats

   # Rotate logs
   php artisan permission:rotate-logs
   ```

2. **Weekly Tasks**
   ```bash
   # Audit log analysis
   php artisan permission:audit-analysis

   # Security scan
   php artisan permission:security-scan

   # Performance report
   php artisan permission:performance-report
   ```

3. **Monthly Tasks**
   ```bash
   # Full security audit
   php artisan permission:full-audit

   # Database optimization
   php artisan permission:db-optimize

   # Backup verification
   php artisan permission:backup-verify
   ```

### Emergency Contacts

Maintain an emergency contact list:

- **Database Administrator**: contact@db-admin.com
- **Security Team**: security@company.com
- **Development Team**: dev@company.com
- **Infrastructure Team**: infra@company.com

### Incident Response

1. **Detection**: Monitor alerts and logs
2. **Assessment**: Evaluate impact and scope
3. **Response**: Follow incident response plan
4. **Recovery**: Restore services and data
5. **Review**: Conduct post-mortem analysis

This deployment guide ensures a smooth transition to the enhanced permission management system with minimal disruption and maximum security.
