import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { PriceDisplay } from '@/components/pharmacy';
import {
    Plus,
    Trash2,
    Save,
    X,
    Package,
    Search,
    Building2,
} from 'lucide-react';
import { useState } from 'react';

interface Medicine {
    id: number;
    name: string;
    medicine_id: string;
    stock_quantity: number;
    unit_price: number;
    cost_price: number;
    form: string | null;
    strength: string | null;
    category?: {
        id: number;
        name: string;
    };
}

interface Supplier {
    id: number;
    name: string;
}

interface PurchaseItem {
    medicine_id: number;
    name: string;
    quantity: number;
    cost_price: number;
    batch_number: string;
    expiry_date: string;
    current_stock: number;
}

interface Props {
    medicines: Medicine[];
    suppliers: Supplier[];
    purchaseNumber: string;
}

export default function CreatePurchase({ medicines, suppliers, purchaseNumber }: Props) {
    const [supplierId, setSupplierId] = useState<string>('');
    const [invoiceNumber, setInvoiceNumber] = useState<string>('');
    const [purchaseDate, setPurchaseDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );
    const [tax, setTax] = useState<string>('0');
    const [discount, setDiscount] = useState<string>('0');
    const [notes, setNotes] = useState<string>('');
    const [showMedicineDialog, setShowMedicineDialog] = useState(false);
    const [showSupplierDialog, setShowSupplierDialog] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // New supplier form
    const [newSupplier, setNewSupplier] = useState({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
    });

    const filteredMedicines = medicines.filter((m) =>
        m.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
        m.medicine_id.toLowerCase().includes(medicineSearch.toLowerCase())
    );

    const addItem = (medicine: Medicine) => {
        const existingIndex = items.findIndex((i) => i.medicine_id === medicine.id);
        if (existingIndex >= 0) {
            setErrors({ items: 'This medicine is already added to the purchase.' });
            return;
        }

        setItems([
            ...items,
            {
                medicine_id: medicine.id,
                name: medicine.name,
                quantity: 1,
                cost_price: medicine.cost_price || medicine.unit_price,
                batch_number: '',
                expiry_date: '',
                current_stock: medicine.stock_quantity,
            },
        ]);
        setShowMedicineDialog(false);
        setMedicineSearch('');
        setErrors({});
    };

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const updateItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
        const updated = [...items];
        (updated[index] as any)[field] = value;
        setItems(updated);
    };

    const calculateSubtotal = () => {
        return items.reduce((sum, item) => sum + item.quantity * item.cost_price, 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        return subtotal + parseFloat(tax || '0') - parseFloat(discount || '0');
    };

    const handleSubmit = () => {
        const newErrors: Record<string, string> = {};

        if (items.length === 0) {
            newErrors.items = 'Please add at least one item to the purchase.';
        }

        items.forEach((item, index) => {
            if (item.quantity <= 0) {
                newErrors[`items.${index}.quantity`] = 'Quantity must be greater than 0.';
            }
            if (item.cost_price <= 0) {
                newErrors[`items.${index}.cost_price`] = 'Cost price must be greater than 0.';
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        router.post(
            '/pharmacy/purchases',
            {
                supplier_id: supplierId || null,
                invoice_number: invoiceNumber || null,
                purchase_date: purchaseDate,
                tax: parseFloat(tax) || 0,
                discount: parseFloat(discount) || 0,
                notes: notes || null,
                items: items.map((item) => ({
                    medicine_id: item.medicine_id,
                    quantity: item.quantity,
                    cost_price: item.cost_price,
                    batch_number: item.batch_number || null,
                    expiry_date: item.expiry_date || null,
                })),
            },
            {
                onError: (errors) => setErrors(errors),
            }
        );
    };

    const handleCreateSupplier = () => {
        if (!newSupplier.name) {
            setErrors({ supplier_name: 'Supplier name is required.' });
            return;
        }

        router.post('/pharmacy/purchases/suppliers/quick-store', newSupplier, {
            onSuccess: (page) => {
                const response = page.props as any;
                if (response.supplier) {
                    setSupplierId(response.supplier.id.toString());
                    suppliers.push(response.supplier);
                }
                setShowSupplierDialog(false);
                setNewSupplier({
                    name: '',
                    contact_person: '',
                    email: '',
                    phone: '',
                    address: '',
                });
            },
        });
    };

    return (
        <PharmacyLayout header={<h1 className="text-xl font-semibold">New Purchase</h1>}>
            <Head title="New Purchase" />

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Purchase Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Purchase Information</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                            <div>
                                <Label>Purchase Number</Label>
                                <Input value={purchaseNumber} disabled />
                            </div>
                            <div>
                                <Label>Invoice Number</Label>
                                <Input
                                    placeholder="Supplier invoice number"
                                    value={invoiceNumber}
                                    onChange={(e) => setInvoiceNumber(e.target.value)}
                                />
                            </div>
                            <div>
                                <Label>Supplier</Label>
                                <div className="flex gap-2">
                                    <Select value={supplierId} onValueChange={setSupplierId}>
                                        <SelectTrigger className="flex-1">
                                            <SelectValue placeholder="Select supplier" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {suppliers.map((supplier) => (
                                                <SelectItem
                                                    key={supplier.id}
                                                    value={supplier.id.toString()}
                                                >
                                                    {supplier.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowSupplierDialog(true)}
                                    >
                                        <Plus className="size-4" />
                                    </Button>
                                </div>
                            </div>
                            <div>
                                <Label>Purchase Date</Label>
                                <Input
                                    type="date"
                                    value={purchaseDate}
                                    onChange={(e) => setPurchaseDate(e.target.value)}
                                />
                                {errors.purchase_date && (
                                    <p className="text-sm text-red-500 mt-1">
                                        {errors.purchase_date}
                                    </p>
                                )}
                            </div>
                            <div className="md:col-span-2">
                                <Label>Notes</Label>
                                <Textarea
                                    placeholder="Additional notes..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    rows={2}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Items */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Purchase Items</CardTitle>
                            <Button onClick={() => setShowMedicineDialog(true)}>
                                <Plus className="size-4 mr-2" />
                                Add Item
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {errors.items && (
                                <p className="text-sm text-red-500 mb-4">{errors.items}</p>
                            )}

                            {items.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Package className="size-12 mx-auto mb-3 opacity-50" />
                                    <p>No items added yet</p>
                                    <p className="text-sm">Click "Add Item" to add medicines</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Medicine</TableHead>
                                            <TableHead className="w-24">Qty</TableHead>
                                            <TableHead className="w-32">Cost Price</TableHead>
                                            <TableHead className="w-32">Batch #</TableHead>
                                            <TableHead className="w-36">Expiry</TableHead>
                                            <TableHead className="w-24">Total</TableHead>
                                            <TableHead className="w-16"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">{item.name}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Stock: {item.current_stock}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) =>
                                                            updateItem(
                                                                index,
                                                                'quantity',
                                                                parseInt(e.target.value) || 0
                                                            )
                                                        }
                                                        className="w-20"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        value={item.cost_price}
                                                        onChange={(e) =>
                                                            updateItem(
                                                                index,
                                                                'cost_price',
                                                                parseFloat(e.target.value) || 0
                                                            )
                                                        }
                                                        className="w-28"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        placeholder="Batch"
                                                        value={item.batch_number}
                                                        onChange={(e) =>
                                                            updateItem(
                                                                index,
                                                                'batch_number',
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="date"
                                                        value={item.expiry_date}
                                                        onChange={(e) =>
                                                            updateItem(
                                                                index,
                                                                'expiry_date',
                                                                e.target.value
                                                            )
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <PriceDisplay
                                                        amount={item.quantity * item.cost_price}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600"
                                                        onClick={() => removeItem(index)}
                                                    >
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Summary */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">
                                    <PriceDisplay amount={calculateSubtotal()} />
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground flex-1">Tax</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={tax}
                                    onChange={(e) => setTax(e.target.value)}
                                    className="w-24"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground flex-1">Discount</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={discount}
                                    onChange={(e) => setDiscount(e.target.value)}
                                    className="w-24"
                                />
                            </div>
                            <div className="border-t pt-4">
                                <div className="flex justify-between text-lg font-bold">
                                    <span>Total</span>
                                    <span>
                                        <PriceDisplay amount={calculateTotal()} />
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Link href="/pharmacy/purchases" className="flex-1">
                                    <Button variant="outline" className="w-full">
                                        <X className="size-4 mr-2" />
                                        Cancel
                                    </Button>
                                </Link>
                                <Button onClick={handleSubmit} className="flex-1">
                                    <Save className="size-4 mr-2" />
                                    Save
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Add Medicine Dialog */}
            <Dialog open={showMedicineDialog} onOpenChange={setShowMedicineDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add Medicine</DialogTitle>
                        <DialogDescription>
                            Search and select a medicine to add to the purchase.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search medicines..."
                                value={medicineSearch}
                                onChange={(e) => setMedicineSearch(e.target.value)}
                                className="pl-8"
                                autoFocus
                            />
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {filteredMedicines.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Package className="size-12 mx-auto mb-3 opacity-50" />
                                    <p>No medicines found</p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Category</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Cost Price</TableHead>
                                            <TableHead></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredMedicines.slice(0, 10).map((medicine) => (
                                            <TableRow key={medicine.id}>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium">
                                                            {medicine.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {medicine.medicine_id}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {medicine.category?.name || 'N/A'}
                                                </TableCell>
                                                <TableCell>{medicine.stock_quantity}</TableCell>
                                                <TableCell>
                                                    <PriceDisplay
                                                        amount={
                                                            medicine.cost_price ||
                                                            medicine.unit_price
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => addItem(medicine)}
                                                    >
                                                        <Plus className="size-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Add Supplier Dialog */}
            <Dialog open={showSupplierDialog} onOpenChange={setShowSupplierDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Supplier</DialogTitle>
                        <DialogDescription>
                            Create a new supplier for this purchase.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Supplier Name *</Label>
                            <Input
                                value={newSupplier.name}
                                onChange={(e) =>
                                    setNewSupplier({ ...newSupplier, name: e.target.value })
                                }
                                placeholder="Enter supplier name"
                            />
                            {errors.supplier_name && (
                                <p className="text-sm text-red-500 mt-1">
                                    {errors.supplier_name}
                                </p>
                            )}
                        </div>
                        <div>
                            <Label>Contact Person</Label>
                            <Input
                                value={newSupplier.contact_person}
                                onChange={(e) =>
                                    setNewSupplier({
                                        ...newSupplier,
                                        contact_person: e.target.value,
                                    })
                                }
                                placeholder="Contact person name"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={newSupplier.email}
                                    onChange={(e) =>
                                        setNewSupplier({ ...newSupplier, email: e.target.value })
                                    }
                                    placeholder="email@example.com"
                                />
                            </div>
                            <div>
                                <Label>Phone</Label>
                                <Input
                                    value={newSupplier.phone}
                                    onChange={(e) =>
                                        setNewSupplier({ ...newSupplier, phone: e.target.value })
                                    }
                                    placeholder="Phone number"
                                />
                            </div>
                        </div>
                        <div>
                            <Label>Address</Label>
                            <Textarea
                                value={newSupplier.address}
                                onChange={(e) =>
                                    setNewSupplier({ ...newSupplier, address: e.target.value })
                                }
                                placeholder="Supplier address"
                                rows={2}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowSupplierDialog(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateSupplier}>
                            <Building2 className="size-4 mr-2" />
                            Create Supplier
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PharmacyLayout>
    );
}