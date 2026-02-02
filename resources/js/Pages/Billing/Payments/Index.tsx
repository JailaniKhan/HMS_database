import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import Heading from '@/components/heading';
import {
    DollarSign,
    Calendar,
    Search,
    FileText,
    Eye,
    Download,
    Filter,
    X,
    TrendingUp,
    TrendingDown,
    CreditCard,
    Banknote,
    Landmark,
    Receipt,
    Smartphone,
    RotateCcw,
    CheckCircle2,
    Clock,
} from 'lucide-react';
import { useState, useCallback } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { PaymentMethod, PaymentStatus, type Payment } from '@/types/billing';

interface PaymentFilters {
    search?: string;
    payment_method?: PaymentMethod;
    status?: PaymentStatus;
    date_from?: string;
    date_to?: string;
    min_amount?: number;
    max_amount?: number;
}
import { format, parseISO } from 'date-fns';

interface PaymentWithBill extends Payment {
    bill?: {
        id: number;
        bill_number: string;
        patient?: {
            full_name: string;
        };
    };
}

interface PaymentIndexProps {
    payments: {
        data: PaymentWithBill[];
        links: Record<string, unknown>;
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            path: string;
            per_page: number;
            to: number;
            total: number;
        };
    };
    filters?: PaymentFilters;
    statistics?: {
        total_payments: number;
        total_amount: number;
        total_refunds: number;
        average_payment: number;
        by_method: Record<string, number>;
    };
}

const PAYMENT_METHODS = [
    { value: PaymentMethod.CASH, label: 'Cash', icon: Banknote },
    { value: PaymentMethod.CREDIT_CARD, label: 'Credit Card', icon: CreditCard },
    { value: PaymentMethod.DEBIT_CARD, label: 'Debit Card', icon: CreditCard },
    { value: PaymentMethod.CHECK, label: 'Check', icon: FileText },
    { value: PaymentMethod.BANK_TRANSFER, label: 'Bank Transfer', icon: Landmark },
    { value: PaymentMethod.INSURANCE, label: 'Insurance', icon: Receipt },
    { value: PaymentMethod.ONLINE, label: 'Online Payment', icon: CreditCard },
    { value: PaymentMethod.MOBILE_PAYMENT, label: 'Mobile Payment', icon: Smartphone },
];

const PAYMENT_STATUSES = [
    { value: PaymentStatus.PAID, label: 'Paid', color: 'text-green-600' },
    { value: PaymentStatus.PENDING, label: 'Pending', color: 'text-yellow-600' },
    { value: PaymentStatus.FAILED, label: 'Failed', color: 'text-red-600' },
    { value: PaymentStatus.REFUNDED, label: 'Refunded', color: 'text-orange-600' },
    { value: PaymentStatus.UNPAID, label: 'Unpaid', color: 'text-gray-600' },
    { value: PaymentStatus.PARTIAL, label: 'Partial', color: 'text-blue-600' },
];

export default function PaymentIndex({ payments, filters = {}, statistics }: PaymentIndexProps) {
    // Filter states
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [methodFilter, setMethodFilter] = useState<string>(filters.payment_method?.toString() || 'all');
    const [statusFilter, setStatusFilter] = useState<string>(filters.status?.toString() || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [minAmount, setMinAmount] = useState(filters.min_amount?.toString() || '');
    const [maxAmount, setMaxAmount] = useState(filters.max_amount?.toString() || '');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState<PaymentWithBill | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);

    // Apply filters
    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {};

        if (searchTerm) params.search = searchTerm;
        if (methodFilter && methodFilter !== 'all') params.payment_method = methodFilter;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (minAmount) params.min_amount = minAmount;
        if (maxAmount) params.max_amount = maxAmount;

        router.get('/billing/payments', params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [searchTerm, methodFilter, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setMethodFilter('all');
        setStatusFilter('all');
        setDateFrom('');
        setDateTo('');
        setMinAmount('');
        setMaxAmount('');

        router.get('/billing/payments', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }, []);

    // Export to CSV
    const exportToCSV = useCallback(() => {
        const headers = [
            'Transaction ID',
            'Bill Number',
            'Patient',
            'Payment Date',
            'Amount',
            'Method',
            'Status',
            'Reference Number',
        ];

        const rows = payments.data.map((payment) => [
            payment.transaction_id,
            payment.bill?.bill_number || 'N/A',
            payment.bill?.patient?.full_name || 'N/A',
            payment.payment_date,
            payment.amount,
            payment.payment_method,
            payment.status,
            payment.reference_number || '',
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `payments_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    }, [payments.data]);

    // Check if any filter is active
    const hasActiveFilters =
        searchTerm ||
        (methodFilter && methodFilter !== 'all') ||
        (statusFilter && statusFilter !== 'all') ||
        dateFrom ||
        dateTo ||
        minAmount ||
        maxAmount;

    // Format date
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return 'N/A';
        try {
            return format(parseISO(dateString), 'MMM dd, yyyy');
        } catch {
            return 'Invalid Date';
        }
    };

    // Get payment method icon
    const getPaymentMethodIcon = (method: PaymentMethod) => {
        const methodConfig = PAYMENT_METHODS.find((m) => m.value === method);
        const Icon = methodConfig?.icon || CreditCard;
        return <Icon className="h-4 w-4" />;
    };

    // Get payment method label
    const getPaymentMethodLabel = (method: PaymentMethod) => {
        return PAYMENT_METHODS.find((m) => m.value === method)?.label || method;
    };

    // Get status color
    const getStatusColor = (status: PaymentStatus) => {
        switch (status) {
            case PaymentStatus.PAID:
                return 'text-green-600 bg-green-50';
            case PaymentStatus.PENDING:
                return 'text-yellow-600 bg-yellow-50';
            case PaymentStatus.FAILED:
                return 'text-red-600 bg-red-50';
            case PaymentStatus.REFUNDED:
                return 'text-orange-600 bg-orange-50';
            case PaymentStatus.UNPAID:
                return 'text-gray-600 bg-gray-50';
            case PaymentStatus.PARTIAL:
                return 'text-blue-600 bg-blue-50';
            default:
                return 'text-gray-600 bg-gray-50';
        }
    };

    // View payment details
    const viewPaymentDetails = (payment: PaymentWithBill) => {
        setSelectedPayment(payment);
        setShowDetailsDialog(true);
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Payment Management" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Payment Management" />
                        <p className="text-muted-foreground mt-1">
                            View and manage all payments across the hospital
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportToCSV}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Link href="/billing">
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                Back to Bills
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                {statistics && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Payments</p>
                                        <p className="text-2xl font-bold mt-1">{statistics.total_payments}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <DollarSign className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                                        <p className="text-2xl font-bold mt-1">
                                            <CurrencyDisplay amount={statistics.total_amount} />
                                        </p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Refunds</p>
                                        <p className="text-2xl font-bold mt-1">
                                            <CurrencyDisplay amount={statistics.total_refunds} />
                                        </p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                        <TrendingDown className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Average Payment</p>
                                        <p className="text-2xl font-bold mt-1">
                                            <CurrencyDisplay amount={statistics.average_payment} />
                                        </p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                        <CreditCard className="h-5 w-5 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Payment Method Breakdown */}
                {statistics?.by_method && Object.keys(statistics.by_method).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Payment Method Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
                                {Object.entries(statistics.by_method).map(([method, amount]) => (
                                    <div key={method} className="text-center p-3 bg-muted rounded-lg">
                                        <div className="flex justify-center mb-2">
                                            {getPaymentMethodIcon(method as PaymentMethod)}
                                        </div>
                                        <p className="text-xs text-muted-foreground capitalize">{method.replace('_', ' ')}</p>
                                        <p className="font-semibold text-sm">
                                            <CurrencyDisplay amount={amount} />
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Filters */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Filters</CardTitle>
                            <div className="flex gap-2">
                                {hasActiveFilters && (
                                    <Button variant="ghost" size="sm" onClick={clearFilters}>
                                        <X className="mr-2 h-4 w-4" />
                                        Clear Filters
                                    </Button>
                                )}
                                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                                    <Filter className="mr-2 h-4 w-4" />
                                    {showFilters ? 'Hide Filters' : 'Show Filters'}
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    {showFilters && (
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Transaction ID, bill #, patient..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="method">Payment Method</Label>
                                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                                        <SelectTrigger id="method">
                                            <SelectValue placeholder="All Methods" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Methods</SelectItem>
                                            {PAYMENT_METHODS.map((method) => (
                                                <SelectItem key={method.value} value={method.value}>
                                                    {method.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            {PAYMENT_STATUSES.map((status) => (
                                                <SelectItem key={status.value} value={status.value}>
                                                    {status.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dateFrom">Date From</Label>
                                    <Input
                                        id="dateFrom"
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dateTo">Date To</Label>
                                    <Input
                                        id="dateTo"
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount Range</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="minAmount"
                                            type="number"
                                            placeholder="Min"
                                            value={minAmount}
                                            onChange={(e) => setMinAmount(e.target.value)}
                                            className="w-1/2"
                                        />
                                        <Input
                                            id="maxAmount"
                                            type="number"
                                            placeholder="Max"
                                            value={maxAmount}
                                            onChange={(e) => setMaxAmount(e.target.value)}
                                            className="w-1/2"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <Button onClick={applyFilters}>Apply Filters</Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Payments Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Payments ({payments.meta.total})</CardTitle>
                        <CardDescription>
                            Showing {payments.meta.from || 0} to {payments.meta.to || 0} of {payments.meta.total} payments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Bill / Patient</TableHead>
                                    <TableHead>Payment Date</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payments.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No payments found matching your criteria
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    payments.data.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell className="font-medium">
                                                {payment.transaction_id}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {payment.bill?.bill_number || 'N/A'}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {payment.bill?.patient?.full_name || 'N/A'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {formatDate(payment.payment_date)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {getPaymentMethodIcon(payment.payment_method)}
                                                    <span className="capitalize">
                                                        {getPaymentMethodLabel(payment.payment_method)}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <CurrencyDisplay amount={payment.amount} weight="semibold" />
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                        payment.status
                                                    )}`}
                                                >
                                                    {payment.status === PaymentStatus.PAID && (
                                                        <CheckCircle2 className="h-3 w-3" />
                                                    )}
                                                    {payment.status === PaymentStatus.PENDING && (
                                                        <Clock className="h-3 w-3" />
                                                    )}
                                                    {payment.status === PaymentStatus.REFUNDED && (
                                                        <RotateCcw className="h-3 w-3" />
                                                    )}
                                                    {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => viewPaymentDetails(payment)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Payment Details Dialog */}
                <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Payment Details</DialogTitle>
                            <DialogDescription>
                                Transaction ID: {selectedPayment?.transaction_id}
                            </DialogDescription>
                        </DialogHeader>
                        {selectedPayment && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bill Number</p>
                                        <p className="font-medium">{selectedPayment.bill?.bill_number || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Patient</p>
                                        <p className="font-medium">{selectedPayment.bill?.patient?.full_name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Date</p>
                                        <p className="font-medium">{formatDate(selectedPayment.payment_date)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Payment Method</p>
                                        <p className="font-medium capitalize">
                                            {getPaymentMethodLabel(selectedPayment.payment_method)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Amount</p>
                                        <p className="font-medium">
                                            <CurrencyDisplay amount={selectedPayment.amount} weight="bold" size="lg" />
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Status</p>
                                        <span
                                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                                selectedPayment.status
                                            )}`}
                                        >
                                            {selectedPayment.status.charAt(0).toUpperCase() +
                                                selectedPayment.status.slice(1)}
                                        </span>
                                    </div>
                                </div>

                                {selectedPayment.reference_number && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Reference Number</p>
                                        <p className="font-medium">{selectedPayment.reference_number}</p>
                                    </div>
                                )}

                                {selectedPayment.card_last_four && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Card Details</p>
                                        <p className="font-medium">
                                            {selectedPayment.card_type} ending in {selectedPayment.card_last_four}
                                        </p>
                                    </div>
                                )}

                                {selectedPayment.bank_name && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Bank</p>
                                        <p className="font-medium">{selectedPayment.bank_name}</p>
                                    </div>
                                )}

                                {selectedPayment.check_number && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Check Number</p>
                                        <p className="font-medium">{selectedPayment.check_number}</p>
                                    </div>
                                )}

                                {selectedPayment.notes && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Notes</p>
                                        <p className="font-medium">{selectedPayment.notes}</p>
                                    </div>
                                )}

                                {selectedPayment.received_by_user && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Received By</p>
                                        <p className="font-medium">{selectedPayment.received_by_user.name}</p>
                                    </div>
                                )}
                            </div>
                        )}
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowDetailsDialog(false)}>
                                Close
                            </Button>
                            {selectedPayment?.bill && (
                                <Link href={`/billing/${selectedPayment.bill.id}`}>
                                    <Button>View Bill</Button>
                                </Link>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </HospitalLayout>
    );
}
