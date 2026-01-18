<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Permission Monitoring Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for the permission monitoring, alerting, and maintenance
    | system. This file controls thresholds, enabled features, and alert settings.
    |
    */

    'enabled' => env('PERMISSION_MONITORING_ENABLED', true),

    'monitoring' => [
        'metrics' => [
            'response_time_threshold_ms' => env('PERMISSION_RESPONSE_TIME_THRESHOLD', 500),
            'cache_hit_rate_min' => env('PERMISSION_CACHE_HIT_RATE_MIN', 0.8),
            'failed_attempts_threshold' => env('PERMISSION_FAILED_ATTEMPTS_THRESHOLD', 10),
            'memory_usage_threshold_mb' => env('PERMISSION_MEMORY_THRESHOLD', 100),
        ],
        'retention_days' => env('PERMISSION_MONITORING_RETENTION_DAYS', 30),
    ],

    'alerting' => [
        'email' => [
            'enabled' => env('PERMISSION_ALERT_EMAIL_ENABLED', true),
            'recipients' => explode(',', env('PERMISSION_ALERT_EMAIL_RECIPIENTS', 'admin@example.com')),
            'from' => env('PERMISSION_ALERT_EMAIL_FROM', 'noreply@example.com'),
        ],
        'levels' => [
            'critical' => [
                'notify_immediately' => true,
                'email_alert' => true,
                'auto_escalate' => true,
            ],
            'high' => [
                'notify_immediately' => true,
                'email_alert' => false,
                'auto_escalate' => false,
            ],
            'medium' => [
                'notify_immediately' => false,
                'email_alert' => false,
                'auto_escalate' => false,
            ],
            'low' => [
                'notify_immediately' => false,
                'email_alert' => false,
                'auto_escalate' => false,
            ],
        ],
    ],

    'maintenance' => [
        'cleanup' => [
            'expired_temporary_permissions' => true,
            'inactive_sessions' => true,
            'old_audit_logs' => true,
            'retention_days' => env('PERMISSION_MAINTENANCE_RETENTION_DAYS', 90),
        ],
        'health_checks' => [
            'enabled' => env('PERMISSION_HEALTH_CHECKS_ENABLED', true),
            'interval_minutes' => env('PERMISSION_HEALTH_CHECK_INTERVAL', 15),
        ],
        'schedules' => [
            'daily_cleanup' => '02:00',
            'weekly_reports' => 'sunday@03:00',
            'health_checks' => '*/15 * * * *', // Every 15 minutes
        ],
    ],

    'reporting' => [
        'enabled' => env('PERMISSION_REPORTING_ENABLED', true),
        'cache_ttl_minutes' => env('PERMISSION_REPORT_CACHE_TTL', 60),
        'reports' => [
            'compliance' => [
                'enabled' => true,
                'retention_months' => 12,
            ],
            'performance' => [
                'enabled' => true,
                'metrics' => ['response_time', 'cache_hit_rate', 'security_incidents'],
            ],
        ],
    ],

    'security' => [
        'anomaly_detection' => [
            'enabled' => env('PERMISSION_ANOMALY_DETECTION_ENABLED', true),
            'sensitivity' => env('PERMISSION_ANOMALY_SENSITIVITY', 0.8), // 0-1 scale
        ],
        'rate_limiting' => [
            'enabled' => env('PERMISSION_RATE_LIMITING_ENABLED', true),
            'max_attempts_per_minute' => env('PERMISSION_RATE_LIMIT_MAX', 100),
        ],
    ],
];
