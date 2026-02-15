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
    Banknote,
    Landmark,
    Wallet,
    Receipt,
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { format, subDays, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import {
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
} from 'recharts';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface PaymentTransaction {
    id: number;
    transaction_id: string;
    patient_name: string;
    payment_date: string;
    amount: number;
    payment_method: string;
    reference_number?: string;
    bill_number: string;
    status: string;
}

interface PaymentMethodStats {
    method: string;
    amount: number;
    count: number;
    percentage: number;
    average_amount: number;
}

interface MonthlyPaymentMethodData {
    month: string;
    cash: number;
    credit_card: number;
    debit_card: number;
    insurance: number;
    bank_transfer: number;
    check: number;
}

interface PaymentMethodsPageProps {
    reportData?: {
        start_date: string;
        end_date: string;
        period: string;
        total_payments: number;
        total_transactions: number;
        top_payment_method?: string;
    };
    transactions?: PaymentTransaction[];
    paymentMethodStats?: PaymentMethodStats[];
    monthlyComparison?: MonthlyPaymentMethodData[];
    filters?: {
        date_from?: string;
        date_to?: string;
        period?: string;
        payment_method?: string;
    };
    summary?: {
        total_payments: number;
        total_transactions: number;
        average_transaction: number;
        growth_percent?: number;
    };
}

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const PAYMENT_METHOD_COLORS: Record<string, string> = {
    cash: '#10B981',
    credit_card: '#3B82F6',
    debit_card: '#F59E0B',
    insurance: '#8B5CF6',
    bank_transfer: '#EC4899',
    check: '#6366F1',
};

const STATUS_COLORS: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
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

function getPaymentMethodIcon(method: string) {
    switch (method.toLowerCase()) {
        case 'cash':
            return Banknote;
        case 'credit_card':
        case 'credit':
            return CreditCard;
        case 'debit_card':
        case 'debit':
            return Wallet;
        case 'insurance':
            return Landmark;
        case 'bank_transfer':
            return Building2;
        case 'check':
            return Receipt;
        default:
            return CreditCard;
    }
}

function getPaymentMethodColor(method: string): string {
    const key = method.toLowerCase().replace(' ', '_').replace('-', '_');
    return PAYMENT_METHOD_COLORS[key] || '#6B7280';
}

// ============================================================================
// Main Component
// ============================================================================

export default function PaymentMethodsPage({
    reportData,
    transactions = [],
    paymentMethodStats = [],
    monthlyComparison = [],
    filters = {},
    summary,
}: PaymentMethodsPageProps) {
    // Filter states
    const [dateFrom, setDateFrom] = useState(filters.date_from || format(subDays(new Date(), 30), 'yyyy-MM-dd'));
    const [dateTo, setDateTo] = useState(filters.date_to || format(new Date(), 'yyyy-MM-dd'));
    const [period, setPeriod] = useState(filters.period || 'custom');
    const [selectedMethod, setSelectedMethod] = useState(filters.payment_method || 'all');

    // Apply filters
    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {
            date_from: dateFrom,
            date_to: dateTo,
            period,
        };

        if (selectedMethod !== 'all') {
            params.payment_method = selectedMethod;
        }

        router.get('/reports/billing/payment-methods', params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [dateFrom, dateTo, period, selectedMethod]);

    // Clear filters
    const clearFilters = useCallback(() => {
        const defaultDateFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const defaultDateTo = format(new Date(), 'yyyy-MM-dd');

        setDateFrom(defaultDateFrom);
        setDateTo(defaultDateTo);
        setPeriod('custom');
        setSelectedMethod('all');

        router.get('/reports/billing/payment-methods', {}, {
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
            'Transaction ID',
            'Bill Number',
            'Patient Name',
            'Payment Date',
            'Amount',
            'Payment Method',
            'Reference Number',
            'Status',
        ];

        const rows = transactions.map((transaction) => [
            transaction.transaction_id,
            transaction.bill_number,
            transaction.patient_name,
            transaction.payment_date,
            transaction.amount.toString(),
            transaction.payment_method,
            transaction.reference_number || '',
            transaction.status,
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `payment_methods_report_${dateFrom}_to_${dateTo}.csv`;
        link.click();
    }, [transactions, dateFrom, dateTo]);

    // Export to PDF (simulated - would typically use a library like jspdf)
    const exportToPDF = useCallback(() => {
        // In a real implementation, this would generate a PDF
        alert('PDF export functionality would be implemented here with a library like jsPDF or dompdf');
    }, []);

    // Format chart data for pie chart
    const pieChartData = useMemo(() => {
        return paymentMethodStats.map((pm) => ({
            name: pm.method.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            value: pm.amount,
            count: pm.count,
            percentage: pm.percentage,
        }));
    }, [paymentMethodStats]);

    // Format chart data for bar chart
    const barChartData = useMemo(() => {
        return monthlyComparison.map((month) => ({
            name: month.month,
            cash: month.cash,
            credit_card: month.credit_card,
            debit_card: month.debit_card,
            insurance: month.insurance,
            bank_transfer: month.bank_transfer,
            check: month.check,
        }));
    }, [monthlyComparison]);

    // Calculate totals for summary
    const totals = useMemo(() => {
        if (summary) return summary;

        const totalPayments = transactions.reduce((sum, t) => sum + t.amount, 0);
        const totalTransactions = transactions.length;
        const averageTransaction = totalTransactions > 0 ? totalPayments / totalTransactions : 0;

        return {
            total_payments: totalPayments,
            total_transactions: totalTransactions,
            average_transaction: averageTransaction,
        };
    }, [summary, transactions]);

    // Check if any filter is active
    const hasActiveFilters =
        dateFrom !== format(subDays(new Date(), 30), 'yyyy-MM-dd') ||
        dateTo !== format(new Date(), 'yyyy-MM-dd') ||
        period !== 'custom' ||
        selectedMethod !== 'all';

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Payment Methods Report" />

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
                        <Heading title="Payment Methods Report" />
                        <p className="text-muted-foreground mt-1">
                            Analyze payment method distribution and transaction patterns
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
                                <Label htmlFor="payment_method">Payment Method</Label>
                                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                                    <SelectTrigger id="payment_method">
                                        <SelectValue placeholder="All Methods" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Methods</SelectItem>
                                        <SelectItem value="cash">Cash</SelectItem>
                                        <SelectItem value="credit_card">Credit Card</SelectItem>
                                        <SelectItem value="debit_card">Debit Card</SelectItem>
                                        <SelectItem value="insurance">Insurance</SelectItem>
                                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                        <SelectItem value="check">Check</SelectItem>
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
                        title="Total Payments"
                        value={<CurrencyDisplay amount={totals.total_payments} />}
                        subtitle={`${totals.total_transactions} transactions`}
                        icon={Currency}
                        color="green"
                        trend={totals.growth_percent && totals.growth_percent >= 0 ? 'up' : 'down'}
                        trendValue={`${Math.abs(totals.growth_percent || 0).toFixed(1)}% vs previous`}
                    />
                    <StatCard
                        title="Total Transactions"
                        value={totals.total_transactions.toLocaleString()}
                        subtitle="Number of payments"
                        icon={Receipt}
                        color="blue"
                    />
                    <StatCard
                        title="Average Transaction"
                        value={<CurrencyDisplay amount={totals.average_transaction} />}
                        subtitle="Per transaction"
                        icon={TrendingUp}
                        color="purple"
                    />
                    <StatCard
                        title="Methods Used"
                        value={paymentMethodStats.length.toString()}
                        subtitle="Payment methods active"
                        icon={CreditCard}
                        color="yellow"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Payment Methods Distribution Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <CreditCard className="mr-2 h-5 w-5" />
                                Payment Method Distribution
                            </CardTitle>
                            <CardDescription>Revenue breakdown by payment method</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {pieChartData.map((_, index) => (
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
                                            formatter={(value: number | undefined, name: string | undefined) => [
                                                <CurrencyDisplay amount={value || 0} />,
                                                name,
                                            ]}
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
                                            <TableHead className="text-right">Count</TableHead>
                                            <TableHead className="text-right">%</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paymentMethodStats.map((pm, index) => {
                                            const IconComponent = getPaymentMethodIcon(pm.method);
                                            return (
                                                <TableRow key={pm.method}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className="w-3 h-3 rounded-full"
                                                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                                            />
                                                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                                                            <span className="capitalize">
                                                                {pm.method.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <CurrencyDisplay amount={pm.amount} />
                                                    </TableCell>
                                                    <TableCell className="text-right">{pm.count}</TableCell>
                                                    <TableCell className="text-right">{pm.percentage.toFixed(1)}%</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Monthly Comparison Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <BarChart3 className="mr-2 h-5 w-5" />
                                Monthly Comparison by Method
                            </CardTitle>
                            <CardDescription>Payment method usage over time</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={barChartData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="name" className="text-xs" tick={{ fontSize: 12 }} />
                                        <YAxis
                                            className="text-xs"
                                            tick={{ fontSize: 12 }}
                                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'white',
                                                border: '1px solid #e2e8f0',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                            }}
                                            formatter={(value: number | undefined) => [`${(value || 0).toLocaleString()}`, '']}
                                        />
                                        <Legend />
                                        <Bar dataKey="cash" fill="#10B981" name="Cash" radius={[2, 2, 0, 0]} />
                                        <Bar dataKey="credit_card" fill="#3B82F6" name="Credit Card" radius={[2, 2, 0, 0]} />
                                        <Bar dataKey="debit_card" fill="#F59E0B" name="Debit Card" radius={[2, 2, 0, 0]} />
                                        <Bar dataKey="insurance" fill="#8B5CF6" name="Insurance" radius={[2, 2, 0, 0]} />
                                        <Bar dataKey="bank_transfer" fill="#EC4899" name="Bank Transfer" radius={[2, 2, 0, 0]} />
                                        <Bar dataKey="check" fill="#6366F1" name="Check" radius={[2, 2, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Detailed Transactions Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <CardTitle className="flex items-center">
                                    <FileText className="mr-2 h-5 w-5" />
                                    Transaction Details
                                </CardTitle>
                                <CardDescription>
                                    Showing {transactions.length} transactions for the selected period
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>Bill Number</TableHead>
                                        <TableHead>Patient</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                                No transactions found for the selected period
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((transaction) => {
                                            const IconComponent = getPaymentMethodIcon(transaction.payment_method);
                                            return (
                                                <TableRow key={transaction.id}>
                                                    <TableCell className="font-medium">{transaction.transaction_id}</TableCell>
                                                    <TableCell>{transaction.bill_number}</TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-muted-foreground" />
                                                            {transaction.patient_name}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{format(parseISO(transaction.payment_date), 'MMM dd, yyyy')}</TableCell>
                                                    <TableCell className="text-right">
                                                        <CurrencyDisplay amount={transaction.amount} />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <IconComponent 
                                                                className="h-4 w-4" 
                                                                style={{ color: getPaymentMethodColor(transaction.payment_method) }}
                                                            />
                                                            <span className="capitalize">
                                                                {transaction.payment_method.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">
                                                        {transaction.reference_number || '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={cn(
                                                                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                                                                STATUS_COLORS[transaction.status] || 'bg-gray-100 text-gray-800'
                                                            )}
                                                        >
                                                            {transaction.status}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
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
                                    <p className="text-sm text-muted-foreground">Total Volume</p>
                                    <p className="text-lg font-semibold">
                                        <CurrencyDisplay amount={reportData.total_payments} />
                                    </p>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                    <p className="text-sm text-muted-foreground">Top Method</p>
                                    <p className="text-lg font-semibold">
                                        {reportData.top_payment_method || 'N/A'}
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
