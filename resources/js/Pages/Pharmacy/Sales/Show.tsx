import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { PriceDisplay, TotalPrice } from '@/components/pharmacy';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Printer,
    Ban,
    Receipt,
    User,
    Currency,
    ShoppingCart,
    CreditCard,
    Wallet,
    Landmark,
    FileText,
    Clock,
    Package,
    CheckCircle,
    XCircle,
    RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import type { Sale, SalesItem } from '@/types/pharmacy';

interface SaleWithDetails extends Sale {
    patient: {
        id: number;
        patient_id: string;
        first_name: string;
        last_name: string;
        phone?: string;
        email?: string;
    } | null;
    user: {
        id: number;
        name: string;
    };
    items: SalesItem[];
    payment_status?: string;
}

interface SaleShowProps {
    sale: SaleWithDetails;
    timeline?: {
        id: number;
        action: string;
        description: string;
        created_at: string;
        user?: {
            name: string;
        };
    }[];
}

export default function SaleShow({ sale, timeline = [] }: SaleShowProps) {
    const [voidDialogOpen, setVoidDialogOpen] = useState(false);
    const [voidReason, setVoidReason] = useState('');
    const [isVoiding, setIsVoiding] = useState(false);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
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
                return <Wallet className="h-5 w-5" />;
            case 'card':
                return <CreditCard className="h-5 w-5" />;
            case 'insurance':
                return <Landmark className="h-5 w-5" />;
            default:
                return <Currency className="h-5 w-5" />;
        }
    };

    const handleVoid = () => {
        if (!voidReason.trim()) return;
        
        setIsVoiding(true);
        router.post(`/pharmacy/sales/${sale.id}/void`, {
            reason: voidReason,
        }, {
            onSuccess: () => {
                setVoidDialogOpen(false);
                setVoidReason('');
                setIsVoiding(false);
            },
            onError: () => {
                setIsVoiding(false);
            },
        });
    };

    const handlePrintReceipt = () => {
        window.open(`/pharmacy/sales/${sale.id}/receipt`, '_blank');
    };

    const canVoid = sale.status !== 'cancelled' && sale.status !== 'refunded';

    return (
        <PharmacyLayout>
            <div className="space-y-6">
                <Head title={`Sale ${sale.sale_id}`} />
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <Link href="/pharmacy/sales">
                            <Button variant="outline" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <Heading title={`Sale ${sale.sale_id}`} />
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant={getStatusBadgeVariant(sale.status)}>
                                    {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                </Badge>
                                <span className="text-muted-foreground text-sm">
                                    {formatDate(sale.created_at)}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrintReceipt}>
                            <Printer className="mr-2 h-4 w-4" />
                            Print Receipt
                        </Button>
                        {canVoid && (
                            <Dialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="destructive">
                                        <Ban className="mr-2 h-4 w-4" />
                                        Void Sale
                                    </Button>
                                </DialogTrigger>
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
                                            disabled={!voidReason.trim() || isVoiding}
                                        >
                                            {isVoiding ? 'Voiding...' : 'Void Sale'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - Sale Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Tabs defaultValue="items" className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="items">Items</TabsTrigger>
                                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                                <TabsTrigger value="notes">Notes</TabsTrigger>
                            </TabsList>

                            {/* Items Tab */}
                            <TabsContent value="items">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ShoppingCart className="h-5 w-5" />
                                            Sale Items
                                        </CardTitle>
                                        <CardDescription>
                                            {sale.items?.length || 0} items in this sale
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="rounded-md border">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b bg-muted/50">
                                                        <th className="px-4 py-3 text-left text-sm font-medium">Item</th>
                                                        <th className="px-4 py-3 text-center text-sm font-medium">Qty</th>
                                                        <th className="px-4 py-3 text-right text-sm font-medium">Unit Price</th>
                                                        <th className="px-4 py-3 text-right text-sm font-medium">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {sale.items?.map((item) => (
                                                        <tr key={item.id}>
                                                            <td className="px-4 py-3">
                                                                <div>
                                                                    <p className="font-medium">{item.medicine?.name || 'Unknown Medicine'}</p>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {item.medicine?.medicine_id}
                                                                    </p>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                {item.quantity}
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                {formatCurrency(item.unit_price)}
                                                            </td>
                                                            <td className="px-4 py-3 text-right font-medium">
                                                                {formatCurrency(item.total_price)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Timeline Tab */}
                            <TabsContent value="timeline">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Clock className="h-5 w-5" />
                                            Sale Timeline
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            {/* Sale Created */}
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Receipt className="h-4 w-4 text-primary" />
                                                    </div>
                                                    <div className="h-full w-px bg-border mt-2" />
                                                </div>
                                                <div className="pb-6">
                                                    <p className="font-medium">Sale Created</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatDate(sale.created_at)}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        By {sale.user?.name}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Additional Timeline Events */}
                                            {timeline.map((event, index) => (
                                                <div key={event.id} className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className={cn(
                                                            "h-8 w-8 rounded-full flex items-center justify-center",
                                                            event.action.includes('Void') ? 'bg-red-100' : 'bg-primary/10'
                                                        )}>
                                                            {event.action.includes('Void') ? (
                                                                <XCircle className="h-4 w-4 text-red-600" />
                                                            ) : event.action.includes('Complete') ? (
                                                                <CheckCircle className="h-4 w-4 text-primary" />
                                                            ) : (
                                                                <Clock className="h-4 w-4 text-primary" />
                                                            )}
                                                        </div>
                                                        {index < timeline.length - 1 && (
                                                            <div className="h-full w-px bg-border mt-2" />
                                                        )}
                                                    </div>
                                                    <div className={cn("pb-6", index === timeline.length - 1 && "pb-0")}>
                                                        <p className="font-medium">{event.action}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDate(event.created_at)}
                                                        </p>
                                                        {event.user && (
                                                            <p className="text-sm text-muted-foreground">
                                                                By {event.user.name}
                                                            </p>
                                                        )}
                                                        {event.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {event.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}

                                            {/* Current Status */}
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center",
                                                        sale.status === 'cancelled' ? 'bg-red-100' :
                                                        sale.status === 'completed' ? 'bg-green-100' :
                                                        'bg-amber-100'
                                                    )}>
                                                        {sale.status === 'cancelled' ? (
                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                        ) : sale.status === 'completed' ? (
                                                            <CheckCircle className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <Clock className="h-4 w-4 text-amber-600" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-medium">
                                                        Status: {sale.status.charAt(0).toUpperCase() + sale.status.slice(1)}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Last updated {formatDate(sale.updated_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            {/* Notes Tab */}
                            <TabsContent value="notes">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <FileText className="h-5 w-5" />
                                            Notes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {sale.notes ? (
                                            <div className="p-4 rounded-lg bg-muted/50">
                                                <p className="whitespace-pre-wrap">{sale.notes}</p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8 text-muted-foreground">
                                                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                                <p>No notes for this sale</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Column - Summary */}
                    <div className="space-y-6">
                        {/* Customer Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {sale.patient ? (
                                    <div className="space-y-3">
                                        <div>
                                            <p className="font-medium text-lg">
                                                {sale.patient.first_name} {sale.patient.last_name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {sale.patient.patient_id}
                                            </p>
                                        </div>
                                        {sale.patient.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Phone:</span>
                                                <span>{sale.patient.phone}</span>
                                            </div>
                                        )}
                                        {sale.patient.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="text-muted-foreground">Email:</span>
                                                <span>{sale.patient.email}</span>
                                            </div>
                                        )}
                                        <Separator />
                                        <Link href={`/patients/${sale.patient.id}`}>
                                            <Button variant="outline" className="w-full">
                                                View Patient Profile
                                            </Button>
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-muted-foreground">
                                        <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Walk-in Customer</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        {getPaymentMethodIcon(sale.payment_method)}
                                        <span className="capitalize font-medium">{sale.payment_method}</span>
                                    </div>
                                    <Badge variant="outline">
                                        {sale.payment_status || 'Paid'}
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <PriceDisplay amount={sale.total_amount} size="sm" />
                                    </div>
                                    {sale.discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Discount</span>
                                            <span className="text-emerald-600">-{formatCurrency(sale.discount)}</span>
                                        </div>
                                    )}
                                    {sale.tax > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Tax</span>
                                            <PriceDisplay amount={sale.tax} size="sm" />
                                        </div>
                                    )}
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Total</span>
                                        <TotalPrice amount={sale.grand_total || sale.total_amount} size="lg" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Sale Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5" />
                                    Sale Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Invoice Number</span>
                                    <span className="font-medium">{sale.sale_id}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Created By</span>
                                    <span>{sale.user?.name}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Date</span>
                                    <span>{formatDate(sale.created_at)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Items</span>
                                    <span>{sale.items?.length || 0}</span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardContent className="pt-6 space-y-3">
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={handlePrintReceipt}
                                >
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Receipt
                                </Button>
                                {canVoid && (
                                    <Button 
                                        variant="outline" 
                                        className="w-full text-destructive hover:text-destructive"
                                        onClick={() => setVoidDialogOpen(true)}
                                    >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Void Sale
                                    </Button>
                                )}
                                <Link href="/pharmacy/sales/create">
                                    <Button className="w-full">
                                        <RotateCcw className="mr-2 h-4 w-4" />
                                        New Sale
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </PharmacyLayout>
    );
}
