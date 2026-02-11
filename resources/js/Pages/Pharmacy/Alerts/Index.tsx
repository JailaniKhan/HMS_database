import { Head, Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { AlertCircle, AlertTriangle, Package, RefreshCw, CheckCircle, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import type { MedicineAlert } from '@/types/pharmacy';

interface AlertsIndexProps {
    alerts: {
        data: MedicineAlert[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        type?: string;
        status?: string;
        severity?: string;
    };
    stats: {
        total: number;
        pending: number;
        resolved: number;
        critical: number;
    };
}

const alertTypeIcons: Record<string, typeof Package> = {
    low_stock: Package,
    expired: AlertCircle,
    expiring_soon: Clock,
    low_stock_expiring: AlertTriangle,
};

const alertTypeLabels: Record<string, string> = {
    low_stock: 'Low Stock',
    expired: 'Expired',
    expiring_soon: 'Expiring Soon',
    low_stock_expiring: 'Low Stock & Expiring',
};

const priorityColors: Record<string, string> = {
    low: 'bg-blue-100 text-blue-800 border-blue-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    critical: 'bg-red-100 text-red-800 border-red-200',
};

const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
};

export default function AlertsIndex({ alerts, filters, stats }: AlertsIndexProps) {
    const { flash } = usePage().props as any;
    const [showMessage, setShowMessage] = useState<string | null>(null);
    const [messageType, setMessageType] = useState<'success' | 'warning' | null>(null);

    useEffect(() => {
        if (flash?.success) {
            setShowMessage(flash.success);
            setMessageType('success');
            setTimeout(() => setShowMessage(null), 5000);
        } else if (flash?.warning) {
            setShowMessage(flash.warning);
            setMessageType('warning');
            setTimeout(() => setShowMessage(null), 5000);
        }
    }, [flash]);

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('pharmacy.alerts.index'),
            { ...filters, [key]: value },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleResolve = (alertId: number | string) => {
        if (confirm('Are you sure you want to mark this alert as resolved?')) {
            router.post(`/pharmacy/alerts/${alertId}/status`, {
                status: 'resolved',
            }, {
                preserveState: false,
                preserveScroll: true,
            });
        }
    };

    const handleTriggerCheck = () => {
        router.get(route('pharmacy.alerts.trigger-check'));
    };

    const handlePageChange = (page: number) => {
        router.get(route('pharmacy.alerts.index'), { ...filters, page }, { preserveState: true });
    };

    return (
        <PharmacyLayout header="Pharmacy Alerts">
            <Head title="Pharmacy Alerts" />

            {/* Flash Messages */}
            {showMessage && (
                <div className={`p-4 rounded-lg flex items-center justify-between ${
                    messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                    <div className="flex items-center gap-2">
                        {messageType === 'success' ? <CheckCircle className="size-5" /> : <AlertTriangle className="size-5" />}
                        <span>{showMessage}</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowMessage(null)}>
                        <X className="size-4" />
                    </Button>
                </div>
            )}

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                                <AlertCircle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Alerts</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                                <Clock className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-green-100 text-green-600">
                                <CheckCircle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Resolved</p>
                                <p className="text-2xl font-bold">{stats.resolved}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-red-100 text-red-600">
                                <AlertTriangle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Critical</p>
                                <p className="text-2xl font-bold">{stats.critical}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Filter Alerts</CardTitle>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleTriggerCheck}
                        >
                            <RefreshCw className="size-4 mr-2" />
                            Trigger Check
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-full md:w-48">
                            <Select
                                value={filters.type || 'all'}
                                onValueChange={(value) => handleFilterChange('type', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Alert Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="low_stock">Low Stock</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                    <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-48">
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="w-full md:w-48">
                            <Select
                                value={filters.severity || 'all'}
                                onValueChange={(value) => handleFilterChange('severity', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Severity" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Severities</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Alerts List */}
            <Card>
                <CardHeader>
                    <CardTitle>Alerts ({alerts.total})</CardTitle>
                    <CardDescription>
                        Manage pharmacy alerts for stock and expiry issues
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {alerts.data.length === 0 ? (
                        <div className="text-center py-12">
                            <CheckCircle className="size-16 mx-auto mb-4 text-green-500 opacity-50" />
                            <h3 className="text-lg font-semibold">No Alerts</h3>
                            <p className="text-muted-foreground">
                                All alerts have been resolved. Great job!
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {alerts.data.map((alert) => {
                                const Icon = alertTypeIcons[alert.alert_type] || AlertCircle;
                                return (
                                    <div
                                        key={alert.id}
                                        className="flex items-start gap-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                                    >
```                                        <div className={`p-3 rounded-lg ${priorityColors[alert.priority]}`}>
                                            <Icon className="size-5" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h4 className="font-semibold">
                                                    {alert.medicine?.name || 'Unknown Medicine'}
                                                </h4>
                                                <Badge variant="outline" className={priorityColors[alert.priority]}>
                                                    {alert.priority}
                                                </Badge>
                                                <Badge className={statusColors[alert.status]}>
                                                    {alert.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                {alert.message}
                                            </p>
                                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                                <span>Type: {alertTypeLabels[alert.alert_type] || alert.alert_type}</span>
                                                <span>•</span>
                                                <span>Created: {format(new Date(alert.created_at), 'MMM d, yyyy HH:mm')}</span>
                                                {alert.status === 'resolved' && alert.updated_at && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Updated: {format(new Date(alert.updated_at), 'MMM d, yyyy HH:mm')}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Link href={route('pharmacy.medicines.show', alert.medicine_id)}>
                                                <Button variant="ghost" size="sm">
                                                    View Medicine
                                                </Button>
                                            </Link>
                                            {alert.status === 'pending' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleResolve(alert.id)}
                                                >
                                                    <CheckCircle className="size-4 mr-1" />
                                                    Resolve
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {alerts.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={alerts.current_page === 1}
                                onClick={() => handlePageChange(alerts.current_page - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {alerts.current_page} of {alerts.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={alerts.current_page === alerts.last_page}
                                onClick={() => handlePageChange(alerts.current_page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </PharmacyLayout>
    );
}
