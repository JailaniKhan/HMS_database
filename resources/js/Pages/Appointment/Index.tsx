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
import { Calendar, User, Stethoscope, PlusCircle, Search, Clock, Eye, Edit, CalendarDays, DollarSign } from 'lucide-react';
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

interface Department {
    id: number;
    name: string;
}

interface Service {
    id: number;
    name: string;
    pivot: {
        custom_cost: number;
        discount_percentage: number;
        final_cost: number;
    };
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
    doctor: Doctor | null;
    department: Department | null;
    services: Service[];
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
    is_super_admin?: boolean;
    stats?: {
        today_appointments: number;
        today_revenue: number;
        scheduled_count: number;
        completed_count: number;
        cancelled_count: number;
        total_count: number;
    };
}

export default function AppointmentIndex({ appointments, stats }: AppointmentIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [printAppointment, setPrintAppointment] = useState<unknown>(null);
    
    const { props } = usePage();

    // Check for flash message on mount
    useEffect(() => {
        const flashProps = props as { flash?: { printAppointment?: unknown } };
        const flash = flashProps.flash;
        if (flash?.printAppointment && !printAppointment) {
            // Defer state updates to avoid synchronous setState in effect which
            // can cause cascading renders (and triggers the linter rule).
            const id = setTimeout(() => {
                setPrintAppointment(flash.printAppointment);
                setShowPrintModal(true);
            }, 0);

            return () => clearTimeout(id);
        }
    // We intentionally only want to run this effect when `props` changes.
    // The `printAppointment` state is intentionally excluded to avoid cascading updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props]);

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

    // Calculate statistics - use server-side counts from stats prop
    // total_count is scoped: today-only for sub-admins, all-time for super admin
    const totalAppointments = stats?.total_count ?? appointments.meta?.total ?? 0;
    const scheduledCount = stats?.scheduled_count ?? 0;
    const completedCount = stats?.completed_count ?? 0;

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

                {/* Stats Cards - Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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

                {/* Stats Cards - Row 2: Today's Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                                    <p className="text-2xl font-bold text-orange-600">{stats?.today_appointments ?? 0}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Regular + Service-based</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <CalendarDays className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                                    <p className="text-2xl font-bold text-emerald-600">؋{(stats?.today_revenue ?? 0).toLocaleString()}</p>
                                    <p className="text-xs text-muted-foreground mt-1">All appointment types</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card className="shadow-lg border-border/50 animate-slide-in-up">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-3">
                                <CardTitle className="text-lg font-semibold">Appointments Directory</CardTitle>
                                <Badge className="bg-orange-100 text-orange-700 border border-orange-300 text-xs font-medium">
                                    <CalendarDays className="h-3 w-3 mr-1" />
                                    Today Only
                                </Badge>
                            </div>
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
                                <TableHeader className="bg-muted/50">
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
                                                    {appointment.doctor ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                                                <Stethoscope className="h-4 w-4 text-green-600" />
                                                            </div>
                                                            <span className="font-medium">
                                                                Dr. {appointment.doctor.full_name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col gap-1">
                                                            {appointment.department ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                                                                        <svg className="h-4 w-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                                        </svg>
                                                                    </div>
                                                                    <div>
                                                                        <span className="font-medium text-purple-700">{appointment.department.name}</span>
                                                                        {appointment.services && appointment.services.length > 0 && (
                                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                                {appointment.services.map(service => (
                                                                                    <Badge key={service.id} variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-700 font-normal">
                                                                                        {service.name}
                                                                                    </Badge>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground italic text-sm">Not Assigned</span>
                                                            )}
                                                        </div>
                                                    )}
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

                        {/* Pagination - always show when meta is available */}
                        {appointments.meta && (
                            <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t bg-muted/30 gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing <strong className="text-foreground">{appointments.meta.from || 0}</strong> to{' '}
                                    <strong className="text-foreground">{appointments.meta.to || 0}</strong> of{' '}
                                    <strong className="text-foreground">{appointments.meta.total || 0}</strong> appointments
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Previous */}
                                    {appointments.meta.current_page <= 1 ? (
                                        <Button variant="outline" size="sm" disabled>
                                            Previous
                                        </Button>
                                    ) : (
                                        <Link href={`/appointments?page=${appointments.meta.current_page - 1}`}>
                                            <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                                Previous
                                            </Button>
                                        </Link>
                                    )}

                                    {/* Current / Total pages
                                    <div className="flex items-center gap-1 px-3 py-1 rounded-md bg-muted text-sm font-medium">
                                        <span>{appointments.meta.current_page}</span>
                                        <span className="text-muted-foreground">/</span>
                                        <span className="text-muted-foreground">{appointments.meta.last_page}</span>
                                    </div>

                                    {/* Next */}
                                    {/* {appointments.meta.current_page >= appointments.meta.last_page ? (
                                        <Button variant="outline" size="sm" disabled>
                                            Next
                                        </Button>
                                    ) : (
                                        <Link href={`/appointments?page=${appointments.meta.current_page + 1}`}>
                                            <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                                Next
                                            </Button>
                                        </Link>
                                    )}  */}
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
