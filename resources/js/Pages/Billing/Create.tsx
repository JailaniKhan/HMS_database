import { Head, useForm, Link } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/components/billing/CurrencyDisplay';
import HospitalLayout from '@/layouts/HospitalLayout';
import {
    ArrowLeft,
    Save,
    Calendar as CalendarIcon,
    Plus,
    Trash2,
    Stethoscope,
    ClipboardList,
    Calculator,
    Building,
    User,
    UserCircle,
    Receipt,
    AlertCircle,
    CheckCircle2,
    Percent,
    FileText,
    Search,
} from 'lucide-react';

// Interface for props from BillController
interface CreateProps {
    patients: Array<{
        id: number;
        patient_id: string;
        first_name: string;
        last_name: string;
        father_name?: string;
        phone?: string;
    }>;
    doctors: Array<{
        id: number;
        doctor_id: string;
        full_name: string;
        specialization: string;
    }>;
    services: Array<{
        id: number;
        service_name: string;
        price: number;
        department: {
            name: string;
        };
    }>;
}

// Bill item interface for the form
interface BillItem {
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
    service_id?: number;
    type: 'service' | 'test' | 'procedure' | 'medication' | 'other';
}

// Currency formatter helper
const formatCurrencySimple = (amount: number): string => {
    return formatCurrency(amount, { currency: 'AFN', locale: 'en-US' });
};

// Get icon for item type
const getItemTypeIcon = (type: BillItem['type']) => {
    switch (type) {
        case 'service': return <Stethoscope className="h-4 w-4" />;
        case 'test': return <ClipboardList className="h-4 w-4" />;
        case 'procedure': return <Building className="h-4 w-4" />;
        case 'medication': return <Receipt className="h-4 w-4" />;
        default: return <FileText className="h-4 w-4" />;
    }
};

const Create = ({ patients, doctors, services }: CreateProps) => {
    const [billItems, setBillItems] = useState<BillItem[]>([]);
    const [selectedService, setSelectedService] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        patient_id: '',
        doctor_id: '',
        bill_date: new Date().toISOString().split('T')[0],
        due_date: '',
        discount: 0,
        discount_type: 'fixed' as 'fixed' | 'percentage',
        tax_rate: 0,
        notes: '',
        billing_address: '',
        items: [] as BillItem[],
    });

    // Calculate totals
    const { subtotal, discountAmount, taxAmount, grandTotal } = useMemo(() => {
        const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
        
        // Calculate discount
        let discountAmount = data.discount;
        if (data.discount_type === 'percentage' && subtotal > 0) {
            discountAmount = subtotal * (data.discount / 100);
        }
        
        // Calculate taxable amount (after discount)
        const taxableAmount = Math.max(0, subtotal - discountAmount);
        const taxAmount = taxableAmount * (data.tax_rate / 100);
        
        // Grand total
        const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);
        
        return { subtotal, discountAmount, taxAmount, grandTotal };
    }, [billItems, data.discount, data.discount_type, data.tax_rate]);

    // Update items in form data whenever billItems changes
    useEffect(() => {
        setData('items', billItems);
    }, [billItems]);

    // Service options for combobox
    const serviceOptions: ComboboxOption[] = services.map(service => ({
        value: service.id.toString(),
        label: service.service_name,
        subtitle: `${service.department.name} - ${formatCurrencySimple(service.price)}`,
    }));

    // Group services by department for better organization
    const servicesByDepartment = useMemo(() => {
        const grouped: Record<string, typeof services> = {};
        services.forEach(service => {
            const dept = service.department.name;
            if (!grouped[dept]) {
                grouped[dept] = [];
            }
            grouped[dept].push(service);
        });
        return grouped;
    }, [services]);

    // Handle adding a service to the bill
    const handleAddService = () => {
        const service = services.find(s => s.id.toString() === selectedService);
        if (!service) return;

        const newItem: BillItem = {
            id: Date.now().toString(),
            description: service.service_name,
            quantity: 1,
            unit_price: service.price,
            total: service.price,
            service_id: service.id,
            type: 'service',
        };

        setBillItems(prev => [...prev, newItem]);
        setSelectedService('');
    };

    // Handle adding a manual item
    const handleAddManualItem = () => {
        const newItem: BillItem = {
            id: Date.now().toString(),
            description: '',
            quantity: 1,
            unit_price: 0,
            total: 0,
            type: 'other',
        };

        setBillItems(prev => [...prev, newItem]);
    };

    // Handle updating a bill item
    const handleUpdateItem = (id: string, updates: Partial<BillItem>) => {
        setBillItems(prev => prev.map(item => {
            if (item.id === id) {
                const updated = { ...item, ...updates };
                // Recalculate total if quantity or price changed
                if (updates.quantity !== undefined || updates.unit_price !== undefined) {
                    updated.total = updated.quantity * updated.unit_price;
                }
                return updated;
            }
            return item;
        }));
    };

    // Handle removing a bill item
    const handleRemoveItem = (id: string) => {
        if (confirm('Are you sure you want to remove this item?')) {
            setBillItems(prev => prev.filter(item => item.id !== id));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (billItems.length === 0) {
            alert('Please add at least one item to the bill.');
            return;
        }
        setIsLoading(true);
        post('/billing', {
            onFinish: () => setIsLoading(false),
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, name === 'discount' || name === 'tax_rate' ? parseFloat(value) || 0 : value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    // Get selected patient and doctor details
    const selectedPatient = patients.find(p => p.id.toString() === data.patient_id);
    const selectedDoctor = doctors.find(d => d.id.toString() === data.doctor_id);

    return (
        <HospitalLayout>
            <Head title="Create New Bill" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
                {/* Header Section */}
                <div className="bg-white border-b shadow-sm">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-600 rounded-xl shadow-lg">
                                    <Receipt className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Create New Bill</h1>
                                    <p className="text-sm text-gray-500">Create a professional billing invoice for patient services</p>
                                </div>
                            </div>
                            
                            <Link href="/billing">
                                <Button variant="outline" className="shadow-sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Bills
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        
                        {/* Step 1: Patient & Doctor Selection */}
                        <Card className="border-l-4 border-l-blue-500 shadow-md">
                            <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <UserCircle className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Step 1: Patient & Doctor Information</CardTitle>
                                        <CardDescription>Select the patient and referring doctor</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Patient Selection */}
                                    <div className="space-y-3">
                                        <Label htmlFor="patient_id" className="text-base font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-blue-500" />
                                            Patient *
                                        </Label>
                                        <Select 
                                            value={data.patient_id} 
                                            onValueChange={(value) => handleSelectChange('patient_id', value)}
                                        >
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="Select a patient" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-80">
                                                {patients.map(patient => (
                                                    <SelectItem key={patient.id} value={patient.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{patient.patient_id}</span>
                                                            <span className="font-medium">{patient.first_name} {patient.last_name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedPatient && (
                                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                                <div className="flex items-center gap-2 text-sm text-blue-700">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span>Selected: {selectedPatient.first_name} {selectedPatient.last_name}</span>
                                                </div>
                                            </div>
                                        )}
                                        {errors.patient_id && (
                                            <div className="flex items-center gap-2 text-sm text-red-600">
                                                <AlertCircle className="h-4 w-4" />
                                                {errors.patient_id}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Doctor Selection */}
                                    <div className="space-y-3">
                                        <Label htmlFor="doctor_id" className="text-base font-semibold flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-green-500" />
                                            Referring Doctor
                                        </Label>
                                        <Select 
                                            value={data.doctor_id} 
                                            onValueChange={(value) => handleSelectChange('doctor_id', value)}
                                        >
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="Select a doctor (optional)" />
                                            </SelectTrigger>
                                            <SelectContent className="max-h-80">
                                                {doctors.map(doctor => (
                                                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{doctor.doctor_id}</span>
                                                            <span className="font-medium">Dr. {doctor.full_name}</span>
                                                            <span className="text-xs text-gray-500">({doctor.specialization})</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {selectedDoctor && (
                                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                                <div className="flex items-center gap-2 text-sm text-green-700">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    <span>Dr. {selectedDoctor.full_name} - {selectedDoctor.specialization}</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* Date Selection */}
                                    <div className="space-y-3">
                                        <Label htmlFor="bill_date" className="text-base font-semibold flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-purple-500" />
                                            Bill Date *
                                        </Label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                id="bill_date"
                                                name="bill_date"
                                                type="date"
                                                value={data.bill_date}
                                                onChange={handleChange}
                                                className="pl-10 h-12"
                                            />
                                        </div>
                                        {errors.bill_date && (
                                            <p className="text-sm text-red-600">{errors.bill_date}</p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <Label htmlFor="due_date" className="text-base font-semibold flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-orange-500" />
                                            Due Date *
                                        </Label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                                            <Input
                                                id="due_date"
                                                name="due_date"
                                                type="date"
                                                value={data.due_date}
                                                onChange={handleChange}
                                                className="pl-10 h-12"
                                            />
                                        </div>
                                        {errors.due_date && (
                                            <p className="text-sm text-red-600">{errors.due_date}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Billing Address */}
                                <div className="mt-6 space-y-3">
                                    <Label htmlFor="billing_address" className="text-base font-semibold flex items-center gap-2">
                                        <Building className="h-4 w-4 text-gray-500" />
                                        Billing Address
                                    </Label>
                                    <Textarea
                                        id="billing_address"
                                        name="billing_address"
                                        value={data.billing_address}
                                        onChange={handleChange}
                                        placeholder="Enter billing address (optional)"
                                        rows={2}
                                        className="resize-none"
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Step 2: Services & Bill Items */}
                        <Card className="border-l-4 border-l-purple-500 shadow-md">
                            <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Stethoscope className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Step 2: Services & Bill Items</CardTitle>
                                        <CardDescription>Add services and items to the bill</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                {/* Service Selection */}
                                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                        <Search className="h-4 w-4" />
                                        Quick Add from Services
                                    </h4>
                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <Combobox
                                                options={serviceOptions}
                                                value={selectedService}
                                                onValueChange={setSelectedService}
                                                placeholder="Search services by name or department..."
                                                searchPlaceholder="Type to search..."
                                                emptyText="No services found."
                                            />
                                        </div>
                                        <Button 
                                            type="button" 
                                            onClick={handleAddService}
                                            disabled={!selectedService}
                                            className="bg-purple-600 hover:bg-purple-700 h-12 px-6"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Service
                                        </Button>
                                    </div>
                                    
                                    {/* Quick Categories */}
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {Object.entries(servicesByDepartment).slice(0, 4).map(([dept, deptServices]) => (
                                            <Badge key={dept} variant="outline" className="text-xs">
                                                {dept}: {deptServices.length} services
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Bill Items Table */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-lg font-semibold flex items-center gap-2">
                                            <ClipboardList className="h-5 w-5 text-gray-600" />
                                            Bill Items
                                            {billItems.length > 0 && (
                                                <Badge variant="secondary" className="ml-2">
                                                    {billItems.length} item(s)
                                                </Badge>
                                            )}
                                        </h4>
                                        <Button type="button" variant="outline" onClick={handleAddManualItem} size="sm">
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add Manual Item
                                        </Button>
                                    </div>

                                    {billItems.length > 0 ? (
                                        <div className="border rounded-xl overflow-hidden shadow-sm">
                                            <table className="w-full">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="text-left p-4 text-sm font-semibold text-gray-700">Item Description</th>
                                                        <th className="text-center p-4 text-sm font-semibold text-gray-700 w-24">Type</th>
                                                        <th className="text-center p-4 text-sm font-semibold text-gray-700 w-28">Quantity</th>
                                                        <th className="text-right p-4 text-sm font-semibold text-gray-700 w-32">Unit Price</th>
                                                        <th className="text-right p-4 text-sm font-semibold text-gray-700 w-32">Total</th>
                                                        <th className="p-4 w-16"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y">
                                                    {billItems.map((item, index) => (
                                                        <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <span className="text-gray-400 text-sm">#{index + 1}</span>
                                                                    <Input
                                                                        value={item.description}
                                                                        onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                                                                        placeholder="Enter description"
                                                                        className="border-0 bg-transparent focus-visible:ring-1 font-medium"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="p-4">
                                                                <Select
                                                                    value={item.type}
                                                                    onValueChange={(value) => handleUpdateItem(item.id, { type: value as BillItem['type'] })}
                                                                >
                                                                    <SelectTrigger className="w-full h-9 text-xs">
                                                                        <div className="flex items-center gap-2">
                                                                            {getItemTypeIcon(item.type)}
                                                                        </div>
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="service">
                                                                            <div className="flex items-center gap-2">
                                                                                <Stethoscope className="h-4 w-4" />
                                                                                Service
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="test">
                                                                            <div className="flex items-center gap-2">
                                                                                <ClipboardList className="h-4 w-4" />
                                                                                Test
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="procedure">
                                                                            <div className="flex items-center gap-2">
                                                                                <Building className="h-4 w-4" />
                                                                                Procedure
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="medication">
                                                                            <div className="flex items-center gap-2">
                                                                                <Receipt className="h-4 w-4" />
                                                                                Medication
                                                                            </div>
                                                                        </SelectItem>
                                                                        <SelectItem value="other">
                                                                            <div className="flex items-center gap-2">
                                                                                <FileText className="h-4 w-4" />
                                                                                Other
                                                                            </div>
                                                                        </SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </td>
                                                            <td className="p-4">
                                                                <Input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleUpdateItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                                                    className="text-center h-9"
                                                                />
                                                            </td>
                                                            <td className="p-4">
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-2 text-lg font-bold text-gray-400">؋</span>
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={item.unit_price}
                                                                        onChange={(e) => handleUpdateItem(item.id, { unit_price: parseFloat(e.target.value) || 0 })}
                                                                        className="pl-7 text-right h-9"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-right font-semibold text-gray-900">
                                                                {formatCurrencySimple(item.total)}
                                                            </td>
                                                            <td className="p-4">
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => handleRemoveItem(item.id)}
                                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
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
                                        <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                            <div className="p-4 bg-white rounded-full inline-block shadow-sm mb-4">
                                                <ClipboardList className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <h4 className="text-lg font-medium text-gray-900 mb-2">No items added yet</h4>
                                            <p className="text-gray-500 mb-4">Add services from the catalog or create manual items</p>
                                            <Button type="button" variant="outline" onClick={handleAddManualItem}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add First Item
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Step 3: Summary & Totals */}
                        <Card className="border-l-4 border-l-orange-500 shadow-md">
                            <CardHeader className="bg-gradient-to-r from-orange-50/50 to-transparent">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Calculator className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Step 3: Summary & Totals</CardTitle>
                                        <CardDescription>Review totals, discounts, and finalize the bill</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Notes */}
                                    <div className="space-y-4">
                                        <Label htmlFor="notes" className="text-base font-semibold flex items-center gap-2">
                                            <FileText className="h-4 w-4 text-gray-500" />
                                            Additional Notes
                                        </Label>
                                        <Textarea
                                            id="notes"
                                            name="notes"
                                            value={data.notes}
                                            onChange={handleChange}
                                            placeholder="Enter any additional notes, special instructions, or payment terms..."
                                            rows={6}
                                            className="resize-none"
                                        />
                                    </div>

                                    {/* Totals Panel */}
                                    <div className="space-y-4">
                                        <div className="bg-gradient-to-br from-gray-50 to-white p-6 rounded-xl border shadow-sm">
                                            <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
                                                <Receipt className="h-5 w-5" />
                                                Bill Summary
                                            </h4>
                                            
                                            <div className="space-y-4">
                                                {/* Subtotal */}
                                                <div className="flex justify-between items-center py-2">
                                                    <span className="text-gray-600">Subtotal</span>
                                                    <span className="text-lg font-medium">{formatCurrencySimple(subtotal)}</span>
                                                </div>
                                                
                                                {/* Discount */}
                                                <div className="py-3 border-t border-gray-200">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-gray-600 flex items-center gap-2">
                                                            <Percent className="h-4 w-4" />
                                                            Discount
                                                        </span>
                                                        <span className="text-lg font-medium text-red-600">
                                                            -{formatCurrencySimple(discountAmount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <div className="relative flex-1">
                                                         <span className="text-2xl font-bold text-amber-600">؋</span>
                                                            <Input
                                                                type="number"
                                                                min="0"
                                                                value={data.discount}
                                                                onChange={handleChange}
                                                                name="discount"
                                                                className="pl-9"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                        <Select
                                                            value={data.discount_type}
                                                            onValueChange={(value) => setData('discount_type', value as 'fixed' | 'percentage')}
                                                        >
                                                            <SelectTrigger className="w-32">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="fixed">Fixed (؋)</SelectItem>
                                                                <SelectItem value="percentage">Percent (%)</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                
                                                {/* Tax */}
                                                <div className="py-3 border-t border-gray-200">
                                                    <div className="flex justify-between items-center mb-3">
                                                        <span className="text-gray-600">Tax</span>
                                                        <span className="text-lg font-medium">{formatCurrencySimple(taxAmount)}</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={data.tax_rate}
                                                            onChange={handleChange}
                                                            name="tax_rate"
                                                            className="w-24"
                                                        />
                                                        <span className="text-gray-500">%</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Grand Total */}
                                                <div className="border-t-2 border-gray-300 pt-4 mt-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-xl font-bold text-gray-900">Grand Total</span>
                                                        <span className="text-3xl font-bold text-blue-600">
                                                            {formatCurrencySimple(grandTotal)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Error Alert */}
                        {Object.keys(errors).length > 0 && (
                            <Alert variant="destructive" className="border-red-200 bg-red-50">
                                <AlertCircle className="h-5 w-5" />
                                <AlertDescription>
                                    <p className="font-semibold mb-2">Please fix the following errors:</p>
                                    <ul className="list-disc list-inside space-y-1">
                                        {Object.entries(errors).map(([key, value]) => (
                                            <li key={key} className="text-sm">{value}</li>
                                        ))}
                                    </ul>
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Submit Buttons */}
                        <div className="flex flex-col sm:flex-row justify-end gap-4 pt-6 border-t">
                            <Link href="/billing">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="lg"
                                    className="w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                            </Link>
                            <Button 
                                type="submit" 
                                disabled={processing || isLoading || billItems.length === 0}
                                size="lg"
                                className="bg-blue-600 hover:bg-blue-700 text-white px-8 w-full sm:w-auto"
                            >
                                <Save className="mr-2 h-5 w-5" />
                                {processing || isLoading ? 'Creating Bill...' : 'Create Bill'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </HospitalLayout>
    );
};

export default Create;
