import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Currency,
    TrendingUp,
    TrendingDown,
    Calendar,
    Download,
    RefreshCw,
    BarChart3,
    CreditCard,
    FileText,
    Filter,
    X,
    Building2,
    Users,
    Clock,
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import type { RevenueReportData, DailyRevenueData, DepartmentRevenueData } from '@/types/billing';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface RevenueRecord {
    id: number;
    bill_number: string;
    patient_name: string;
    bill_date: string;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    payment_status: string;
    department: string;
    payment_method?: string;
}

interface PaymentMethodBreakdown {
    method: string;
    amount: number;
    count: number;
    percentage: number;
}

interface RevenuePageProps {
    reportData?: RevenueReportData;
    records?: RevenueRecord[];
    paymentMethodBreakdown?: PaymentMethodBreakdown[];
    filters?: {
        date_from?: string;
        date_to?: string;
        period?: string;
        department_id?: string;
    };
    departments?: Array<{ id: number; name: string }>;
    summary?: {
        total_revenue: number;
        total_collected: number;
        total_pending: number;
        total_refunded: number;
        revenue_growth_percent?: number;
        collection_rate_percent?: number;
    };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const STATUS_COLORS: Record<string, string> = {
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    unpaid: 'bg-red-100 text-red-800',
    pending: 'bg-blue-100 text-blue-800',
    refunded: 'bg-purple-100 text-purple-800',
};

// ============================================================================
// Helper Components
// ============================================================================

function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color = 'blue',
    trend,
    trendValue,
}: {
    title: string;
    value: React.ReactNode;
    subtitle?: string;
    icon: React.ElementType;
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}) {
    const colorClasses = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        yellow: 'bg-yellow-100 text-yellow-600',
        red: 'bg-red-100 text-red-600',
        purple: 'bg-purple-100 text-purple-600',
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
                        )}
                        {trend && trendValue && (
                            <div
                                className={cn(
                                    'flex items-center gap-1 mt-2 text-sm',
                                    trend === 'up'
                                        ? 'text-green-600'
                                        : trend === 'down'
                                        ? 'text-red-600'
                                        : 'text-gray-600'
                                )}
                            >
                                {trend === 'up' ? (
                                    <TrendingUp className="h-4 w-4" />
                                ) : trend === 'down' ? (
                                    <TrendingDown className="h-4 w-4" />
                                ) : null}
                                <span>{trendValue}</span>
                            </div>
                        )}
                    </div>
                    <div className={cn('p-3 rounded-full', colorClasses[color])}>
                        <Icon className="h-5 w-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// Main Component
// ============================================================================

export default function RevenuePage({
    reportData,
    records = [],
    paymentMethodBreakdown = [],
    filters = {},
    departments = [],
    summary,
}: RevenuePageProps) {
    // Filter states
    const [dateFrom, setDateFrom] = useState(filters.date_from || format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(filters.date_to || format(new Date(), 'yyyy-MM-dd'));
    const [period, setPeriod] = useState(filters.period || 'custom');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department_id || 'all');

    // Apply filters
    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {
            date_from: dateFrom,
            date_to: dateTo,
            period,
        };

        if (selectedDepartment !== 'all') {
            params.department_id = selectedDepartment;
        }

        router.get('/reports/billing/revenue', params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [dateFrom, dateTo, period, selectedDepartment]);

    // Clear filters
    const clearFilters = useCallback(() => {
        const defaultDateFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const defaultDateTo = format(new Date(), 'yyyy-MM-dd');

        setDateFrom(defaultDateFrom);
        setDateTo(defaultDateTo);
        setPeriod('custom');
        setSelectedDepartment('all');

        router.get('/reports/billing/revenue', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }, []);

    // Quick date range selection
    const setQuickDateRange = useCallback((range: 'today' | 'week' | 'month' | 'year') => {
        const today = new Date();
        let from: Date;
        let to: Date = today;

        switch (range) {
            case 'today':
                from = today;
                break;
            case 'week':
                from = subDays(today, 7);
                break;
            case 'month':
                from = startOfMonth(today);
                to = endOfMonth(today);
                break;
            case 'year':
                from = new Date(today.getFullYear(), 0, 1);
                to = new Date(today.getFullYear(), 11, 31);
                break;
            default:
                from = subDays(today, 30);
        }

        setDateFrom(format(from, 'yyyy-MM-dd'));
        setDateTo(format(to, 'yyyy-MM-dd'));
        setPeriod(range);

        setTimeout(applyFilters, 0);
    }, [applyFilters]);

    // Export to CSV
    const exportToCSV = useCallback(() => {
        const headers = [
            'Bill Number',
            'Patient Name',
            'Bill Date',
            'Total Amount',
            'Amount Paid',
            'Balance Due',
            'Payment Status',
            'Department',
            'Payment Method',
        ];

        const rows = records.map((record) => [
            record.bill_number,
            record.patient_name,
            record.bill_date,
            record.total_amount.toString(),
            record.amount_paid.toString(),
            record.balance_due.toString(),
            record.payment_status,
            record.department,
            record.payment_method || 'N/A',
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `revenue_report_${dateFrom}_to_${dateTo}.csv`;
        link.click();
    }, [records, dateFrom, dateTo]);

    // Export to PDF (simulated - would typically use a library like jspdf)
    const exportToPDF = useCallback(() => {
        // In a real implementation, this would generate a PDF
        alert('PDF export functionality would be implemented here with a library like jsPDF or dompdf');
    }, []);

    // Format chart data for revenue trends
    const revenueTrendData = useMemo(() => {
        const dailyBreakdown = reportData?.daily_breakdown;
        if (!dailyBreakdown) return [];

        return dailyBreakdown.map((day: DailyRevenueData) => ({
            date: format(parseISO(day.date), 'MMM dd'),
            revenue: day.revenue,
            payments: day.payments,
            refunds: day.refunds,
            bills: day.bill_count,
        }));
    }, [reportData?.daily_breakdown]);

    // Format chart data for department breakdown
    const departmentChartData = useMemo(() => {
        const deptBreakdown = reportData?.department_breakdown;
        if (!deptBreakdown) return [];

        return deptBreakdown.map((dept: DepartmentRevenueData) => ({
            name: dept.department_name,
            revenue: dept.revenue,
            bills: dept.bill_count,
        }));
    }, [reportData?.department_breakdown]);

    // Format chart data for payment methods
    const paymentMethodChartData = useMemo(() => {
        return paymentMethodBreakdown.map((pm) => ({
            name: pm.method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            value: pm.amount,
            percentage: pm.percentage,
        }));
    }, [paymentMethodBreakdown]);

    // Calculate totals for summary
    const totals = useMemo(() => {
        if (summary) return summary;

        const totalRevenue = records.reduce((sum, r) => sum + r.total_amount, 0);
        const totalCollected = records.reduce((sum, r) => sum + r.amount_paid, 0);
        const totalPending = records.reduce((sum, r) => sum + r.balance_due, 0);

        return {
            total_revenue: totalRevenue,
            total_collected: totalCollected,
            total_pending: totalPending,
            total_refunded: 0,
            collection_rate_percent: totalRevenue > 0 ? (totalCollected / totalRevenue) * 100 : 0,
        };
    }, [summary, records]);

    // Check if any filter is active
    const hasActiveFilters =
        dateFrom !== format(subDays(new Date(), 30), 'yyyy-MM-dd') ||
        dateTo !== format(new Date(), 'yyyy-MM-dd') ||
        period !== 'custom' ||
        selectedDepartment !== 'all';

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Revenue Report" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <Link href="/reports/billing">
                                <Button variant="ghost" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-1" />
                                    Back
                                </Button>
                            </Link>
                        </div>
                        <Heading title="Revenue Report" />
                        <p className="text-muted-foreground mt-1">
                            Track revenue analytics and financial performance
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportToCSV}>
                            <Download className="mr-2 h-4 w-4" />
                            Export CSV
                        </Button>
                        <Button variant="outline" onClick={exportToPDF}>
                            <FileText className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                        <Button variant="outline" onClick={applyFilters}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                <CardTitle className="text-base">Filters</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <X className="mr-1 h-4 w-4" />
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="date_from">From Date</Label>
                                <Input
                                    id="date_from"
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date_to">To Date</Label>
                                <Input
                                    id="date_to"
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="period">Quick Range</Label>
                                <Select value={period} onValueChange={setPeriod}>
                                    <SelectTrigger id="period">
                                        <SelectValue placeholder="Select period" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="today">Today</SelectItem>
                                        <SelectItem value="week">Last 7 Days</SelectItem>
                                        <SelectItem value="month">This Month</SelectItem>
                                        <SelectItem value="year">This Year</SelectItem>
                                        <SelectItem value="custom">Custom</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="department">Department</Label>
                                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                                    <SelectTrigger id="department">
                                        <SelectValue placeholder="All Departments" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Departments</SelectItem>
                                        {departments.map((dept) => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                                {dept.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end">
                                <Button onClick={applyFilters} className="w-full">
                                    Apply Filters
                                </Button>
                            </div>
                        </div>

                        {/* Quick Date Range Buttons */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('today')}>
                                <Clock className="h-3 w-3 mr-1" />
                                Today
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('week')}>
                                <Calendar className="h-3 w-3 mr-1" />
                                Last 7 Days
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('month')}>
                                <Calendar className="h-3 w-3 mr-1" />
                                This Month
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setQuickDateRange('year')}>
                                <Calendar className="h-3 w-3 mr-1" />
                                This Year
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Summary Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Revenue"
                        value={<CurrencyDisplay amount={totals.total_revenue} />}
                        subtitle="Gross revenue for period"
                        icon={Currency}
                        color="blue"
                        trend={totals.revenue_growth_percent && totals.revenue_growth_percent >= 0 ? 'up' : 'down'}
                        trendValue={`${Math.abs(totals.revenue_growth_percent || 0).toFixed(1)}% vs previous`}
                    />
                    <StatCard
                        title="Collected"
                        value={<CurrencyDisplay amount={totals.total_collected} />}
                        subtitle={`${totals.collection_rate_percent?.toFixed(1)}% collection rate`}
                        icon={TrendingUp}
                        color="green"
                    />
                    <StatCard
                        title="Pending"
                        value={<CurrencyDisplay amount={totals.total_pending} />}
                        subtitle="Outstanding payments"
                        icon={Clock}
                        color="yellow"
                    />
                    <StatCard
                        title="Refunded"
                        value={<CurrencyDisplay amount={totals.total_refunded} />}
                        subtitle="Total refunds processed"
                        icon={TrendingDown}
                        color="purple"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Trend Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <TrendingUp className="mr-2 h-5 w-5" />
                                Revenue Trend
                            </CardTitle>
                            <CardDescription>Daily revenue breakdown over the selected period</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueTrendData}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0088FE" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorPayments" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00C49F" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#00C49F" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                                        <YAxis
                                            className="text-xs"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()}`, '']}
                                        />
                                        <Legend />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#0088FE"
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            name="Revenue"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="payments"
                                            stroke="#00C49F"
                                            fillOpacity={1}
                                            fill="url(#colorPayments)"
                                            name="Payments"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Department Breakdown Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Building2 className="mr-2 h-5 w-5" />
                                Department Breakdown
                            </CardTitle>
                            <CardDescription>Revenue distribution by department</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={departmentChartData} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis
                                            type="number"
                                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                            className="text-xs"
                                            tick={{ fontSize: 12 }}
                                        />
                                        <YAxis dataKey="name" type="category" width={100} className="text-xs" tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()}`, 'Revenue']}
                                        />
                                        <Bar dataKey="revenue" fill="#0088FE" radius={[0, 4, 4, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Payment Methods & Status Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payment Methods Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <CreditCard className="mr-2 h-5 w-5" />
                                Payment Methods
                            </CardTitle>
                            <CardDescription>Revenue distribution by payment method</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={paymentMethodChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {paymentMethodChartData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            }}
                                            formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()}`, 'Amount']}
                                        />
                                        <Legend />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Payment Method Details Table */}
                            <div className="mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Method</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-right">%</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paymentMethodBreakdown.map((pm, index) => (
                                            <TableRow key={pm.method}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                        />
                                                        <span className="capitalize">
                                                            {pm.method.replace(/_/g, ' ')}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <CurrencyDisplay amount={pm.amount} />
                                                </TableCell>
                                                <TableCell className="text-right">{pm.percentage.toFixed(1)}%</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Daily Bills Count Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <BarChart3 className="mr-2 h-5 w-5" />
                                Daily Transaction Volume
                            </CardTitle>
                            <CardDescription>Number of bills processed per day</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={revenueTrendData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="date" className="text-xs" tick={{ fontSize: 12 }} />
                                        <YAxis className="text-xs" tick={{ fontSize: 12 }} />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="bills"
                                            stroke="#8884d8"
                                            strokeWidth={2}
                                            dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                                            name="Bills"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Records Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="flex items-center">
                                    <FileText className="mr-2 h-5 w-5" />
                                    Detailed Revenue Records
                                </CardTitle>
                                <CardDescription>
                                    Showing {records.length} records for the selected period
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Bill #</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Paid</TableHead>
                                        <TableHead className="text-right">Balance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Department</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                No records found for the selected period
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        records.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">{record.bill_number}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        {record.patient_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{format(parseISO(record.bill_date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell className="text-right">
                                                    <CurrencyDisplay amount={record.total_amount} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <CurrencyDisplay amount={record.amount_paid} />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <CurrencyDisplay
                                                        amount={record.balance_due}
                                                        className={record.balance_due > 0 ? 'text-yellow-600 font-medium' : ''}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                                                            STATUS_COLORS[record.payment_status] || 'bg-gray-100 text-gray-800'
                                                        )}
                                                    >
                                                        {record.payment_status}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                        {record.department}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Period Summary */}
                {reportData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="mr-2 h-5 w-5" />
                                Report Period Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Period</p>
                                    <p className="text-lg font-semibold">
                                        {format(parseISO(reportData.start_date), 'MMM dd, yyyy')} -{' '}
                                        {format(parseISO(reportData.end_date), 'MMM dd, yyyy')}
                                    </p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Report Type</p>
                                    <p className="text-lg font-semibold capitalize">{reportData.period}</p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Net Revenue</p>
                                    <p className="text-lg font-semibold text-green-600">
                                        <CurrencyDisplay amount={reportData.net_revenue} />
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </HospitalLayout>
    );
}
