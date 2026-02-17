import { Head, useForm, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Combobox, type ComboboxOption } from '@/components/ui/combobox';
import Heading from '@/components/heading';
import HospitalLayout from '@/layouts/HospitalLayout';
import { AppointmentPrintModal } from '@/components/appointment/AppointmentPrintModal';
import { DepartmentPrint } from '@/components/appointment/DepartmentPrint';
import { useToast } from '@/components/Toast';
import { 
    ArrowLeft, 
    Save, 
    Calendar as CalendarIcon, 
    User, 
    Stethoscope, 
    Percent, 
    Users, 
    Building2,
    Plus,
    Trash2,
    Package,
    Calculator,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';

interface Patient {
    id: number;
    patient_id: string;
    full_name: string;
}

interface Doctor {
    id: number;
    doctor_id: string;
    full_name: string;
    specialization: string;
    fees: string;
    department_id: number;
}

interface DepartmentService {
    id: number;
    department_id: number;
    name: string;
    base_cost: string;
}

interface Department {
    id: number;
    name: string;
    services: DepartmentService[];
}

interface SelectedService {
    id: string;
    department_service_id: string;
    name: string;
    custom_cost: string;
    discount_percentage: string;
    final_cost: number;
}

interface SubmitService {
    department_service_id: string;
    custom_cost: number;
    discount_percentage: number;
}

interface PrintAppointment {
    appointment_id: string;
    patient?: {
        first_name: string;
        father_name?: string;
        gender?: string;
        age?: number;
    };
    doctor?: {
        id?: number;
        full_name: string;
    };
    department?: {
        name: string;
    };
    services?: Array<{
        id: number;
        name: string;
        pivot: {
            custom_cost: number;
            discount_percentage: number;
            final_cost: number;
        };
    }>;
    appointment_date: string;
    fee: number;
    discount: number;
    grand_total?: number;
    created_at?: string;
}

interface AppointmentCreateProps {
    patients: Patient[];
    doctors: Doctor[];
    departments: Department[];
    printAppointment?: PrintAppointment;
}

// Extended page props for Inertia
interface PageProps {
    flash?: { success?: string; error?: string };
    printAppointment?: PrintAppointment;
}

interface FormData {
    patient_id: string;
    doctor_id: string;
    department_id: string;
    appointment_date: string;
    reason: string;
    notes: string;
    fee: string;
    discount: string;
    discount_type: 'percentage' | 'fixed';
    discount_fixed: string;
    services: SubmitService[];
}

export default function AppointmentCreate({ patients, doctors, departments, printAppointment: initialPrintAppointment }: AppointmentCreateProps) {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    // Get page props for flash messages and printAppointment from Inertia
    const pageProps = usePage().props as PageProps;
    const { showSuccess } = useToast();
    
    // Get printAppointment from page props (updated automatically by Inertia after form submission)
    const printAppointment = pageProps.printAppointment || initialPrintAppointment;
    
    // Separate state for managing services in the UI
    const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
    // Initialize with printAppointment value - will show modal if appointment was created
    const [showPrintModal, setShowPrintModal] = useState(false);
    // Track which print modal to show based on whether services were added
    const [printType, setPrintType] = useState<'doctor' | 'department' | null>(null);
    // Track if form was successfully submitted - only show print modal after submission
    const [hasSubmitted, setHasSubmitted] = useState(false);
    
    // Show toast when appointment is created successfully
    useEffect(() => {
        console.log('[DEBUG] Page props updated:', pageProps);
        console.log('[DEBUG] Flash message:', pageProps.flash?.success);
        console.log('[DEBUG] Print appointment:', printAppointment);
        
        if (pageProps.flash?.success) {
            showSuccess('Appointment Created', pageProps.flash.success);
        }
    }, [pageProps.flash?.success, printAppointment, showSuccess]);
    
    // Show print modal only after form submission succeeds
    useEffect(() => {
        if (printAppointment && hasSubmitted) {
            console.log('[DEBUG] Showing print modal for:', printAppointment.appointment_id);
            console.log('[DEBUG] Print appointment services:', printAppointment.services);
            
            // Logic to determine which print modal to show:
            // 1. If there are services (selectedServices.length > 0) → Department Print
            // 2. If there's a doctor selected (data.doctor_id is set) AND no services → Doctor Print
            // 3. If there's no doctor but there are services → Department Print
            
            // Check services from backend response
            const hasServices = (printAppointment.services && printAppointment.services.length > 0);
            
            console.log('[DEBUG] Has services (from backend):', hasServices);
            console.log('[DEBUG] Print appointment doctor info:', printAppointment.doctor);
            
            // Determine print type based on requirements
            // 1. If services are selected → Department Print (regardless of doctor selection)
            // 2. If no services but doctor is selected → Doctor Print
            // 3. If no doctor but services are selected → Department Print (covered by #1)
            
            let determinedPrintType: 'doctor' | 'department' = 'doctor';
            
            if (hasServices) {
                // Priority 1: If there are services, always use Department Print regardless of doctor
                determinedPrintType = 'department';
            } else if (printAppointment.doctor) {
                // Priority 2: If no services but doctor is selected, use Doctor Print
                determinedPrintType = 'doctor';
            } else {
                // Fallback: If no services and no doctor, default to department if available
                determinedPrintType = printAppointment.department ? 'department' : 'doctor';
            }
            
            console.log('[DEBUG] Determined print type:', determinedPrintType);
            
            setTimeout(() => {
                setPrintType(determinedPrintType);
                setShowPrintModal(true);
                setHasSubmitted(false); // Reset after showing
            }, 0);
        }
    }, [printAppointment, hasSubmitted]);
    
    const { data, setData, post, processing, errors } = useForm<FormData>({
        patient_id: '',
        doctor_id: '',
        department_id: '',
        appointment_date: currentDate + 'T' + currentTime,
        reason: '',
        notes: '',
        fee: '',
        discount: '0',
        discount_type: 'percentage',
        discount_fixed: '0',
        services: [] as SubmitService[],
    });

    // Get available services for selected department
    const availableServices = useMemo(() => {
        if (!data.department_id) return [];
        const department = departments.find(d => d.id.toString() === data.department_id);
        return department?.services || [];
    }, [data.department_id, departments]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        console.log('[DEBUG] Form submission started');
        console.log('[DEBUG] Form data:', JSON.stringify(data, null, 2));
        console.log('[DEBUG] Selected services:', JSON.stringify(selectedServices, null, 2));
        
        // Calculate totals to get final fee value
        const totals = calculateTotals();
        console.log('[DEBUG] Calculated totals:', totals);
        
        // If using services, set the fee from grand total
        if (selectedServices.length > 0 && !data.fee) {
            setData('fee', totals.grandTotal.toString());
        }
        
        console.log('[DEBUG] Submitting to /appointments');
        
        // Submit the form - services data is sent via hidden input
        post('/appointments', {
            onStart: () => console.log('[DEBUG] Request started'),
            onSuccess: () => {
                console.log('[DEBUG] Request succeeded');
                // Mark form as submitted successfully - this triggers the print modal
                setHasSubmitted(true);
            },
            onError: (errors) => console.error('[DEBUG] Request errors:', errors),
            onFinish: () => console.log('[DEBUG] Request finished'),
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const handleComboboxChange = (name: string, value: string) => {
        // Convert "0" to empty string (when nothing is selected in combobox)
        const finalValue = value === '0' ? '' : value;
        setData(name as keyof typeof data, finalValue);
        
        // Auto-populate fee when doctor is selected
        if (name === 'doctor_id' && value) {
            const selectedDoctor = doctors.find(d => d.id.toString() === value);
            if (selectedDoctor && selectedDoctor.fees) {
                setData('fee', selectedDoctor.fees);
            }
        }
        
        // Clear services when department changes
        if (name === 'department_id') {
            setSelectedServices([]);
            if (data.doctor_id) {
                const selectedDoctor = doctors.find(d => d.id.toString() === data.doctor_id);
                if (selectedDoctor && selectedDoctor.department_id?.toString() !== value) {
                    setData('doctor_id', '');
                    setData('fee', '');
                }
            }
        }
    };

    const addService = () => {
        const newService: SelectedService = {
            id: Date.now().toString(),
            department_service_id: '',
            name: '',
            custom_cost: '',
            discount_percentage: '0',
            final_cost: 0,
        };
        
        setSelectedServices([...selectedServices, newService]);
    };

    const removeService = (id: string) => {
        setSelectedServices(selectedServices.filter(s => s.id !== id));
    };

    const updateService = (id: string, field: keyof SelectedService, value: string) => {
        setSelectedServices(prev => prev.map(service => {
            if (service.id !== id) return service;
            
            const updated = { ...service, [field]: value };
            
            if (field === 'department_service_id' && value) {
                const deptService = availableServices.find(s => s.id.toString() === value);
                if (deptService) {
                    updated.name = deptService.name;
                    updated.custom_cost = deptService.base_cost;
                }
            }
            
            const cost = parseFloat(updated.custom_cost) || 0;
            const discount = parseFloat(updated.discount_percentage) || 0;
            const discountAmount = cost * (discount / 100);
            updated.final_cost = Math.max(0, cost - discountAmount);
            
            return updated;
        }));
    };

    const calculateTotals = () => {
        if (selectedServices.length > 0) {
            const subtotal = selectedServices.reduce((sum, s) => sum + (parseFloat(s.custom_cost) || 0), 0);
            const servicesDiscount = selectedServices.reduce((sum, s) => {
                const cost = parseFloat(s.custom_cost) || 0;
                const discount = parseFloat(s.discount_percentage) || 0;
                return sum + (cost * discount / 100);
            }, 0);
            
            let additionalDiscount = 0;
            if (data.discount_type === 'percentage') {
                const discountPercent = parseFloat(data.discount) || 0;
                additionalDiscount = subtotal * (discountPercent / 100);
            } else {
                additionalDiscount = parseFloat(data.discount_fixed) || 0;
            }
            
            const totalDiscount = servicesDiscount + additionalDiscount;
            const grandTotal = Math.max(0, subtotal - totalDiscount);
            
            return {
                subtotal,
                totalDiscount,
                grandTotal,
                isServiceBased: true,
            };
        } else {
            const fee = parseFloat(data.fee) || 0;
            let discountAmount = 0;
            
            if (data.discount_type === 'percentage') {
                const discountPercent = parseFloat(data.discount) || 0;
                discountAmount = fee * (discountPercent / 100);
            } else {
                discountAmount = parseFloat(data.discount_fixed) || 0;
            }
            
            const finalFee = Math.max(0, fee - discountAmount);
            
            return {
                subtotal: fee,
                totalDiscount: discountAmount,
                grandTotal: finalFee,
                isServiceBased: false,
            };
        }
    };

    const totals = calculateTotals();

    const patientOptions: ComboboxOption[] = patients.map(patient => ({
        value: patient.id.toString(),
        label: patient.full_name,
        subtitle: `ID: ${patient.patient_id}`,
        icon: <User className="h-4 w-4 text-blue-600" />
    }));

    const doctorOptions: ComboboxOption[] = doctors.map(doctor => ({
        value: doctor.id.toString(),
        label: `Dr. ${doctor.full_name}`,
        subtitle: `${doctor.specialization} • ID: ${doctor.doctor_id}`,
        icon: <Stethoscope className="h-4 w-4 text-green-600" />
    }));

    const departmentOptions: ComboboxOption[] = departments.map(dept => ({
        value: dept.id.toString(),
        label: dept.name,
        icon: <Building2 className="h-4 w-4 text-purple-600" />
    }));

    const getAvailableServiceOptions = (currentServiceId: string) => {
        const selectedIds = selectedServices
            .filter(s => s.id !== currentServiceId)
            .map(s => s.department_service_id);
        
        return availableServices
            .filter(s => !selectedIds.includes(s.id.toString()))
            .map(s => ({
                value: s.id.toString(),
                label: s.name,
                subtitle: `؋${s.base_cost}`,
                icon: <Package className="h-4 w-4 text-amber-600" />
            }));
    };

    return (
        <HospitalLayout>
            <Head title="Schedule New Appointment" />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title="Schedule New Appointment" />
                            <p className="text-sm text-muted-foreground mt-1">Create a new appointment for a patient with their preferred doctor</p>
                        </div>
                        
                        <Link href="/appointments">
                            <Button variant="outline" size="sm" className="shadow-sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Appointments
                            </Button>
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Hidden inputs for services data */}
                        <input type="hidden" name="services" value={JSON.stringify(selectedServices.map(s => ({
                            department_service_id: s.department_service_id,
                            custom_cost: parseFloat(s.custom_cost) || 0,
                            discount_percentage: parseFloat(s.discount_percentage) || 0,
                        })))} />
                        <Card className="shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Users className="h-6 w-6 text-blue-600" />
                                    Patient & Doctor Selection
                                </CardTitle>
                                <CardDescription className="text-base">Search and select the patient and attending doctor</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="patient_id" className="text-base font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-blue-600" />
                                            Patient 
                                        </Label>
                                        <Combobox
                                            options={patientOptions}
                                            value={data.patient_id}
                                            onValueChange={(value) => handleComboboxChange('patient_id', value)}
                                            placeholder="Search for a patient..."
                                            searchPlaceholder="Type to search patients..."
                                            emptyText="No patients found"
                                            className="h-auto py-3"
                                        />
                                        {errors.patient_id && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.patient_id}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Search by patient name or ID</p>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="department_id" className="text-base font-semibold flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-purple-600" />
                                            Department <span className="text-green-600 text-xs font-normal">(Optional)</span>
                                        </Label>
                                        <Combobox
                                            options={departmentOptions}
                                            value={data.department_id}
                                            onValueChange={(value) => handleComboboxChange('department_id', value)}
                                            placeholder="Select department..."
                                            searchPlaceholder="Search departments..."
                                            emptyText="No departments found"
                                            className="h-auto py-3"
                                        />
                                        {errors.department_id && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.department_id}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">Select a department (optional - leave empty for general appointment)</p>
                                    </div>

                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="doctor_id" className="text-base font-semibold flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-green-600" />
                                            Doctor <span className="text-green-600 text-xs font-normal">(Optional)</span>
                                        </Label>
                                        <Combobox
                                            options={doctorOptions}
                                            value={data.doctor_id}
                                            onValueChange={(value) => handleComboboxChange('doctor_id', value)}
                                            placeholder="Search for a doctor..."
                                            searchPlaceholder="Type to search doctors..."
                                            emptyText="No doctors found"
                                            className="h-auto py-3"
                                            disabled={false}
                                        />
                                        {errors.doctor_id && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.doctor_id}
                                            </p>
                                        )}
                                        <p className="text-xs text-muted-foreground">
                                            {data.doctor_id 
                                                ? "Doctor's fee will be automatically populated" 
                                                : "Select a specific doctor (optional - leave empty for department-only appointment)"}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-t-4 border-t-green-500">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <CalendarIcon className="h-6 w-6 text-green-600" />
                                    Appointment Details
                                </CardTitle>
                                <CardDescription className="text-base">Schedule date, time and reason for the appointment</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="appointment_date" className="text-base font-semibold flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-green-600" />
                                            Appointment Date & Time *
                                        </Label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="appointment_date"
                                                name="appointment_date"
                                                type="datetime-local"
                                                value={data.appointment_date}
                                                onChange={handleChange}
                                                className="pl-11 h-12 text-base"
                                            />
                                        </div>
                                        {errors.appointment_date && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.appointment_date}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="reason" className="text-base font-semibold">Reason for Appointment</Label>
                                        <Textarea
                                            id="reason"
                                            name="reason"
                                            value={data.reason}
                                            onChange={handleChange}
                                            placeholder="Describe the reason for the appointment (e.g., routine checkup, follow-up, consultation)"
                                            rows={3}
                                            className="resize-none text-base"
                                        />
                                        {errors.reason && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.reason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-t-4 border-t-indigo-500">
                            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Package className="h-6 w-6 text-indigo-600" />
                                    Department Services
                                </CardTitle>
                                <CardDescription className="text-base">
                                    Add department services to the appointment (optional)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {!data.department_id ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>Please select a department first to view available services</p>
                                    </div>
                                ) : availableServices.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No services available for this department</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">
                                                {selectedServices.length} service(s) added
                                            </span>
                                            <Button
                                                type="button"
                                                onClick={addService}
                                                disabled={availableServices.length === 0}
                                                variant="outline"
                                                className="bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Add Service
                                            </Button>
                                        </div>

                                        {selectedServices.length > 0 && (
                                            <div className="space-y-4">
                                                {selectedServices.map((service, index) => (
                                                    <div 
                                                        key={service.id} 
                                                        className="border rounded-lg p-4 bg-gray-50/50 space-y-4"
                                                    >
                                                        <div className="flex justify-between items-center">
                                                            <span className="font-semibold text-indigo-700">
                                                                Service #{index + 1}
                                                            </span>
                                                            <Button
                                                                type="button"
                                                                onClick={() => removeService(service.id)}
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        
                                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                                            <div className="md:col-span-2">
                                                                <Label className="text-sm font-medium">Service</Label>
                                                                <Combobox
                                                                    options={getAvailableServiceOptions(service.id)}
                                                                    value={service.department_service_id}
                                                                    onValueChange={(value) => updateService(service.id, 'department_service_id', value)}
                                                                    placeholder="Select a service..."
                                                                    searchPlaceholder="Search services..."
                                                                    emptyText="No services available"
                                                                />
                                                            </div>
                                                            
                                                            <div>
                                                                <Label className="text-sm font-medium">Cost (؋)</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={service.custom_cost}
                                                                    onChange={(e) => updateService(service.id, 'custom_cost', e.target.value)}
                                                                    placeholder="0.00"
                                                                />
                                                            </div>
                                                            
                                                            <div>
                                                                <Label className="text-sm font-medium">Discount (%)</Label>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max="100"
                                                                    value={service.discount_percentage}
                                                                    onChange={(e) => updateService(service.id, 'discount_percentage', e.target.value)}
                                                                    placeholder="0"
                                                                />
                                                            </div>
                                                        </div>
                                                        
                                                        <div className="flex justify-end items-center gap-2 text-sm">
                                                            <span className="text-muted-foreground">Final Cost:</span>
                                                            <span className="font-bold text-indigo-700 text-lg">
                                                                ؋{service.final_cost.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {errors.services && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.services}
                                            </p>
                                        )}
                                    </>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="shadow-lg border-t-4 border-t-amber-500">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <Calculator className="h-6 w-6 text-amber-600" />
                                    Cost Summary
                                </CardTitle>
                                <CardDescription className="text-base">
                                    {totals.isServiceBased 
                                        ? "Total calculated from selected services" 
                                        : "Consultation fee and discount"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                {!totals.isServiceBased ? (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="fee" className="text-base font-semibold">
                                                Consultation Fee {data.doctor_id ? '' : '*'}
                                            </Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-3 text-lg font-bold text-muted-foreground">؋</span>
                                                <Input
                                                    id="fee"
                                                    name="fee"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    value={data.fee}
                                                    onChange={handleChange}
                                                    placeholder="0.00"
                                                    className={`pl-11 h-12 text-base ${!data.doctor_id ? '' : 'bg-muted/50'}`}
                                                    readOnly={!!data.doctor_id}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {data.doctor_id 
                                                    ? "📌 Auto-filled from selected doctor" 
                                                    : "Enter consultation fee manually"}
                                            </p>
                                            {errors.fee && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {errors.fee}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-base font-semibold">Discount Type</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant={data.discount_type === 'percentage' ? 'default' : 'outline'}
                                                    onClick={() => setData('discount_type', 'percentage')}
                                                    className="flex-1 h-12 text-sm"
                                                >
                                                    <Percent className="h-4 w-4 mr-1" />
                                                    Percentage
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant={data.discount_type === 'fixed' ? 'default' : 'outline'}
                                                    onClick={() => setData('discount_type', 'fixed')}
                                                    className="flex-1 h-12 text-sm"
                                                >
                                                    <span className="mr-1">؋</span>
                                                    Fixed
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="discount_value" className="text-base font-semibold">
                                                Discount {data.discount_type === 'percentage' ? '(%)' : '(؋)'}
                                            </Label>
                                            <div className="relative">
                                                {data.discount_type === 'percentage' ? (
                                                    <Percent className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                                ) : (
                                                    <span className="absolute left-3 top-3 text-lg font-bold text-muted-foreground">؋</span>
                                                )}
                                                <Input
                                                    id="discount_value"
                                                    name={data.discount_type === 'percentage' ? 'discount' : 'discount_fixed'}
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max={data.discount_type === 'percentage' ? 100 : undefined}
                                                    value={data.discount_type === 'percentage' ? data.discount : data.discount_fixed}
                                                    onChange={handleChange}
                                                    placeholder="0"
                                                    className="pl-11 h-12 text-base"
                                                />
                                            </div>
                                            {errors.discount && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <span className="font-medium">⚠</span> {errors.discount}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2 md:col-start-3">
                                            <Label className="text-base font-semibold">Final Amount *</Label>
                                            <div className="flex items-center h-12 px-4 py-3 border-2 border-amber-500 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
                                                <span className="text-2xl font-bold mr-2 text-amber-600">؋</span>
                                                <span className="font-bold text-2xl text-amber-700">{totals.grandTotal.toFixed(2)}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">💰 Amount after discount</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            {selectedServices.map((service, index) => (
                                                <div key={service.id} className="flex justify-between items-center py-2 border-b last:border-0">
                                                    <div>
                                                        <span className="font-medium">{service.name || `Service #${index + 1}`}</span>
                                                        <span className="text-sm text-muted-foreground ml-2">
                                                            (؋{parseFloat(service.custom_cost || '0').toFixed(2)} 
                                                            {parseFloat(service.discount_percentage || '0') > 0 && (
                                                                <span className="text-green-600"> - {service.discount_percentage}%</span>
                                                            )})
                                                        </span>
                                                    </div>
                                                    <span className="font-semibold">؋{service.final_cost.toFixed(2)}</span>
                                                </div>
                                            ))}
                                        </div>
                                        
                                        <div className="border-t pt-4 space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-sm font-semibold">Additional Discount Type</Label>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant={data.discount_type === 'percentage' ? 'default' : 'outline'}
                                                            onClick={() => setData('discount_type', 'percentage')}
                                                            className="flex-1 h-10 text-xs"
                                                        >
                                                            <Percent className="h-3 w-3 mr-1" />
                                                            Percentage
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant={data.discount_type === 'fixed' ? 'default' : 'outline'}
                                                            onClick={() => setData('discount_type', 'fixed')}
                                                            className="flex-1 h-10 text-xs"
                                                        >
                                                            <span className="mr-1">؋</span>
                                                            Fixed
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor="discount_value_services" className="text-sm font-semibold">
                                                        Additional Discount {data.discount_type === 'percentage' ? '(%)' : '(؋)'}
                                                    </Label>
                                                    <div className="relative">
                                                        {data.discount_type === 'percentage' ? (
                                                            <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                        ) : (
                                                            <span className="absolute left-3 top-2 text-base font-bold text-muted-foreground">؋</span>
                                                        )}
                                                        <Input
                                                            id="discount_value_services"
                                                            name={data.discount_type === 'percentage' ? 'discount' : 'discount_fixed'}
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max={data.discount_type === 'percentage' ? 100 : undefined}
                                                            value={data.discount_type === 'percentage' ? data.discount : data.discount_fixed}
                                                            onChange={handleChange}
                                                            placeholder="0"
                                                            className="pl-10 h-10 text-sm"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Subtotal:</span>
                                                <span className="font-medium">؋{totals.subtotal.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm text-green-600">
                                                <span>Total Discount:</span>
                                                <span className="font-medium">-؋{totals.totalDiscount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center pt-2 border-t">
                                                <span className="text-lg font-bold">Grand Total:</span>
                                                <div className="flex items-center h-12 px-6 py-3 border-2 border-amber-500 rounded-lg bg-gradient-to-r from-amber-50 to-orange-50 shadow-sm">
                                                    <span className="text-2xl font-bold mr-2 text-amber-600">؋</span>
                                                    <span className="font-bold text-2xl text-amber-700">{totals.grandTotal.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                                
                        <div className="flex justify-end space-x-4 pb-8">
                            <Link href="/appointments">
                                <Button type="button" variant="outline" size="lg" className="shadow-md">
                                    Cancel
                                </Button>
                            </Link>
                            <Button 
                                type="submit" 
                                disabled={processing} 
                                size="lg"
                                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg text-white"
                            >
                                <Save className="mr-2 h-5 w-5" />
                                {processing ? 'Scheduling...' : 'Schedule Appointment'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Show appropriate print modal based on whether services were selected */}
            {printType === 'department' && (
                <DepartmentPrint
                    isOpen={showPrintModal}
                    onClose={() => { setShowPrintModal(false); setPrintType(null); }}
                    appointment={printAppointment ?? null}
                />
            )}

            {printType === 'doctor' && (
                <AppointmentPrintModal
                    isOpen={showPrintModal}
                    onClose={() => { setShowPrintModal(false); setPrintType(null); }}
                    appointment={printAppointment ?? null}
                />
            )}
        </HospitalLayout>
    );
}
