import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
    FileText,
    Pill,
    Stethoscope,
    Calendar,
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
    age?: number;
}

interface PrescriptionItem {
    id: number;
    medicine_id: number;
    medicine_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    instructions: string;
    dispensed_quantity: number;
}

interface Prescription {
    id: number;
    prescription_code: string;
    patient_id: number;
    doctor_id: number;
    doctor_name: string;
    diagnosis: string;
    notes: string;
    status: 'pending' | 'dispensed' | 'partial' | 'cancelled';
    created_at: string;
    items: PrescriptionItem[];
}

interface DispenseProps {
    medicines: Medicine[];
    patients: Patient[];
    prescriptions: Prescription[];
    taxRate?: number;
}

export default function Dispense({ medicines, patients, prescriptions, taxRate = 0 }: DispenseProps) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [patientSearchQuery, setPatientSearchQuery] = useState('');
    const [prescriptionSearchQuery, setPrescriptionSearchQuery] = useState('');
    const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
    const [discountValue, setDiscountValue] = useState(0);
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false);
    const [saleComplete, setSaleComplete] = useState(false);
    const [completedSaleId, setCompletedSaleId] = useState<number | null>(null);
    const [activeTab, setActiveTab] = useState<'prescription' | 'walkin'>('prescription');

    const { data, setData, post, processing } = useForm({
        patient_id: '',
        prescription_id: '',
        payment_method: 'cash' as 'cash' | 'card' | 'insurance' | 'credit',
        notes: '',
        discount_amount: 0,
        discount_percentage: 0,
        tax_amount: 0,
        items: [] as CartItem[],
        is_prescription_sale: true,
    });

    // Filter patients based on search
    const filteredPatients = useMemo(() => {
        if (!patientSearchQuery.trim()) return patients.slice(0, 5);
        const query = patientSearchQuery.toLowerCase();
        return patients.filter(p => {
            const nameMatch = p.first_name?.toLowerCase().includes(query) ||
                             p.father_name?.toLowerCase().includes(query);
            const idMatch = p.patient_id?.toLowerCase().includes(query);
            return nameMatch || idMatch;
        }).slice(0, 5);
    }, [patients, patientSearchQuery]);

    // Filter prescriptions based on search
    const filteredPrescriptions = useMemo(() => {
        if (!prescriptionSearchQuery.trim()) return prescriptions.filter(p => p.status === 'pending');
        const query = prescriptionSearchQuery.toLowerCase();
        return prescriptions.filter(p => 
            p.status === 'pending' &&
            (p.prescription_code.toLowerCase().includes(query) ||
            p.patient_id.toString().includes(query))
        );
    }, [prescriptions, prescriptionSearchQuery]);


    // Calculate totals
    const { subtotal, discount, tax, total } = useMemo(() => {
        const sub = cartItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
        let disc = 0;
        if (discountType === 'percentage') {
            disc = sub * (discountValue / 100);
        } else {
            disc = discountValue;
        }
        // Ensure discount doesn't exceed subtotal
        disc = Math.min(disc, sub);
        const calculatedTax = sub * (taxRate / 100);
        const tot = sub - disc + calculatedTax;
        return {
            subtotal: sub,
            discount: disc,
            tax: calculatedTax,
            total: tot,
        };
    }, [cartItems, discountValue, discountType, taxRate]);

    // Check if discount exceeds subtotal (for validation warning)
    const discountExceedsSubtotal = discountType === 'fixed' && discountValue > subtotal && subtotal > 0;

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
        setSelectedPrescription(null);
        setData('patient_id', '');
        setData('prescription_id', '');
        handleClearCart();
    };

    // Prescription handlers
    const handleSelectPrescription = (prescription: Prescription) => {
        setSelectedPrescription(prescription);
        setData('prescription_id', prescription.id.toString());
        
        // Auto-populate cart with prescription items
        const newCartItems: CartItem[] = [];
        prescription.items.forEach(item => {
            const medicine = medicines.find(m => m.id === item.medicine_id);
            if (medicine) {
                const remainingQty = item.quantity - item.dispensed_quantity;
                if (remainingQty > 0) {
                    newCartItems.push({
                        medicine_id: medicine.id,
                        name: medicine.name,
                        quantity: Math.min(remainingQty, medicine.stock_quantity),
                        unit_price: medicine.unit_price,
                        stock_quantity: medicine.stock_quantity,
                        dosage_form: medicine.dosage_form,
                        strength: medicine.strength,
                    });
                }
            }
        });
        setCartItems(newCartItems);
        
        // Auto-select patient if not already selected
        if (!selectedPatient) {
            const patient = patients.find(p => p.id === prescription.patient_id);
            if (patient) {
                setSelectedPatient(patient);
                setData('patient_id', patient.id.toString());
            }
        }
    };

    const handleClearPrescription = () => {
        setSelectedPrescription(null);
        setData('prescription_id', '');
        handleClearCart();
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
            is_prescription_sale: activeTab === 'prescription',
        });

        setShowCheckoutDialog(true);
    };

    const handleCompleteSale = () => {
        post('/pharmacy/sales', {
            onSuccess: () => {
                setShowCheckoutDialog(false);
                // Sale completed successfully - controller redirects to receipt page
                // No need to set saleComplete state as page will redirect
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
        setSelectedPrescription(null);
        setDiscountValue(0);
        setData({
            patient_id: '',
            prescription_id: '',
            payment_method: 'cash',
            notes: '',
            discount_amount: 0,
            discount_percentage: 0,
            tax_amount: 0,
            items: [],
            is_prescription_sale: true,
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'AFN',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
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
                            <h2 className="text-2xl font-bold mb-2">Prescription Dispensed!</h2>
                            <p className="text-muted-foreground mb-6">
                                The prescription has been dispensed successfully.
                            </p>
                            <div className="space-y-3">
                                <Button onClick={handlePrintReceipt} className="w-full">
                                    <Printer className="mr-2 h-4 w-4" />
                                    Print Receipt
                                </Button>
                                <Button variant="outline" onClick={handleNewSale} className="w-full">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Dispense
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
                <Head title="Dispense Prescription" />
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Dispense Prescription" />
                        <p className="text-muted-foreground mt-1">
                            Dispense medicines from doctor prescriptions
                        </p>
                    </div>
                    
                    <Link href="/pharmacy/sales">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Sales
                        </Button>
                    </Link>
                </div>

                {/* Main Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Side - Prescription/Walk-in Selection & Cart */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tab Selection */}
                        <Card>
                            <CardHeader>
                                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'prescription' | 'walkin')}>
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="prescription" className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            From Prescription
                                        </TabsTrigger>
                                        <TabsTrigger value="walkin" className="flex items-center gap-2">
                                            <ShoppingCart className="h-4 w-4" />
                                            Walk-in Sale
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </CardHeader>
                            <CardContent>
                                {activeTab === 'prescription' ? (
                                    <div className="space-y-4">
                                        {/* Prescription Search */}
                                        {!selectedPrescription ? (
                                            <>
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                    <Input
                                                        placeholder="Search by prescription code or patient ID..."
                                                        value={prescriptionSearchQuery}
                                                        onChange={(e) => setPrescriptionSearchQuery(e.target.value)}
                                                        className="pl-9"
                                                    />
                                                </div>
                                                
                                                {prescriptionSearchQuery && (
                                                    <div className="border rounded-md divide-y">
                                                        {filteredPrescriptions.length > 0 ? (
                                                            filteredPrescriptions.map(prescription => (
                                                                <button
                                                                    key={prescription.id}
                                                                    onClick={() => handleSelectPrescription(prescription)}
                                                                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                                            <div>
                                                                                <p className="font-medium text-sm">
                                                                                    {prescription.prescription_code}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Dr. {prescription.doctor_name}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {prescription.items.length} items
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {formatDate(prescription.created_at)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                                                No pending prescriptions found
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Recent Prescriptions */}
                                                {!prescriptionSearchQuery && (
                                                    <div className="space-y-2">
                                                        <p className="text-sm font-medium text-muted-foreground">Recent Pending Prescriptions</p>
                                                        <div className="border rounded-md divide-y">
                                                            {prescriptions.filter(p => p.status === 'pending').slice(0, 5).map(prescription => (
                                                                <button
                                                                    key={prescription.id}
                                                                    onClick={() => handleSelectPrescription(prescription)}
                                                                    className="w-full px-4 py-3 text-left hover:bg-muted transition-colors"
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                                                            <div>
                                                                                <p className="font-medium text-sm">
                                                                                    {prescription.prescription_code}
                                                                                </p>
                                                                                <p className="text-xs text-muted-foreground">
                                                                                    Dr. {prescription.doctor_name}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="text-right">
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {prescription.items.length} items
                                                                            </p>
                                                                            <p className="text-xs text-muted-foreground">
                                                                                {formatDate(prescription.created_at)}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                </button>
                                                            ))}
                                                            {prescriptions.filter(p => p.status === 'pending').length === 0 && (
                                                                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                                                    No pending prescriptions
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="p-4 rounded-lg bg-muted/50 border">
                                                <div className="flex items-start justify-between">
                                                    <div className="space-y-2">
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-5 w-5 text-primary" />
                                                            <span className="font-medium">{selectedPrescription.prescription_code}</span>
                                                            <Badge variant="outline">{selectedPrescription.status}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Stethoscope className="h-4 w-4" />
                                                            <span>Dr. {selectedPrescription.doctor_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <Calendar className="h-4 w-4" />
                                                            <span>{formatDate(selectedPrescription.created_at)}</span>
                                                        </div>
                                                        {selectedPrescription.diagnosis && (
                                                            <div className="mt-2 p-2 bg-background rounded text-sm">
                                                                <span className="font-medium">Diagnosis:</span> {selectedPrescription.diagnosis}
                                                            </div>
                                                        )}
                                                        
                                                        {/* Prescription Items */}
                                                        <div className="mt-4 space-y-2">
                                                            <p className="text-sm font-medium">Prescribed Items:</p>
                                                            {selectedPrescription.items.map(item => (
                                                                <div key={item.id} className="flex items-center gap-2 text-sm p-2 bg-background rounded">
                                                                    <Pill className="h-4 w-4 text-muted-foreground" />
                                                                    <div className="flex-1">
                                                                        <span className="font-medium">{item.medicine_name}</span>
                                                                        <span className="text-muted-foreground"> - {item.dosage}</span>
                                                                    </div>
                                                                    <Badge variant={item.dispensed_quantity >= item.quantity ? "default" : "secondary"}>
                                                                        {item.dispensed_quantity}/{item.quantity} dispensed
                                                                    </Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={handleClearPrescription}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <p className="text-sm text-muted-foreground">
                                            Walk-in sales do not require a prescription. Search for medicines below to add to cart.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

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
                                    Patient
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {selectedPatient ? (
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium">
                                                    {selectedPatient.first_name} {selectedPatient.father_name || ''}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {selectedPatient.patient_id}
                                                </p>
                                                {selectedPatient.phone && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {selectedPatient.phone}
                                                    </p>
                                                )}
                                                {selectedPatient.age && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Age: {selectedPatient.age}
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
                                {discountExceedsSubtotal && (
                                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                                        <p className="text-sm text-amber-800 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            Discount cannot exceed subtotal ({formatCurrency(subtotal)})
                                        </p>
                                    </div>
                                )}
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
                                    placeholder="Add any notes about this dispense..."
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
                                        disabled={discountExceedsSubtotal || total < 0}
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
                            <DialogTitle>Confirm Dispense</DialogTitle>
                            <DialogDescription>
                                Review the dispense details before completing
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
                                        <span className="text-muted-foreground">Patient</span>
                                        <span>{selectedPatient.first_name} {selectedPatient.father_name}</span>
                                    </div>
                                )}
                                {selectedPrescription && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Prescription</span>
                                        <span>{selectedPrescription.prescription_code}</span>
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
                                {processing ? 'Processing...' : 'Complete Dispense'}
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </PharmacyLayout>
    );
}
