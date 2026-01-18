# Security Measures: Permission Management System

## Overview

The enhanced permission management system implements multiple layers of security controls to protect against unauthorized access, data breaches, and system compromise. This document details the implemented security measures and their technical implementation.

## Authentication and Authorization

### Multi-Factor Authentication (MFA)

#### Implementation
```php
class LoginController
{
    public function authenticate(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (Auth::attempt($credentials)) {
            $user = Auth::user();

            // Check if MFA is required
            if ($user->requiresMfa()) {
                // Generate and send MFA challenge
                $this->initiateMfaChallenge($user);
                return response()->json(['mfa_required' => true]);
            }

            return $this->completeAuthentication($user);
        }

        // Log failed attempt
        $this->logFailedLogin($request);
        return response()->json(['error' => 'Invalid credentials'], 401);
    }
}
```

#### MFA Methods Supported
- **TOTP (Time-based One-Time Password)**: Google Authenticator, Authy
- **Hardware Security Keys**: FIDO2/WebAuthn compatible
- **SMS Backup Codes**: For recovery scenarios

#### MFA Enforcement
```php
class User extends Authenticatable
{
    public function requiresMfa(): bool
    {
        // Super admins always require MFA
        if ($this->isSuperAdmin()) {
            return true;
        }

        // MFA required for sensitive roles
        return in_array($this->role, config('auth.mfa_required_roles'));
    }
}
```

### Session Security

#### Session Management
```php
class PermissionSessionMiddleware
{
    public function handle($request, Closure $next)
    {
        $user = $request->user();

        if ($user) {
            // Create or update session record
            $session = PermissionSession::updateOrCreate(
                ['user_id' => $user->id, 'session_token' => session()->getId()],
                [
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'started_at' => now(),
                    'is_active' => true,
                ]
            );

            // Check for suspicious activity
            $this->detectSessionAnomalies($session, $request);
        }

        return $next($request);
    }
}
```

#### Session Invalidation
```php
class SecurityController
{
    public function invalidateUserSessions($userId)
    {
        // Mark all user sessions as inactive
        PermissionSession::where('user_id', $userId)
            ->where('is_active', true)
            ->update([
                'is_active' => false,
                'ended_at' => now(),
            ]);

        // Clear user caches
        Cache::tags(['user:' . $userId])->flush();

        // Log security action
        AuditLog::create([
            'action' => 'sessions_invalidated',
            'user_id' => auth()->id(),
            'target_user_id' => $userId,
            'ip_address' => request()->ip(),
            'details' => ['reason' => 'Security incident response'],
        ]);
    }
}
```

## Network Security

### IP-Based Access Control

#### IP Restriction Implementation
```php
class IpRestrictionMiddleware
{
    public function handle($request, Closure $next, $permission = null)
    {
        $clientIP = $request->ip();
        $user = $request->user();

        // Check if IP is explicitly blocked
        if ($this->isIpBlocked($clientIP)) {
            Log::warning('Blocked IP attempted access', [
                'ip' => $clientIP,
                'user_id' => $user?->id,
                'path' => $request->path(),
            ]);

            return response()->json(['error' => 'Access denied'], 403);
        }

        // Check permission-specific IP restrictions
        if ($permission && !$this->checkPermissionIpAccess($user, $permission, $clientIP)) {
            return response()->json(['error' => 'IP not authorized for this permission'], 403);
        }

        return $next($request);
    }

    private function isIpBlocked($ip): bool
    {
        return PermissionIpRestriction::where('ip_address', $ip)
            ->where('is_allowed', false)
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('expires_at')
                      ->orWhere('expires_at', '>', now());
            })
            ->exists();
    }
}
```

#### IP Whitelisting
```php
class IpRestrictionManager
{
    public function allowIP($ipAddress, $reason, $expiresAt = null)
    {
        PermissionIpRestriction::create([
            'ip_address' => $ipAddress,
            'is_allowed' => true,
            'reason' => $reason,
            'created_by' => auth()->id(),
            'expires_at' => $expiresAt,
            'is_active' => true,
        ]);

        Log::info('IP address whitelisted', [
            'ip' => $ipAddress,
            'reason' => $reason,
            'expires_at' => $expiresAt,
        ]);
    }

    public function blockIP($ipAddress, $reason, $expiresAt = null)
    {
        PermissionIpRestriction::create([
            'ip_address' => $ipAddress,
            'is_allowed' => false,
            'reason' => $reason,
            'created_by' => auth()->id(),
            'expires_at' => $expiresAt,
            'is_active' => true,
        ]);

        // Immediately terminate active sessions from this IP
        $this->terminateSessionsFromIP($ipAddress);

        Log::warning('IP address blocked', [
            'ip' => $ipAddress,
            'reason' => $reason,
        ]);
    }
}
```

### Network Segmentation

#### Administrative Network Isolation
- Separate VLANs for administrative access
- VPN requirements for remote administration
- Network Access Control (NAC) integration
- Micro-segmentation for sensitive systems

## Application Security

### Input Validation and Sanitization

#### Request Validation
```php
class PermissionChangeRequest extends FormRequest
{
    public function rules()
    {
        return [
            'user_id' => 'required|exists:users,id',
            'permissions_to_add' => 'nullable|array',
            'permissions_to_add.*' => 'exists:permissions,id',
            'permissions_to_remove' => 'nullable|array',
            'permissions_to_remove.*' => 'exists:permissions,id',
            'reason' => 'required|string|max:1000|regex:/^[a-zA-Z0-9\s\.,!?\-\(\)]+$/',
            'expires_at' => 'nullable|date|after:now|before:+30 days',
        ];
    }

    public function messages()
    {
        return [
            'reason.regex' => 'Reason contains invalid characters.',
            'expires_at.before' => 'Expiration cannot be more than 30 days in the future.',
        ];
    }
}
```

#### SQL Injection Prevention
- Parameterized queries in all database operations
- Eloquent ORM usage prevents SQL injection
- Input sanitization for dynamic queries

#### XSS Protection
```php
class SecurityHelper
{
    public static function sanitizeInput($input)
    {
        if (is_string($input)) {
            // Remove potentially dangerous HTML
            $input = strip_tags($input);

            // Convert special characters
            $input = htmlspecialchars($input, ENT_QUOTES | ENT_HTML5);

            // Additional XSS prevention
            $input = self::preventXssPatterns($input);
        }

        return $input;
    }

    private static function preventXssPatterns($input)
    {
        $patterns = [
            '/javascript:/i',
            '/vbscript:/i',
            '/onload=/i',
            '/onerror=/i',
            '/<script/i',
        ];

        return preg_replace($patterns, '', $input);
    }
}
```

### Rate Limiting

#### API Rate Limiting
```php
class RateLimitMiddleware
{
    public function handle($request, Closure $next)
    {
        $user = $request->user();
        $route = $request->route();

        // Different limits for different endpoints
        $limits = [
            'api.admin.permissions.grant-temporary' => [10, 1], // 10 per minute
            'api.admin.permissions.approve' => [50, 1],         // 50 per minute
            'api.admin.permissions.check' => [100, 1],          // 100 per minute
        ];

        $key = "rate_limit:{$user->id}:{$route->getName()}";

        if (isset($limits[$route->getName()])) {
            [$maxAttempts, $decayMinutes] = $limits[$route->getName()];

            if (RateLimiter::tooManyAttempts($key, $maxAttempts)) {
                Log::warning('Rate limit exceeded', [
                    'user_id' => $user->id,
                    'route' => $route->getName(),
                    'ip' => $request->ip(),
                ]);

                return response()->json(['error' => 'Rate limit exceeded'], 429);
            }

            RateLimiter::hit($key, $decayMinutes * 60);
        }

        return $next($request);
    }
}
```

#### Brute Force Protection
```php
class BruteForceProtection
{
    public function checkFailedLogin($email, $ip)
    {
        $key = "failed_login:{$email}:{$ip}";
        $attempts = Cache::get($key, 0);

        if ($attempts >= 5) {
            // Temporary account lockout
            $this->lockAccount($email);

            // IP blocking for severe cases
            if ($attempts >= 10) {
                app(IpRestrictionManager::class)->blockIP(
                    $ip,
                    'Brute force attack detected',
                    now()->addHours(24)
                );
            }

            return false;
        }

        Cache::put($key, $attempts + 1, 3600); // 1 hour
        return true;
    }
}
```

## Data Protection

### Encryption at Rest

#### Database Encryption
```php
class EncryptedPermissionChangeRequest extends Model
{
    protected $casts = [
        'permissions_to_add' => 'encrypted:array',
        'permissions_to_remove' => 'encrypted:array',
        'reason' => 'encrypted',
    ];
}
```

#### File Encryption
```php
class AuditLogManager
{
    public function storeEncryptedLog($data)
    {
        $encrypted = Crypt::encrypt(json_encode($data));

        return Storage::put('audit/encrypted/' . date('Y-m-d') . '.log', $encrypted);
    }

    public function retrieveDecryptedLog($date)
    {
        $encrypted = Storage::get("audit/encrypted/{$date}.log");

        return json_decode(Crypt::decrypt($encrypted), true);
    }
}
```

### Data Masking

#### Sensitive Data Protection
```php
class DataMasking
{
    public static function maskSensitiveData($data)
    {
        if (isset($data['password'])) {
            $data['password'] = '***masked***';
        }

        if (isset($data['api_token'])) {
            $data['api_token'] = substr($data['api_token'], 0, 8) . '***masked***';
        }

        return $data;
    }
}
```

## Audit and Monitoring

### Comprehensive Audit Logging

#### Audit Event Types
```php
class AuditLogger
{
    public static function logPermissionEvent($event, $data)
    {
        $auditData = array_merge($data, [
            'timestamp' => now(),
            'user_id' => auth()->id(),
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'session_id' => session()->getId(),
        ]);

        // Store in database
        AuditLog::create([
            'event_type' => $event,
            'data' => json_encode(self::maskSensitiveData($auditData)),
            'severity' => self::calculateSeverity($event),
        ]);

        // Send to monitoring system
        self::sendToMonitoring($event, $auditData);
    }

    private static function calculateSeverity($event)
    {
        $severityMap = [
            'permission_granted' => 'info',
            'permission_revoked' => 'info',
            'permission_denied' => 'warning',
            'unauthorized_access_attempt' => 'error',
            'permission_escalation_attempt' => 'critical',
        ];

        return $severityMap[$event] ?? 'info';
    }
}
```

### Real-Time Monitoring

#### Anomaly Detection
```php
class SecurityMonitor
{
    public function detectAnomalies()
    {
        $anomalies = [];

        // Check for unusual login patterns
        $anomalies = array_merge($anomalies, $this->checkLoginAnomalies());

        // Check for permission escalation attempts
        $anomalies = array_merge($anomalies, $this->checkEscalationAttempts());

        // Check for unusual API usage
        $anomalies = array_merge($anomalies, $this->checkApiAbuse());

        // Alert on critical anomalies
        foreach ($anomalies as $anomaly) {
            if ($anomaly['severity'] === 'critical') {
                $this->sendCriticalAlert($anomaly);
            }
        }

        return $anomalies;
    }

    private function checkLoginAnomalies()
    {
        // Implement login anomaly detection logic
        return [];
    }

    private function checkEscalationAttempts()
    {
        // Check for users requesting permissions they don't normally have
        return PermissionChangeRequest::pending()
            ->with(['user', 'permissionsToAdd'])
            ->get()
            ->filter(function ($request) {
                return $request->permissionsToAdd->contains(function ($permission) use ($request) {
                    return !$request->user->hasPermission($permission->name) &&
                           in_array($permission->category, ['Administration', 'System']);
                });
            })
            ->map(function ($request) {
                return [
                    'type' => 'permission_escalation',
                    'severity' => 'high',
                    'user_id' => $request->user_id,
                    'description' => 'User requested high-privilege permissions',
                ];
            })
            ->toArray();
    }
}
```

## Incident Response

### Automated Response Actions

#### Threat Detection and Response
```php
class IncidentResponder
{
    public function respondToThreat($threatType, $data)
    {
        switch ($threatType) {
            case 'brute_force':
                $this->handleBruteForce($data);
                break;

            case 'unauthorized_access':
                $this->handleUnauthorizedAccess($data);
                break;

            case 'permission_escalation':
                $this->handleEscalationAttempt($data);
                break;

            case 'suspicious_ip':
                $this->handleSuspiciousIP($data);
                break;
        }
    }

    private function handleBruteForce($data)
    {
        // Block IP temporarily
        app(IpRestrictionManager::class)->blockIP(
            $data['ip'],
            'Brute force attack detected',
            now()->addHours(24)
        );

        // Lock account if necessary
        if ($data['failed_attempts'] >= 10) {
            User::where('email', $data['email'])->update(['locked_until' => now()->addHours(24)]);
        }
    }

    private function handleEscalationAttempt($data)
    {
        // Immediately reject suspicious requests
        PermissionChangeRequest::where('user_id', $data['user_id'])
            ->where('status', 'pending')
            ->update(['status' => 'rejected']);

        // Alert administrators
        Notification::send(
            User::where('role', 'Super Admin')->get(),
            new EscalationAttemptNotification($data)
        );
    }
}
```

### Security Incident Response Plan

#### Response Phases
1. **Detection**: Automated monitoring alerts
2. **Assessment**: Determine impact and scope
3. **Containment**: Isolate affected systems
4. **Recovery**: Restore normal operations
5. **Lessons Learned**: Update security measures

## Compliance and Regulatory Requirements

### HIPAA Security Rule Compliance

#### Technical Safeguards
- **Access Control**: Role-based and user-specific permissions
- **Audit Controls**: Comprehensive audit logging
- **Integrity**: Data validation and encryption
- **Transmission Security**: TLS encryption for data in transit

#### Administrative Safeguards
- **Security Management**: Regular risk assessments
- **Workforce Training**: Security awareness training
- **Incident Response**: Documented response procedures

### Data Retention and Disposal

#### Audit Log Retention
```php
class DataRetentionManager
{
    public function cleanupOldData()
    {
        $retentionDays = config('audit.retention_days', 2555); // 7 years

        // Archive old audit logs
        AuditLog::where('created_at', '<', now()->subDays($retentionDays))
            ->delete();

        // Clean expired temporary permissions
        TemporaryPermission::where('expires_at', '<', now())
            ->where('is_active', true)
            ->update(['is_active' => false]);

        // Remove old IP restrictions
        PermissionIpRestriction::where('expires_at', '<', now())
            ->where('is_active', true)
            ->update(['is_active' => false]);
    }
}
```

This comprehensive security implementation provides multiple layers of protection against various threat vectors while maintaining system usability and performance.
