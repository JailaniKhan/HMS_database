import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { 
    Calendar, 
    User, 
    Pill, 
    Building2,
    ChevronLeft, 
    ChevronRight,
    ChevronUp,
    ChevronDown,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    AlertCircle,
    Activity,
    TrendingUp
} from 'lucide-react';
import { useState, Fragment } from 'react';
import PharmacyLayout from '@/layouts/PharmacyLayout';

// Types
interface Customer {
    id: number;
    name: string;
}

interface Pharmacist {
    id: number;
    name: string;
}

interface Product {
    id: number | null;
    name: string;
    quantity: number;
    unit_price: number;
    discount_percentage: number;
    final_price: number;
}

interface SaleData {
    id: string;
    sale_id: string;
    sale_date: string;
    status: string;
    customer: Customer | null;
    pharmacist: Pharmacist | null;
    products: Product[];
    products_count: number;
    grand_total: number;
    discount: number;
}

interface FilterCategory {
    id: number;
    name: string;
}

interface Summary {
    total_revenue: number;
    total_sales: number;
    completed_sales: number;
    cancelled_sales: number;
    pending_sales: number;
    refunded_sales: number;
}

interface Navigation {
    can_go_next: boolean;
    can_go_prev: boolean;
    next_params: Record<string, number>;
    prev_params: Record<string, number>;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    has_more_pages: boolean;
}

interface SalesDashboardProps {
    sales: SaleData[];
    filters: {
        view: string;
        year: number;
        month: number;
        day: number;
    };
    summary: Summary;
    categories: FilterCategory[];
    navigation: Navigation;
    is_super_admin: boolean;
    period_label: string;
}

export default function SalesDashboard({
    sales,
    filters,
    summary,
    categories,
    navigation,
    is_super_admin,
    period_label,
    pagination,
}: SalesDashboardProps & { pagination: Pagination }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const currentView = filters.view;

    // Toggle expanded row
    const toggleExpanded = (id: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Helper function to build URL with params
    const buildUrl = (params: Record<string, string | number>) => {
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            urlParams.set(key, String(value));
        });
        return `/pharmacy/sales?${urlParams.toString()}`;
    };

    // Filter sales based on search
    const filteredSales = sales.filter(sale =>
        (categoryFilter === 'all' || sale.products?.some(p => p.name?.toLowerCase().includes(categoryFilter.toLowerCase()))) &&
        (
            sale.sale_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.pharmacist?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sale.products?.some(p => p.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    );

    // Format currency in Afghani
    const formatCurrency = (amount: number) => {
        return `؋${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get status badge variant
    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'default';
            case 'cancelled':
                return 'destructive';
            case 'pending':
                return 'secondary';
            case 'refunded':
                return 'outline';
            default:
                return 'outline';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-blue-500" />;
            case 'refunded':
                return <RefreshCw className="h-4 w-4 text-purple-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <PharmacyLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
                <Head title="Sales Dashboard - Pharmacy Sales Management" />
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
                    <div>
                        <Heading title="Sales Dashboard" />
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage and monitor all pharmacy sales with financial tracking
                        </p>
                    </div>
                    
                    {/* View Toggle for Super Admins */}
                    {is_super_admin && (
                        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border">
                            <Link href={buildUrl({ ...filters, view: 'today' })}>
                                <Button
                                    variant={currentView === 'today' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="transition-all"
                                >
                                    Today
                                </Button>
                            </Link>
                            <Link href={buildUrl({ ...filters, view: 'monthly' })}>
                                <Button
                                    variant={currentView === 'monthly' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="transition-all"
                                >
                                    Monthly
                                </Button>
                            </Link>
                            <Link href={buildUrl({ ...filters, view: 'yearly' })}>
                                <Button
                                    variant={currentView === 'yearly' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="transition-all"
                                >
                                    Yearly
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Navigation and Period Label */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        {/* Previous Button */}
                        {navigation.can_go_prev ? (
                            <Link href={buildUrl({ ...navigation.prev_params, view: currentView })}>
                                <Button variant="outline" size="sm" className="hover:bg-primary hover:text-white transition-all">
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" disabled className="opacity-50">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                        )}

                        {/* Period Label */}
                        <div className="px-4 py-2 bg-white rounded-lg shadow-sm border">
                            <span className="text-lg font-semibold text-primary">{period_label}</span>
                        </div>

                        {/* Next Button */}
                        {navigation.can_go_next ? (
                            <Link href={buildUrl({ ...navigation.next_params, view: currentView })}>
                                <Button variant="outline" size="sm" className="hover:bg-primary hover:text-white transition-all">
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" disabled className="opacity-50">
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        )}
                    </div>

                    {/* Access Level Indicator */}
                    <div className="flex items-center gap-2">
                        <Badge variant={is_super_admin ? 'default' : 'secondary'}>
                            {is_super_admin ? 'Super Admin - Full Access' : 'Sub Admin - Today Only'}
                        </Badge>
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Total Revenue Card */}
                    <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {currentView === 'today' ? "Today's Revenue" : 
                                         currentView === 'monthly' ? 'Monthly Revenue' : 'Yearly Revenue'}
                                    </p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {formatCurrency(summary.total_revenue)}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <TrendingUp className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Sales Card */}
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                                    <p className="text-2xl font-bold text-blue-600">{summary.total_sales}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Activity className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Completed Sales Card */}
                    <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                    <p className="text-2xl font-bold text-green-600">{summary.completed_sales}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cancelled Sales Card */}
                    <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                                    <p className="text-2xl font-bold text-red-600">{summary.cancelled_sales}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <XCircle className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Status Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Pending</p>
                                <p className="text-xl font-bold text-blue-500">{summary.pending_sales}</p>
                            </div>
                            <Clock className="h-5 w-5 text-blue-400" />
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Refunded</p>
                                <p className="text-xl font-bold text-orange-500">{summary.refunded_sales}</p>
                            </div>
                            <RefreshCw className="h-5 w-5 text-orange-400" />
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Avg Sale Value</p>
                                <p className="text-xl font-bold text-purple-500">
                                    {formatCurrency(summary.total_sales > 0 ? summary.total_revenue / summary.total_sales : 0)}
                                </p>
                            </div>
                            <TrendingUp className="h-5 w-5 text-purple-400" />
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Total Discount</p>
                                <p className="text-xl font-bold text-indigo-500">
                                    {formatCurrency(sales.reduce((sum, sale) => sum + sale.discount, 0))}
                                </p>
                            </div>
                            <AlertCircle className="h-5 w-5 text-indigo-400" />
                        </CardContent>
                    </Card>
                </div>

                {/* Main Sales Table */}
                <Card className="shadow-lg border-border/50">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Pharmacy Sales
                                <Badge variant="outline" className="ml-2">
                                    {filteredSales.length} sales
                                </Badge>
                            </CardTitle>
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                {/* Category Filter */}
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[150px]"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.name}>
                                            {cat.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search sales..."
                                        className="w-full pl-4 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold">Sale ID</TableHead>
                                        <TableHead className="font-semibold">Date & Time</TableHead>
                                        <TableHead className="font-semibold">Customer</TableHead>
                                        <TableHead className="font-semibold">Pharmacist</TableHead>
                                        <TableHead className="font-semibold">Products</TableHead>
                                        <TableHead className="font-semibold text-right">Total</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredSales.length > 0 ? (
                                        filteredSales.map((sale) => {
                                            const isExpanded = expandedRows.has(sale.id.toString());
                                            return (
                                                <Fragment key={sale.id}>
                                                    <TableRow className="hover:bg-muted/50 transition-colors">
                                                        <TableCell className="font-medium">
                                                            <Badge variant="outline" className="font-mono text-xs">
                                                                {sale.sale_id}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-sm">
                                                                    {formatDate(sale.sale_date)}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                                    <User className="h-4 w-4 text-blue-600" />
                                                                </div>
                                                                <span className="font-medium">
                                                                    {sale.customer?.name || 'Walk-in Customer'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {sale.pharmacist ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                                                        <Pill className="h-4 w-4 text-green-600" />
                                                                    </div>
                                                                    <span className="font-medium">
                                                                        {sale.pharmacist.name}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                                        <Building2 className="h-4 w-4 text-blue-600" />
                                                                    </div>
                                                                    <span className="font-medium text-blue-700">
                                                                        Pharmacy
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1">
                                                                {sale.products?.slice(0, 2).map((p, idx) => (
                                                                    <span key={idx} className="font-medium text-sm">
                                                                        {p.name} (x{p.quantity})
                                                                        {p.discount_percentage > 0 && (
                                                                            <Badge variant="outline" className="ml-1 text-xs">
                                                                                {p.discount_percentage}% off
                                                                            </Badge>
                                                                        )}
                                                                    </span>
                                                                ))}
                                                                {sale.products_count > 2 && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        +{sale.products_count - 2} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="font-semibold text-emerald-600">
                                                                {formatCurrency(sale.grand_total)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {getStatusIcon(sale.status)}
                                                                <Badge 
                                                                    variant={getStatusBadgeVariant(sale.status)} 
                                                                    className="capitalize"
                                                                >
                                                                    {sale.status}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {sale.products_count > 1 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => toggleExpanded(sale.id.toString())}
                                                                    className="p-1 h-8 w-8"
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronUp className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                    {isExpanded && sale.products && sale.products.length > 1 && (
                                                        <TableRow key={`${sale.id}-expanded`} className="bg-muted/30">
                                                            <TableCell colSpan={8} className="py-2">
                                                                <div className="pl-4 border-l-2 border-primary/30">
                                                                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                                                                        Products Breakdown:
                                                                    </p>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                        {sale.products.map((p, idx) => (
                                                                            <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                                                                                <div>
                                                                                    <span className="font-medium">{p.name}</span>
                                                                                    <span className="text-muted-foreground ml-2">x{p.quantity}</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-muted-foreground line-through text-xs">
                                                                                        {formatCurrency(p.unit_price * p.quantity)}
                                                                                    </span>
                                                                                    <span className="font-semibold text-emerald-600">
                                                                                        {formatCurrency(p.final_price)}
                                                                                    </span>
                                                                                    {p.discount_percentage > 0 && (
                                                                                        <Badge variant="destructive" className="text-xs">
                                                                                            -{p.discount_percentage}%
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </Fragment>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Activity className="h-8 w-8 text-muted-foreground/50" />
                                                    <p>No sales found for this period</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Pagination Controls */}
                {pagination && pagination.total > 0 && (
                    <Card className="mt-6 shadow-sm">
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                                {/* Results Info */}
                                <div className="text-sm text-muted-foreground">
                                    Showing <span className="font-medium">{pagination.from || 0}</span> to{' '}
                                    <span className="font-medium">{pagination.to || 0}</span> of{' '}
                                    <span className="font-medium">{pagination.total}</span> sales
                                </div>

                                {/* Pagination Buttons */}
                                <div className="flex items-center gap-2">
                                    {/* Previous Page Button */}
                                    {pagination.current_page > 1 ? (
                                        <Link 
                                            href={buildUrl({ 
                                                ...filters, 
                                                view: currentView, 
                                                page: pagination.current_page - 1 
                                            })}
                                        >
                                            <Button variant="outline" size="sm" className="hover:bg-primary hover:text-white transition-all">
                                                <ChevronLeft className="h-4 w-4 mr-1" />
                                                Previous
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button variant="outline" size="sm" disabled className="opacity-50">
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Previous
                                        </Button>
                                    )}

                                    {/* Page Numbers */}
                                    <div className="flex items-center gap-1">
                                        {/* First Page */}
                                        {pagination.current_page > 2 && (
                                            <Link 
                                                href={buildUrl({ 
                                                    ...filters, 
                                                    view: currentView, 
                                                    page: 1 
                                                })}
                                            >
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0"
                                                >
                                                    1
                                                </Button>
                                            </Link>
                                        )}

                                        {/* Ellipsis before current */}
                                        {pagination.current_page > 3 && (
                                            <span className="px-2 text-muted-foreground">...</span>
                                        )}

                                        {/* Page before current */}
                                        {pagination.current_page > 1 && (
                                            <Link 
                                                href={buildUrl({ 
                                                    ...filters, 
                                                    view: currentView, 
                                                    page: pagination.current_page - 1 
                                                })}
                                            >
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0"
                                                >
                                                    {pagination.current_page - 1}
                                                </Button>
                                            </Link>
                                        )}

                                        {/* Current Page */}
                                        <Button 
                                            variant="default" 
                                            size="sm" 
                                            className="h-8 w-8 p-0"
                                        >
                                            {pagination.current_page}
                                        </Button>

                                        {/* Page after current */}
                                        {pagination.current_page < pagination.last_page && (
                                            <Link 
                                                href={buildUrl({ 
                                                    ...filters, 
                                                    view: currentView, 
                                                    page: pagination.current_page + 1 
                                                })}
                                            >
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0"
                                                >
                                                    {pagination.current_page + 1}
                                                </Button>
                                            </Link>
                                        )}

                                        {/* Ellipsis after current */}
                                        {pagination.current_page < pagination.last_page - 2 && (
                                            <span className="px-2 text-muted-foreground">...</span>
                                        )}

                                        {/* Last Page */}
                                        {pagination.current_page < pagination.last_page - 1 && (
                                            <Link 
                                                href={buildUrl({ 
                                                    ...filters, 
                                                    view: currentView, 
                                                    page: pagination.last_page 
                                                })}
                                            >
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="h-8 w-8 p-0"
                                                >
                                                    {pagination.last_page}
                                                </Button>
                                            </Link>
                                        )}
                                    </div>

                                    {/* Next Page Button */}
                                    {pagination.has_more_pages ? (
                                        <Link 
                                            href={buildUrl({ 
                                                ...filters, 
                                                view: currentView, 
                                                page: pagination.current_page + 1 
                                            })}
                                        >
                                            <Button variant="outline" size="sm" className="hover:bg-primary hover:text-white transition-all">
                                                Next
                                                <ChevronRight className="h-4 w-4 ml-1" />
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button variant="outline" size="sm" disabled className="opacity-50">
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    )}
                                </div>

                                {/* Page Info */}
                                <div className="text-sm text-muted-foreground">
                                    Page <span className="font-medium">{pagination.current_page}</span> of{' '}
                                    <span className="font-medium">{pagination.last_page}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Footer Info */}
                <div className="mt-4 text-center text-sm text-muted-foreground">
                    <p>
                        {is_super_admin 
                            ? `Viewing sales for ${period_label}` 
                            : 'Viewing today\'s sales (sub-admin access limited)'}
                    </p>
                </div>
            </div>
        </PharmacyLayout>
    );
}