import { Head, useForm, Link, router } from '@inertiajs/react';
import { useState, useCallback, useEffect } from 'react';
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
import Heading from '@/components/heading';
import HospitalLayout from '@/layouts/HospitalLayout';
import { BillItemManager } from './Components/BillItemManager';
import { BillSummary } from '@/components/billing/BillSummary';
import { useBillCalculations } from '@/hooks/billing/useBillCalculations';
import {
    ArrowLeft,
    Save,
    DollarSign,
    Calendar as CalendarIcon,
    AlertCircle,
    User,
    Stethoscope,
    Shield,
} from 'lucide-react';

interface CreateProps {
    patients: Array<{
        id: number;
        patient_id: string;
        first_name: string;
        last_name: string;
    }>;
}

const Create = ({ patients }: CreateProps) => {
    const { data, setData, post, processing, errors } = useForm({
        patient_id: '',
        due_date: '',
        total_amount: 0,
        discount: 0,
        tax: 0,
        net_amount: 0,
        status: 'pending',
        notes: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/billing');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, name === 'total_amount' || name === 'discount' || name === 'tax' ? parseFloat(value) || 0 : value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    // Calculate net amount when total, discount, or tax changes
    const calculateNetAmount = () => {
        const total = data.total_amount || 0;
        const discount = data.discount || 0;
        const tax = data.tax || 0;
        const net = total - discount + tax;
        setData('net_amount', net);
    };

    // Recalculate when relevant fields change
    useEffect(() => {
        calculateNetAmount();
    }, [data.total_amount, data.discount, data.tax]);

    return (
        <>
            <Head title="Create New Bill" />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Create New Bill" />
                    
                    <Link href="/billing">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Bills
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Bill Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="patient_id">Patient *</Label>
                                    <Select 
                                        value={data.patient_id} 
                                        onValueChange={(value) => handleSelectChange('patient_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select patient" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {patients.map(patient => (
                                                <SelectItem key={patient.id} value={patient.id.toString()}>
                                                    {patient.patient_id} - {patient.first_name} {patient.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.patient_id && (
                                        <p className="text-sm text-red-600">{errors.patient_id}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date *</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="due_date"
                                            name="due_date"
                                            type="date"
                                            value={data.due_date}
                                            onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.due_date && (
                                        <p className="text-sm text-red-600">{errors.due_date}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="total_amount">Total Amount *</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="total_amount"
                                            name="total_amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.total_amount}
                                            onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.total_amount && (
                                        <p className="text-sm text-red-600">{errors.total_amount}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="discount">Discount</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="discount"
                                            name="discount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.discount}
                                            onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.discount && (
                                        <p className="text-sm text-red-600">{errors.discount}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="tax">Tax</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="tax"
                                            name="tax"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.tax}
                                            onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.tax && (
                                        <p className="text-sm text-red-600">{errors.tax}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="net_amount">Net Amount</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="net_amount"
                                            name="net_amount"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.net_amount.toFixed(2)}
                                            readOnly
                                            className="pl-8 bg-gray-100"
                                        />
                                    </div>
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select 
                                        value={data.status} 
                                        onValueChange={(value) => handleSelectChange('status', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="paid">Paid</SelectItem>
                                            <SelectItem value="overdue">Overdue</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-red-600">{errors.status}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Notes</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        value={data.notes}
                                        onChange={handleChange}
                                        placeholder="Enter any additional notes for this bill"
                                        rows={3}
                                    />
                                    {errors.notes && (
                                        <p className="text-sm text-red-600">{errors.notes}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-4 pt-4">
                                <Link href="/billing">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Create Bill'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}