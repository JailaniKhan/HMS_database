import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
} from '@/components/ui/dialog';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { PriceDisplay } from '@/components/pharmacy';
import {
    ArrowLeft,
    Building2,
    Calendar,
    FileText,
    CheckCircle,
    XCircle,
    Printer,
    User,
    Clock,
} from 'lucide-react';
import { useState } from 'react';

interface PurchaseItem {
    id: number;
    quantity: number;
    cost_price: number;
    total_price: number;
    batch_number: string | null;
    expiry_date: string | null;
    medicine: {
        id: number;
        name: string;
        medicine_id: string;
        category?: {
            name: string;
        };
    };
}

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
    notes: string | null;
    created_at: string;
    received_at: string | null;
    supplier: {
        id: number;
        name: string;
        contact_person?: string;
        email?: string;
        phone?: string;
        address?: string;
    } | null;
    creator: {
        id: number;
        name: string;
    };
    receiver: {
        id: number;
        name: string;
    } | null;
    items: PurchaseItem[];
}

interface Props {
    purchase: Purchase;
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

export default function ShowPurchase({ purchase }: Props) {
    const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
    const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

    const handleReceive = () => {
        router.post(`/pharmacy/purchases/${purchase.id}/receive`, {}, {
            onSuccess: () => {
                setReceiveDialogOpen(false);
            },
        });
    };

    const handleCancel = () => {
        router.post(`/pharmacy/purchases/${purchase.id}/cancel`, {}, {
            onSuccess: () => {
                setCancelDialogOpen(false);
            },
        });
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <PharmacyLayout header={<h1 className="text-xl font-semibold">Purchase Details</h1>}>
            <Head title={`Purchase ${purchase.purchase_number}`} />

            <div className="mb-6">
                <Link href="/pharmacy/purchases">
                    <Button variant="ghost">
                        <ArrowLeft className="size-4 mr-2" />
                        Back to Purchases
                    </Button>
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Purchase Info */}
                    <Card>
                        <CardHeader className="flex flex-row items-start justify-between">
                            <div>
                                <CardTitle className="text-xl">
                                    {purchase.purchase_number}
                                </CardTitle>
                                <div className="flex items-center gap-2 mt-2">
                                    <Badge
                                        variant="outline"
                                        className={statusColors[purchase.status]}
                                    >
                                        {purchase.status.charAt(0).toUpperCase() +
                                            purchase.status.slice(1)}
                                    </Badge>
                                    <Badge className={paymentStatusColors[purchase.payment_status]}>
                                        {purchase.payment_status.charAt(0).toUpperCase() +
                                            purchase.payment_status.slice(1)}
                                    </Badge>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={handlePrint}>
                                    <Printer className="size-4 mr-2" />
                                    Print
                                </Button>
                                {purchase.status === 'pending' && (
                                    <Button onClick={() => setReceiveDialogOpen(true)}>
                                        <CheckCircle className="size-4 mr-2" />
                                        Receive
                                    </Button>
                                )}
                                {(purchase.status === 'pending' ||
                                    purchase.status === 'received') && (
                                    <Button
                                        variant="destructive"
                                        onClick={() => setCancelDialogOpen(true)}
                                    >
                                        <XCircle className="size-4 mr-2" />
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-start gap-3">
                                    <FileText className="size-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Invoice Number
                                        </p>
                                        <p className="font-medium">
                                            {purchase.invoice_number || 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Calendar className="size-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Purchase Date
                                        </p>
                                        <p className="font-medium">
                                            {formatDate(purchase.purchase_date)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="size-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">Created By</p>
                                        <p className="font-medium">{purchase.creator.name}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="size-5 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="text-sm text-muted-foreground">
                                            Created At
                                        </p>
                                        <p className="font-medium">
                                            {formatDateTime(purchase.created_at)}
                                        </p>
                                    </div>
                                </div>
                                {purchase.receiver && (
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="size-5 text-green-600 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                Received By
                                            </p>
                                            <p className="font-medium">{purchase.receiver.name}</p>
                                            {purchase.received_at && (
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateTime(purchase.received_at)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {purchase.notes && (
                                <>
                                    <Separator className="my-4" />
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">
                                            Notes
                                        </p>
                                        <p>{purchase.notes}</p>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Purchase Items ({purchase.items.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-center">Qty</TableHead>
                                        <TableHead className="text-right">Cost Price</TableHead>
                                        <TableHead>Batch #</TableHead>
                                        <TableHead>Expiry</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchase.items.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">
                                                        {item.medicine.name}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.medicine.medicine_id}
                                                    </p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {item.medicine.category?.name || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <PriceDisplay amount={item.cost_price} />
                                            </TableCell>
                                            <TableCell>
                                                {item.batch_number || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {item.expiry_date
                                                    ? formatDate(item.expiry_date)
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                <PriceDisplay amount={item.total_price} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Supplier Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="size-5" />
                                Supplier
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {purchase.supplier ? (
                                <div className="space-y-2">
                                    <p className="font-medium">{purchase.supplier.name}</p>
                                    {purchase.supplier.contact_person && (
                                        <p className="text-sm text-muted-foreground">
                                            {purchase.supplier.contact_person}
                                        </p>
                                    )}
                                    {purchase.supplier.phone && (
                                        <p className="text-sm text-muted-foreground">
                                            {purchase.supplier.phone}
                                        </p>
                                    )}
                                    {purchase.supplier.email && (
                                        <p className="text-sm text-muted-foreground">
                                            {purchase.supplier.email}
                                        </p>
                                    )}
                                    {purchase.supplier.address && (
                                        <p className="text-sm text-muted-foreground">
                                            {purchase.supplier.address}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-muted-foreground">No supplier assigned</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">
                                    <PriceDisplay amount={purchase.subtotal} />
                                </span>
                            </div>
                            {purchase.tax > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tax</span>
                                    <span className="font-medium">
                                        <PriceDisplay amount={purchase.tax} />
                                    </span>
                                </div>
                            )}
                            {purchase.discount > 0 && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Discount</span>
                                    <span className="font-medium text-green-600">
                                        -<PriceDisplay amount={purchase.discount} />
                                    </span>
                                </div>
                            )}
                            <Separator />
                            <div className="flex justify-between text-lg font-bold">
                                <span>Total</span>
                                <span>
                                    <PriceDisplay amount={purchase.total_amount} />
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Receive Confirmation Dialog */}
            <Dialog open={receiveDialogOpen} onOpenChange={setReceiveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Receive Purchase</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to receive this purchase? This will update the
                            stock for all items.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReceiveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleReceive}>
                            <CheckCircle className="size-4 mr-2" />
                            Confirm Receive
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Cancel Confirmation Dialog */}
            <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cancel Purchase</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to cancel this purchase?
                            {purchase.status === 'received' && (
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
                        <Button variant="destructive" onClick={handleCancel}>
                            Yes, Cancel Purchase
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PharmacyLayout>
    );
}