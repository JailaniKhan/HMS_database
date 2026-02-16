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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Heading from '@/components/heading';
import { Calendar, User, ArrowLeft, Eye, CalendarDays, CalendarRange, DollarSign, Percent, Wallet, TrendingUp } from 'lucide-react';
import { useState } from 'react';
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
    specialization: string;
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
    fee: number | string;
    discount: number | string;
    created_at: string;
    patient: Patient;
    doctor: Doctor;
}

interface AppointmentsData {
    today: Appointment[];
    monthly: Appointment[];
    yearly: Appointment[];
}

interface Financials {
    consultationFee: number | string;
    feePercentage: number | string;
    salary: number | string;
    bonus: number | string;
    totalFees: number | string;
    totalDiscounts: number | string;
    netTotal: number | string;
    doctorEarnings: number | string;
    hospitalEarnings: number | string;
    completedAppointments: number;
}

interface DoctorAppointmentsProps {
    doctor: Doctor;
    appointments: AppointmentsData;
    stats: {
        todayCount: number;
        monthlyCount: number;
        yearlyCount: number;
    };
    financials: Financials;
}

export default function DoctorAppointments({ doctor, appointments, stats, financials }: DoctorAppointmentsProps) {
    const [activeTab, setActiveTab] = useState('today');

    // Helper function to format currency
    const formatCurrency = (value: number | string): string => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? '0.00' : num.toFixed(2);
    };

    // Helper function to format percentage
    const formatPercentage = (value: number | string): string => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        return isNaN(num) ? '0' : num.toString();
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

    const renderAppointmentTable = (appointmentList: Appointment[]) => {
        if (appointmentList.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <Calendar className="h-12 w-12 mb-4 text-muted-foreground/50" />
                    <p className="text-lg">No appointments found</p>
                    <p className="text-sm">There are no appointments for this period.</p>
                </div>
            );
        }

        return (
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow>
                            <TableHead className="font-semibold">Appointment ID</TableHead>
                            <TableHead className="font-semibold">Patient</TableHead>
                            <TableHead className="font-semibold">Created Date</TableHead>
                            <TableHead className="font-semibold text-right">Fee</TableHead>
                            <TableHead className="font-semibold text-right">Discount</TableHead>
                            <TableHead className="font-semibold">Status</TableHead>
                            <TableHead className="font-semibold">Reason</TableHead>
                            <TableHead className="text-right font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {appointmentList.map((appointment) => (
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
                                        <div>
                                            <span className="font-medium block">{appointment.patient.full_name}</span>
                                            <span className="text-xs text-muted-foreground">{appointment.patient.patient_id}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">
                                            {appointment.created_at ? new Date(appointment.created_at).toLocaleString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            }) : 'N/A'}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <span className="font-medium">؋{formatCurrency(appointment.fee)}</span>
                                </TableCell>
                                <TableCell className="text-right">
                                    {appointment.discount && parseFloat(appointment.discount.toString()) > 0 ? (
                                        <span className="font-medium text-red-600">-؋{formatCurrency(appointment.discount)}</span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getStatusBadgeVariant(appointment.status)} className="capitalize">
                                        {appointment.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="max-w-xs truncate text-sm text-muted-foreground" title={appointment.reason}>
                                        {appointment.reason || 'N/A'}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <Link href={`/appointments/${appointment.id}`}>
                                        <Button variant="outline" size="sm" className="hover:bg-green-50 hover:text-green-600 hover:border-green-600">
                                            <Eye className="h-3 w-3 mr-1" />
                                            View
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <Head title={`Appointments - Dr. ${doctor.full_name}`} />

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
                    <div>
                        <Heading title={`Dr. ${doctor.full_name}'s Appointments`} />
                        <p className="text-sm text-muted-foreground mt-1">
                            View all appointments for {doctor.specialization}
                        </p>
                    </div>

                    <Link href={`/doctors/${doctor.id}`}>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Doctor
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Today's Appointments</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.todayCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.monthlyCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <CalendarDays className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">This Year</p>
                                    <p className="text-2xl font-bold text-purple-600">{stats.yearlyCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                                    <CalendarRange className="h-6 w-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Financial Information Cards */}
                <Card className="mb-6 border-border/50">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-primary" />
                            Financial Overview
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Consultation Fee */}
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                        <Wallet className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">Consultation Fee</p>
                                </div>
                                <p className="text-2xl font-bold text-blue-600">؋{formatCurrency(financials.consultationFee)}</p>
                            </div>

                            {/* Fee Percentage */}
                            <div className="bg-purple-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                                        <Percent className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">Doctor's Percentage</p>
                                </div>
                                <p className="text-2xl font-bold text-purple-600">{formatPercentage(financials.feePercentage)}%</p>
                            </div>

                            {/* Salary */}
                            <div className="bg-green-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <TrendingUp className="h-4 w-4 text-green-600" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">Monthly Salary</p>
                                </div>
                                <p className="text-2xl font-bold text-green-600">؋{formatCurrency(financials.salary)}</p>
                            </div>

                            {/* Bonus */}
                            <div className="bg-amber-50 rounded-lg p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                                        <DollarSign className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <p className="text-sm font-medium text-muted-foreground">Bonus</p>
                                </div>
                                <p className="text-2xl font-bold text-amber-600">؋{formatCurrency(financials.bonus)}</p>
                            </div>
                        </div>

                        {/* Earnings Breakdown */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t">
                            {/* Total Fees from Completed Appointments */}
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Total Fees Collected</p>
                                <p className="text-xl font-bold text-slate-700">؋{formatCurrency(financials.totalFees)}</p>
                                <p className="text-xs text-muted-foreground">{financials.completedAppointments} completed appointments</p>
                            </div>

                            {/* Total Discounts */}
                            <div className="text-center border-l border-r border-border">
                                <p className="text-sm text-muted-foreground mb-1">Total Discounts</p>
                                <p className="text-xl font-bold text-red-600">-؋{formatCurrency(financials.totalDiscounts)}</p>
                                <p className="text-xs text-muted-foreground">Applied to completed appointments</p>
                            </div>

                            {/* Net Total */}
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Net Total</p>
                                <p className="text-xl font-bold text-emerald-600">؋{formatCurrency(financials.netTotal)}</p>
                                <p className="text-xs text-muted-foreground">After discounts</p>
                            </div>
                        </div>

                        {/* Doctor & Hospital Earnings */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                            {/* Doctor's Earnings */}
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground mb-1">Doctor's Earnings ({formatPercentage(financials.feePercentage)}%)</p>
                                <p className="text-xl font-bold text-emerald-600">؋{formatCurrency(financials.doctorEarnings)}</p>
                            </div>

                            {/* Hospital Earnings */}
                            <div className="text-center border-l border-border">
                                <p className="text-sm text-muted-foreground mb-1">Hospital Earnings ({100 - parseFloat(formatPercentage(financials.feePercentage))}%)</p>
                                <p className="text-xl font-bold text-indigo-600">؋{formatCurrency(financials.hospitalEarnings)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs for different time periods */}
                <Card className="shadow-lg border-border/50">
                    <CardHeader className="border-b bg-muted/30">
                        <CardTitle className="text-lg font-semibold">Appointment History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="w-full justify-start rounded-none border-b bg-muted/50 p-0">
                                <TabsTrigger
                                    value="today"
                                    className="rounded-none px-6 py-3 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    Today ({stats.todayCount})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="monthly"
                                    className="rounded-none px-6 py-3 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                >
                                    <CalendarDays className="mr-2 h-4 w-4" />
                                    This Month ({stats.monthlyCount})
                                </TabsTrigger>
                                <TabsTrigger
                                    value="yearly"
                                    className="rounded-none px-6 py-3 data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary"
                                >
                                    <CalendarRange className="mr-2 h-4 w-4" />
                                    This Year ({stats.yearlyCount})
                                </TabsTrigger>
                            </TabsList>

                            <div className="p-4">
                                <TabsContent value="today" className="mt-0">
                                    {renderAppointmentTable(appointments.today)}
                                </TabsContent>

                                <TabsContent value="monthly" className="mt-0">
                                    {renderAppointmentTable(appointments.monthly)}
                                </TabsContent>

                                <TabsContent value="yearly" className="mt-0">
                                    {renderAppointmentTable(appointments.yearly)}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
