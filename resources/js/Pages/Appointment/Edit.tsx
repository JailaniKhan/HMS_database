import { Head, useForm, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Heading from '@/components/heading';
import HospitalLayout from '@/layouts/HospitalLayout';
import { ArrowLeft, Save, Calendar as CalendarIcon, Clock, User, Stethoscope, FileText, DollarSign, Percent } from 'lucide-react';

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
}

interface Appointment {
    id: number;
    appointment_id: string;
    patient_id: number;
    doctor_id: number | null;
    appointment_date: string;
    appointment_time: string;
    status: string;
    reason: string;
    fee?: number;
    discount?: number;
    created_at: string;
    patient: Patient;
    doctor: Doctor | null;
}

interface AppointmentEditProps {
    appointment: Appointment;
    patients: Patient[];
    doctors: Doctor[];
}

export default function AppointmentEdit({ appointment, patients, doctors }: AppointmentEditProps) {
    const { data, setData, processing, errors } = useForm({
        patient_id: appointment.patient_id?.toString() ?? '',
        doctor_id: appointment.doctor_id?.toString() ?? '',
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        status: appointment.status,
        reason: appointment.reason ?? '',
        fee: appointment.fee?.toString() || '0',
        discount: appointment.discount?.toString() || '0',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.visit(`/appointments/${appointment.id}`, {
            method: 'post',
            data: {
                ...data,
                _method: 'PUT',
            },
            preserveScroll: true,
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
        
        // Auto-populate fee when doctor is changed
        if (name === 'doctor_id' && value) {
            const selectedDoctor = doctors.find(d => d.id.toString() === value);
            if (selectedDoctor && selectedDoctor.fees) {
                setData('fee', selectedDoctor.fees);
            }
        }
    };

    const calculateFinalFee = () => {
        const fee = parseFloat(data.fee) || 0;
        const discount = parseFloat(data.discount) || 0;
        
        // Validate discount is between 0-100
        if (discount < 0 || discount > 100) {
            return '0.00';
        }
        
        const discountAmount = (fee * discount) / 100;
        const finalFee = fee - discountAmount;
        
        // Ensure final fee is not negative
        return finalFee >= 0 ? finalFee.toFixed(2) : '0.00';
    };

    return (
        <HospitalLayout>
            <Head title={`Edit Appointment - ${appointment.appointment_id}`} />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title={`Editing Appointment: ${appointment.appointment_id}`} />
                            <p className="text-sm text-muted-foreground mt-1">Update appointment details and status</p>
                        </div>
                        
                        <Link href={`/appointments/${appointment.id}`}>
                            <Button variant="outline" className="shadow-sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Details
                            </Button>
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Patient & Doctor Information */}
                        <Card className="shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <User className="h-6 w-6 text-blue-600" />
                                    Patient & Doctor Details
                                </CardTitle>
                                <CardDescription className="text-base">Update the patient and doctor for this appointment</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="patient_id" className="text-base font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-blue-600" />
                                            Patient *
                                        </Label>
                                        <Select 
                                            value={data.patient_id} 
                                            onValueChange={(value) => handleSelectChange('patient_id', value)}
                                        >
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="Select patient" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {patients.map(patient => (
                                                    <SelectItem key={patient.id} value={patient.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs text-muted-foreground">{patient.patient_id}</span>
                                                            <span>-</span>
                                                            <span>{patient.full_name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.patient_id && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.patient_id}
                                            </p>
                                        )}
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <Label htmlFor="doctor_id" className="text-base font-semibold flex items-center gap-2">
                                            <Stethoscope className="h-4 w-4 text-green-600" />
                                            Doctor *
                                        </Label>
                                        <Select 
                                            value={data.doctor_id} 
                                            onValueChange={(value) => handleSelectChange('doctor_id', value)}
                                        >
                                            <SelectTrigger className="h-12">
                                                <SelectValue placeholder="Select doctor" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {doctors.map(doctor => (
                                                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-mono text-xs text-muted-foreground">{doctor.doctor_id}</span>
                                                            <span>-</span>
                                                            <span>Dr. {doctor.full_name}</span>
                                                            <span className="text-xs text-muted-foreground">({doctor.specialization})</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.doctor_id && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.doctor_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Appointment Schedule */}
                        <Card className="shadow-lg border-t-4 border-t-green-500">
                            <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <CalendarIcon className="h-6 w-6 text-green-600" />
                                    Appointment Schedule
                                </CardTitle>
                                <CardDescription className="text-base">Update the date and time for the appointment</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="appointment_date" className="text-base font-semibold flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-green-600" />
                                            Date *
                                        </Label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="appointment_date"
                                                name="appointment_date"
                                                type="date"
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
                                        <Label htmlFor="appointment_time" className="text-base font-semibold flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-blue-600" />
                                            Time *
                                        </Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="appointment_time"
                                                name="appointment_time"
                                                type="time"
                                                value={data.appointment_time}
                                                onChange={handleChange}
                                                className="pl-11 h-12 text-base"
                                            />
                                        </div>
                                        {errors.appointment_time && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.appointment_time}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Fee & Discount */}
                        <Card className="shadow-lg border-t-4 border-t-amber-500">
                            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <span className="text-2xl font-bold text-amber-600">؋</span>
                                    Fee & Discount
                                </CardTitle>
                                <CardDescription className="text-base">Consultation fee and applicable discount</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                            <span className="absolute left-3 top-3 text-lg font-bold text-muted-foreground">؋</span>
                                        <div className="relative">
                                            <span className="text-2xl font-bold text-amber-600">؋</span>
                                            <Input
                                                id="fee"
                                                name="fee"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.fee}
                                                onChange={handleChange}
                                                placeholder="0.00"
                                                className="pl-11 h-12 text-base"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">📌 Auto-updates when doctor changes</p>
                                        {errors.fee && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.fee}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="discount" className="text-base font-semibold">Discount (%)</Label>
                                        <div className="relative">
                                            <Percent className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                            <Input
                                                id="discount"
                                                name="discount"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max="100"
                                                value={data.discount}
                                                onChange={handleChange}
                                                placeholder="0"
                                                className="pl-11 h-12 text-base"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Enter percentage (0-100)</p>
                                        {errors.discount && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <span className="font-medium">⚠</span> {errors.discount}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-base font-semibold">Final Fee</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-3 h-5 w-5 text-green-600" />
                                            <Input
                                                value={calculateFinalFee()}
                                                placeholder="0.00"
                                                className="pl-11 h-12 text-base font-bold text-green-600 bg-green-50 border-green-200"
                                                readOnly
                                            />
                                        </div>
                                        <p className="text-xs text-green-600 font-medium">💰 Amount after discount</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Appointment Details */}
                        <Card className="shadow-lg border-t-4 border-t-purple-500">
                            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <FileText className="h-6 w-6 text-purple-600" />
                                    Appointment Details
                                </CardTitle>
                                <CardDescription className="text-base">Provide reason and status information</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="space-y-2">
                                    <Label htmlFor="reason" className="text-base font-semibold">Reason for Appointment *</Label>
                                    <Textarea
                                        id="reason"
                                        name="reason"
                                        value={data.reason}
                                        onChange={handleChange}
                                        placeholder="Describe the reason for the appointment"
                                        rows={4}
                                        className="resize-none text-base"
                                    />
                                    {errors.reason && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <span className="font-medium">⚠</span> {errors.reason}
                                        </p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="status" className="text-base font-semibold">Status *</Label>
                                    <Select 
                                        value={data.status} 
                                        onValueChange={(value) => handleSelectChange('status', value)}
                                    >
                                        <SelectTrigger className="h-12">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="scheduled">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                                    Scheduled
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="completed">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                    Completed
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="cancelled">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-red-500"></span>
                                                    Cancelled
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="rescheduled">
                                                <div className="flex items-center gap-2">
                                                    <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                                                    Rescheduled
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.status && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <span className="font-medium">⚠</span> {errors.status}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        
                        {/* Action Buttons */}
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
                                {processing ? 'Updating...' : 'Update Appointment'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </HospitalLayout>
    );
}