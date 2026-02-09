import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Package,
    Truck,
    CheckCircle,
    AlertCircle,
    Save,
    ClipboardList,
    AlertTriangle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import type { Medicine, PurchaseOrder, PurchaseOrderItem, Supplier } from '@/types/pharmacy';

interface PurchaseOrderItemWithReceived extends PurchaseOrderItem {
    medicine: Medicine;
    received_quantity: number;
    batch_number?: string;
    expiry_date?: string;
}

interface PurchaseOrderWithDetails extends PurchaseOrder {
    items: PurchaseOrderItemWithReceived[];
    supplier: Supplier;
}

interface ReceiveProps {
    purchaseOrder: PurchaseOrderWithDetails;
}

interface ValidationError {
    po_item_id: number;
    field: 'received_quantity' | 'batch_number' | 'expiry_date';
    message: string;
}

interface ReceiveItem {
    po_item_id: number;
    medicine_id: number;
    name: string;
    ordered_quantity: number;
    previously_received: number;
    received_quantity: number;
    batch_number: string;
    expiry_date: string;
}

export default function Receive({ purchaseOrder }: ReceiveProps) {
    const [items, setItems] = useState<ReceiveItem[]>(
        purchaseOrder.items.map(item => ({
            po_item_id: item.id,
            medicine_id: item.medicine_id,
            name: item.medicine?.name || 'Unknown Medicine',
            ordered_quantity: item.quantity,
            previously_received: item.received_quantity || 0,
            received_quantity: 0,
            batch_number: item.batch_number || '',
            expiry_date: item.expiry_date || '',
        }))
    );

    // Validation state
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [showValidationSummary, setShowValidationSummary] = useState(false);

    const { data, setData, post, processing } = useForm({
        items: [] as ReceiveItem[],
        notes: '',
        received_date: new Date().toISOString().split('T')[0],
        mark_as_complete: false,
    });

    // Calculate totals
    const { totalOrdered, totalPreviouslyReceived, totalReceiving } = useMemo(() => {
        const ordered = items.reduce((sum, item) => sum + item.ordered_quantity, 0);
        const prevReceived = items.reduce((sum, item) => sum + item.previously_received, 0);
        const receiving = items.reduce((sum, item) => sum + item.received_quantity, 0);
        return { totalOrdered: ordered, totalPreviouslyReceived: prevReceived, totalReceiving: receiving };
    }, [items]);

    const totalAfterReceipt = totalPreviouslyReceived + totalReceiving;
    const isFullyReceived = totalAfterReceipt >= totalOrdered;
    const isPartiallyReceived = totalReceiving > 0 && !isFullyReceived;

    // Calculate progress percentage
    const receiveProgress = useMemo(() => {
        if (totalOrdered === 0) return 0;
        return Math.round((totalAfterReceipt / totalOrdered) * 100);
    }, [totalAfterReceipt, totalOrdered]);

    // Get items with warnings
    const itemsWithWarnings = useMemo(() => {
        return items.filter(item => {
            const remaining = item.ordered_quantity - item.previously_received;
            // Warning if receiving more than remaining
            if (item.received_quantity > remaining) return true;
            // Warning if batch number is missing when receiving
            if (item.received_quantity > 0 && !item.batch_number) return true;
            // Warning if expiry date is missing when receiving
            if (item.received_quantity > 0 && !item.expiry_date) return true;
            return false;
        });
    }, [items]);

    // Update received quantity
    const handleUpdateReceivedQuantity = (poItemId: number, quantity: number) => {
        const item = items.find(i => i.po_item_id === poItemId);
        if (!item) return;

        const maxReceivable = item.ordered_quantity - item.previously_received;
        const validQuantity = Math.max(0, Math.min(quantity, maxReceivable));

        setItems(prev =>
            prev.map(i =>
                i.po_item_id === poItemId
                    ? { ...i, received_quantity: validQuantity }
                    : i
            )
        );
    };

    // Update batch number
    const handleUpdateBatchNumber = (poItemId: number, batchNumber: string) => {
        setItems(prev =>
            prev.map(i =>
                i.po_item_id === poItemId
                    ? { ...i, batch_number: batchNumber }
                    : i
            )
        );
    };

    // Update expiry date
    const handleUpdateExpiryDate = (poItemId: number, expiryDate: string) => {
        setItems(prev =>
            prev.map(i =>
                i.po_item_id === poItemId
                    ? { ...i, expiry_date: expiryDate }
                    : i
            )
        );
    };

    // Validate item before submission
    const validateItem = (item: ReceiveItem): ValidationError[] => {
        const errors: ValidationError[] = [];
        const remaining = item.ordered_quantity - item.previously_received;

        if (item.received_quantity < 0) {
            errors.push({
                po_item_id: item.po_item_id,
                field: 'received_quantity',
                message: 'Received quantity cannot be negative'
            });
        }

        if (item.received_quantity > remaining) {
            errors.push({
                po_item_id: item.po_item_id,
                field: 'received_quantity',
                message: `Cannot receive more than ${remaining} units`
            });
        }

        if (item.received_quantity > 0 && !item.batch_number.trim()) {
            errors.push({
                po_item_id: item.po_item_id,
                field: 'batch_number',
                message: 'Batch number is required when receiving items'
            });
        }

        if (item.received_quantity > 0 && !item.expiry_date) {
            errors.push({
                po_item_id: item.po_item_id,
                field: 'expiry_date',
                message: 'Expiry date is required when receiving items'
            });
        }

        if (item.expiry_date) {
            const expiry = new Date(item.expiry_date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (expiry < today) {
                errors.push({
                    po_item_id: item.po_item_id,
                    field: 'expiry_date',
                    message: 'Expiry date cannot be in the past'
                });
            }
        }

        return errors;
    };

    // Get item validation errors
    const getItemErrors = (poItemId: number): ValidationError[] => {
        return validationErrors.filter(e => e.po_item_id === poItemId);
    };

    // Quick fill all remaining quantities
    const handleReceiveAll = () => {
        setItems(prev =>
            prev.map(item => {
                const remaining = item.ordered_quantity - item.previously_received;
                return {
                    ...item,
                    received_quantity: remaining
                };
            })
        );
    };

    // Clear all received quantities
    const handleClearAll = () => {
        setItems(prev =>
            prev.map(item => ({
                ...item,
                received_quantity: 0,
                batch_number: '',
                expiry_date: ''
            }))
        );
        setValidationErrors([]);
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent, _markAsFullyReceived: boolean = false) => {
        e.preventDefault();

        // Filter out items with 0 received quantity
        const itemsToSubmit = items.filter(item => item.received_quantity > 0);

        if (itemsToSubmit.length === 0) {
            alert('Please enter at least one received quantity');
            return;
        }

        // Validate all items being submitted
        const allErrors: ValidationError[] = [];
        itemsToSubmit.forEach(item => {
            const itemErrors = validateItem(item);
            allErrors.push(...itemErrors);
        });

        if (allErrors.length > 0) {
            setValidationErrors(allErrors);
            setShowValidationSummary(true);
            // Scroll to first error
            const firstError = document.querySelector('[data-error="true"]');
            firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        setValidationErrors([]);
        setShowValidationSummary(false);

        // Set form data with items and completion flag
        setData('items', itemsToSubmit);
        setData('mark_as_complete', _markAsFullyReceived);

        post(`/pharmacy/purchase-orders/${purchaseOrder.id}/receive`, {
            onSuccess: () => {
                // Success handled by redirect
            },
        });
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const canReceive = ['sent', 'partial'].includes(purchaseOrder.status);

    if (!canReceive) {
        return (
            <PharmacyLayout>
                <div className="space-y-6">
                    <Head title="Receive Items" />
                    <Card className="py-12">
                        <CardContent className="text-center">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h2 className="text-xl font-semibold mb-2">Cannot Receive Items</h2>
                            <p className="text-muted-foreground mb-4">
                                This purchase order cannot receive items because it is in "{purchaseOrder.status}" status.
                            </p>
                            <Link href="/pharmacy/purchase-orders">
                                <Button>Back to Orders</Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </PharmacyLayout>
        );
    }

    return (
        <PharmacyLayout>
            <div className="space-y-6">
                <Head title="Receive Items" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Receive Items" />
                        <p className="text-muted-foreground mt-1">
                            Receive items from purchase order #{purchaseOrder.po_number}
                        </p>
                    </div>

                    <Link href="/pharmacy/purchase-orders">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Button>
                    </Link>
                </div>

                {/* Validation Summary Alert */}
                {showValidationSummary && validationErrors.length > 0 && (
                    <Card className="border-red-200 bg-red-50">
                        <CardHeader className="pb-2">
                            <CardTitle className="flex items-center gap-2 text-red-700 text-base">
                                <AlertTriangle className="h-5 w-5" />
                                Please fix the following errors before submitting
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                                {validationErrors.map((error, index) => (
                                    <li key={index}>
                                        {items.find(i => i.po_item_id === error.po_item_id)?.name}: {error.message}
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                )}

                {/* Supplier Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Truck className="h-5 w-5" />
                            Supplier Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Supplier</p>
                                <p className="font-medium">{purchaseOrder.supplier.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Order Date</p>
                                <p className="font-medium">{formatDate(purchaseOrder.order_date)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Expected Delivery</p>
                                <p className="font-medium">{formatDate(purchaseOrder.expected_delivery)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Progress Card */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <ClipboardList className="h-5 w-5" />
                            Receipt Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Completion</span>
                                <span className="font-medium">{receiveProgress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2.5">
                                <div
                                    className={cn(
                                        "h-2.5 rounded-full transition-all duration-500",
                                        receiveProgress === 100 ? "bg-green-500" :
                                        receiveProgress >= 75 ? "bg-blue-500" :
                                        receiveProgress >= 50 ? "bg-amber-500" : "bg-gray-400"
                                    )}
                                    style={{ width: `${receiveProgress}%` }}
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {isFullyReceived && (
                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Fully Received
                                    </Badge>
                                )}
                                {isPartiallyReceived && (
                                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                        <AlertCircle className="h-3 w-3 mr-1" />
                                        Partial Receipt
                                    </Badge>
                                )}
                                {itemsWithWarnings.length > 0 && (
                                    <Badge variant="destructive">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {itemsWithWarnings.length} Warning{itemsWithWarnings.length > 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <form onSubmit={(e) => handleSubmit(e, false)}>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Items to Receive
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleReceiveAll}
                                    disabled={processing}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Receive All
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleClearAll}
                                    disabled={processing || totalReceiving === 0}
                                >
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b bg-muted/50">
                                            <th className="text-left p-3 text-sm font-medium">Medicine</th>
                                            <th className="text-center p-3 text-sm font-medium">Ordered</th>
                                            <th className="text-center p-3 text-sm font-medium">Previously Received</th>
                                            <th className="text-center p-3 text-sm font-medium w-32">Receive Now</th>
                                            <th className="text-left p-3 text-sm font-medium w-40">Batch #</th>
                                            <th className="text-left p-3 text-sm font-medium w-40">Expiry Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => {
                                            const remaining = item.ordered_quantity - item.previously_received;
                                            const itemErrors = getItemErrors(item.po_item_id);
                                            const hasErrors = itemErrors.length > 0;

                                            return (
                                                <tr
                                                    key={item.po_item_id}
                                                    className={cn(
                                                        "border-b last:border-0",
                                                        hasErrors && "bg-red-50/50"
                                                    )}
                                                    data-error={hasErrors}
                                                >
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <Package className="h-4 w-4 text-primary" />
                                                            </div>
                                                            <div>
                                                                <span className="font-medium text-sm">{item.name}</span>
                                                                {hasErrors && (
                                                                    <p className="text-xs text-red-600 mt-0.5">
                                                                        {itemErrors[0].message}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="font-medium">{item.ordered_quantity}</span>
                                                    </td>
                                                    <td className="p-3 text-center">
                                                        <span className="text-muted-foreground">{item.previously_received}</span>
                                                    </td>
                                                    <td className="p-3">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                max={remaining}
                                                                value={item.received_quantity}
                                                                onChange={(e) => handleUpdateReceivedQuantity(item.po_item_id, parseInt(e.target.value) || 0)}
                                                                className={cn(
                                                                    "w-24 text-center",
                                                                    item.received_quantity > 0 && item.received_quantity === remaining && "border-green-500 text-green-600",
                                                                    item.received_quantity > 0 && item.received_quantity < remaining && "border-amber-500 text-amber-600",
                                                                    hasErrors && "border-red-500 focus-visible:ring-red-500"
                                                                )}
                                                            />
                                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                                / {remaining} remaining
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-3">
                                                        <Input
                                                            type="text"
                                                            value={item.batch_number}
                                                            onChange={(e) => handleUpdateBatchNumber(item.po_item_id, e.target.value)}
                                                            placeholder="Batch #"
                                                            className={cn(
                                                                "w-full",
                                                                hasErrors && itemErrors.some(e => e.field === 'batch_number') && "border-red-500 focus-visible:ring-red-500"
                                                            )}
                                                            disabled={item.received_quantity === 0}
                                                        />
                                                    </td>
                                                    <td className="p-3">
                                                        <Input
                                                            type="date"
                                                            value={item.expiry_date}
                                                            onChange={(e) => handleUpdateExpiryDate(item.po_item_id, e.target.value)}
                                                            className={cn(
                                                                "w-full",
                                                                hasErrors && itemErrors.some(e => e.field === 'expiry_date') && "border-red-500 focus-visible:ring-red-500"
                                                            )}
                                                            disabled={item.received_quantity === 0}
                                                            min={new Date().toISOString().split('T')[0]}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card className="mt-6">
                        <CardHeader>
                            <CardTitle>Receipt Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <p className="text-sm text-muted-foreground">Total Ordered</p>
                                    <p className="text-2xl font-bold">{totalOrdered}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-muted/50">
                                    <p className="text-sm text-muted-foreground">Previously Received</p>
                                    <p className="text-2xl font-bold text-muted-foreground">{totalPreviouslyReceived}</p>
                                </div>
                                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                                    <p className="text-sm text-muted-foreground">Receiving Now</p>
                                    <p className={cn(
                                        "text-2xl font-bold",
                                        totalReceiving > 0 ? "text-primary" : "text-muted-foreground"
                                    )}>
                                        {totalReceiving}
                                    </p>
                                </div>
                                <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                    <p className="text-sm text-muted-foreground">Total After Receipt</p>
                                    <p className={cn(
                                        "text-2xl font-bold",
                                        isFullyReceived ? "text-green-600" : "text-amber-600"
                                    )}>
                                        {totalAfterReceipt}
                                    </p>
                                    {isFullyReceived && (
                                        <p className="text-xs text-green-600 mt-1">Fully Received!</p>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Received Date */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="received_date">Received Date</Label>
                                    <Input
                                        id="received_date"
                                        type="date"
                                        value={data.received_date}
                                        onChange={(e) => setData('received_date', e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <Label htmlFor="notes">Receipt Notes</Label>
                                <textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Add any notes about this receipt..."
                                    className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between">
                            <Link href="/pharmacy/purchase-orders">
                                <Button variant="outline" type="button">
                                    Cancel
                                </Button>
                            </Link>
                            <div className="flex gap-2">
                                <Button
                                    type="submit"
                                    variant="outline"
                                    disabled={processing || totalReceiving === 0}
                                    onClick={(e) => handleSubmit(e, false)}
                                >
                                    <Save className="mr-2 h-4 w-4" />
                                    Save as Partial
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || totalReceiving === 0}
                                    onClick={(e) => handleSubmit(e, true)}
                                    className={cn(
                                        isFullyReceived && "bg-green-600 hover:bg-green-700"
                                    )}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    {isFullyReceived ? 'Complete Receipt' : 'Save Receipt'}
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </PharmacyLayout>
    );
}
