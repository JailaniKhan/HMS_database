<?php

namespace App\Services;

use App\Models\PermissionAlert;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\PermissionAlertNotification;

class PermissionAlertService
{
    protected $config;

    public function __construct()
    {
        $this->config = config('permission-monitoring');
    }

    /**
     * Create a new alert
     */
    public function createAlert(string $alertType, string $title, string $message, array $data = [], int $userId = null): PermissionAlert
    {
        if (!$this->config['enabled']) {
            return null;
        }

        $alert = PermissionAlert::create([
            'alert_type' => $alertType,
            'title' => $title,
            'message' => $message,
            'data' => json_encode($data),
            'status' => 'active',
            'user_id' => $userId,
        ]);

        // Handle alert based on type configuration
        $this->handleAlert($alert);

        return $alert;
    }

    /**
     * Handle alert actions (email, notifications, etc.)
     */
    protected function handleAlert(PermissionAlert $alert): void
    {
        $alertConfig = $this->config['alerting']['levels'][$alert->alert_type] ?? [];

        // Send email if configured
        if ($alertConfig['email_alert'] ?? false) {
            $this->sendEmailAlert($alert);
        }

        // Log alert
        Log::channel('permission-alerts')->{$this->getLogLevel($alert->alert_type)}(
            "Permission Alert [{$alert->alert_type}]: {$alert->title} - {$alert->message}",
            $alert->toArray()
        );

        // Auto-escalate if configured
        if ($alertConfig['auto_escalate'] ?? false) {
            $this->escalateAlert($alert);
        }
    }

    /**
     * Send email alert
     */
    protected function sendEmailAlert(PermissionAlert $alert): void
    {
        if (!$this->config['alerting']['email']['enabled']) {
            return;
        }

        try {
            Mail::to($this->config['alerting']['email']['recipients'])
                ->send(new PermissionAlertNotification($alert));
        } catch (\Exception $e) {
            Log::error('Failed to send permission alert email', [
                'alert_id' => $alert->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Get log level based on alert type
     */
    protected function getLogLevel(string $alertType): string
    {
        return match ($alertType) {
            'critical' => 'emergency',
            'high' => 'error',
            'medium' => 'warning',
            'low' => 'info',
            default => 'info',
        };
    }

    /**
     * Escalate alert (placeholder for escalation logic)
     */
    protected function escalateAlert(PermissionAlert $alert): void
    {
        // Implementation for escalation (e.g., notify higher authorities, create incident tickets)
        Log::warning('Alert escalated', ['alert_id' => $alert->id]);

        // Could integrate with external systems here
    }

    /**
     * Acknowledge alert
     */
    public function acknowledgeAlert(int $alertId, int $userId): bool
    {
        $alert = PermissionAlert::find($alertId);
        if (!$alert) {
            return false;
        }

        $alert->update([
            'status' => 'acknowledged',
            'updated_at' => now(),
        ]);

        Log::info('Alert acknowledged', [
            'alert_id' => $alertId,
            'user_id' => $userId,
        ]);

        return true;
    }

    /**
     * Resolve alert
     */
    public function resolveAlert(int $alertId, int $userId): bool
    {
        $alert = PermissionAlert::find($alertId);
        if (!$alert) {
            return false;
        }

        $alert->update([
            'status' => 'resolved',
            'updated_at' => now(),
        ]);

        Log::info('Alert resolved', [
            'alert_id' => $alertId,
            'user_id' => $userId,
        ]);

        return true;
    }

    /**
     * Get active alerts
     */
    public function getActiveAlerts(string $alertType = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = PermissionAlert::where('status', 'active')
            ->orderBy('created_at', 'desc');

        if ($alertType) {
            $query->where('alert_type', $alertType);
        }

        return $query->get();
    }

    /**
     * Get alert statistics
     */
    public function getAlertStatistics(\Carbon\Carbon $startDate = null, \Carbon\Carbon $endDate = null): array
    {
        $startDate = $startDate ?: now()->subDays(30);
        $endDate = $endDate ?: now();

        $stats = [
            'total_alerts' => PermissionAlert::whereBetween('created_at', [$startDate, $endDate])->count(),
            'by_type' => PermissionAlert::whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('alert_type, COUNT(*) as count')
                ->groupBy('alert_type')
                ->pluck('count', 'alert_type')
                ->toArray(),
            'by_status' => PermissionAlert::whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),
            'active_alerts' => PermissionAlert::where('status', 'active')->count(),
            'unresolved_critical' => PermissionAlert::where('status', '!=', 'resolved')
                ->where('alert_type', 'critical')
                ->count(),
        ];

        return $stats;
    }

    /**
     * Create security alert for suspicious activity
     */
    public function createSecurityAlert(string $title, string $message, array $context = []): PermissionAlert
    {
        return $this->createAlert('high', $title, $message, array_merge($context, ['category' => 'security']));
    }

    /**
     * Create performance alert
     */
    public function createPerformanceAlert(string $title, string $message, array $metrics = []): PermissionAlert
    {
        return $this->createAlert('medium', $title, $message, array_merge($metrics, ['category' => 'performance']));
    }

    /**
     * Create critical system alert
     */
    public function createCriticalAlert(string $title, string $message, array $data = []): PermissionAlert
    {
        return $this->createAlert('critical', $title, $message, $data);
    }

    /**
     * Clean up old alerts
     */
    public function cleanupOldAlerts(int $daysOld = 90): int
    {
        return PermissionAlert::where('created_at', '<', now()->subDays($daysOld))
            ->where('status', 'resolved')
            ->delete();
    }
}
