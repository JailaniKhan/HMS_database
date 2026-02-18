import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Calendar, Clock, User, Stethoscope, FileText, ArrowLeft, Pencil } from 'lucide-react';

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
}

interface Department {
    id: number;
    name: string;
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
    created_at: string;
    updated_at: string;
    patient: Patient;
    doctor: Doctor | null;
    department: Department | null;
}

interface AppointmentShowProps {
    appointment: Appointment;
}

export default function AppointmentShow({ appointment }: AppointmentShowProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'scheduled':
                return 'secondary';
            case 'completed':
                return 'default';
            case 'cancelled':
                return 'destructive';
            case 'rescheduled':
                return 'outline';
            default:
                return 'outline';
        }
    };

    return (
        <HospitalLayout>
            <Head title={`Appointment Details - ${appointment.appointment_id}`} />
            
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <Heading title={`Appointment: ${appointment.appointment_id}`} />
                            <p className="text-sm text-muted-foreground mt-1">
                                View detailed information about this appointment
                            </p>
                        </div>
                        
                        <div className="flex space-x-2">
                            <Link href={`/appointments/${appointment.id}/edit`}>
                                <Button variant="outline" className="shadow-sm hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                </Button>
                            </Link>
                            
                            <Link href="/appointments">
                                <Button variant="outline" className="shadow-sm">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Appointments
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Appointment Information Card */}
                        <Card className="lg:col-span-2 shadow-lg border-t-4 border-t-blue-500">
                            <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <FileText className="h-6 w-6 text-blue-600" />
                                    Appointment Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6 pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Appointment ID</h3>
                                        <Badge variant="outline" className="text-base font-mono px-3 py-1">
                                            {appointment.appointment_id}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</h3>
                                        <Badge variant={getStatusBadgeVariant(appointment.status)} className="text-base px-3 py-1 capitalize">
                                            {appointment.status}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Date</h3>
                                        <div className="flex items-center gap-2 text-base">
                                            <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                                                <Calendar className="h-5 w-5 text-green-600" />
                                            </div>
                                            <span className="font-medium">{new Date(appointment.appointment_date).toLocaleDateString('en-US', {
                                                weekday: 'long',
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Time</h3>
                                        <div className="flex items-center gap-2 text-base">
                                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                <Clock className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <span className="font-medium">{appointment.appointment_time}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-3 pt-4 border-t">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Reason for Appointment</h3>
                                    <div className="bg-muted/50 rounded-lg p-4">
                                        <p className="text-base leading-relaxed">{appointment.reason}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Patient and Doctor Information Card */}
                        <div className="space-y-6">
                            {/* Patient Information */}
                            <Card className="shadow-lg border-l-4 border-l-blue-500">
                                <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50">
                                    <CardTitle className="flex items-center gap-2">
                                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <div className="text-lg">Patient Information</div>
                                            <div className="text-xs font-normal text-muted-foreground">Patient details</div>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient ID</h3>
                                        <Badge variant="outline" className="font-mono">{appointment.patient.patient_id}</Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</h3>
                                        <p className="font-semibold text-lg">{appointment.patient.full_name}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Doctor / Department Information */}
                            <Card className={`shadow-lg border-l-4 ${appointment.doctor ? 'border-l-green-500' : 'border-l-purple-500'}`}>
                                <CardHeader className={`bg-gradient-to-r ${appointment.doctor ? 'from-green-50 to-emerald-50' : 'from-purple-50 to-violet-50'}`}>
                                    <CardTitle className="flex items-center gap-2">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${appointment.doctor ? 'bg-green-500/10' : 'bg-purple-500/10'}`}>
                                            <Stethoscope className={`h-5 w-5 ${appointment.doctor ? 'text-green-600' : 'text-purple-600'}`} />
                                        </div>
                                        <div>
                                            <div className="text-lg">{appointment.doctor ? 'Doctor Information' : 'Department Information'}</div>
                                            <div className="text-xs font-normal text-muted-foreground">
                                                {appointment.doctor ? 'Attending physician' : 'Service department'}
                                            </div>
                                        </div>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 pt-6">
                                    {appointment.doctor ? (
                                        <>
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Doctor ID</h3>
                                                <Badge variant="outline" className="font-mono">{appointment.doctor.doctor_id}</Badge>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</h3>
                                                <p className="font-semibold text-lg">Dr. {appointment.doctor.full_name}</p>
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Specialization</h3>
                                                <Badge variant="secondary" className="capitalize">
                                                    {appointment.doctor.specialization?.replace(/-/g, ' ') || 'N/A'}
                                                </Badge>
                                            </div>
                                        </>
                                    ) : appointment.department ? (
                                        <div className="space-y-2">
                                            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Department</h3>
                                            <p className="font-semibold text-lg text-purple-700">{appointment.department.name}</p>
                                            <p className="text-sm text-muted-foreground italic">No doctor assigned</p>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground italic">Not Assigned</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Additional Information Section */}
                    <Card className="shadow-lg">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle>Additional Information</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Created
                                    </h3>
                                    <p className="text-base">{formatDate(appointment.created_at)}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Last Updated
                                    </h3>
                                    <p className="text-base">{formatDate(appointment.updated_at)}</p>
                                </div>
                            </div>
                            
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                                <h4 className="font-semibold mb-2 flex items-center gap-2 text-blue-900">
                                    <FileText className="h-5 w-5" />
                                    Appointment Notes
                                </h4>
                                <p className="text-sm text-blue-800 leading-relaxed">
                                    This appointment is scheduled for {appointment.patient.full_name}
                                    {appointment.doctor
                                        ? ` with Dr. ${appointment.doctor.full_name}`
                                        : appointment.department
                                            ? ` at the ${appointment.department.name} department`
                                            : ''
                                    }.
                                    Please ensure all necessary preparations are completed before the appointment time.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HospitalLayout>
    );
}