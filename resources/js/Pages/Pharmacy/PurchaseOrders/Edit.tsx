import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MedicineSearch, PriceDisplay } from '@/components/pharmacy';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Trash2,
    Package,
    Truck,
    Save,
    Calculator,
    AlertCircle,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import type { Medicine, Supplier, PurchaseOrder, PurchaseOrderItem } from '@/types/pharmacy';

interface PurchaseOrderItemForm {
    id?: number;
    medicine_id: number;
    name: string;
    quantity: number;
    unit_cost: number;
    total: number;
}

interface PurchaseOrderEditProps {
    purchaseOrder: PurchaseOrder & {
        items: (PurchaseOrderItem & {
            medicine: Medicine;
        })[];
    };
    suppliers: Supplier[];
    medicines: Medicine[];
}

export default function PurchaseOrderEdit({ purchaseOrder, suppliers, medicines }: PurchaseOrderEditProps) {
    const [items, setItems] = useState<PurchaseOrderItemForm[]>(
        purchaseOrder.items.map(item => ({
            id: item.id,
            medicine_id: item.medicine_id,
            name: item.medicine?.name || 'Unknown Medicine',
            quantity: item.quantity,
            unit_cost: item.unit_price,
            total: item.total_price,
        }))
    );

    const { data, setData, put, processing, errors } = useForm({
        supplier_id: purchaseOrder.supplier_id.toString(),
        order_date: purchaseOrder.order_date,
        expected_delivery_date: purchaseOrder.expected_delivery || '',
        notes: purchaseOrder.notes || '',
        items: [] as PurchaseOrderItemForm[],
    });

    // Calculate totals
    const { subtotal, totalItems } = useMemo(() => {
        const sub = items.reduce((sum, item) => sum + item.total, 0);
        const count = items.reduce((sum, item) => sum + item.quantity, 0);
        return { subtotal: sub, totalItems: count };
    }, [items]);

    // Add item to PO
    const handleAddItem = useCallback((medicine: Medicine) => {
        setItems(prev => {
            const existing = prev.find(item => item.medicine_id === medicine.id);
            if (existing) {
                return prev.map(item =>
                    item.medicine_id === medicine.id
                        ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_cost }
                        : item
                );
            }
            return [...prev, {
                medicine_id: medicine.id,
                name: medicine.name,
                quantity: 1,
                unit_cost: medicine.unit_price || 0,
                total: medicine.unit_price || 0,
            }];
        });
    }, []);

    // Update item quantity
    const handleUpdateQuantity = useCallback((medicineId: number, quantity: number) => {
        setItems(prev =>
            prev.map(item =>
                item.medicine_id === medicineId
                    ? { ...item, quantity: Math.max(1, quantity), total: Math.max(1, quantity) * item.unit_cost }
                    : item
            )
        );
    }, []);

    // Update item unit cost
    const handleUpdateUnitCost = useCallback((medicineId: number, unitCost: number) => {
        setItems(prev =>
            prev.map(item =>
                item.medicine_id === medicineId
                    ? { ...item, unit_cost: unitCost, total: item.quantity * unitCost }
                    : item
            )
        );
    }, []);

    // Remove item
    const handleRemoveItem = useCallback((medicineId: number) => {
        setItems(prev => prev.filter(item => item.medicine_id !== medicineId));
    }, []);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setData('items', items);

        put(`/pharmacy/purchase-orders/${purchaseOrder.id}`, {
            onSuccess: () => {
                // Success handled by redirect
            },
        });
    };

    const canEdit = ['draft'].includes(purchaseOrder.status);

    if (!canEdit) {
        return (
            <PharmacyLayout>
                <div className="space-y-6">
                    <Head title="Edit Purchase Order" />
                    <Card className="py-12">
                        <CardContent className="text-center">
                            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                            <h2 className="text-xl font-semibold mb-2">Cannot Edit Purchase Order</h2>
                            <p className="text-muted-foreground mb-4">
                                This purchase order cannot be edited because it is in "{purchaseOrder.status}" status.
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
                <Head title="Edit Purchase Order" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Edit Purchase Order" />
                        <p className="text-muted-foreground mt-1">
                            Edit purchase order #{purchaseOrder.po_number}
                        </p>
                    </div>

                    <Link href="/pharmacy/purchase-orders">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Orders
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Order Details */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Supplier & Dates */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Truck className="h-5 w-5" />
                                        Order Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Supplier Selection */}
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier">Supplier *</Label>
                                        <Select
                                            value={data.supplier_id}
                                            onValueChange={(value) => setData('supplier_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a supplier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map((supplier) => (
                                                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                                                        <div className="flex flex-col">
                                                            <span>{supplier.name}</span>
                                                            {supplier.contact_person && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    Contact: {supplier.contact_person}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.supplier_id && (
                                            <p className="text-sm text-destructive">{errors.supplier_id}</p>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {/* Order Date */}
                                        <div className="space-y-2">
                                            <Label htmlFor="order_date">Order Date *</Label>
                                            <Input
                                                id="order_date"
                                                type="date"
                                                value={data.order_date}
                                                onChange={(e) => setData('order_date', e.target.value)}
                                            />
                                            {errors.order_date && (
                                                <p className="text-sm text-destructive">{errors.order_date}</p>
                                            )}
                                        </div>

                                        {/* Expected Delivery Date */}
                                        <div className="space-y-2">
                                            <Label htmlFor="expected_delivery_date">Expected Delivery Date *</Label>
                                            <Input
                                                id="expected_delivery_date"
                                                type="date"
                                                value={data.expected_delivery_date}
                                                onChange={(e) => setData('expected_delivery_date', e.target.value)}
                                                min={data.order_date}
                                            />
                                            {errors.expected_delivery_date && (
                                                <p className="text-sm text-destructive">{errors.expected_delivery_date}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    <div className="space-y-2">
                                        <Label htmlFor="notes">Notes</Label>
                                        <Textarea
                                            id="notes"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Add any notes about this purchase order..."
                                            rows={3}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Items Section */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Order Items
                                        {items.length > 0 && (
                                            <Badge variant="secondary">{items.length} items</Badge>
                                        )}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Medicine Search */}
                                    <MedicineSearch
                                        medicines={medicines}
                                        onSelect={handleAddItem}
                                        placeholder="Search and add medicines to the order..."
                                        showStock={true}
                                        showPrice={false}
                                        filterByStock={false}
                                    />

                                    {/* Items Table */}
                                    {items.length > 0 ? (
                                        <div className="rounded-md border">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b bg-muted/50">
                                                        <th className="text-left p-3 text-sm font-medium">Medicine</th>
                                                        <th className="text-center p-3 text-sm font-medium w-32">Quantity</th>
                                                        <th className="text-right p-3 text-sm font-medium w-32">Unit Cost</th>
                                                        <th className="text-right p-3 text-sm font-medium w-32">Total</th>
                                                        <th className="text-center p-3 text-sm font-medium w-16">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {items.map((item) => (
                                                        <tr key={item.medicine_id} className="border-b last:border-0">
                                                            <td className="p-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                        <Package className="h-4 w-4 text-primary" />
                                                                    </div>
                                                                    <span className="font-medium text-sm">{item.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="p-3">
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleUpdateQuantity(item.medicine_id, parseInt(e.target.value) || 1)}
                                                                    className="w-24 text-center"
                                                                />
                                                            </td>
                                                            <td className="p-3">
                                                                <Input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.unit_cost}
                                                                    onChange={(e) => handleUpdateUnitCost(item.medicine_id, parseFloat(e.target.value) || 0)}
                                                                    className="w-28 text-right"
                                                                />
                                                            </td>
                                                            <td className="p-3 text-right">
                                                                <PriceDisplay amount={item.total} size="sm" />
                                                            </td>
                                                            <td className="p-3 text-center">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleRemoveItem(item.medicine_id)}
                                                                    className="text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 border rounded-md">
                                            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                                            <p className="text-muted-foreground">No items added yet</p>
                                            <p className="text-sm text-muted-foreground/70">
                                                Search for medicines above to add them to the order
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column - Summary */}
                        <div className="space-y-6">
                            {/* Order Summary */}
                            <Card className="border-primary/20">
                                <CardHeader className="bg-primary/5">
                                    <CardTitle className="flex items-center gap-2">
                                        <Calculator className="h-5 w-5" />
                                        Order Summary
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Total Items</span>
                                        <span className="font-medium">{totalItems}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Unique Products</span>
                                        <span className="font-medium">{items.length}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">Total Amount</span>
                                        <PriceDisplay amount={subtotal} size="lg" variant="total" />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-3">
                                    {items.length > 0 && data.supplier_id ? (
                                        <Button
                                            type="submit"
                                            className="w-full"
                                            size="lg"
                                            disabled={processing}
                                        >
                                            <Save className="mr-2 h-4 w-4" />
                                            Update Order
                                        </Button>
                                    ) : (
                                        <Button disabled className="w-full" size="lg">
                                            <AlertCircle className="mr-2 h-4 w-4" />
                                            {items.length === 0 ? 'Add items to continue' : 'Select a supplier'}
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>

                            {/* Current Status */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Current Status</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Badge
                                        className={
                                            purchaseOrder.status === 'draft' ? 'bg-gray-500/10 text-gray-600' :
                                            purchaseOrder.status === 'sent' ? 'bg-purple-500/10 text-purple-600' :
                                            'bg-gray-500/10 text-gray-600'
                                        }
                                    >
                                        {purchaseOrder.status.charAt(0).toUpperCase() + purchaseOrder.status.slice(1)}
                                    </Badge>
                                    <p className="text-sm text-muted-foreground mt-2">
                                        Last updated: {new Date(purchaseOrder.updated_at).toLocaleDateString()}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </PharmacyLayout>
    );
}
