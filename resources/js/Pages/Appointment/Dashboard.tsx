import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { 
    Calendar, 
    User, 
    Stethoscope, 
    Package, 
    Building2, 
    Clock, 
    PlusCircle,
    ArrowRight,
    CheckCircle,
    Activity
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';

// ============================================================================
// Types
// ============================================================================

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
    patient: Patient;
    doctor: Doctor;
}

interface Department {
    id: number;
    name: string;
}

interface DepartmentService {
    id: number;
    name: string;
    description: string | null;
    base_cost: string;
    is_active: boolean;
    department: Department;
    final_cost: number;
}

interface AppointmentDashboardProps {
    appointments: {
        data: Appointment[];
        meta: {
            total: number;
            current_page: number;
            last_page: number;
            from: number;
            to: number;
        };
    };
    services: {
        data: DepartmentService[];
        meta: {
            total: number;
            current_page: number;
            last_page: number;
            per_page: number;
            from: number;
            to: number;
        };
    };
    departments: {
        id: number;
        name: string;
    }[];
    stats: {
        appointments: {
            total: number;
            scheduled: number;
            completed: number;
            cancelled: number;
        };
        services: {
            total: number;
            active: number;
            inactive: number;
        };
    };
}

// ============================================================================
// Utility Functions
// ============================================================================

const formatCurrency = (amount: string | number | undefined | null): string => {
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
        return '؋0.00';
    }
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `؋${num.toFixed(2)}`;
};

const formatDateTime = (dateString: string, timeString: string): string => {
    const date = new Date(`${dateString}T${timeString}`);
    return date.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getStatusBadgeVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
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

// ============================================================================
// Main Component
// ============================================================================

export default function AppointmentDashboard({ appointments, services, stats }: AppointmentDashboardProps) {
    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <Head title="Appointment Dashboard" />
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
                    <div>
                        <Heading title="Appointment Dashboard" />
                        <p className="text-sm text-muted-foreground mt-1">
                            Overview of appointments and department services
                        </p>
                    </div>
                    
                    <div className="flex gap-3">
                        <Link href="/appointments/create">
                            <Button className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                New Appointment
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {/* Appointment Stats */}
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.appointments.total}</p>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Calendar className="h-7 w-7 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.appointments.completed}</p>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle className="h-7 w-7 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Stats */}
                    <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                                    <p className="text-3xl font-bold text-purple-600">{stats.services.total}</p>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <Package className="h-7 w-7 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                                    <p className="text-3xl font-bold text-teal-600">{stats.services.active}</p>
                                </div>
                                <div className="h-14 w-14 rounded-full bg-teal-500/10 flex items-center justify-center">
                                    <Activity className="h-7 w-7 text-teal-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content - Two Columns */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Appointments Section */}
                    <Card className="shadow-lg border-border/50">
                        <CardHeader className="border-b bg-muted/30 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Calendar className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-semibold">Recent Appointments</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {stats.appointments.scheduled} scheduled • {stats.appointments.cancelled} cancelled
                                    </p>
                                </div>
                            </div>
                            <Link href="/appointments">
                                <Button variant="outline" size="sm" className="gap-1">
                                    View All <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {appointments.data.length > 0 ? (
                                <div className="divide-y">
                                    {appointments.data.slice(0, 5).map((appointment) => (
                                        <div key={appointment.id} className="p-4 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                        <User className="h-5 w-5 text-blue-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{appointment.patient?.full_name || 'Unknown Patient'}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            Dr. {appointment.doctor?.full_name || 'Not Assigned'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant={getStatusBadgeVariant(appointment.status)} className="capitalize mb-1">
                                                        {appointment.status}
                                                    </Badge>
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                                                        <Clock className="h-3 w-3" />
                                                        {formatDateTime(appointment.appointment_date, appointment.appointment_time)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No appointments found</p>
                                    <Link href="/appointments/create">
                                        <Button variant="link" className="mt-2">
                                            Schedule your first appointment
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Department Services Section */}
                    <Card className="shadow-lg border-border/50">
                        <CardHeader className="border-b bg-muted/30 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg font-semibold">Department Services</CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {stats.services.active} active • {stats.services.inactive} inactive
                                    </p>
                                </div>
                            </div>
                            <Link href="/departments/services">
                                <Button variant="outline" size="sm" className="gap-1">
                                    View All <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent className="p-0">
                            {services.data.length > 0 ? (
                                <div className="divide-y">
                                    {services.data.slice(0, 5).map((service) => (
                                        <div key={service.id} className="p-4 hover:bg-muted/50 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                                        <Building2 className="h-5 w-5 text-purple-600" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{service.name}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {service.department?.name || 'No Department'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <Badge variant={service.is_active ? 'default' : 'secondary'} className="capitalize mb-1">
                                                        {service.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    <p className="text-sm font-bold text-green-600">
                                                        {formatCurrency(service.final_cost)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center text-muted-foreground">
                                    <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No services found</p>
                                    <Link href="/departments">
                                        <Button variant="link" className="mt-2">
                                            Add your first service
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/appointments/create">
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                        <Calendar className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Schedule Appointment</p>
                                        <p className="text-sm text-muted-foreground">Create new appointment</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/appointments">
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <Stethoscope className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Manage Appointments</p>
                                        <p className="text-sm text-muted-foreground">View all appointments</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/departments/services">
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                        <Package className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">View Services</p>
                                        <p className="text-sm text-muted-foreground">Browse department services</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/departments">
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-transparent hover:border-teal-500">
                                <CardContent className="p-4 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center">
                                        <Building2 className="h-6 w-6 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium">Manage Departments</p>
                                        <p className="text-sm text-muted-foreground">View all departments</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}
