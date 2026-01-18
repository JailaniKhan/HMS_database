import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertTriangle,
    Shield,
    TrendingUp,
    Clock,
    Server,
    CheckCircle,
    XCircle,
    AlertCircle,
    BarChart3,
    RefreshCw
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState, useEffect } from 'react';
import axios from 'axios';

interface MonitoringStatistics {
    response_times: {
        average: number;
        max: number;
    };
    cache_performance: {
        average_hit_rate: number;
        samples: number;
    };
    failed_attempts: number;
    health_status: Record<string, string>;
}

interface AlertData {
    id: number;
    alert_type: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    message: string;
    status: 'active' | 'acknowledged' | 'resolved';
    created_at: string;
    user?: {
        name: string;
    };
}

interface HealthCheck {
    check_type: string;
    status: 'healthy' | 'warning' | 'critical';
    checked_at: string;
    details: Record<string, unknown>;
}

interface Props {
    auth: {
        user: {
            id: number;
            name: string;
            role?: string;
        };
    };
}

export default function PermissionMonitoring({ auth }: Props) {
    const [statistics, setStatistics] = useState<MonitoringStatistics | null>(null);
    const [alerts, setAlerts] = useState<AlertData[]>([]);
    const [healthStatus, setHealthStatus] = useState<Record<string, HealthCheck>>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = async () => {
        try {
            setRefreshing(true);

            const [statsResponse, alertsResponse, healthResponse] = await Promise.all([
                axios.get('/api/v1/permission-monitoring/dashboard'),
                axios.get('/api/v1/permission-monitoring/alerts?status=active&per_page=10'),
                axios.get('/api/v1/permission-monitoring/health-status')
            ]);

            setStatistics(statsResponse.data.statistics);
            setAlerts(alertsResponse.data.data);
            setHealthStatus(healthResponse.data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch monitoring data:', err);
            setError('Failed to load monitoring data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getAlertTypeColor = (type: string) => {
        switch (type) {
            case 'critical': return 'destructive';
            case 'high': return 'destructive';
            case 'medium': return 'secondary';
            case 'low': return 'outline';
            default: return 'secondary';
        }
    };

    const getHealthStatusIcon = (status: string) => {
        switch (status) {
            case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
            case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
            default: return <AlertCircle className="h-4 w-4 text-gray-600" />;
        }
    };

    const acknowledgeAlert = async (alertId: number) => {
        try {
            await axios.post(`/api/v1/permission-monitoring/alerts/${alertId}/acknowledge`, {
                user_id: auth.user.id
            });
            fetchData(); // Refresh data
        } catch (err) {
            console.error('Failed to acknowledge alert:', err);
        }
    };

    const resolveAlert = async (alertId: number) => {
        try {
            await axios.post(`/api/v1/permission-monitoring/alerts/${alertId}/resolve`, {
                user_id: auth.user.id
            });
            fetchData(); // Refresh data
        } catch (err) {
            console.error('Failed to resolve alert:', err);
        }
    };

    if (loading) {
        return (
            <HospitalLayout>
                <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="animate-pulse">
                            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="h-32 bg-gray-200 rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </HospitalLayout>
        );
    }

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Permission Monitoring" />

                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Permission Monitoring</h1>
                            <p className="text-gray-600 mt-2">Monitor permission system health, performance, and security</p>
                        </div>
                        <Button
                            onClick={fetchData}
                            disabled={refreshing}
                            className="flex items-center gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </Button>
                    </div>

                    {error && (
                        <Alert className="mb-6">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {statistics?.response_times.average ?
                                        `${statistics.response_times.average.toFixed(2)}ms` :
                                        'N/A'
                                    }
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Max: {statistics?.response_times.max ?
                                        `${statistics.response_times.max.toFixed(2)}ms` :
                                        'N/A'
                                    }
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {statistics?.cache_performance.average_hit_rate ?
                                        `${(statistics.cache_performance.average_hit_rate * 100).toFixed(1)}%` :
                                        'N/A'
                                    }
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {statistics?.cache_performance.samples} samples
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
                                <Shield className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {statistics?.failed_attempts || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Last 7 days
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {alerts.length}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Requiring attention
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Health Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Server className="h-5 w-5" />
                                    System Health
                                </CardTitle>
                                <CardDescription>
                                    Current health status of permission system components
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {Object.entries(healthStatus).map(([type, check]) => (
                                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {getHealthStatusIcon(check.status)}
                                            <div>
                                                <p className="font-medium capitalize">
                                                    {type.replace('_', ' ')}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Last checked: {new Date(check.checked_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <Badge variant={check.status === 'healthy' ? 'default' : 'destructive'}>
                                            {check.status}
                                        </Badge>
                                    </div>
                                ))}
                                {Object.keys(healthStatus).length === 0 && (
                                    <div className="text-center py-8 text-muted-foreground">
                                        No health checks available
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Active Alerts */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5" />
                                    Active Alerts
                                </CardTitle>
                                <CardDescription>
                                    Current alerts requiring attention
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {alerts.length > 0 ? alerts.slice(0, 5).map((alert) => (
                                    <div key={alert.id} className="border rounded-lg p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h4 className="font-medium">{alert.title}</h4>
                                                <p className="text-sm text-muted-foreground">{alert.message}</p>
                                            </div>
                                            <Badge variant={getAlertTypeColor(alert.alert_type)}>
                                                {alert.alert_type}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>
                                                {alert.user ? `By ${alert.user.name}` : 'System'} •
                                                {new Date(alert.created_at).toLocaleString()}
                                            </span>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => acknowledgeAlert(alert.id)}
                                                >
                                                    Acknowledge
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => resolveAlert(alert.id)}
                                                >
                                                    Resolve
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                                        <p>No active alerts</p>
                                        <p className="text-sm">All systems operating normally</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Performance Metrics */}
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Performance Overview
                            </CardTitle>
                            <CardDescription>
                                Detailed performance metrics for the permission system
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600 mb-2">
                                        {statistics?.response_times.average ?
                                            `${statistics.response_times.average.toFixed(0)}ms` :
                                            'N/A'
                                        }
                                    </div>
                                    <p className="text-sm text-muted-foreground">Average Response Time</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600 mb-2">
                                        {statistics?.cache_performance.average_hit_rate ?
                                            `${(statistics.cache_performance.average_hit_rate * 100).toFixed(0)}%` :
                                            'N/A'
                                        }
                                    </div>
                                    <p className="text-sm text-muted-foreground">Cache Efficiency</p>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-600 mb-2">
                                        {statistics?.failed_attempts || 0}
                                    </div>
                                    <p className="text-sm text-muted-foreground">Failed Attempts (7d)</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>
                                Common monitoring and maintenance tasks
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = '/api/v1/permission-monitoring/performance-report'}
                                    className="flex items-center gap-2"
                                >
                                    <BarChart3 className="h-4 w-4" />
                                    Performance Report
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => window.location.href = '/api/v1/permission-monitoring/compliance-report'}
                                    className="flex items-center gap-2"
                                >
                                    <Shield className="h-4 w-4" />
                                    Compliance Report
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={fetchData}
                                    disabled={refreshing}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                                    Refresh All
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HospitalLayout>
    );
}
