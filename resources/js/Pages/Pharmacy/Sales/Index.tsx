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
    Currency, 
    Calendar, 
    User, 
    PlusCircle, 
    Search,
    FileDown,
    Printer,
    Eye,
    Ban,
    Receipt,
    ShoppingCart,
    TrendingUp,
    CreditCard,
    Wallet,
    Landmark
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import HospitalLayout from '@/layouts/PharmacyLayout';
import type { Sale } from '@/types/pharmacy';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// Helper function to decode HTML entities safely
const decodeHtmlEntity = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    last_name: string;
}

interface SaleWithItems extends Sale {
    patient: Patient | null;
    user: {
        id: number;
        name: string;
    };
    items_count: number;
}

interface SaleIndexProps {
    sales: {
        data: SaleWithItems[];
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
    filters?: {
        query?: string;
        status?: string;
        payment_method?: string;
        date_from?: string;
        date_to?: string;
    };
    stats?: {
        total_sales: number;
        total_revenue: number;
        today_sales: number;
        today_revenue: number;
    };
}

export default function SaleIndex({ sales, filters = {}, stats }: SaleIndexProps) {
    const [localFilters, setLocalFilters] = useState<FilterState>({
        query: filters.query || '',
        status: filters.status || '',
        payment_method: filters.payment_method || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });
    const [voidDialogOpen, setVoidDialogOpen] = useState(false);
    const [voidReason, setVoidReason] = useState('');
    const [saleToVoid, setSaleToVoid] = useState<number | null>(null);

    // Filter configurations
    const filterConfigs: FilterConfig[] = useMemo(() => [
        {
            id: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { label: 'Completed', value: 'completed' },
                { label: 'Pending', value: 'pending' },
                { label: 'Cancelled', value: 'cancelled' },
                { label: 'Refunded', value: 'refunded' },
            ],
        },
        {
            id: 'payment_method',
            label: 'Payment Method',
            type: 'select',
            options: [
                { label: 'Cash', value: 'cash' },
                { label: 'Card', value: 'card' },
                { label: 'Insurance', value: 'insurance' },
                { label: 'Credit', value: 'credit' },
            ],
        },
        {
            id: 'date_range',
            label: 'Date Range',
            type: 'date-range',
        },
    ], []);

    const handleFilterChange = (newFilters: FilterState) => {
        setLocalFilters(newFilters);
        
        // Prepare query params
        const params: Record<string, string> = {};
        if (newFilters.query) params.query = newFilters.query as string;
        if (newFilters.status && newFilters.status !== 'all') params.status = newFilters.status as string;
        if (newFilters.payment_method && newFilters.payment_method !== 'all') params.payment_method = newFilters.payment_method as string;
        if (newFilters.date_from) params.date_from = newFilters.date_from as string;
        if (newFilters.date_to) params.date_to = newFilters.date_to as string;

        router.get('/pharmacy/sales', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setLocalFilters({});
        router.get('/pharmacy/sales', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number | null | undefined) => {
        if (amount === null || amount === undefined || isNaN(amount)) {
            return '$0.00';
        }
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'AFN',
        }).format(amount);
    };

    const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'default';
            case 'pending':
                return 'secondary';
            case 'cancelled':
            case 'refunded':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        switch (method.toLowerCase()) {
            case 'cash':
                return <Wallet className="h-4 w-4" />;
            case 'card':
                return <CreditCard className="h-4 w-4" />;
            case 'insurance':
                return <Landmark className="h-4 w-4" />;
            default:
                return <Currency className="h-4 w-4" />;
        }
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (localFilters.query) params.append('query', localFilters.query as string);
        if (localFilters.status) params.append('status', localFilters.status as string);
        if (localFilters.payment_method) params.append('payment_method', localFilters.payment_method as string);
        if (localFilters.date_from) params.append('date_from', localFilters.date_from as string);
        if (localFilters.date_to) params.append('date_to', localFilters.date_to as string);
        
        window.location.href = `/pharmacy/sales/export?${params.toString()}`;
    };

    const handleVoid = () => {
        if (!voidReason.trim() || !saleToVoid) return;
        
        router.post(`/pharmacy/sales/${saleToVoid}/void`, {
            reason: voidReason,
        }, {
            onSuccess: () => {
                setVoidDialogOpen(false);
                setVoidReason('');
                setSaleToVoid(null);
            },
        });
    };

    const openVoidDialog = (saleId: number) => {
        setSaleToVoid(saleId);
        setVoidReason('');
        setVoidDialogOpen(true);
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Pharmacy Sales" />
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Pharmacy Sales Management" />
                        <p className="text-muted-foreground mt-1">
                            Manage sales transactions and view sales history
                        </p>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Link href="/pharmacy/sales/create">
                            <Button className="bg-primary hover:bg-primary/90">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Sale
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                {stats && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Sales</p>
                                        <p className="text-2xl font-bold">{stats.total_sales}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                        <ShoppingCart className="h-5 w-5 text-primary" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Total Revenue</p>
                                        <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_revenue)}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Currency className="h-5 w-5 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Today's Sales</p>
                                        <p className="text-2xl font-bold text-blue-600">{stats.today_sales}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <TrendingUp className="h-5 w-5 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Today's Revenue</p>
                                        <p className="text-2xl font-bold text-amber-600">{formatCurrency(stats.today_revenue)}</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                        <Receipt className="h-5 w-5 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Filter Bar */}
                <FilterBar
                    filters={filterConfigs}
                    value={localFilters}
                    onChange={handleFilterChange}
                    onReset={handleReset}
                    searchPlaceholder="Search by invoice #, patient name..."
                    showFilterChips={true}
                />

                {/* Sales Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Sales List</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Showing {sales.data?.length || 0} of {sales.meta?.total || 0} sales
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[120px]">Invoice #</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Customer</TableHead>
                                        <TableHead className="text-center">Items</TableHead>
                                        <TableHead>Total</TableHead>
                                        <TableHead>Payment</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {sales.data.length > 0 ? (
                                        sales.data.map((sale) => (
                                            <TableRow key={sale.id}>
                                                <TableCell className="font-medium">
                                                    {sale.sale_id}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {formatDate(sale.created_at)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {sale.patient ? (
                                                        <div className="flex items-center">
                                                            <User className="mr-2 h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="font-medium">{sale.patient.first_name} {sale.patient.last_name}</p>
                                                                <p className="text-xs text-muted-foreground">{sale.patient.patient_id}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">Walk-in Customer</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant="secondary">{sale.items_count || 0}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Currency className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="font-semibold">{formatCurrency(sale.grand_total || sale.total_amount)}</p>
                                                            {sale.discount > 0 && (
                                                                <p className="text-xs text-emerald-600">-{formatCurrency(sale.discount)} discount</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {getPaymentMethodIcon(sale.payment_method)}
                                                        <span className="capitalize">{sale.payment_method}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(sale.status)}>
                                                        {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/pharmacy/sales/${sale.id}`}>
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/pharmacy/sales/${sale.id}/receipt`} target="_blank">
                                                            <Button variant="ghost" size="sm">
                                                                <Printer className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        {sale.status !== 'cancelled' && sale.status !== 'refunded' && (
                                                            <Button 
                                                                variant="ghost" 
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => openVoidDialog(sale.id)}
                                                            >
                                                                <Ban className="h-4 w-4" />
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
                                                    <p>No sales found</p>
                                                    {(localFilters.query || localFilters.status || localFilters.payment_method) && (
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
                        {(sales.meta?.last_page || 0) > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <p className="text-sm text-muted-foreground">
                                    Showing {sales.meta?.from || 0} to {sales.meta?.to || 0} of {sales.meta?.total || 0} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={sales.links.prev || '#'}
                                        className={cn(
                                            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                                            'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                                            !sales.links.prev && 'pointer-events-none opacity-50'
                                        )}
                                    >
                                        Previous
                                    </Link>
                                    <div className="flex items-center gap-1">
                                        {sales.meta.links
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
                                                    dangerouslySetInnerHTML={{ __html: decodeHtmlEntity(link.label) }}
                                                />
                                            ))}
                                    </div>
                                    <Link
                                        href={sales.links.next || '#'}
                                        className={cn(
                                            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                                            'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                                            !sales.links.next && 'pointer-events-none opacity-50'
                                        )}
                                    >
                                        Next
                                    </Link>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Void Sale Dialog */}
                <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Void Sale</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to void this sale? This action cannot be undone and will restore stock quantities.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Reason for voiding</label>
                                <Textarea
                                    value={voidReason}
                                    onChange={(e) => setVoidReason(e.target.value)}
                                    placeholder="Enter reason for voiding this sale..."
                                    rows={3}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setVoidDialogOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleVoid}
                                disabled={!voidReason.trim()}
                            >
                                Void Sale
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </HospitalLayout>
    );
}
