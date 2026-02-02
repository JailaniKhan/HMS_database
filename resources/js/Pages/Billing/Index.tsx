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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Heading from '@/components/heading';
import {
    DollarSign,
    Calendar,
    User,
    PlusCircle,
    Search,
    FileText,
    Eye,
    Pencil,
    MoreHorizontal,
    Download,
    Filter,
    X,
    TrendingUp,
    TrendingDown,
    Clock,
    AlertCircle,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { BillStatusBadge } from '@/components/billing/BillStatusBadge';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { BillStatus, PaymentStatus, type Bill, type BillFilters } from '@/types/billing';
import { cn } from '@/lib/utils';
import { format, parseISO, isAfter, isBefore, isWithinInterval } from 'date-fns';

interface BillIndexProps {
    bills: {
        data: Bill[];
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
    filters?: BillFilters;
    statistics?: {
        total_bills: number;
        total_amount: number;
        total_paid: number;
        total_outstanding: number;
        overdue_count: number;
    };
}

export default function BillIndex({ bills, filters = {}, statistics }: BillIndexProps) {
    // Filter states
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState<string>(filters.status?.toString() || 'all');
    const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>(
        filters.payment_status?.toString() || 'all'
    );
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [minAmount, setMinAmount] = useState(filters.min_amount?.toString() || '');
    const [maxAmount, setMaxAmount] = useState(filters.max_amount?.toString() || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(filters.sort_order || 'desc');
    const [showFilters, setShowFilters] = useState(false);

    // Apply filters
    const applyFilters = useCallback(() => {
        const params: Record<string, string> = {};

        if (searchTerm) params.search = searchTerm;
        if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
        if (paymentStatusFilter && paymentStatusFilter !== 'all') params.payment_status = paymentStatusFilter;
        if (dateFrom) params.date_from = dateFrom;
        if (dateTo) params.date_to = dateTo;
        if (minAmount) params.min_amount = minAmount;
        if (maxAmount) params.max_amount = maxAmount;
        params.sort_by = sortBy;
        params.sort_order = sortOrder;

        router.get('/billing', params, {
            preserveState: true,
            preserveScroll: true,
        });
    }, [
        searchTerm,
        statusFilter,
        paymentStatusFilter,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
        sortBy,
        sortOrder,
    ]);

    // Clear all filters
    const clearFilters = useCallback(() => {
        setSearchTerm('');
        setStatusFilter('all');
        setPaymentStatusFilter('all');
        setDateFrom('');
        setDateTo('');
        setMinAmount('');
        setMaxAmount('');
        setSortBy('created_at');
        setSortOrder('desc');

        router.get('/billing', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    }, []);

    // Handle sort
    const handleSort = useCallback(
        (column: string) => {
            const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
            setSortBy(column);
            setSortOrder(newSortOrder);

            const params: Record<string, string> = {
                sort_by: column,
                sort_order: newSortOrder,
            };

            if (searchTerm) params.search = searchTerm;
            if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
            if (paymentStatusFilter && paymentStatusFilter !== 'all') params.payment_status = paymentStatusFilter;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (minAmount) params.min_amount = minAmount;
            if (maxAmount) params.max_amount = maxAmount;

            router.get('/billing', params, {
                preserveState: true,
                preserveScroll: true,
            });
        },
        [sortBy, sortOrder, searchTerm, statusFilter, paymentStatusFilter, dateFrom, dateTo, minAmount, maxAmount]
    );

    // Export to CSV
    const exportToCSV = useCallback(() => {
        const headers = [
            'Bill Number',
            'Patient',
            'Bill Date',
            'Due Date',
            'Total Amount',
            'Amount Paid',
            'Balance Due',
            'Status',
            'Payment Status',
        ];

        const rows = bills.data.map((bill) => [
            bill.bill_number,
            bill.patient?.full_name || 'N/A',
            bill.bill_date,
            bill.due_date || '',
            bill.total_amount,
            bill.amount_paid,
            bill.balance_due,
            bill.status,
            bill.payment_status,
        ]);

        const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `bills_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        link.click();
    }, [bills.data]);

    // Check if any filter is active
    const hasActiveFilters =
        searchTerm ||
        (statusFilter && statusFilter !== 'all') ||
        (paymentStatusFilter && paymentStatusFilter !== 'all') ||
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

    // Check if bill is overdue
    const isOverdue = (bill: Bill) => {
        if (!bill.due_date || bill.status === BillStatus.PAID || bill.status === BillStatus.VOID) {
            return false;
        }
        return isAfter(new Date(), parseISO(bill.due_date));
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Billing Management" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Billing Management" />
                        <p className="text-muted-foreground mt-1">
                            Manage patient bills, payments, and insurance claims
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={exportToCSV}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Link href="/billing/create">
                            <Button className="bg-blue-600 hover:bg-blue-700">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New Bill
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
                                        <p className="text-sm font-medium text-muted-foreground">Total Bills</p>
                                        <p className="text-2xl font-bold">{statistics.total_bills}</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                                        <p className="text-2xl font-bold">
                                            <CurrencyDisplay amount={statistics.total_amount} />
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <TrendingUp className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Outstanding</p>
                                        <p className="text-2xl font-bold">
                                            <CurrencyDisplay amount={statistics.total_outstanding} />
                                        </p>
                                    </div>
                                    <div className="p-3 bg-yellow-100 rounded-full">
                                        <Clock className="h-5 w-5 text-yellow-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                                        <p className="text-2xl font-bold">{statistics.overdue_count}</p>
                                    </div>
                                    <div className="p-3 bg-red-100 rounded-full">
                                        <AlertCircle className="h-5 w-5 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

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
                                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                                    {showFilters ? 'Hide' : 'Show'} Filters
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    {showFilters && (
                        <CardContent className="pt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="search">Search</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            placeholder="Bill #, Patient..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-8"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="status">Bill Status</Label>
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger id="status">
                                            <SelectValue placeholder="All Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value={BillStatus.DRAFT}>Draft</SelectItem>
                                            <SelectItem value={BillStatus.PENDING}>Pending</SelectItem>
                                            <SelectItem value={BillStatus.SENT}>Sent</SelectItem>
                                            <SelectItem value={BillStatus.PARTIAL}>Partial</SelectItem>
                                            <SelectItem value={BillStatus.PAID}>Paid</SelectItem>
                                            <SelectItem value={BillStatus.OVERDUE}>Overdue</SelectItem>
                                            <SelectItem value={BillStatus.VOID}>Void</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="payment_status">Payment Status</Label>
                                    <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                                        <SelectTrigger id="payment_status">
                                            <SelectValue placeholder="All Payment Statuses" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Payment Statuses</SelectItem>
                                            <SelectItem value={PaymentStatus.UNPAID}>Unpaid</SelectItem>
                                            <SelectItem value={PaymentStatus.PARTIAL}>Partial</SelectItem>
                                            <SelectItem value={PaymentStatus.PAID}>Paid</SelectItem>
                                            <SelectItem value={PaymentStatus.PENDING}>Pending</SelectItem>
                                            <SelectItem value={PaymentStatus.REFUNDED}>Refunded</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Date Range</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(e) => setDateFrom(e.target.value)}
                                            placeholder="From"
                                        />
                                        <Input
                                            type="date"
                                            value={dateTo}
                                            onChange={(e) => setDateTo(e.target.value)}
                                            placeholder="To"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Amount Range</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            type="number"
                                            placeholder="Min"
                                            value={minAmount}
                                            onChange={(e) => setMinAmount(e.target.value)}
                                        />
                                        <Input
                                            type="number"
                                            placeholder="Max"
                                            value={maxAmount}
                                            onChange={(e) => setMaxAmount(e.target.value)}
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

                {/* Bills Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Bills</CardTitle>
                        <CardDescription>
                            Showing {bills.meta.from || 0} to {bills.meta.to || 0} of {bills.meta.total} bills
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('bill_number')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Bill #
                                                {sortBy === 'bill_number' && (
                                                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('patient')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Patient
                                                {sortBy === 'patient' && (
                                                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('bill_date')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Bill Date
                                                {sortBy === 'bill_date' && (
                                                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('total_amount')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Total
                                                {sortBy === 'total_amount' && (
                                                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => handleSort('balance_due')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Balance
                                                {sortBy === 'balance_due' && (
                                                    <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                                                )}
                                            </div>
                                        </TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {bills.data.length > 0 ? (
                                        bills.data.map((bill) => (
                                            <TableRow key={bill.id} className={cn(isOverdue(bill) && 'bg-red-50/50')}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        {bill.bill_number}
                                                        {isOverdue(bill) && (
                                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium">
                                                                {bill.patient?.full_name || 'N/A'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {bill.patient?.patient_id}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {formatDate(bill.bill_date)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <CurrencyDisplay amount={bill.total_amount} />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <CurrencyDisplay
                                                            amount={bill.balance_due}
                                                            color={bill.balance_due > 0 ? 'danger' : 'success'}
                                                        />
                                                        {bill.amount_paid > 0 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                Paid: <CurrencyDisplay amount={bill.amount_paid} />
                                                            </span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        <BillStatusBadge status={bill.status} size="sm" />
                                                        <span className="text-xs text-muted-foreground">
                                                            {bill.payment_status}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/billing/${bill.id}`}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    View Details
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/billing/${bill.id}/edit`}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Edit
                                                                </Link>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem asChild>
                                                                <Link href={`/billing/${bill.id}/invoice`}>
                                                                    <FileText className="mr-2 h-4 w-4" />
                                                                    View Invoice
                                                                </Link>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <FileText className="h-8 w-8 mb-2 opacity-50" />
                                                    <p>No bills found</p>
                                                    {hasActiveFilters && (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            onClick={clearFilters}
                                                            className="mt-2"
                                                        >
                                                            Clear filters to see all bills
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {bills.meta.last_page > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Page {bills.meta.current_page} of {bills.meta.last_page}
                                </div>

                                <div className="flex space-x-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={bills.meta.current_page <= 1}
                                        onClick={() =>
                                            router.get(
                                                `/billing?page=${bills.meta.current_page - 1}`,
                                                {},
                                                { preserveState: true }
                                            )
                                        }
                                    >
                                        Previous
                                    </Button>

                                    {Array.from({ length: Math.min(5, bills.meta.last_page) }, (_, i) => {
                                        const page = i + 1;
                                        return (
                                            <Button
                                                key={page}
                                                variant={bills.meta.current_page === page ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() =>
                                                    router.get(`/billing?page=${page}`, {}, { preserveState: true })
                                                }
                                            >
                                                {page}
                                            </Button>
                                        );
                                    })}

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={bills.meta.current_page >= bills.meta.last_page}
                                        onClick={() =>
                                            router.get(
                                                `/billing?page=${bills.meta.current_page + 1}`,
                                                {},
                                                { preserveState: true }
                                            )
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
