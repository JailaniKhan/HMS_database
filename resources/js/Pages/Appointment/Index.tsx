import { Head, Link, usePage } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { AppointmentPrintModal } from '@/components/appointment/AppointmentPrintModal';
import { Calendar, User, Stethoscope, PlusCircle, Search, Clock, Eye, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface Patient {
    id: number;
    patient_id: string;
    full_name: string;
}

interface Doctor {
    id: number;
    doctor_id: string;
    full_name: string;
}

interface Appointment {
    id: number;
    appointment_id: string;
    patient_id: number;
    doctor_id: number;
    appointment_date: string;
    appointment_time: string;
    status: string;
    reason: string;
    created_at: string;
    patient: Patient;
    doctor: Doctor;
}

interface AppointmentIndexProps {
    appointments: {
        data: Appointment[];
        links: Record<string, unknown>;
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
}

export default function AppointmentIndex({ appointments }: AppointmentIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printAppointment, setPrintAppointment] = useState<unknown>(null);
    
    const { props } = usePage();

    // Check for flash message on mount
    useEffect(() => {
        const flashProps = props as { flash?: { printAppointment?: unknown } };
        const flash = flashProps.flash;
        if (flash?.printAppointment && !printAppointment) {
            setPrintAppointment(flash.printAppointment);
            setShowPrintModal(true);
        }
    }, [props, printAppointment]);

    const filteredAppointments = appointments.data.filter(appointment =>
        appointment.appointment_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (appointment.patient?.patient_id?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false) ||
        (appointment.doctor?.doctor_id?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false) ||
        (appointment.patient?.full_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false) ||
        (appointment.doctor?.full_name?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false) ||
        (appointment.reason?.toLowerCase()?.includes(searchTerm.toLowerCase()) ?? false)
    );

    const formatDateTime = (dateString: string, timeString: string) => {
        const date = new Date(`${dateString}T${timeString}`);
        return date.toLocaleString('en-US', {
            weekday: 'short',
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

    // Calculate statistics
    const totalAppointments = appointments.meta?.total || 0;
    const scheduledCount = appointments.data.filter(a => a.status.toLowerCase() === 'scheduled').length;
    const completedCount = appointments.data.filter(a => a.status.toLowerCase() === 'completed').length;

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <Head title="Appointments" />
                
                {/* Header Section with gradient */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
                    <div>
                        <Heading title="Appointment Management" />
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage and monitor all appointments in the system
                        </p>
                    </div>
                    
                    <Link href="/appointments/create">
                        <Button className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Schedule New Appointment
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                                    <p className="text-2xl font-bold text-primary">{totalAppointments}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Scheduled</p>
                                    <p className="text-2xl font-bold text-blue-600">{scheduledCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                    <p className="text-2xl font-bold text-green-600">{completedCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card className="shadow-lg border-border/50 animate-slide-in-up">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="text-lg font-semibold">Appointments Directory</CardTitle>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by patient, doctor, or ID..."
                                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold w-[100px]">Appointment ID</TableHead>
                                        <TableHead className="font-semibold">Patient</TableHead>
                                        <TableHead className="font-semibold">Doctor</TableHead>
                                        <TableHead className="font-semibold">Date & Time</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="font-semibold">Reason</TableHead>
                                        <TableHead className="text-right font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                            </Table>
                        </div>
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableBody>
                                    {filteredAppointments.length > 0 ? (
                                        filteredAppointments.map((appointment) => (
                                            <TableRow key={appointment.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium">
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {appointment.appointment_id}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                            <User className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <span className="font-medium">
                                                            {appointment.patient?.full_name || 'Unknown Patient'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                                            <Stethoscope className="h-4 w-4 text-green-600" />
                                                        </div>
                                                        <span className="font-medium">
                                                            Dr. {appointment.doctor?.full_name || 'Not Assigned'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                                            {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(appointment.status)} className="capitalize">
                                                        {appointment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate text-sm text-muted-foreground" title={appointment.reason}>
                                                        {appointment.reason}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link href={`/appointments/${appointment.id}/edit`}>
                                                            <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600">
                                                                <Edit className="h-3 w-3 mr-1" />
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/appointments/${appointment.id}`}>
                                                            <Button variant="outline" size="sm" className="hover:bg-green-50 hover:text-green-600 hover:border-green-600">
                                                                <Eye className="h-3 w-3 mr-1" />
                                                                View
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Calendar className="h-8 w-8 text-muted-foreground/50" />
                                                    <p>No appointments found</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {appointments.meta && appointments.meta.last_page > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t bg-muted/30 gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong className="text-foreground">{appointments.meta?.from || 0}</strong> to <strong className="text-foreground">{appointments.meta?.to || 0}</strong> of{' '}
                                <strong className="text-foreground">{appointments.meta?.total || 0}</strong> appointments
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(appointments.meta?.current_page) || appointments.meta?.current_page <= 1}
                                    onClick={() => window.location.href = `/appointments?page=${(appointments.meta?.current_page || 1) - 1}`}
                                    className="hover:bg-primary hover:text-white"
                                >
                                    ← Previous
                                </Button>
                                
                                {/* Page Numbers */}
                                {Array.from({ length: Math.min(5, appointments.meta.last_page) }, (_, i) => {
                                    let pageNum: number;
                                    if (appointments.meta.last_page <= 5) {
                                        pageNum = i + 1;
                                    } else if (appointments.meta.current_page <= 3) {
                                        pageNum = i + 1;
                                    } else if (appointments.meta.current_page >= appointments.meta.last_page - 2) {
                                        pageNum = appointments.meta.last_page - 4 + i;
                                    } else {
                                        pageNum = appointments.meta.current_page - 2 + i;
                                    }
                                    
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={appointments.meta.current_page === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => window.location.href = `/appointments?page=${pageNum}`}
                                            className={appointments.meta.current_page === pageNum ? "bg-primary" : "hover:bg-primary hover:text-white"}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(appointments.meta?.current_page) || appointments.meta?.current_page >= (appointments.meta?.last_page || 1)}
                                    onClick={() => window.location.href = `/appointments?page=${(appointments.meta?.current_page || 1) + 1}`}
                                    className="hover:bg-primary hover:text-white"
                                >
                                    Next →
                                </Button>
                            </div>
                        </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Print Modal */}
            <AppointmentPrintModal
                isOpen={showPrintModal}
                onClose={() => setShowPrintModal(false)}
                appointment={printAppointment as Parameters<typeof AppointmentPrintModal>[0]['appointment']}
            />
        </HospitalLayout>
    );
}
