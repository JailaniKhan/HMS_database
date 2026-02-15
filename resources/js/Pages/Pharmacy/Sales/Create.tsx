import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { MedicineSearch, Cart, PriceDisplay, TotalPrice } from '@/components/pharmacy';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    ShoppingCart,
    User,
    Plus,
    Receipt,
    CreditCard,
    Wallet,
    Landmark,
    Percent,
    Currency,
    Calculator,
    Printer,
    CheckCircle,
    AlertCircle,
    Search,
    X,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import type { Medicine, CartItem } from '@/types/pharmacy';

interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    father_name: string;
    phone?: string;
}

interface SaleCreateProps {
    medicines: Medicine[];
    patients: Patient[];
    taxRate?: number;
}

interface QuickPatientForm {
    first_name: string;
    last_name: string;
    phone: string;
}

export default function SaleCreate({ medicines, patients, taxRate = 0 }: SaleCreateProps) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [showQuickAddPatient, setShowQuickAddPatient] = useState(false);
    const [quickPatient, setQuickPatient] = useState<QuickPatientForm>({
        first_name: '',
        last_name: '',
        phone: '',
    });
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState(0);
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
    const [saleComplete, setSaleComplete] = useState(false);
    const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);

    const { data, setData, post, processing } = useForm({
        patient_id: '',
        payment_method: 'cash' as 'cash' | 'card' | 'insurance' | 'credit',
        notes: '',
        discount_amount: 0,
        discount_percentage: 0,
        tax_amount: 0,
        items: [] as CartItem[],
    });

    // Filter patients based on search
    const filteredPatients = useMemo(() => {
        if (!patientSearchQuery.trim()) return patients.slice(0, 5);
        const query = patientSearchQuery.toLowerCase();
        return patients.filter(p => 
            p.first_name.toLowerCase().includes(query) ||
            p.father_name.toLowerCase().includes(query) ||
            p.patient_id.toLowerCase().includes(query)
        ).slice(0, 5);
    }, [patients, patientSearchQuery]);

    // Calculate totals
    const { subtotal, discount, tax, total } = useMemo(() => {
        const sub = cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        let disc = 0;
        if (discountType === 'percentage') {
            disc = sub * (discountValue / 100);
        } else {
            disc = discountValue;
        }
        const calculatedTax = sub * (taxRate / 100);
        const tot = sub - disc + calculatedTax;
        return {
            subtotal: sub,
            discount: disc,
            tax: calculatedTax,
            total: tot,
        };
    }, [cartItems, discountValue, discountType, taxRate]);

    // Cart handlers
    const handleAddToCart = useCallback((medicine: Medicine) => {
        setCartItems(prev => {
            const existing = prev.find(item => item.medicine_id === medicine.id);
            if (existing) {
                return prev.map(item =>
                    item.medicine_id === medicine.id
                        ? { ...item, quantity: Math.min(item.quantity + 1, medicine.stock_quantity) }
                        : item
                );
            }
            return [...prev, {
                medicine_id: medicine.id,
                name: medicine.name,
                quantity: 1,
                unit_price: medicine.unit_price,
                stock_quantity: medicine.stock_quantity,
                dosage_form: medicine.dosage_form,
                strength: medicine.strength,
            }];
        });
    }, []);

    const handleUpdateQuantity = useCallback((medicineId: number, quantity: number) => {
        setCartItems(prev =>
            prev.map(item =>
                item.medicine_id === medicineId
                    ? { ...item, quantity: Math.max(1, quantity) }
                    : item
            )
        );
    }, []);

    const handleRemoveItem = useCallback((medicineId: number) => {
        setCartItems(prev => prev.filter(item => item.medicine_id !== medicineId));
    }, []);

    const handleClearCart = useCallback(() => {
        setCartItems([]);
    }, []);

    // Patient handlers
    const handleSelectPatient = (patient: Patient) => {
        setSelectedPatient(patient);
        setData('patient_id', patient.id.toString());
        setPatientSearchQuery('');
    };

    const handleClearPatient = () => {
        setSelectedPatient(null);
        setData('patient_id', '');
    };

    const handleQuickAddPatient = async () => {
        try {
            // Make API call to create the patient using web route
            const response = await fetch('/pharmacy/quick-patient', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    first_name: quickPatient.first_name,
                    father_name: quickPatient.last_name,
                    phone: quickPatient.phone,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create patient');
            }

            const result = await response.json();
            
            if (result.success && result.data) {
                const newPatient: Patient = {
                    id: result.data.id,
                    patient_id: result.data.patient_id,
                    first_name: result.data.first_name,
                    father_name: result.data.father_name,
                    phone: result.data.phone,
                };
                setSelectedPatient(newPatient);
                setData('patient_id', newPatient.id.toString());
                setShowQuickAddPatient(false);
                setQuickPatient({ first_name: '', last_name: '', phone: '' });
            } else {
                throw new Error(result.message || 'Failed to create patient');
            }
        } catch (error) {
            console.error('Error creating patient:', error);
            alert('Failed to create patient: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    // Checkout handler
    const handleCheckout = () => {
        if (cartItems.length === 0) return;

        setData({
            ...data,
            items: cartItems,
            discount_amount: discount,
            discount_percentage: discountType === 'percentage' ? discountValue : 0,
            tax_amount: tax,
        });

        setShowCheckoutDialog(true);
    };

    const handleCompleteSale = () => {
        post('/pharmacy/sales', {
            onSuccess: () => {
                setShowCheckoutDialog(false);
                setSaleComplete(true);
                // Sale ID will be set from redirect or flash data
                setCompletedSaleId(null);
            },
        });
    };

    const handlePrintReceipt = () => {
        if (completedSaleId) {
            window.open(`/pharmacy/sales/${completedSaleId}/receipt`, '_blank');
        }
    };

    const handleNewSale = () => {
        setSaleComplete(false);
        setCompletedSaleId(null);
        setCartItems([]);
        setSelectedPatient(null);
        setDiscountValue(0);
        setData({
            patient_id: '',
            payment_method: 'cash',
            notes: '',
            discount_amount: 0,
            discount_percentage: 0,
            tax_amount: 0,
            items: [],
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'AFN',
        }).format(amount);
    };

    // Success state after sale completion
    if (saleComplete) {
        return (
            <PharmacyLayout>
                <div className="min-h-[80vh] flex items-center justify-center">
                    <Card className="w-full max-w-md">
                        <CardContent className="pt-6 text-center">
                            <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Sale Completed!</h2>
                            <p className="text-muted-foreground mb-6">
                                The sale has been processed successfully.
                            </p>
                            <div className="space-y-3">
                                <Button onClick={handlePrintReceipt} className="w-full">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Receipt
                                </Button>
                                <Button variant="outline" onClick={handleNewSale} className="w-full">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Sale
                                </Button>
                                <Link href="/pharmacy/sales">
                                    <Button variant="ghost" className="w-full">
                                        View All Sales
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </PharmacyLayout>
        );
    }

    return (
        <PharmacyLayout>
            <div className="space-y-6">
                <Head title="New Sale - POS" />
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Point of Sale" />
                        <p className="text-muted-foreground mt-1">
                            Create a new sale transaction
                        </p>
                    </div>
                    
                    <Link href="/pharmacy/sales">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sales
                        </Button>
                    </Link>
                </div>

                {/* Main POS Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Side - Medicine Search & Cart */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Medicine Search */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="h-5 w-5" />
                                    Search Medicines
                                </CardTitle>
                                <CardDescription>
                                    Search and add medicines to the cart
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <MedicineSearch
                                    medicines={medicines}
                                    onSelect={handleAddToCart}
                                    placeholder="Search by name, code, or category..."
                                    showStock={true}
                                    showPrice={true}
                                />
                            </CardContent>
                        </Card>

                        {/* Cart */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <ShoppingCart className="h-5 w-5" />
                                    Cart
                                    {cartItems.length > 0 && (
                                        <Badge variant="secondary">
                                            {cartItems.reduce((sum, item) => sum + item.quantity, 0)} items
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Cart
                                    items={cartItems}
                                    onUpdateQuantity={handleUpdateQuantity}
                                    onRemoveItem={handleRemoveItem}
                                    onClearCart={handleClearCart}
                                    discount={discount}
                                    tax={tax}
                                    maxHeight="400px"
                                    emptyMessage="Your cart is empty. Search for medicines above to add items."
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Side - Customer & Checkout */}
                    <div className="space-y-6">
                        {/* Customer Selection */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Customer
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedPatient ? (
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {selectedPatient.first_name} {selectedPatient.father_name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedPatient.patient_id}
                                                </p>
                                                {selectedPatient.phone && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {selectedPatient.phone}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleClearPatient}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Search existing patient..."
                                                value={patientSearchQuery}
                                                onChange={(e) => setPatientSearchQuery(e.target.value)}
                                                className="pl-9"
                                            />
                                        </div>
                                        
                                        {patientSearchQuery && (
                                            <div className="border rounded-md divide-y">
                                                {filteredPatients.length > 0 ? (
                                                    filteredPatients.map(patient => (
                                                        <button
                                                            key={patient.id}
                                                            onClick={() => handleSelectPatient(patient)}
                                                            className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center gap-3"
                                                        >
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="font-medium text-sm">
                                                                    {patient.first_name} {patient.father_name}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {patient.patient_id}
                                                                </p>
                                                            </div>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                                        No patients found
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <Dialog open={showQuickAddPatient} onOpenChange={setShowQuickAddPatient}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" className="w-full">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Quick Add Patient
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Quick Add Patient</DialogTitle>
                                                    <DialogDescription>
                                                        Add a new patient quickly for this sale
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-4 pt-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <Label>First Name</Label>
                                                            <Input
                                                                value={quickPatient.first_name}
                                                                onChange={(e) => setQuickPatient(prev => ({ ...prev, first_name: e.target.value }))}
                                                                placeholder="John"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Father's Name</Label>
                                                            <Input
                                                                value={quickPatient.last_name}
                                                                onChange={(e) => setQuickPatient(prev => ({ ...prev, last_name: e.target.value }))}
                                                                placeholder="Smith"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Phone</Label>
                                                        <Input
                                                            value={quickPatient.phone}
                                                            onChange={(e) => setQuickPatient(prev => ({ ...prev, phone: e.target.value }))}
                                                            placeholder="+1 234 567 8900"
                                                        />
                                                    </div>
                                                    <Button 
                                                        onClick={handleQuickAddPatient}
                                                        disabled={!quickPatient.first_name}
                                                        className="w-full"
                                                    >
                                                        Add Patient
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        {/* Discount */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Percent className="h-5 w-5" />
                                    Discount
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Tabs value={discountType} onValueChange={(v) => setDiscountType(v as 'percentage' | 'fixed')}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="percentage">Percentage</TabsTrigger>
                                        <TabsTrigger value="fixed">Fixed Amount</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="percentage" className="mt-4">
                                        <div className="relative">
                                            <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={discountValue}
                                                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                                className="pl-9"
                                                placeholder="0"
                                            />
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="fixed" className="mt-4">
                                        <div className="relative">
                                            <Currency className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={discountValue}
                                                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                                                className="pl-9"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>

                        {/* Payment Method */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Method
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Select
                                    value={data.payment_method}
                                    onValueChange={(value) => setData('payment_method', value as 'cash' | 'card' | 'insurance' | 'credit')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="cash">
                                            <div className="flex items-center gap-2">
                                                <Wallet className="h-4 w-4" />
                                                Cash
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="card">
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-4 w-4" />
                                                Card
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="insurance">
                                            <div className="flex items-center gap-2">
                                                <Landmark className="h-4 w-4" />
                                                Insurance
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="credit">
                                            <div className="flex items-center gap-2">
                                                <Receipt className="h-4 w-4" />
                                                Credit
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </CardContent>
                        </Card>

                        {/* Notes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Notes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Textarea
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Add any notes about this sale..."
                                    rows={3}
                                />
                            </CardContent>
                        </Card>

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
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <PriceDisplay amount={subtotal} size="sm" />
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Discount</span>
                                        <span className="text-emerald-600">-{formatCurrency(discount)}</span>
                                    </div>
                                )}
                                {tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                                        <PriceDisplay amount={tax} size="sm" />
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total</span>
                                    <TotalPrice amount={total} size="lg" />
                                </div>
                            </CardContent>
                            <CardFooter className="flex flex-col gap-3">
                                {cartItems.length > 0 ? (
                                    <Button 
                                        onClick={handleCheckout}
                                        className="w-full"
                                        size="lg"
                                    >
                                        <Receipt className="mr-2 h-4 w-4" />
                                        Checkout
                                    </Button>
                                ) : (
                                    <Button disabled className="w-full" size="lg">
                                        <AlertCircle className="mr-2 h-4 w-4" />
                                        Add items to checkout
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    </div>
                </div>

                {/* Checkout Dialog */}
                <Dialog open={showCheckoutDialog} onOpenChange={setShowCheckoutDialog}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Confirm Sale</DialogTitle>
                            <DialogDescription>
                                Review the sale details before completing
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="rounded-lg bg-muted p-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Items</span>
                                    <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatCurrency(subtotal)}</span>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Discount</span>
                                        <span className="text-emerald-600">-{formatCurrency(discount)}</span>
                                    </div>
                                )}
                                {tax > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Tax</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>
                                )}
                                <Separator />
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total</span>
                                    <span>{formatCurrency(total)}</span>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Payment Method</span>
                                    <span className="capitalize">{data.payment_method}</span>
                                </div>
                                {selectedPatient && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Customer</span>
                                        <span>{selectedPatient.first_name} {selectedPatient.father_name}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setShowCheckoutDialog(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleCompleteSale}
                                disabled={processing}
                                className="flex-1"
                            >
                                {processing ? 'Processing...' : 'Complete Sale'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </PharmacyLayout>
    );
}
