import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import {
    AlertCircle,
    ArrowLeft,
    Download,
    Clock,
    Calendar,
    Search,
    AlertTriangle,
    Trash2,
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { useState } from 'react';
import type { Medicine, MedicineAlert } from '@/types/pharmacy';

interface ExpiryReportProps {
    medicines: {
        data: Medicine[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    alerts: MedicineAlert[];
    filters: {
        expiry_status?: string;
        days_until_expiry?: string;
        search?: string;
    };
    summary: {
        totalExpiring: number;
        expiredCount: number;
        expiringSoonCount: number;
        expiring30Days: number;
        expiring60Days: number;
        expiring90Days: number;
        totalValueAtRisk: number;
    };
}

const expiryStatusColors: Record<string, string> = {
    expired: 'bg-red-100 text-red-800 border-red-200',
    critical: 'bg-orange-100 text-orange-800 border-orange-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    good: 'bg-green-100 text-green-800 border-green-200',
};

const expiryStatusLabels: Record<string, string> = {
    expired: 'Expired',
    critical: 'Critical (≤7 days)',
    warning: 'Warning (≤30 days)',
    good: 'Good (>30 days)',
};

export default function ExpiryReport({ medicines, alerts, filters, summary }: ExpiryReportProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('pharmacy.reports.expiry'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearch = () => {
        router.get(
            route('pharmacy.reports.expiry'),
            { ...filters, search: searchQuery, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            ...filters,
            export: 'csv',
        } as Record<string, string>);
        window.open(`${route('pharmacy.reports.expiry')}?${params.toString()}`, '_blank');
    };

    const handlePageChange = (page: number) => {
        router.get(route('pharmacy.reports.expiry'), { ...filters, page }, { preserveState: true });
    };

    const getExpiryStatus = (medicine: Medicine) => {
        if (!medicine.expiry_date) return 'good';
        const daysUntil = differenceInDays(parseISO(medicine.expiry_date), new Date());
        if (daysUntil < 0) return 'expired';
        if (daysUntil <= 7) return 'critical';
        if (daysUntil <= 30) return 'warning';
        return 'good';
    };

    const getDaysUntilExpiry = (medicine: Medicine) => {
        if (!medicine.expiry_date) return null;
        return differenceInDays(parseISO(medicine.expiry_date), new Date());
    };

    const getDaysUntilExpiryText = (medicine: Medicine) => {
        const days = getDaysUntilExpiry(medicine);
        if (days === null) return 'N/A';
        if (days < 0) return `Expired ${Math.abs(days)} days ago`;
        if (days === 0) return 'Expires today';
        if (days === 1) return 'Expires tomorrow';
        return `${days} days left`;
    };

    return (
        <PharmacyLayout header="Expiry Report">
            <Head title="Expiry Report" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/pharmacy/reports">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Reports
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Expiry Report</h1>
                        <p className="text-muted-foreground">Track medicines nearing expiration</p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-red-100 text-red-600">
                                <AlertCircle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Expired</p>
                                <p className="text-2xl font-bold">{summary.expiredCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                                <Clock className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Expiring Soon</p>
                                <p className="text-2xl font-bold">{summary.expiringSoonCount}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                                <Calendar className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">≤30 Days</p>
                                <p className="text-2xl font-bold">{summary.expiring30Days}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                                <AlertTriangle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Value at Risk</p>
                                <p className="text-2xl font-bold">${summary.totalValueAtRisk.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Expiry Timeline */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Expiry Timeline
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                            <p className="text-sm text-red-600 font-medium">Already Expired</p>
                            <p className="text-2xl font-bold text-red-700">{summary.expiredCount}</p>
                            <p className="text-xs text-red-500">Immediate action required</p>
                        </div>
                        <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
                            <p className="text-sm text-orange-600 font-medium">≤ 7 Days</p>
                            <p className="text-2xl font-bold text-orange-700">{summary.expiringSoonCount}</p>
                            <p className="text-xs text-orange-500">Critical priority</p>
                        </div>
                        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                            <p className="text-sm text-yellow-600 font-medium">8-30 Days</p>
                            <p className="text-2xl font-bold text-yellow-700">
                                {Math.max(0, summary.expiring30Days - summary.expiringSoonCount)}
                            </p>
                            <p className="text-xs text-yellow-500">Plan for usage</p>
                        </div>
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                            <p className="text-sm text-blue-600 font-medium">31-90 Days</p>
                            <p className="text-2xl font-bold text-blue-700">{summary.expiring90Days}</p>
                            <p className="text-xs text-blue-500">Monitor closely</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active Alerts */}
            {alerts.length > 0 && (
                <Card className="mb-6 border-orange-200">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                            <AlertTriangle className="h-5 w-5" />
                            Active Expiry Alerts ({alerts.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200"
                                >
                                    <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{alert.message}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Medicine: {alert.medicine?.name}
                                        </p>
                                    </div>
                                    <Link href={route('pharmacy.medicines.show', alert.medicine_id)}>
                                        <Button variant="ghost" size="sm">
                                            View
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-full md:w-64">
                            <label className="text-sm font-medium mb-2 block">Search</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search medicines..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button size="icon" variant="outline" onClick={handleSearch}>
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="w-full md:w-48">
                            <label className="text-sm font-medium mb-2 block">Expiry Status</label>
                            <Select
                                value={filters.expiry_status || 'all'}
                                onValueChange={(value) => handleFilterChange('expiry_status', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="expired">Expired</SelectItem>
                                    <SelectItem value="critical">Critical (≤7 days)</SelectItem>
                                    <SelectItem value="warning">Warning (≤30 days)</SelectItem>
                                    <SelectItem value="good">Good (&gt;30 days)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-48">
                            <label className="text-sm font-medium mb-2 block">Days Until Expiry</label>
                            <Select
                                value={filters.days_until_expiry || 'all'}
                                onValueChange={(value) => handleFilterChange('days_until_expiry', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="expired">Already Expired</SelectItem>
                                    <SelectItem value="7">≤ 7 days</SelectItem>
                                    <SelectItem value="30">≤ 30 days</SelectItem>
                                    <SelectItem value="60">≤ 60 days</SelectItem>
                                    <SelectItem value="90">≤ 90 days</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Medicines Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Medicines ({medicines.total})</CardTitle>
                    <CardDescription>Medicines with expiry dates and status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">Medicine</th>
                                    <th className="text-left py-3 px-4 font-medium">Batch #</th>
                                    <th className="text-right py-3 px-4 font-medium">Stock</th>
                                    <th className="text-left py-3 px-4 font-medium">Expiry Date</th>
                                    <th className="text-left py-3 px-4 font-medium">Time Left</th>
                                    <th className="text-right py-3 px-4 font-medium">Value</th>
                                    <th className="text-center py-3 px-4 font-medium">Status</th>
                                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicines.data.map((medicine) => {
                                    const status = getExpiryStatus(medicine);
                                    const stockValue = medicine.stock_quantity * medicine.unit_price;
                                    return (
                                        <tr key={medicine.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{medicine.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {medicine.medicine_id}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm font-mono">
                                                {medicine.batch_number || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                {medicine.stock_quantity}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                {medicine.expiry_date ? (
                                                    format(parseISO(medicine.expiry_date), 'MMM d, yyyy')
                                                ) : (
                                                    <span className="text-muted-foreground">N/A</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                <span className={`font-medium ${
                                                    status === 'expired' ? 'text-red-600' :
                                                    status === 'critical' ? 'text-orange-600' :
                                                    status === 'warning' ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`}>
                                                    {getDaysUntilExpiryText(medicine)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                ${stockValue.toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge variant="outline" className={expiryStatusColors[status]}>
                                                    {expiryStatusLabels[status]}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={route('pharmacy.medicines.show', medicine.id)}>
                                                        <Button variant="ghost" size="sm">
                                                            View
                                                        </Button>
                                                    </Link>
                                                    {status === 'expired' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {medicines.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={medicines.current_page === 1}
                                onClick={() => handlePageChange(medicines.current_page - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {medicines.current_page} of {medicines.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={medicines.current_page === medicines.last_page}
                                onClick={() => handlePageChange(medicines.current_page + 1)}
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
