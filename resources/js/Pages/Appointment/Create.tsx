import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Heading from '@/components/heading';
import { ArrowLeft, Save, Calendar as CalendarIcon, User, Stethoscope, Percent, DollarSign } from 'lucide-react';

interface Patient {
    id: number;
    patient_id: string;
    first_name: string;
    father_name: string;
}

interface Doctor {
    id: number;
    full_name: string;
    specialization: string;
    fees: string;
}

interface Department {
    id: number;
    name: string;
}

interface AppointmentCreateProps {
    patients: Patient[];
    doctors: Doctor[];
    departments: Department[];
}

export default function AppointmentCreate({ patients, doctors, departments }: AppointmentCreateProps) {
    // Get current date and time
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    const { data, setData, post, processing, errors } = useForm({
        patient_id: '',
        doctor_id: '',
        department_id: '',
        appointment_date: currentDate + 'T' + currentTime,
        reason: '',
        notes: '',
        fee: '',
        discount: '0',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/appointments');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
        
        // Auto-populate fee when doctor is selected
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
        <>
            <Head title="Schedule New Appointment" />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Schedule New Appointment" />
                        <p className="text-sm text-muted-foreground mt-1">Create a new appointment for a patient</p>
                    </div>
                    
                    <Link href="/appointments">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Patient & Doctor Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Patient & Doctor Information
                            </CardTitle>
                            <CardDescription>Select the patient and doctor for this appointment</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Patient Selection with Search */}
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
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{patient.patient_id}</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {patient.first_name} {patient.father_name}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.patient_id && (
                                        <p className="text-sm text-red-600">{errors.patient_id}</p>
                                    )}
                                </div>
                                
                                {/* Doctor Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="doctor_id">Doctor *</Label>
                                    <Select 
                                        value={data.doctor_id} 
                                        onValueChange={(value) => handleSelectChange('doctor_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select doctor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctors.map(doctor => (
                                                <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                    <div className="flex items-center gap-2">
                                                        <Stethoscope className="h-4 w-4" />
                                                        <span>{doctor.full_name} ({doctor.specialization})</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.doctor_id && (
                                        <p className="text-sm text-red-600">{errors.doctor_id}</p>
                                    )}
                                </div>

                                {/* Department Selection */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="department_id">Department *</Label>
                                    <Select 
                                        value={data.department_id} 
                                        onValueChange={(value) => handleSelectChange('department_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select department" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {departments.map(dept => (
                                                <SelectItem key={dept.id} value={dept.id.toString()}>
                                                    {dept.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.department_id && (
                                        <p className="text-sm text-red-600">{errors.department_id}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Appointment Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5" />
                                Appointment Details
                            </CardTitle>
                            <CardDescription>Schedule date, time and reason for the appointment</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Date and Time */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="appointment_date">Appointment Date & Time *</Label>
                                    <div className="relative">
                                        <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="appointment_date"
                                            name="appointment_date"
                                            type="datetime-local"
                                            value={data.appointment_date}
                                            onChange={handleChange}
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.appointment_date && (
                                        <p className="text-sm text-red-600">{errors.appointment_date}</p>
                                    )}
                                </div>
                                
                                {/* Reason */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="reason">Reason for Appointment</Label>
                                    <Textarea
                                        id="reason"
                                        name="reason"
                                        value={data.reason}
                                        onChange={handleChange}
                                        placeholder="Describe the reason for the appointment"
                                        rows={3}
                                        className="resize-none"
                                    />
                                    {errors.reason && (
                                        <p className="text-sm text-red-600">{errors.reason}</p>
                                    )}
                                </div>

                                {/* Notes */}
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notes">Additional Notes</Label>
                                    <Textarea
                                        id="notes"
                                        name="notes"
                                        value={data.notes}
                                        onChange={handleChange}
                                        placeholder="Any additional notes or special requirements"
                                        rows={2}
                                        className="resize-none"
                                    />
                                    {errors.notes && (
                                        <p className="text-sm text-red-600">{errors.notes}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fee & Discount */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <DollarSign className="h-5 w-5" />
                                Fee & Discount
                            </CardTitle>
                            <CardDescription>Set the consultation fee and apply discount if applicable</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Fee */}
                                <div className="space-y-2">
                                    <Label htmlFor="fee">Consultation Fee *</Label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="fee"
                                            name="fee"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={data.fee}
                                            onChange={handleChange}
                                            placeholder="0.00"
                                            className="pl-8 bg-muted"
                                            readOnly
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground">Auto-filled from selected doctor</p>
                                    {errors.fee && (
                                        <p className="text-sm text-red-600">{errors.fee}</p>
                                    )}
                                </div>

                                {/* Discount */}
                                <div className="space-y-2">
                                    <Label htmlFor="discount">Discount (%)</Label>
                                    <div className="relative">
                                        <Percent className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
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
                                            className="pl-8"
                                        />
                                    </div>
                                    {errors.discount && (
                                        <p className="text-sm text-red-600">{errors.discount}</p>
                                    )}
                                </div>

                                {/* Final Fee */}
                                <div className="space-y-2">
                                    <Label>Final Amount *</Label>
                                    <div className="flex items-center h-10 px-3 py-2 border-2 border-primary rounded-md bg-primary/5">
                                        <DollarSign className="h-5 w-5 mr-2 text-primary" />
                                        <span className="font-bold text-xl text-primary">{calculateFinalFee()}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Amount after discount</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                            
                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4">
                        <Link href="/appointments">
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Scheduling...' : 'Schedule Appointment'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}
