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
    Clock,
    AlertTriangle,
    CheckCircle,
    FileText,
    Filter,
    X,
    Building2,
    Users,
    AlertCircle,
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart as RechartsPieChart,
    Pie,
    Cell,
} from 'recharts';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface OutstandingRecord {
    id: number;
    bill_number: string;
    patient_name: string;
    patient_id: string;
    bill_date: string;
    due_date: string;
    total_amount: number;
    amount_paid: number;
    balance_due: number;
    days_overdue: number;
    aging_category: 'current' | '30_days' | '60_days' | '90_plus';
    status: 'overdue' | 'due_soon' | 'current';
    department: string;
    insurance_provider?: string;
}

interface AgingBucket {
    category: string;
    label: string;
    amount: number;
    count: number;
    percentage: number;
    color: string;
}

interface OutstandingPageProps {
    reportData?: {
        start_date: string;
        end_date: string;
        period: string;
    };
    records?: OutstandingRecord[];
    agingBreakdown?: AgingBucket[];
    filters?: {
        date_from?: string;
        date_to?: string;
        period?: string;
        status?: string;
        department_id?: string;
    };
    departments?: Array<{ id: number; name: string }>;
    summary?: {
        total_outstanding: number;
        total_overdue: number;
        due_soon: number;
        current: number;
        overdue_growth_percent?: number;
        average_days_overdue: number;
        count_total: number;
        count_overdue: number;
    };
}

const STATUS_COLORS: Record<string, string> = {
    overdue: 'bg-red-100 text-red-800',
    due_soon: 'bg-yellow-100 text-yellow-800',
    current: 'bg-green-100 text-green-800',
};

const STATUS_LABELS: Record<string, string> = {
    overdue: 'Overdue',
    due_soon: 'Due Soon',
    current: 'Current',
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
                                        ? 'text-red-600'
                                        : trend === 'down'
                                        ? 'text-green-600'
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

export default function OutstandingPage({
    reportData,
    records = [],
    agingBreakdown = [],
    filters = {},
    departments = [],
    summary,
}: OutstandingPageProps) {
    // Filter states
    const [dateFrom, setDateFrom] = useState(filters.date_from || format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(filters.date_to || format(new Date(), 'yyyy-MM-dd'));
    const [period, setPeriod] = useState(filters.period || 'custom');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || 'all');
    const [selectedDepartment, setSelectedDepartment] = useState(filters.department_id || 'all');

    // Apply filters
    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {
            date_from: dateFrom,
            date_to: dateTo,
            period,
        };

        if (selectedStatus !== 'all') {
            params.status = selectedStatus;
        }

        if (selectedDepartment !== 'all') {
            params.department_id = selectedDepartment;
        }

        router.get('/reports/billing/outstanding', params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [dateFrom, dateTo, period, selectedStatus, selectedDepartment]);

    // Clear filters
    const clearFilters = useCallback(() => {
        const defaultDateFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const defaultDateTo = format(new Date(), 'yyyy-MM-dd');

        setDateFrom(defaultDateFrom);
        setDateTo(defaultDateTo);
        setPeriod('custom');
        setSelectedStatus('all');
        setSelectedDepartment('all');

        router.get('/reports/billing/outstanding', {}, {
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
            'Patient ID',
            'Bill Date',
            'Due Date',
            'Total Amount',
            'Amount Paid',
            'Balance Due',
            'Days Overdue',
            'Aging Category',
            'Status',
            'Department',
            'Insurance Provider',
        ];

        const rows = records.map((record) => [
            record.bill_number,
            record.patient_name,
            record.patient_id,
            record.bill_date,
            record.due_date,
            record.total_amount.toString(),
            record.amount_paid.toString(),
            record.balance_due.toString(),
            record.days_overdue.toString(),
            record.aging_category,
            record.status,
            record.department,
            record.insurance_provider || 'N/A',
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `outstanding_report_${dateFrom}_to_${dateTo}.csv`;
        link.click();
    }, [records, dateFrom, dateTo]);

    // Export to PDF (simulated - would typically use a library like jspdf)
    const exportToPDF = useCallback(() => {
        alert('PDF export functionality would be implemented here with a library like jsPDF or dompdf');
    }, []);

    // Format chart data for aging breakdown
    const agingChartData = useMemo(() => {
        return agingBreakdown.map((bucket) => ({
            name: bucket.label,
            amount: bucket.amount,
            count: bucket.count,
            percentage: bucket.percentage,
            fill: bucket.color,
        }));
    }, [agingBreakdown]);

    // Calculate totals for summary
    const totals = useMemo(() => {
        if (summary) return summary;

        const totalOutstanding = records.reduce((sum, r) => sum + r.balance_due, 0);
        const totalOverdue = records
            .filter((r) => r.status === 'overdue')
            .reduce((sum, r) => sum + r.balance_due, 0);
        const dueSoon = records
            .filter((r) => r.status === 'due_soon')
            .reduce((sum, r) => sum + r.balance_due, 0);
        const current = records
            .filter((r) => r.status === 'current')
            .reduce((sum, r) => sum + r.balance_due, 0);
        const overdueRecords = records.filter((r) => r.status === 'overdue');
        const avgDaysOverdue =
            overdueRecords.length > 0
                ? overdueRecords.reduce((sum, r) => sum + r.days_overdue, 0) / overdueRecords.length
                : 0;

        return {
            total_outstanding: totalOutstanding,
            total_overdue: totalOverdue,
            due_soon: dueSoon,
            current: current,
            average_days_overdue: avgDaysOverdue,
            count_total: records.length,
            count_overdue: overdueRecords.length,
        };
    }, [summary, records]);

    // Check if any filter is active
    const hasActiveFilters =
        dateFrom !== format(subDays(new Date(), 30), 'yyyy-MM-dd') ||
        dateTo !== format(new Date(), 'yyyy-MM-dd') ||
        period !== 'custom' ||
        selectedStatus !== 'all' ||
        selectedDepartment !== 'all';

    // Get aging badge color
    const getAgingBadgeColor = (category: string) => {
        const colors: Record<string, string> = {
            current: 'bg-green-100 text-green-800',
            '30_days': 'bg-yellow-100 text-yellow-800',
            '60_days': 'bg-orange-100 text-orange-800',
            '90_plus': 'bg-red-100 text-red-800',
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    // Get aging label
    const getAgingLabel = (category: string) => {
        const labels: Record<string, string> = {
            current: 'Current',
            '30_days': '1-30 Days',
            '60_days': '31-60 Days',
            '90_plus': '90+ Days',
        };
        return labels[category] || category;
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Outstanding Report" />

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
                        <Heading title="Outstanding Report" />
                        <p className="text-muted-foreground mt-1">
                            Track outstanding payments and receivables aging analysis
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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
                                <Label htmlFor="status">Status</Label>
                                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="overdue">Overdue</SelectItem>
                                        <SelectItem value="due_soon">Due Soon</SelectItem>
                                        <SelectItem value="current">Current</SelectItem>
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
                        title="Total Outstanding"
                        value={<CurrencyDisplay amount={totals.total_outstanding} />}
                        subtitle={`${totals.count_total} bills pending`}
                        icon={Currency}
                        color="blue"
                        trend={totals.overdue_growth_percent && totals.overdue_growth_percent >= 0 ? 'up' : 'down'}
                        trendValue={`${Math.abs(totals.overdue_growth_percent || 0).toFixed(1)}% vs previous`}
                    />
                    <StatCard
                        title="Overdue"
                        value={<CurrencyDisplay amount={totals.total_overdue} />}
                        subtitle={`${totals.count_overdue} bills - ${totals.average_days_overdue.toFixed(0)} avg days`}
                        icon={AlertTriangle}
                        color="red"
                    />
                    <StatCard
                        title="Due Soon"
                        value={<CurrencyDisplay amount={totals.due_soon} />}
                        subtitle="Due within 7 days"
                        icon={Clock}
                        color="yellow"
                    />
                    <StatCard
                        title="Current"
                        value={<CurrencyDisplay amount={totals.current} />}
                        subtitle="Not yet due"
                        icon={CheckCircle}
                        color="green"
                    />
                </div>

                {/* Aging Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Aging Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <BarChart3 className="mr-2 h-5 w-5" />
                                Aging Analysis
                            </CardTitle>
                            <CardDescription>Outstanding balance by aging category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={agingChartData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                                        <YAxis
                                            className="text-xs"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            formatter={(value: number | undefined, name: string) => {
                                                if (name === 'count') {
                                                    return [(value || 0).toLocaleString(), 'Count'];
                                                }
                                                return [`${(value || 0).toLocaleString()}`, 'Amount'];
                                            }}
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                        <Legend />
                                        <Bar dataKey="amount" name="Amount" radius={[4, 4, 0, 0]}>
                                            {agingChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill || '#8884d8'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Aging Breakdown Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <AlertCircle className="mr-2 h-5 w-5" />
                                Distribution by Age
                            </CardTitle>
                            <CardDescription>Percentage breakdown by aging category</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={agingChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="amount"
                                        >
                                            {agingChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill || '#8884d8'} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            formatter={(value: number | undefined, name: string) => {
                                                const bucket = agingBreakdown.find(b => b.label === name);
                                                return [
                                                    `${(value || 0).toLocaleString()}`,
                                                    `${name} (${bucket?.count || 0} bills)`
                                                ];
                                            }}
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            }}
                                        />
                                        <Legend />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Aging Details Table */}
                            <div className="mt-4">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Category</TableHead>
                                            <TableHead className="text-right">Amount</TableHead>
                                            <TableHead className="text-right">Count</TableHead>
                                            <TableHead className="text-right">%</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {agingBreakdown.map((bucket) => (
                                            <TableRow key={bucket.category}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div
                                                            className="w-3 h-3 rounded-full"
                                                            style={{ backgroundColor: bucket.color }}
                                                        />
                                                        <span>{bucket.label}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <CurrencyDisplay amount={bucket.amount} />
                                                </TableCell>
                                                <TableCell className="text-right">{bucket.count}</TableCell>
                                                <TableCell className="text-right">{bucket.percentage.toFixed(1)}%</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Outstanding Records Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="flex items-center">
                                    <FileText className="mr-2 h-5 w-5" />
                                    Outstanding Bills
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
                                        <TableHead>Bill Date</TableHead>
                                        <TableHead>Due Date</TableHead>
                                        <TableHead className="text-right">Balance Due</TableHead>
                                        <TableHead>Days Overdue</TableHead>
                                        <TableHead>Aging</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Department</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {records.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                                                No outstanding records found for the selected period
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        records.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell className="font-medium">{record.bill_number}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <div className="font-medium">{record.patient_name}</div>
                                                            <div className="text-xs text-muted-foreground">{record.patient_id}</div>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>{format(parseISO(record.bill_date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell>{format(parseISO(record.due_date), 'MMM dd, yyyy')}</TableCell>
                                                <TableCell className="text-right">
                                                    <CurrencyDisplay
                                                        amount={record.balance_due}
                                                        className={record.status === 'overdue' ? 'text-red-600 font-medium' : ''}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={cn(
                                                            'font-medium',
                                                            record.days_overdue > 90
                                                                ? 'text-red-600'
                                                                : record.days_overdue > 60
                                                                ? 'text-orange-600'
                                                                : record.days_overdue > 30
                                                                ? 'text-yellow-600'
                                                                : ''
                                                        )}
                                                    >
                                                        {record.days_overdue} days
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                                                            getAgingBadgeColor(record.aging_category)
                                                        )}
                                                    >
                                                        {getAgingLabel(record.aging_category)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={cn(
                                                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                                                            STATUS_COLORS[record.status] || 'bg-gray-100 text-gray-800'
                                                        )}
                                                    >
                                                        {STATUS_LABELS[record.status]}
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

                {/* Report Period Summary */}
                {reportData && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <Calendar className="mr-2 h-5 w-5" />
                                Report Period Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
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
                                    <p className="text-sm text-muted-foreground">Total Outstanding</p>
                                    <p className="text-lg font-semibold text-blue-600">
                                        <CurrencyDisplay amount={totals.total_outstanding} />
                                    </p>
                                </div>
                                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                    <p className="text-sm text-red-600">At Risk (90+ Days)</p>
                                    <p className="text-lg font-semibold text-red-700">
                                        <CurrencyDisplay
                                            amount={agingBreakdown.find((b) => b.category === '90_plus')?.amount || 0}
                                        />
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
