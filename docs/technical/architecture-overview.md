# Technical Architecture: Enhanced Permission Management System

## System Overview

The Enhanced Permission Management System provides comprehensive access control for the Hospital Management System (HMS), featuring role-based permissions, temporary access grants, approval workflows, and real-time security monitoring.

## Core Components

### 1. Permission Model Architecture

#### Permission Entity
```php
class Permission extends Model
{
    protected $fillable = [
        'name',        // Unique permission identifier (e.g., 'view-users')
        'description', // Human-readable description
        'resource',    // Target resource (users, patients, etc.)
        'action',      // Action type (view, create, edit, delete)
        'category'     // Permission category for grouping
    ];
}
```

#### Permission Relationships
- **Role Permissions**: Many-to-many relationship between roles and permissions
- **User Permissions**: Direct user-permission overrides
- **Temporary Permissions**: Time-limited permission grants
- **Permission Dependencies**: Prerequisite permission requirements

### 2. User Authentication and Authorization

#### Multi-Layer Authorization
1. **Role-Based Access Control (RBAC)**: Primary authorization mechanism
2. **User-Specific Overrides**: Individual permission modifications
3. **Temporary Permissions**: Time-bound access grants
4. **Context-Aware Permissions**: Session and IP-based restrictions

#### Authorization Flow
```
User Request → Authentication → Role Check → User Override Check → Temporary Permission Check → Access Granted/Denied
```

### 3. Approval Workflow System

#### State Machine Implementation
```
Pending → Approved (automatic application) | Rejected (no changes)
    ↓
Expired (after timeout)
```

#### Workflow Components
- **PermissionChangeRequest**: Core request entity
- **Approval Engine**: Automated validation and application
- **Notification System**: Stakeholder alerts
- **Audit Trail**: Complete change history

## Database Schema

### Core Tables

#### permissions
```sql
CREATE TABLE permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    resource VARCHAR(255),
    action VARCHAR(255),
    category VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### role_permissions
```sql
CREATE TABLE role_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    role VARCHAR(255) NOT NULL,
    permission_id BIGINT NOT NULL,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY role_permission_unique (role, permission_id)
);
```

#### user_permissions
```sql
CREATE TABLE user_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    allowed BOOLEAN DEFAULT TRUE,
    granted_by BIGINT,
    granted_at TIMESTAMP,
    reason TEXT,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
```

#### temporary_permissions
```sql
CREATE TABLE temporary_permissions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    permission_id BIGINT NOT NULL,
    granted_by BIGINT NOT NULL,
    granted_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NULL,
    reason TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    revoked_by BIGINT NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    INDEX idx_user_permission (user_id, permission_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_is_active (is_active)
);
```

#### permission_change_requests
```sql
CREATE TABLE permission_change_requests (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    requested_by BIGINT NOT NULL,
    permissions_to_add JSON,
    permissions_to_remove JSON,
    reason TEXT NOT NULL,
    expires_at TIMESTAMP NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by BIGINT NULL,
    approved_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
);
```

#### permission_dependencies
```sql
CREATE TABLE permission_dependencies (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    permission_id BIGINT NOT NULL,
    depends_on_permission_id BIGINT NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY dep_unique (permission_id, depends_on_permission_id)
);
```

## Caching Strategy

### Cache Layers

#### 1. Application-Level Caching
- **Framework**: Laravel Cache (Redis/File/Memory)
- **TTL**: 15 minutes (900 seconds) for permission checks
- **Key Pattern**: `user_permission:{user_id}:{permission_name}`

#### 2. Permission Check Optimization
```php
public function hasPermission($permissionName): bool
{
    $cacheKey = "user_permission:{$this->id}:{$permissionName}";

    return Cache::remember($cacheKey, 900, function () use ($permissionName) {
        // Complex permission logic here
        return $this->calculatePermission($permissionName);
    });
}
```

#### 3. Cache Invalidation Strategy
- **Role Changes**: Clear all user caches in role
- **User Permission Changes**: Clear specific user cache
- **Temporary Permission Changes**: Clear affected user cache
- **Bulk Operations**: Selective cache clearing

### Cache Performance Characteristics
- **Hit Rate Target**: >95% for normal operations
- **Memory Usage**: ~50KB per active user
- **Cache Miss Latency**: <100ms for complex permission checks

## Security Architecture

### Authentication Integration

#### Sanctum Integration
- API token-based authentication
- Session management for web interface
- Token refresh mechanisms
- Device tracking and management

#### Multi-Factor Authentication (MFA)
- TOTP support
- Hardware security key integration
- Risk-based MFA triggers
- Backup recovery codes

### Authorization Middleware

#### permission.ip.restriction
```php
class IPRestrictionMiddleware
{
    public function handle($request, Closure $next, $permission)
    {
        $userIP = $request->ip();
        $allowedIPs = config('permissions.allowed_ips');

        if (!$this->isIPAllowed($userIP, $allowedIPs)) {
            return response()->json(['error' => 'IP not allowed'], 403);
        }

        return $next($request);
    }
}
```

#### permission.rate.limit
```php
class RateLimitMiddleware
{
    public function handle($request, Closure $next)
    {
        $key = 'permission_api:' . $request->user()->id;
        $maxAttempts = config('permissions.rate_limit_attempts', 100);
        $decayMinutes = config('permissions.rate_limit_decay', 1);

        if ($this->limiter->tooManyAttempts($key, $maxAttempts)) {
            return response()->json(['error' => 'Rate limit exceeded'], 429);
        }

        $this->limiter->hit($key, $decayMinutes * 60);

        return $next($request);
    }
}
```

#### permission.session
```php
class SessionTrackingMiddleware
{
    public function handle($request, Closure $next)
    {
        if ($request->user()) {
            PermissionSession::recordAction($request, [
                'action_type' => $this->getActionType($request),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        return $next($request);
    }
}
```

## Anomaly Detection System

### Detection Algorithms

#### 1. Bulk Permission Grants
```php
private function detectUnusualPermissionGrants(): Collection
{
    $recentGrants = TemporaryPermission::where('created_at', '>=', now()->subHour())->get();
    $grantsByUser = $recentGrants->groupBy('granted_by');

    foreach ($grantsByUser as $userId => $grants) {
        if ($grants->count() > 5) { // Threshold
            // Flag as anomaly
        }
    }
}
```

#### 2. Unusual Time Patterns
```php
private function detectUnusualTimePatterns(): Collection
{
    $unusualHourStart = 2; // 2 AM
    $unusualHourEnd = 5;   // 5 AM

    $unusualChanges = PermissionSessionAction::whereRaw(
        'HOUR(performed_at) BETWEEN ? AND ?',
        [$unusualHourStart, $unusualHourEnd]
    )->get();

    // Analyze patterns and flag anomalies
}
```

#### 3. Permission Escalation Attempts
```php
private function detectPermissionEscalation(): Collection
{
    $pendingRequests = PermissionChangeRequest::pending()
        ->with(['user', 'permissionsToAdd'])
        ->get();

    foreach ($pendingRequests as $request) {
        foreach ($request->permissionsToAdd() as $permission) {
            if ($this->isHighPrivilege($permission) &&
                !$request->user->hasPermission($permission->name)) {
                // Flag as potential escalation
            }
        }
    }
}
```

### Anomaly Scoring and Alerting

#### Severity Levels
- **Low**: Minor anomalies, informational
- **Medium**: Potential security concerns, review recommended
- **High**: Serious security threats, immediate action required
- **Critical**: System compromise suspected, emergency response

#### Alert Channels
- **Dashboard Notifications**: Real-time UI alerts
- **Email Alerts**: Critical anomaly notifications
- **Audit Logs**: Complete anomaly history
- **External Systems**: SIEM integration for high-severity events

## API Architecture

### RESTful API Design

#### Endpoint Organization
```
/api/v1/admin/permissions/
├── temporary-permissions     # GET: List active temp permissions
├── grant-temporary          # POST: Grant temporary permission
├── revoke-temporary/{id}    # DELETE: Revoke temporary permission
├── check-temporary-permission # POST: Check temp permission status
├── change-requests          # GET/POST: List/Create change requests
├── change-requests/{id}     # GET: Show specific request
├── change-requests/{id}/approve # POST: Approve request
├── change-requests/{id}/reject  # POST: Reject request
└── change-requests/{id}/cancel  # DELETE: Cancel request
```

#### Response Standardization
```json
{
    "data": { /* Primary response data */ },
    "meta": {
        "pagination": { /* Pagination info */ },
        "permissions": { /* Available actions */ }
    },
    "message": "Success message",
    "errors": { /* Validation errors */ }
}
```

### API Security

#### Request Validation
- Input sanitization and validation
- SQL injection prevention
- XSS protection
- Rate limiting and throttling

#### Response Security
- Sensitive data filtering
- Error message sanitization
- CORS configuration
- Content type validation

## Performance Optimization

### Database Optimization

#### Indexing Strategy
- Composite indexes on frequently queried columns
- Foreign key constraints with cascade deletes
- Partial indexes for active records
- Covering indexes for common query patterns

#### Query Optimization
```php
// Optimized permission check query
$user->userPermissions()
    ->whereHas('permission', function ($query) use ($permissionName) {
        $query->where('name', $permissionName);
    })
    ->active() // Scope for active records
    ->first();
```

### Background Processing

#### Queue-Based Operations
- Bulk permission updates
- Email notifications
- Audit log processing
- Cache invalidation

#### Scheduled Tasks
- Permission expiration cleanup
- Cache warming
- Anomaly detection analysis
- Report generation

## Monitoring and Observability

### Key Metrics

#### Performance Metrics
- Permission check response times
- Cache hit/miss ratios
- Database query performance
- API response times

#### Security Metrics
- Failed authentication attempts
- Permission escalation attempts
- Unusual access patterns
- Rate limit hits

#### Business Metrics
- Active temporary permissions
- Pending approval requests
- Permission change frequency
- User role distribution

### Logging Architecture

#### Structured Logging
```php
Log::info('Permission granted', [
    'user_id' => $user->id,
    'permission' => $permission->name,
    'granted_by' => Auth::id(),
    'ip_address' => request()->ip(),
    'reason' => $reason,
    'context' => [
        'user_agent' => request()->userAgent(),
        'session_id' => session()->getId(),
    ]
]);
```

#### Audit Trail Implementation
- Immutable audit logs
- Cryptographic integrity verification
- Long-term retention policies
- Compliance reporting capabilities

## Deployment and Scaling

### Horizontal Scaling

#### Database Sharding
- User-based sharding for permission data
- Read replicas for audit logs
- Connection pooling optimization

#### Cache Distribution
- Redis cluster for session storage
- Cache warming strategies
- Cache invalidation across nodes

### High Availability

#### Redundancy Design
- Multi-region database replication
- Load balancer configuration
- Failover procedures
- Backup and recovery strategies

#### Disaster Recovery
- Point-in-time recovery capabilities
- Cross-region backup storage
- Recovery time objectives (RTO)
- Recovery point objectives (RPO)

This architecture provides a robust, scalable, and secure foundation for permission management while maintaining performance and compliance requirements.
