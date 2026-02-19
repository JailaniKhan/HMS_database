import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { PriceDisplay } from '@/components/pharmacy';
import {
    Plus,
    Search,
    ShoppingCart,
    Package,
    Clock,
    CheckCircle,
    Eye,
    XCircle,
    FileText,
    Calendar,
} from 'lucide-react';
import { useState } from 'react';

interface Purchase {
    id: number;
    purchase_number: string;
    invoice_number: string | null;
    purchase_date: string;
    subtotal: number;
    tax: number;
    discount: number;
    total_amount: number;
    status: 'pending' | 'received' | 'partial' | 'cancelled';
    payment_status: 'unpaid' | 'partial' | 'paid';
    supplier: {
        id: number;
        name: string;
    } | null;
    creator: {
        id: number;
        name: string;
    };
    items_count: number;
    created_at: string;
}

interface Supplier {
    id: number;
    name: string;
}

interface Props {
    purchases: {
        data: Purchase[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    suppliers: Supplier[];
    stats: {
        total_purchases: number;
        total_amount: number;
        pending: number;
        received: number;
    };
    filters: {
        query?: string;
        status?: string;
        supplier_id?: string;
        date_from?: string;
        date_to?: string;
    };
}

const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    received: 'bg-green-100 text-green-800 border-green-200',
    partial: 'bg-blue-100 text-blue-800 border-blue-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
};

const paymentStatusColors = {
    unpaid: 'bg-red-100 text-red-800',
    partial: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
};

export default function PurchasesIndex({ purchases, suppliers, stats, filters }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.query || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [supplierFilter, setSupplierFilter] = useState(filters.supplier_id || 'all');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
    const [purchaseToCancel, setPurchaseToCancel] = useState<Purchase | null>(null);

    const handleSearch = () => {
        router.get(
            '/pharmacy/purchases',
            {
                query: searchQuery || undefined,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                supplier_id: supplierFilter !== 'all' ? supplierFilter : undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true }
        );
    };

    const handleCancelPurchase = (purchase: Purchase) => {
        setPurchaseToCancel(purchase);
        setCancelDialogOpen(true);
    };

    const confirmCancel = () => {
        if (purchaseToCancel) {
            router.post(`/pharmacy/purchases/${purchaseToCancel.id}/cancel`, {}, {
                onSuccess: () => {
                    setCancelDialogOpen(false);
                    setPurchaseToCancel(null);
                },
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <PharmacyLayout header={<h1 className="text-xl font-semibold">Purchases</h1>}>
            <Head title="Pharmacy Purchases" />

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <ShoppingCart className="size-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Purchases</p>
                                <p className="text-2xl font-bold">{stats.total_purchases}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <FileText className="size-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Amount</p>
                                <p className="text-2xl font-bold">
                                    <PriceDisplay amount={stats.total_amount} />
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Clock className="size-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold">{stats.pending}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <CheckCircle className="size-5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Received</p>
                                <p className="text-2xl font-bold">{stats.received}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="text-lg">Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-6">
                        <div className="md:col-span-2">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Search by purchase # or invoice..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="received">Received</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Supplier</Label>
                            <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Suppliers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Suppliers</SelectItem>
                                    {suppliers.map((supplier) => (
                                        <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                            {supplier.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>From Date</Label>
                            <Input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />
                        </div>
                        <div>
                            <Label>To Date</Label>
                            <div className="flex gap-2">
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                                <Button onClick={handleSearch}>Filter</Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Purchases Table */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Purchase Orders</CardTitle>
                    <Link href="/pharmacy/purchases/create">
                        <Button>
                            <Plus className="size-4 mr-2" />
                            New Purchase
                        </Button>
                    </Link>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Purchase #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead>Items</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {purchases.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8">
                                        <Package className="size-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                                        <p className="text-muted-foreground">No purchases found</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                purchases.data.map((purchase) => (
                                    <TableRow key={purchase.id}>
                                        <TableCell className="font-medium">
                                            {purchase.purchase_number}
                                        </TableCell>
                                        <TableCell>{formatDate(purchase.purchase_date)}</TableCell>
                                        <TableCell>{purchase.supplier?.name || 'N/A'}</TableCell>
                                        <TableCell>{purchase.items_count} items</TableCell>
                                        <TableCell>
                                            <PriceDisplay amount={purchase.total_amount} />
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={statusColors[purchase.status]}
                                            >
                                                {purchase.status.charAt(0).toUpperCase() +
                                                    purchase.status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={paymentStatusColors[purchase.payment_status]}>
                                                {purchase.payment_status.charAt(0).toUpperCase() +
                                                    purchase.payment_status.slice(1)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/pharmacy/purchases/${purchase.id}`}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="size-4" />
                                                    </Button>
                                                </Link>
                                                {purchase.status === 'pending' && (
                                                    <Link
                                                        href={`/pharmacy/purchases/${purchase.id}`}
                                                        method="post"
                                                        as="button"
                                                    >
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-green-600 hover:text-green-700"
                                                        >
                                                            <CheckCircle className="size-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                {(purchase.status === 'pending' ||
                                                    purchase.status === 'received') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => handleCancelPurchase(purchase)}
                                                    >
                                                        <XCircle className="size-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination */}
                    {purchases.last_page > 1 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Showing {(purchases.current_page - 1) * purchases.per_page + 1} to{' '}
                                {Math.min(
                                    purchases.current_page * purchases.per_page,
                                    purchases.total
                                )}{' '}
                                of {purchases.total} purchases
                            </p>
                            <div className="flex gap-2">
                                {purchases.current_page > 1 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get(
                                                '/pharmacy/purchases',
                                                { page: purchases.current_page - 1 },
                                                { preserveState: true }
                                            )
                                        }
                                    >
                                        Previous
                                    </Button>
                                )}
                                {purchases.current_page < purchases.last_page && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get(
                                                '/pharmacy/purchases',
                                                { page: purchases.current_page + 1 },
                                                { preserveState: true }
                                            )
                                        }
                                    >
                                        Next
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Purchase</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel purchase{' '}
                            <strong>{purchaseToCancel?.purchase_number}</strong>?
                            {purchaseToCancel?.status === 'received' && (
                                <span className="block mt-2 text-yellow-600">
                                    This will reverse the stock changes.
                                </span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                            No, Keep It
                        </Button>
                        <Button variant="destructive" onClick={confirmCancel}>
                            Yes, Cancel Purchase
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PharmacyLayout>
    );
}