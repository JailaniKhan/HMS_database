import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { MedicineSearch } from '@/components/pharmacy';
import { StockBadge } from '@/components/pharmacy/StockBadge';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    Plus,
    Minus,
    RotateCcw,
    History,
    Package,
    Calculator,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import HospitalLayout from '@/layouts/HospitalLayout';
import type { Medicine } from '@/types/pharmacy';

interface StockAdjustment {
    id: number;
    medicine_id: number;
    medicine: Medicine;
    adjustment_type: 'add' | 'remove' | 'set';
    quantity: number;
    previous_stock: number;
    new_stock: number;
    reason: string;
    notes: string | null;
    user: {
        id: number;
        name: string;
    };
    created_at: string;
}

interface AdjustmentFormData {
    medicine_id: string;
    adjustment_type: 'add' | 'remove' | 'set';
    quantity: string;
    reason: string;
    notes: string;
}

interface AdjustmentsProps {
    medicines: Medicine[];
    recentAdjustments: {
        data: StockAdjustment[];
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
            path: string;
            per_page: number;
            to: number;
            total: number;
        };
    };
    preselectedMedicineId?: string;
}

export default function Adjustments({ medicines, recentAdjustments, preselectedMedicineId }: AdjustmentsProps) {
    const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
    const [previewStock, setPreviewStock] = useState<number | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm<AdjustmentFormData>({
        medicine_id: preselectedMedicineId || '',
        adjustment_type: 'add',
        quantity: '',
        reason: '',
        notes: '',
    });

    // Set preselected medicine if provided
    useEffect(() => {
        if (preselectedMedicineId) {
            const medicine = medicines.find(m => m.id.toString() === preselectedMedicineId);
            if (medicine) {
                // Use requestAnimationFrame to avoid synchronous setState during render
                requestAnimationFrame(() => {
                    setSelectedMedicine(medicine);
                    setData('medicine_id', preselectedMedicineId);
                });
            }
        }
    }, [preselectedMedicineId, medicines]);

    // Calculate preview stock whenever inputs change
    useEffect(() => {
        if (selectedMedicine && data.quantity) {
            const qty = parseInt(data.quantity) || 0;
            const currentStock = selectedMedicine.stock_quantity;

            let newStock: number;
            switch (data.adjustment_type) {
                case 'add':
                    newStock = currentStock + qty;
                    break;
                case 'remove':
                    newStock = Math.max(0, currentStock - qty);
                    break;
                case 'set':
                    newStock = qty;
                    break;
                default:
                    newStock = currentStock;
            }
            // Use requestAnimationFrame to avoid synchronous setState during render
            requestAnimationFrame(() => {
                setPreviewStock(newStock);
            });
        } else {
            // Use requestAnimationFrame to avoid synchronous setState during render
            requestAnimationFrame(() => {
                setPreviewStock(null);
            });
        }
    }, [selectedMedicine, data.adjustment_type, data.quantity]);

    const handleMedicineSelect = (medicine: Medicine) => {
        setSelectedMedicine(medicine);
        setData('medicine_id', medicine.id.toString());
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/pharmacy/stock/adjust', {
            onSuccess: () => {
                reset();
                setSelectedMedicine(null);
                setPreviewStock(null);
            },
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

    const getAdjustmentTypeBadge = (type: string) => {
        switch (type) {
            case 'add':
                return <Badge className="bg-green-500/10 text-green-600 border-green-500/30">Add</Badge>;
            case 'remove':
                return <Badge className="bg-red-500/10 text-red-600 border-red-500/30">Remove</Badge>;
            case 'set':
                return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">Set</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    const getStockStatus = (medicine: Medicine) => {
        if (medicine.stock_quantity <= 0) return 'out-of-stock';
        if (medicine.stock_quantity <= medicine.reorder_level * 0.5) return 'critical';
        if (medicine.stock_quantity <= medicine.reorder_level) return 'low-stock';
        return 'in-stock';
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Stock Adjustments" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Stock Adjustments" />
                        <p className="text-muted-foreground mt-1">
                            Adjust stock levels and track all changes
                        </p>
                    </div>

                    <Link href="/pharmacy/stock">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Stock
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Adjustment Form */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <RotateCcw className="h-5 w-5" />
                                New Adjustment
                            </CardTitle>
                            <CardDescription>
                                Adjust stock levels for a medicine
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleSubmit}>
                            <CardContent className="space-y-4">
                                {/* Medicine Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="medicine">Medicine *</Label>
                                    <MedicineSearch
                                        medicines={medicines}
                                        value={selectedMedicine}
                                        onSelect={handleMedicineSelect}
                                        placeholder="Search and select a medicine..."
                                        showStock={true}
                                        showPrice={false}
                                        filterByStock={false}
                                    />
                                    {errors.medicine_id && (
                                        <p className="text-sm text-destructive">{errors.medicine_id}</p>
                                    )}
                                </div>

                                {/* Current Stock Display */}
                                {selectedMedicine && (
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                    <Package className="h-5 w-5 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{selectedMedicine.name}</p>
                                                    <p className="text-xs text-muted-foreground">{selectedMedicine.medicine_id}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-muted-foreground">Current Stock</p>
                                                <p className="text-2xl font-bold">{selectedMedicine.stock_quantity}</p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center gap-2">
                                            <StockBadge status={getStockStatus(selectedMedicine)} size="sm" />
                                            <span className="text-xs text-muted-foreground">
                                                Reorder Level: {selectedMedicine.reorder_level || 'Not set'}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Adjustment Type */}
                                <div className="space-y-2">
                                    <Label htmlFor="adjustment_type">Adjustment Type *</Label>
                                    <Select
                                        value={data.adjustment_type}
                                        onValueChange={(value) => setData('adjustment_type', value as 'add' | 'remove' | 'set')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select adjustment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="add">
                                                <div className="flex items-center gap-2">
                                                    <Plus className="h-4 w-4 text-green-600" />
                                                    Add Stock
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="remove">
                                                <div className="flex items-center gap-2">
                                                    <Minus className="h-4 w-4 text-red-600" />
                                                    Remove Stock
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="set">
                                                <div className="flex items-center gap-2">
                                                    <RotateCcw className="h-4 w-4 text-blue-600" />
                                                    Set Stock Level
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.adjustment_type && (
                                        <p className="text-sm text-destructive">{errors.adjustment_type}</p>
                                    )}
                                </div>

                                {/* Quantity */}
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantity *</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={data.quantity}
                                        onChange={(e) => setData('quantity', e.target.value)}
                                        placeholder="Enter quantity..."
                                    />
                                    {errors.quantity && (
                                        <p className="text-sm text-destructive">{errors.quantity}</p>
                                    )}
                                </div>

                                {/* Preview */}
                                {previewStock !== null && selectedMedicine && (
                                    <div className={cn(
                                        "p-4 rounded-lg border flex items-center justify-between",
                                        previewStock < 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"
                                    )}>
                                        <div className="flex items-center gap-2">
                                            <Calculator className={cn(
                                                "h-5 w-5",
                                                previewStock < 0 ? "text-red-600" : "text-green-600"
                                            )} />
                                            <span className="font-medium">New Stock Level</span>
                                        </div>
                                        <div className="text-right">
                                            <p className={cn(
                                                "text-2xl font-bold",
                                                previewStock < 0 ? "text-red-600" : "text-green-600"
                                            )}>
                                                {previewStock}
                                            </p>
                                            {previewStock < 0 && (
                                                <p className="text-xs text-red-600">Cannot have negative stock</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Reason */}
                                <div className="space-y-2">
                                    <Label htmlFor="reason">Reason *</Label>
                                    <Select
                                        value={data.reason}
                                        onValueChange={(value) => setData('reason', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select reason for adjustment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="purchase">Purchase Received</SelectItem>
                                            <SelectItem value="damage">Damaged/Expired</SelectItem>
                                            <SelectItem value="return">Customer Return</SelectItem>
                                            <SelectItem value="correction">Stock Correction</SelectItem>
                                            <SelectItem value="donation">Donation</SelectItem>
                                            <SelectItem value="transfer">Transfer</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.reason && (
                                        <p className="text-sm text-destructive">{errors.reason}</p>
                                    )}
                                </div>

                                {/* Notes */}
                                <div className="space-y-2">
                                    <Label htmlFor="notes">Notes (Optional)</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Add any additional notes..."
                                        rows={3}
                                    />
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        reset();
                                        setSelectedMedicine(null);
                                        setPreviewStock(null);
                                    }}
                                >
                                    Clear
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !selectedMedicine || !data.quantity || previewStock === null || previewStock < 0}
                                >
                                    {processing ? 'Processing...' : 'Submit Adjustment'}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>

                    {/* Recent Adjustments */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5" />
                                Recent Adjustments
                            </CardTitle>
                            <CardDescription>
                                History of recent stock adjustments
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Medicine</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-right">Change</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {recentAdjustments?.data?.length > 0 ? (
                                            recentAdjustments.data.map((adjustment) => (
                                                <TableRow key={adjustment.id}>
                                                    <TableCell className="text-sm">
                                                        {formatDate(adjustment.created_at)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-sm">{adjustment.medicine?.name}</p>
                                                            <p className="text-xs text-muted-foreground">{adjustment.medicine?.medicine_id}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getAdjustmentTypeBadge(adjustment.adjustment_type)}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="text-sm">
                                                            <span className={cn(
                                                                adjustment.new_stock > adjustment.previous_stock ? 'text-green-600' :
                                                                adjustment.new_stock < adjustment.previous_stock ? 'text-red-600' : 'text-muted-foreground'
                                                            )}>
                                                                {adjustment.previous_stock} → {adjustment.new_stock}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">
                                                            by {adjustment.user?.name}
                                                        </p>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                                    <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                                    No adjustments found
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Pagination */}
                            {recentAdjustments?.meta?.last_page > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-xs text-muted-foreground">
                                        Showing {recentAdjustments?.meta?.from} to {recentAdjustments?.meta?.to} of {recentAdjustments?.meta?.total}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!recentAdjustments?.links?.prev}
                                            onClick={() => router.visit(recentAdjustments?.links?.prev || '')}
                                        >
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={!recentAdjustments?.links?.next}
                                            onClick={() => router.visit(recentAdjustments?.links?.next || '')}
                                        >
                                            Next
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HospitalLayout>
    );
}
