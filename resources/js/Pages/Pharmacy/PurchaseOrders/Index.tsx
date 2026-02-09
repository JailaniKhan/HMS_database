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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilterBar, type FilterConfig, type FilterState } from '@/components/pharmacy/FilterBar';
import Heading from '@/components/heading';
import {
    DollarSign,
    Calendar,
    Package,
    PlusCircle,
    Search,
    FileDown,
    Printer,
    Eye,
    Edit,
    Trash2,
    CheckCircle,
    Clock,
    Truck,
    XCircle,
    AlertCircle,
    ClipboardList,
    TrendingUp,
    Clock3,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import type { PurchaseOrder, Supplier } from '@/types/pharmacy';

interface PurchaseOrderWithItems extends PurchaseOrder {
    items_count: number;
    supplier: Supplier;
}

interface PurchaseOrderIndexProps {
    purchaseOrders: {
        data: PurchaseOrderWithItems[];
        links: {
            first: string;
            last: string;
            prev: string | null;
            next: string | null;
        };
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            links: {
                url: string | null;
                label: string;
                active: boolean;
            }[];
            path: string;
            per_page: number;
            to: number;
            total: number;
        };
    };
    suppliers: Supplier[];
    stats: {
        pending: number;
        ordered: number;
        partial: number;
        received: number;
        cancelled: number;
        total_value: number;
    };
    filters?: {
        query?: string;
        status?: string;
        supplier_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function PurchaseOrderIndex({ purchaseOrders, suppliers, stats, filters = {} }: PurchaseOrderIndexProps) {
    const [localFilters, setLocalFilters] = useState<FilterState>({
        query: filters.query || '',
        status: filters.status || '',
        supplier_id: filters.supplier_id || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    // Supplier options for filter
    const supplierOptions = useMemo(() =>
        suppliers.map(s => ({
            label: s.name,
            value: s.id.toString(),
        })),
        [suppliers]
    );

    // Filter configurations
    const filterConfigs: FilterConfig[] = useMemo(() => [
        {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Approved', value: 'approved' },
                { label: 'Ordered', value: 'ordered' },
                { label: 'Partial', value: 'partial' },
                { label: 'Received', value: 'received' },
                { label: 'Cancelled', value: 'cancelled' },
            ],
        },
        {
            id: 'supplier_id',
            label: 'Supplier',
            type: 'select',
            options: supplierOptions,
        },
        {
            id: 'date_range',
            label: 'Date Range',
            type: 'date-range',
        },
    ], [supplierOptions]);

    const handleFilterChange = (newFilters: FilterState) => {
        setLocalFilters(newFilters);

        const params: Record<string, string> = {};
        if (newFilters.query) params.query = newFilters.query as string;
        if (newFilters.status && newFilters.status !== 'all') params.status = newFilters.status as string;
        if (newFilters.supplier_id && newFilters.supplier_id !== 'all') params.supplier_id = newFilters.supplier_id as string;
        if (newFilters.date_from) params.date_from = newFilters.date_from as string;
        if (newFilters.date_to) params.date_to = newFilters.date_to as string;

        router.get('/pharmacy/purchase-orders', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setLocalFilters({});
        router.get('/pharmacy/purchase-orders', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (localFilters.query) params.append('query', localFilters.query as string);
        if (localFilters.status) params.append('status', localFilters.status as string);
        if (localFilters.supplier_id) params.append('supplier_id', localFilters.supplier_id as string);
        if (localFilters.date_from) params.append('date_from', localFilters.date_from as string);
        if (localFilters.date_to) params.append('date_to', localFilters.date_to as string);

        window.location.href = `/pharmacy/purchase-orders/export?${params.toString()}`;
    };

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this purchase order?')) {
            router.delete(`/pharmacy/purchase-orders/${id}`);
        }
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return (
                    <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Pending
                    </Badge>
                );
            case 'approved':
                return (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Approved
                    </Badge>
                );
            case 'ordered':
                return (
                    <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1">
                        <Truck className="h-3 w-3" />
                        Ordered
                    </Badge>
                );
            case 'partial':
                return (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Partial
                    </Badge>
                );
            case 'received':
                return (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30 gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Received
                    </Badge>
                );
            case 'cancelled':
                return (
                    <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" />
                        Cancelled
                    </Badge>
                );
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const canEdit = (status: string) => {
        return ['pending', 'approved'].includes(status.toLowerCase());
    };

    const canDelete = (status: string) => {
        return ['pending', 'cancelled'].includes(status.toLowerCase());
    };

    return (
        <PharmacyLayout>
            <div className="space-y-6">
                <Head title="Purchase Orders" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Purchase Order Management" />
                        <p className="text-muted-foreground mt-1">
                            Manage purchase orders and track supplier deliveries
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Link href="/pharmacy/purchase-orders/create">
                            <Button className="bg-primary hover:bg-primary/90">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Order
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold">{stats.pending}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Clock3 className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Ordered</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.ordered}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Truck className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Partial</p>
                                    <p className="text-2xl font-bold text-amber-600">{stats.partial}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <AlertCircle className="h-5 w-5 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Received</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.received}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Cancelled</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <XCircle className="h-5 w-5 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Value</p>
                                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.total_value)}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Bar */}
                <FilterBar
                    filters={filterConfigs}
                    value={localFilters}
                    onChange={handleFilterChange}
                    onReset={handleReset}
                    searchPlaceholder="Search by PO number or supplier..."
                    showFilterChips={true}
                />

                {/* Purchase Orders Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Purchase Orders</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Showing {purchaseOrders.data?.length || 0} of {purchaseOrders.meta?.total || 0} orders
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>PO Number</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Order Date</TableHead>
                                        <TableHead>Expected Delivery</TableHead>
                                        <TableHead className="text-center">Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchaseOrders.data.length > 0 ? (
                                        purchaseOrders.data.map((po) => (
                                            <TableRow key={po.id}>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <ClipboardList className="h-4 w-4 text-muted-foreground" />
                                                        {po.po_number}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Package className="h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-medium text-sm">{po.supplier.name}</p>
                                                            {po.supplier.contact_person && (
                                                                <p className="text-xs text-muted-foreground">{po.supplier.contact_person}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        {formatDate(po.order_date)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {po.expected_delivery ? (
                                                        <span className={cn(
                                                            new Date(po.expected_delivery) < new Date() && po.status !== 'received' && po.status !== 'cancelled'
                                                                ? 'text-red-600 font-medium'
                                                                : ''
                                                        )}>
                                                            {formatDate(po.expected_delivery)}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary">{po.items_count || 0}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1">
                                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                                        {formatCurrency(po.total_amount)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusBadge(po.status)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/pharmacy/purchase-orders/${po.id}`}>
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        {canEdit(po.status) && (
                                                            <Link href={`/pharmacy/purchase-orders/${po.id}/edit`}>
                                                                <Button variant="ghost" size="sm">
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {(po.status === 'sent' || po.status === 'partial') && (
                                                            <Link href={`/pharmacy/purchase-orders/${po.id}/receive`}>
                                                                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        <Link href={`/pharmacy/purchase-orders/${po.id}/print`} target="_blank">
                                                            <Button variant="ghost" size="sm">
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        {canDelete(po.status) && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleDelete(po.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <Search className="h-8 w-8 mb-2 opacity-50" />
                                                    <p>No purchase orders found</p>
                                                    {(localFilters.query || localFilters.status || localFilters.supplier_id) && (
                                                        <Button variant="link" onClick={handleReset} className="mt-2">
                                                            Clear filters
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
                        {(purchaseOrders.meta?.last_page || 0) > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <p className="text-sm text-muted-foreground">
                                    Showing {purchaseOrders.meta?.from || 0} to {purchaseOrders.meta?.to || 0} of {purchaseOrders.meta?.total || 0} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={purchaseOrders.links.prev || '#'}
                                        className={cn(
                                            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                                            'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                                            !purchaseOrders.links.prev && 'pointer-events-none opacity-50'
                                        )}
                                    >
                                        Previous
                                    </Link>
                                    <div className="flex items-center gap-1">
                                        {purchaseOrders.meta.links
                                            .filter(link => !link.label.includes('Previous') && !link.label.includes('Next'))
                                            .map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={cn(
                                                        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 w-9',
                                                        link.active
                                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                            : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                                                        !link.url && 'pointer-events-none opacity-50'
                                                    )}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                    </div>
                                    <Link
                                        href={purchaseOrders.links.next || '#'}
                                        className={cn(
                                            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                                            'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                                            !purchaseOrders.links.next && 'pointer-events-none opacity-50'
                                        )}
                                    >
                                        Next
                                    </Link>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PharmacyLayout>
    );
}
