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
import { Phone, PlusCircle, Search, User, Users, HeartPulse, CalendarDays, CalendarRange, CalendarCheck } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Patient } from '@/types/patient';

interface PatientIndexProps {
    patients: {
        data: Patient[];
        links: Record<string, unknown>;
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            path: string;
            per_page: number;
            to: number;
            total: number;
            male_count: number;
            female_count: number;
            today_count: number;
            monthly_count: number;
            yearly_count: number;
        };
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function PatientIndex({ patients }: PatientIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredPatients = patients.data.filter(patient =>
        patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.first_name && patient.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.father_name && patient.father_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.phone && patient.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getGenderBadgeClass = (gender: string) => {
        switch (gender?.toLowerCase()) {
            case 'male':
                return 'bg-blue-500/10 border-blue-500/20 text-blue-600';
            case 'female':
                return 'bg-pink-500/10 border-pink-500/20 text-pink-600';
            default:
                return 'bg-muted text-muted-foreground';
        }
    };

    const maleCount = patients.meta?.male_count ?? 0;
    const femaleCount = patients.meta?.female_count ?? 0;
    const todayCount = patients.meta?.today_count ?? 0;
    const monthlyCount = patients.meta?.monthly_count ?? 0;
    const yearlyCount = patients.meta?.yearly_count ?? 0;

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Patients" />

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
                    <div>
                        <Heading title="Patient Management" />
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage and monitor all patients in the system
                        </p>
                    </div>

                    <Link href="/patients/create">
                        <Button className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Patient
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards - Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                                    <p className="text-2xl font-bold text-primary">{patients.meta?.total || 0}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Male Patients</p>
                                    <p className="text-2xl font-bold text-blue-600">{maleCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-pink-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Female Patients</p>
                                    <p className="text-2xl font-bold text-pink-600">{femaleCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-pink-500/10 flex items-center justify-center">
                                    <HeartPulse className="h-6 w-6 text-pink-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Stats Cards - Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-orange-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Today's Patients</p>
                                    <p className="text-2xl font-bold text-orange-600">{todayCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <CalendarDays className="h-6 w-6 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-teal-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                                    <p className="text-2xl font-bold text-teal-600">{monthlyCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center">
                                    <CalendarRange className="h-6 w-6 text-teal-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-violet-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">This Year</p>
                                    <p className="text-2xl font-bold text-violet-600">{yearlyCount}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-violet-500/10 flex items-center justify-center">
                                    <CalendarCheck className="h-6 w-6 text-violet-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Table Card */}
                <Card className="shadow-lg border-border/50 animate-slide-in-up">
                    <CardHeader className="border-b bg-muted/30">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <CardTitle className="text-lg font-semibold">Patients Directory</CardTitle>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by name, ID, or phone..."
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
                                        <TableHead className="font-semibold w-[110px]">Patient ID</TableHead>
                                        <TableHead className="font-semibold">Name</TableHead>
                                        <TableHead className="font-semibold">Father's Name</TableHead>
                                        <TableHead className="font-semibold">Gender</TableHead>
                                        <TableHead className="font-semibold">Age</TableHead>
                                        <TableHead className="font-semibold">Blood Group</TableHead>
                                        <TableHead className="font-semibold">Contact</TableHead>
                                        <TableHead className="text-right font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPatients.length > 0 ? (
                                        filteredPatients.map((patient) => (
                                            <TableRow key={patient.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium">
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {patient.patient_id}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                            {patient.first_name?.charAt(0) ?? '?'}
                                                        </div>
                                                        {patient.first_name || <span className="text-gray-400 italic">N/A</span>}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {patient.father_name || <span className="text-gray-400 italic">N/A</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {patient.gender ? (
                                                        <Badge variant="outline" className={`capitalize ${getGenderBadgeClass(patient.gender as string)}`}>
                                                            {(patient.gender as string).charAt(0).toUpperCase() + (patient.gender as string).slice(1)}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400 italic">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {patient.age ? (
                                                        <Badge variant="secondary" className="font-normal">
                                                            {patient.age} yrs
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400 italic">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {patient.blood_group ? (
                                                        <Badge variant="outline" className="font-mono bg-red-500/5 border-red-500/20 text-red-600">
                                                            {patient.blood_group}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400 italic">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{patient.phone || 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/patients/${patient.patient_id}/edit`}>
                                                            <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/patients/${patient.patient_id}`}>
                                                            <Button variant="outline" size="sm" className="hover:bg-secondary hover:text-secondary-foreground transition-colors">
                                                                View
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <Users className="h-12 w-12 mb-2 opacity-20" />
                                                    <p className="font-medium">No patients found</p>
                                                    <p className="text-sm">Try adjusting your search</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {patients.meta && (
                            <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t bg-muted/30 gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing <strong className="text-foreground">{patients.meta.from || 0}</strong> to{' '}
                                    <strong className="text-foreground">{patients.meta.to || 0}</strong> of{' '}
                                    <strong className="text-foreground">{patients.meta.total || 0}</strong> patients
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Previous */}
                                    {patients.meta.current_page <= 1 ? (
                                        <Button variant="outline" size="sm" disabled>
                                            Previous
                                        </Button>
                                    ) : (
                                        <Link href={`/patients?page=${patients.meta.current_page - 1}`}>
                                            <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                                Previous
                                            </Button>
                                        </Link>
                                    )}

                                    {/* Current / Total pages */}
                                    <div className="flex items-center gap-1 px-3 py-1 rounded-md bg-muted text-sm font-medium">
                                        <span>{patients.meta.current_page}</span>
                                        <span className="text-muted-foreground">/</span>
                                        <span className="text-muted-foreground">{patients.meta.last_page}</span>
                                    </div>

                                    {/* Next */}
                                    {patients.meta.current_page >= patients.meta.last_page ? (
                                        <Button variant="outline" size="sm" disabled>
                                            Next
                                        </Button>
                                    ) : (
                                        <Link href={`/patients?page=${patients.meta.current_page + 1}`}>
                                            <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                                Next
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
