import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import {
    TrendingUp,
    ArrowLeft,
    Download,
    Currency,
    ShoppingCart,
    Search,
    BarChart3,
    PieChart,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import type { Sale } from '@/types/pharmacy';

interface SalesReportProps {
    sales: {
        data: Sale[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        date_from?: string;
        date_to?: string;
        payment_method?: string;
        status?: string;
    };
    summary: {
        totalSales: number;
        totalRevenue: number;
        averageOrderValue: number;
        totalItems: number;
        paymentBreakdown: Record<string, number>;
        dailySales: Array<{
            date: string;
            sales: number;
            revenue: number;
        }>;
    };
}

const paymentMethodLabels: Record<string, string> = {
    cash: 'Cash',
    card: 'Card',
    insurance: 'Insurance',
    credit: 'Credit',
};

const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    cancelled: 'bg-red-100 text-red-800',
    refunded: 'bg-gray-100 text-gray-800',
};

export default function SalesReport({ sales, filters, summary }: SalesReportProps) {
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('pharmacy.reports.sales'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleDateFilter = () => {
        router.get(
            route('pharmacy.reports.sales'),
            { ...filters, date_from: dateFrom, date_to: dateTo, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleExport = () => {
        const params = new URLSearchParams({
            ...filters,
            export: 'pdf',
        } as Record<string, string>);
        window.open(`${route('pharmacy.reports.sales')}?${params.toString()}`, '_blank');
    };

    const handlePageChange = (page: number) => {
        router.get(route('pharmacy.reports.sales'), { ...filters, page }, { preserveState: true });
    };

    return (
        <PharmacyLayout header="Sales Report">
            <Head title="Sales Report" />

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
                        <h1 className="text-2xl font-bold">Sales Report</h1>
                        <p className="text-muted-foreground">Detailed sales analytics and trends</p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                                <ShoppingCart className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Sales</p>
                                <p className="text-2xl font-bold">{summary.totalSales.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-green-100 text-green-600">
                                <Currency className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Revenue</p>
                                <p className="text-2xl font-bold">${summary.totalRevenue.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                                <TrendingUp className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Avg Order Value</p>
                                <p className="text-2xl font-bold">${summary.averageOrderValue.toFixed(2)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-orange-100 text-orange-600">
                                <BarChart3 className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Items</p>
                                <p className="text-2xl font-bold">{summary.totalItems.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Payment Method Breakdown */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <PieChart className="h-5 w-5" />
                        Payment Method Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(summary.paymentBreakdown).map(([method, amount]) => (
                            <div key={method} className="p-4 rounded-lg bg-muted">
                                <p className="text-sm text-muted-foreground capitalize">{paymentMethodLabels[method] || method}</p>
                                <p className="text-xl font-bold">${amount.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">
                                    {((amount / summary.totalRevenue) * 100).toFixed(1)}% of total
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-full md:w-48">
                            <label className="text-sm font-medium mb-2 block">Date From</label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <label className="text-sm font-medium mb-2 block">Date To</label>
                            <Input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <label className="text-sm font-medium mb-2 block">Payment Method</label>
                            <Select
                                value={filters.payment_method || 'all'}
                                onValueChange={(value) => handleFilterChange('payment_method', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Methods" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Methods</SelectItem>
                                    <SelectItem value="cash">Cash</SelectItem>
                                    <SelectItem value="card">Card</SelectItem>
                                    <SelectItem value="insurance">Insurance</SelectItem>
                                    <SelectItem value="credit">Credit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-48">
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <Select
                                value={filters.status || 'all'}
                                onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleDateFilter}>
                                <Search className="mr-2 h-4 w-4" />
                                Apply Filters
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Sales Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Sales Transactions ({sales.total})</CardTitle>
                    <CardDescription>Detailed list of all sales transactions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">Invoice #</th>
                                    <th className="text-left py-3 px-4 font-medium">Date</th>
                                    <th className="text-left py-3 px-4 font-medium">Customer</th>
                                    <th className="text-left py-3 px-4 font-medium">Items</th>
                                    <th className="text-right py-3 px-4 font-medium">Total</th>
                                    <th className="text-left py-3 px-4 font-medium">Payment</th>
                                    <th className="text-left py-3 px-4 font-medium">Status</th>
                                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sales.data.map((sale) => (
                                    <tr key={sale.id} className="border-b hover:bg-muted/50">
                                        <td className="py-3 px-4 font-medium">{sale.sale_id}</td>
                                        <td className="py-3 px-4 text-sm">
                                            {format(parseISO(sale.created_at), 'MMM d, yyyy')}
                                        </td>
                                        <td className="py-3 px-4">
                                            {sale.patient ? (
                                                <div>
                                                    <p className="font-medium">
                                                        {sale.patient.first_name} {sale.patient.last_name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {sale.patient.patient_id}
                                                    </p>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Walk-in Customer</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-sm">
                                            {sale.items?.length || 0} items
                                        </td>
                                        <td className="py-3 px-4 text-right font-medium">
                                            ${Number(sale.grand_total).toFixed(2)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge variant="outline" className="capitalize">
                                                {paymentMethodLabels[sale.payment_method] || sale.payment_method}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4">
                                            <Badge className={statusColors[sale.status]}>
                                                {sale.status}
                                            </Badge>
                                        </td>
                                        <td className="py-3 px-4 text-right">
                                            <Link href={route('pharmacy.sales.show', sale.id)}>
                                                <Button variant="ghost" size="sm">
                                                    View
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {sales.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={sales.current_page === 1}
                                onClick={() => handlePageChange(sales.current_page - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {sales.current_page} of {sales.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={sales.current_page === sales.last_page}
                                onClick={() => handlePageChange(sales.current_page + 1)}
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
