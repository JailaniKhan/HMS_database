import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PriceDisplay } from '@/components/pharmacy';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Printer,
    Edit,
    CheckCircle,
    Truck,
    Package,
    FileText,
    Clock,
    AlertCircle,
    XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import type { Medicine, PurchaseOrder, PurchaseOrderItem, Supplier } from '@/types/pharmacy';

interface PurchaseOrderWithDetails extends PurchaseOrder {
    items: (PurchaseOrderItem & {
        medicine: Medicine;
        received_quantity?: number;
    })[];
    supplier: Supplier;
    user: {
        id: number;
        name: string;
    };
}

interface PurchaseOrderShowProps {
    purchaseOrder: PurchaseOrderWithDetails;
}

export default function PurchaseOrderShow({ purchaseOrder }: PurchaseOrderShowProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
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

    const canEdit = ['draft'].includes(purchaseOrder.status);
    const canReceive = ['sent', 'partial'].includes(purchaseOrder.status);
    const canCancel = ['draft', 'sent', 'partial'].includes(purchaseOrder.status);

    const handleStatusChange = (newStatus: string) => {
        if (confirm(`Are you sure you want to change the status to ${newStatus}?`)) {
            router.post(`/pharmacy/purchase-orders/${purchaseOrder.id}/status`, {
                status: newStatus,
            });
        }
    };

    const handleCancel = () => {
        if (confirm('Are you sure you want to cancel this purchase order?')) {
            router.post(`/pharmacy/purchase-orders/${purchaseOrder.id}/status`, {
                status: 'cancelled',
            });
        }
    };

    const totalReceived = purchaseOrder.items.reduce((sum, item) => sum + (item.received_quantity || 0), 0);
    const totalOrdered = purchaseOrder.items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <PharmacyLayout>
            <div className="space-y-6">
                <Head title={`Purchase Order ${purchaseOrder.po_number}`} />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <Heading title={`Purchase Order ${purchaseOrder.po_number}`} />
                            {getStatusBadge(purchaseOrder.status)}
                        </div>
                        <p className="text-muted-foreground mt-1">
                            View and manage purchase order details
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Link href={`/pharmacy/purchase-orders/${purchaseOrder.id}/print`} target="_blank">
                            <Button variant="outline">
                                <Printer className="mr-2 h-4 w-4" />
                                Print
                            </Button>
                        </Link>
                        {canEdit && (
                            <Link href={`/pharmacy/purchase-orders/${purchaseOrder.id}/edit`}>
                                <Button variant="outline">
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                        )}
                        {canReceive && (
                            <Link href={`/pharmacy/purchase-orders/${purchaseOrder.id}/receive`}>
                                <Button className="bg-green-600 hover:bg-green-700">
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Receive Items
                                </Button>
                            </Link>
                        )}
                        {canCancel && (
                            <Button variant="destructive" onClick={handleCancel}>
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel
                            </Button>
                        )}
                        <Link href="/pharmacy/purchase-orders">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Supplier Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Truck className="h-5 w-5" />
                                    Supplier Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Supplier Name</p>
                                        <p className="font-medium">{purchaseOrder.supplier.name}</p>
                                    </div>
                                    {purchaseOrder.supplier.contact_person && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Contact Person</p>
                                            <p className="font-medium">{purchaseOrder.supplier.contact_person}</p>
                                        </div>
                                    )}
                                    {purchaseOrder.supplier.phone && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Phone</p>
                                            <p className="font-medium">{purchaseOrder.supplier.phone}</p>
                                        </div>
                                    )}
                                    {purchaseOrder.supplier.email && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Email</p>
                                            <p className="font-medium">{purchaseOrder.supplier.email}</p>
                                        </div>
                                    )}
                                    {purchaseOrder.supplier.address && (
                                        <div className="sm:col-span-2">
                                            <p className="text-sm text-muted-foreground">Address</p>
                                            <p className="font-medium">{purchaseOrder.supplier.address}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Items */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Order Items
                                    <Badge variant="secondary">{purchaseOrder.items.length} items</Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="rounded-md border">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b bg-muted/50">
                                                <th className="text-left p-3 text-sm font-medium">Medicine</th>
                                                <th className="text-center p-3 text-sm font-medium">Ordered</th>
                                                <th className="text-center p-3 text-sm font-medium">Received</th>
                                                <th className="text-right p-3 text-sm font-medium">Unit Cost</th>
                                                <th className="text-right p-3 text-sm font-medium">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {purchaseOrder.items.map((item) => (
                                                <tr key={item.id} className="border-b last:border-0">
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <Package className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{item.medicine?.name || 'Unknown Medicine'}</p>
                                                                <p className="text-xs text-muted-foreground">{item.medicine?.medicine_id || ''}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="font-medium">{item.quantity}</span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className={cn(
                                                            'font-medium',
                                                            (item.received_quantity || 0) < item.quantity && 'text-amber-600'
                                                        )}>
                                                            {item.received_quantity || 0}
                                                        </span>
                                                        {(item.received_quantity || 0) < item.quantity && purchaseOrder.status !== 'cancelled' && (
                                                            <span className="text-xs text-muted-foreground ml-1">
                                                                ({item.quantity - (item.received_quantity || 0)} pending)
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <PriceDisplay amount={item.unit_price} size="sm" />
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <PriceDisplay amount={item.total_price} size="sm" />
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-muted/50">
                                            <tr>
                                                <td colSpan={4} className="p-3 text-right font-semibold">
                                                    Total Amount:
                                                </td>
                                                <td className="p-3 text-right">
                                                    <PriceDisplay amount={purchaseOrder.total_amount} size="md" variant="total" />
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        {purchaseOrder.notes && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Notes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm whitespace-pre-wrap">{purchaseOrder.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Order Summary */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Order Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Order Date</span>
                                    <span className="font-medium">{formatDate(purchaseOrder.order_date)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Expected Delivery</span>
                                    <span className={cn(
                                        'font-medium',
                                        purchaseOrder.expected_delivery && new Date(purchaseOrder.expected_delivery) < new Date() && purchaseOrder.status !== 'received' && purchaseOrder.status !== 'cancelled'
                                            ? 'text-red-600'
                                            : ''
                                    )}>
                                        {formatDate(purchaseOrder.expected_delivery)}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Items</span>
                                    <span className="font-medium">{totalOrdered}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Received</span>
                                    <span className={cn(
                                        'font-medium',
                                        totalReceived < totalOrdered && 'text-amber-600'
                                    )}>
                                        {totalReceived}
                                    </span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total Amount</span>
                                    <PriceDisplay amount={purchaseOrder.total_amount} size="lg" variant="total" />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Order Timeline */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Order Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                                <CheckCircle className="h-4 w-4 text-green-600" />
                                            </div>
                                            <div className="w-0.5 h-full bg-border mt-1" />
                                        </div>
                                        <div className="pb-4">
                                            <p className="font-medium text-sm">Order Created</p>
                                            <p className="text-xs text-muted-foreground">{formatDate(purchaseOrder.created_at)}</p>
                                            <p className="text-xs text-muted-foreground">by {purchaseOrder.user?.name || 'Unknown'}</p>
                                        </div>
                                    </div>

                                    {purchaseOrder.status !== 'draft' && purchaseOrder.status !== 'cancelled' && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                    <CheckCircle className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="w-0.5 h-full bg-border mt-1" />
                                            </div>
                                            <div className="pb-4">
                                                <p className="font-medium text-sm">Order Approved</p>
                                                <p className="text-xs text-muted-foreground">Status changed to approved</p>
                                            </div>
                                        </div>
                                    )}

                                    {(purchaseOrder.status === 'sent' || purchaseOrder.status === 'partial' || purchaseOrder.status === 'received') && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                    <Truck className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div className="w-0.5 h-full bg-border mt-1" />
                                            </div>
                                            <div className="pb-4">
                                                <p className="font-medium text-sm">Order Placed</p>
                                                <p className="text-xs text-muted-foreground">Sent to supplier</p>
                                            </div>
                                        </div>
                                    )}

                                    {(purchaseOrder.status === 'partial' || purchaseOrder.status === 'received') && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                                                    <Package className="h-4 w-4 text-amber-600" />
                                                </div>
                                                <div className="w-0.5 h-full bg-border mt-1" />
                                            </div>
                                            <div className="pb-4">
                                                <p className="font-medium text-sm">
                                                    {purchaseOrder.status === 'received' ? 'Fully Received' : 'Partially Received'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {totalReceived} of {totalOrdered} items received
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {purchaseOrder.status === 'cancelled' && (
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <div className="h-8 w-8 rounded-full bg-red-500/20 flex items-center justify-center">
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">Order Cancelled</p>
                                                <p className="text-xs text-muted-foreground">This order has been cancelled</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Status Actions */}
                        {purchaseOrder.status === 'draft' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button
                                        className="w-full"
                                        onClick={() => handleStatusChange('sent')}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Send to Supplier
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {purchaseOrder.status === 'sent' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Button
                                        className="w-full"
                                        onClick={() => handleStatusChange('partial')}
                                    >
                                        <Truck className="mr-2 h-4 w-4" />
                                        Mark as Partial
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleStatusChange('received')}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark as Received
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {purchaseOrder.status === 'partial' && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <Link href={`/pharmacy/purchase-orders/${purchaseOrder.id}/receive`}>
                                        <Button className="w-full">
                                            <Package className="mr-2 h-4 w-4" />
                                            Receive More Items
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => handleStatusChange('received')}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Mark Fully Received
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </PharmacyLayout>
    );
}
