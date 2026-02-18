import { Head, Link } from '@inertiajs/react';
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
import { 
    Calendar, 
    User, 
    Stethoscope, 
    ChevronLeft, 
    ChevronRight,
    ChevronUp,
    ChevronDown,
    DollarSign,
    CheckCircle,
    XCircle,
    Clock,
    RefreshCw,
    AlertCircle,
    Activity
} from 'lucide-react';
import { useState, Fragment } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

// Types
interface Patient {
    id: number;
    name: string;
}

interface Doctor {
    id: number;
    name: string;
}

interface ServiceDepartment {
    id: number;
    name: string;
}

interface Service {
    id: number | null;
    name: string;
    custom_cost: number;
    discount_percentage: number;
    final_cost: number;
}

interface ServiceData {
    id: string;
    appointment_id: string;
    appointment_date: string;
    status: string;
    patient: Patient | null;
    doctor: Doctor | null;
    department: ServiceDepartment | null;
    services: Service[];
    services_count: number;
    grand_total: number;
    fee: number;
    discount: number;
}

interface FilterDepartment {
    id: number;
    name: string;
}

interface Summary {
    total_revenue: number;
    total_appointments: number;
    completed_count: number;
    cancelled_count: number;
    scheduled_count: number;
    no_show_count: number;
    rescheduled_count: number;
}

interface Navigation {
    can_go_next: boolean;
    can_go_prev: boolean;
    next_params: Record<string, number>;
    prev_params: Record<string, number>;
}

interface ServicesDashboardProps {
    services: ServiceData[];
    filters: {
        view: string;
        year: number;
        month: number;
        day: number;
    };
    summary: Summary;
    departments: FilterDepartment[];
    navigation: Navigation;
    is_super_admin: boolean;
    period_label: string;
}

export default function ServicesDashboard({
    services,
    filters,
    summary,
    departments,
    navigation,
    is_super_admin,
    period_label,
}: ServicesDashboardProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<string>('all');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const currentView = filters.view;

    // Toggle expanded row
    const toggleExpanded = (id: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Helper function to build URL with params
    const buildUrl = (params: Record<string, string | number>) => {
        const urlParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            urlParams.set(key, String(value));
        });
        return `/departments/services?${urlParams.toString()}`;
    };

    // Filter services based on search
    const filteredServices = services.filter(service =>
        (departmentFilter === 'all' || service.department?.name === departmentFilter) &&
        (
            service.appointment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.patient?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.doctor?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.department?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            service.services?.some(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()))
        )
    );

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Get status badge variant
    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'default';
            case 'cancelled':
                return 'destructive';
            case 'scheduled':
                return 'secondary';
            case 'no_show':
                return 'outline';
            case 'rescheduled':
                return 'outline';
            default:
                return 'outline';
        }
    };

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'cancelled':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'scheduled':
                return <Clock className="h-4 w-4 text-blue-500" />;
            case 'no_show':
                return <AlertCircle className="h-4 w-4 text-orange-500" />;
            case 'rescheduled':
                return <RefreshCw className="h-4 w-4 text-purple-500" />;
            default:
                return <Clock className="h-4 w-4 text-gray-500" />;
        }
    };

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-8">
                <Head title="Services Dashboard - Appointment Services Management" />
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
                    <div>
                        <Heading title="Services Dashboard" />
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage and monitor all appointment services with financial tracking
                        </p>
                    </div>
                    
                    {/* View Toggle for Super Admins */}
                    {is_super_admin && (
                        <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border">
                            <Link href={buildUrl({ ...filters, view: 'today' })}>
                                <Button
                                    variant={currentView === 'today' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="transition-all"
                                >
                                    Today
                                </Button>
                            </Link>
                            <Link href={buildUrl({ ...filters, view: 'monthly' })}>
                                <Button
                                    variant={currentView === 'monthly' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="transition-all"
                                >
                                    Monthly
                                </Button>
                            </Link>
                            <Link href={buildUrl({ ...filters, view: 'yearly' })}>
                                <Button
                                    variant={currentView === 'yearly' ? 'default' : 'ghost'}
                                    size="sm"
                                    className="transition-all"
                                >
                                    Yearly
                                </Button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Navigation and Period Label */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
                    <div className="flex items-center gap-4">
                        {/* Previous Button */}
                        {navigation.can_go_prev ? (
                            <Link href={buildUrl({ ...navigation.prev_params, view: currentView })}>
                                <Button variant="outline" size="sm" className="hover:bg-primary hover:text-white transition-all">
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" disabled className="opacity-50">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Button>
                        )}

                        {/* Period Label */}
                        <div className="px-4 py-2 bg-white rounded-lg shadow-sm border">
                            <span className="text-lg font-semibold text-primary">{period_label}</span>
                        </div>

                        {/* Next Button */}
                        {navigation.can_go_next ? (
                            <Link href={buildUrl({ ...navigation.next_params, view: currentView })}>
                                <Button variant="outline" size="sm" className="hover:bg-primary hover:text-white transition-all">
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </Button>
                            </Link>
                        ) : (
                            <Button variant="outline" size="sm" disabled className="opacity-50">
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        )}
                    </div>

                    {/* Access Level Indicator */}
                    <div className="flex items-center gap-2">
                        <Badge variant={is_super_admin ? 'default' : 'secondary'}>
                            {is_super_admin ? 'Super Admin - Full Access' : 'Sub Admin - Today Only'}
                        </Badge>
                    </div>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Total Revenue Card */}
                    <Card className="border-l-4 border-l-emerald-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        {currentView === 'today' ? "Today's Revenue" : 
                                         currentView === 'monthly' ? 'Monthly Revenue' : 'Yearly Revenue'}
                                    </p>
                                    <p className="text-2xl font-bold text-emerald-600">
                                        {formatCurrency(summary.total_revenue)}
                                    </p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <DollarSign className="h-6 w-6 text-emerald-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Total Appointments Card */}
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Appointments</p>
                                    <p className="text-2xl font-bold text-blue-600">{summary.total_appointments}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Activity className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Completed Card */}
                    <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                                    <p className="text-2xl font-bold text-green-600">{summary.completed_count}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Cancelled Card */}
                    <Card className="border-l-4 border-l-red-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                                    <p className="text-2xl font-bold text-red-600">{summary.cancelled_count}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                    <XCircle className="h-6 w-6 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Status Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Scheduled</p>
                                <p className="text-xl font-bold text-blue-500">{summary.scheduled_count}</p>
                            </div>
                            <Clock className="h-5 w-5 text-blue-400" />
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">No Show</p>
                                <p className="text-xl font-bold text-orange-500">{summary.no_show_count}</p>
                            </div>
                            <AlertCircle className="h-5 w-5 text-orange-400" />
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Rescheduled</p>
                                <p className="text-xl font-bold text-purple-500">{summary.rescheduled_count}</p>
                            </div>
                            <RefreshCw className="h-5 w-5 text-purple-400" />
                        </CardContent>
                    </Card>
                    <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-3 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-muted-foreground">Avg. per Appointment</p>
                                <p className="text-xl font-bold text-indigo-500">
                                    {services.length > 0 
                                        ? formatCurrency(summary.total_revenue / services.length) 
                                        : formatCurrency(0)}
                                </p>
                            </div>
                            <DollarSign className="h-5 w-5 text-indigo-400" />
                        </CardContent>
                    </Card>
                </div>

                {/* Main Services Table */}
                <Card className="shadow-lg border-border/50">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="text-lg font-semibold flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Appointment Services
                                <Badge variant="outline" className="ml-2">
                                    {filteredServices.length} appointments
                                </Badge>
                            </CardTitle>
                            <div className="flex flex-col sm:flex-row gap-2 w-full">
                                {/* Department Filter */}
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => setDepartmentFilter(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-[150px]"
                                >
                                    <option value="all">All Departments</option>
                                    {departments.map((dept) => (
                                        <option key={dept.id} value={dept.name}>
                                            {dept.name}
                                        </option>
                                    ))}
                                </select>
                                <div className="relative flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search services..."
                                        className="w-full pl-4 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold">Appointment ID</TableHead>
                                        <TableHead className="font-semibold">Date & Time</TableHead>
                                        <TableHead className="font-semibold">Patient</TableHead>
                                        <TableHead className="font-semibold">Doctor</TableHead>
                                        <TableHead className="font-semibold">Department</TableHead>
                                        <TableHead className="font-semibold">Services</TableHead>
                                        <TableHead className="font-semibold text-right">Total</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServices.length > 0 ? (
                                        filteredServices.map((service) => {
                                            const isExpanded = expandedRows.has(service.id.toString());
                                            return (
                                                <Fragment key={service.id}>
                                                    <TableRow className="hover:bg-muted/50 transition-colors">
                                                        <TableCell className="font-medium">
                                                            <Badge variant="outline" className="font-mono text-xs">
                                                                {service.appointment_id}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                                <span className="text-sm">
                                                                    {formatDate(service.appointment_date)}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                                    <User className="h-4 w-4 text-blue-600" />
                                                                </div>
                                                                <span className="font-medium">
                                                                    {service.patient?.name || 'Unknown Patient'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                                                    <Stethoscope className="h-4 w-4 text-green-600" />
                                                                </div>
                                                                <span className="font-medium">
                                                                    {service.doctor?.name || 'Not Assigned'}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <span className="text-sm">
                                                                {service.department?.name || '-'}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex flex-col gap-1">
                                                                {service.services?.slice(0, 2).map((s, idx) => (
                                                                    <span key={idx} className="font-medium text-sm">
                                                                        {s.name}
                                                                        {s.discount_percentage > 0 && (
                                                                            <Badge variant="outline" className="ml-1 text-xs">
                                                                                {s.discount_percentage}% off
                                                                            </Badge>
                                                                        )}
                                                                    </span>
                                                                ))}
                                                                {service.services_count > 2 && (
                                                                    <span className="text-xs text-muted-foreground">
                                                                        +{service.services_count - 2} more
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <span className="font-semibold text-emerald-600">
                                                                {formatCurrency(service.grand_total)}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {getStatusIcon(service.status)}
                                                                <Badge 
                                                                    variant={getStatusBadgeVariant(service.status)} 
                                                                    className="capitalize"
                                                                >
                                                                    {service.status}
                                                                </Badge>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            {service.services_count > 1 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => toggleExpanded(service.id.toString())}
                                                                    className="p-1 h-8 w-8"
                                                                >
                                                                    {isExpanded ? (
                                                                        <ChevronUp className="h-4 w-4" />
                                                                    ) : (
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                    {isExpanded && service.services && service.services.length > 1 && (
                                                        <TableRow key={`${service.id}-expanded`} className="bg-muted/30">
                                                            <TableCell colSpan={9} className="py-2">
                                                                <div className="pl-4 border-l-2 border-primary/30">
                                                                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                                                                        Services Breakdown:
                                                                    </p>
                                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                                        {service.services.map((s, idx) => (
                                                                            <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                                                                                <span className="font-medium">{s.name}</span>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-muted-foreground line-through text-xs">
                                                                                        {formatCurrency(s.custom_cost)}
                                                                                    </span>
                                                                                    <span className="font-semibold text-emerald-600">
                                                                                        {formatCurrency(s.final_cost)}
                                                                                    </span>
                                                                                    {s.discount_percentage > 0 && (
                                                                                        <Badge variant="destructive" className="text-xs">
                                                                                            -{s.discount_percentage}%
                                                                                        </Badge>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                </Fragment>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Activity className="h-8 w-8 text-muted-foreground/50" />
                                                    <p>No services found for this period</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer Info */}
                <div className="mt-6 text-center text-sm text-muted-foreground">
                    <p>
                        Showing {filteredServices.length} of {services.length} appointments
                        {is_super_admin 
                            ? ` for ${period_label}` 
                            : ' for today (sub-admin access limited)'}
                    </p>
                </div>
            </div>
        </HospitalLayout>
    );
}
