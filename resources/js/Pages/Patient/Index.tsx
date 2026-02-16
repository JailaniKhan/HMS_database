import { Head, Link, router } from '@inertiajs/react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import Heading from '@/components/heading';
import { PlusCircle, Search, Phone, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Patient } from '@/types/patient';

interface PaginationMeta {
    current_page: number;
    from: number;
    last_page: number;
    path: string;
    per_page: number;
    to: number;
    total: number;
}

interface PatientIndexProps {
    patients: {
        data: Patient[];
        links?: Record<string, unknown>;
        meta?: PaginationMeta;
        // Laravel paginator also returns these at top level
        current_page?: number;
        from?: number;
        last_page?: number;
        path?: string;
        per_page?: number;
        to?: number;
        total?: number;
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function PatientIndex({ patients, flash }: PatientIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    // Get meta from either nested meta object or top-level properties
    const meta: PaginationMeta = {
        current_page: patients.meta?.current_page ?? patients.current_page ?? 1,
        from: patients.meta?.from ?? patients.from ?? 1,
        last_page: patients.meta?.last_page ?? patients.last_page ?? 1,
        path: patients.meta?.path ?? patients.path ?? '/patients',
        per_page: patients.meta?.per_page ?? patients.per_page ?? 100,
        to: patients.meta?.to ?? patients.to ?? patients.data.length,
        total: patients.meta?.total ?? patients.total ?? patients.data.length,
    };

    const filteredPatients = patients.data.filter(patient =>
        patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (patient.first_name && patient.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (patient.user && patient.user.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const getGenderBadgeVariant = (gender: string) => {
        switch (gender.toLowerCase()) {
            case 'male':
                return 'secondary';
            case 'female':
                return 'destructive';
            default:
                return 'outline';
        }
    };

    const goToPage = (page: number) => {
        router.get(`/patients?page=${page}`);
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Patients" />
                
                {/* Success/Error Alerts */}
                {flash?.success && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            {flash.success}
                        </AlertDescription>
                    </Alert>
                )}
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Patient Management" />
                    
                    <Link href="/patients/create">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Patient
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Patients List</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search patients..."
                                    className="pl-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="rounded-md border">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-25">Patient ID</TableHead>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Father's Name</TableHead>
                                            <TableHead>Gender</TableHead>
                                            <TableHead>Age</TableHead>
                                            <TableHead>Blood Group</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                </Table>
                            </div>
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                <Table>
                                    <TableBody>
                                    {filteredPatients.length > 0 ? (
                                        filteredPatients.map((patient) => {
                                            return (
                                            <TableRow key={patient.id}>
                                                <TableCell className="font-medium">
                                                    {patient.patient_id}
                                                </TableCell>
                                                <TableCell>
                                                    {patient.first_name || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {patient.father_name || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {patient.gender ? (
                                                        <Badge variant={getGenderBadgeVariant(patient.gender as string)}>
                                                            {(patient.gender as string).charAt(0).toUpperCase() + (patient.gender as string).slice(1)}
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="outline">N/A</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {patient.age || 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    {patient.blood_group ? (
                                                        <Badge variant="outline">{patient.blood_group}</Badge>
                                                    ) : 'N/A'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {patient.phone || 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Link href={`/patients/${patient.patient_id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/patients/${patient.patient_id}`}>
                                                            <Button variant="outline" size="sm">
                                                                View
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center">
                                                No patients found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        </div>

                        {/* Pagination */}
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong>{meta.from}</strong> to <strong>{meta.to}</strong> of{' '}
                                <strong>{meta.total}</strong> patients
                                {meta.last_page > 1 && (
                                    <span className="ml-2 text-xs">(Page {meta.current_page} of {meta.last_page})</span>
                                )}
                            </div>
                            
                            {meta.last_page > 1 && (
                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={meta.current_page <= 1}
                                    onClick={() => goToPage(meta.current_page - 1)}
                                    className="flex items-center gap-1"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                
                                {/* Page Numbers */}
                                <div className="flex space-x-1">
                                    {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                                        let pageNum;
                                        if (meta.last_page <= 5) {
                                            pageNum = i + 1;
                                        } else if (meta.current_page <= 3) {
                                            pageNum = i + 1;
                                        } else if (meta.current_page >= meta.last_page - 2) {
                                            pageNum = meta.last_page - 4 + i;
                                        } else {
                                            pageNum = meta.current_page - 2 + i;
                                        }
                                        
                                        return (
                                            <Button
                                                key={pageNum}
                                                variant={meta.current_page === pageNum ? "default" : "outline"}
                                                size="sm"
                                                onClick={() => goToPage(pageNum)}
                                                className="w-8 h-8 p-0"
                                            >
                                                {pageNum}
                                            </Button>
                                        );
                                    })}
                                </div>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={meta.current_page >= meta.last_page}
                                    onClick={() => goToPage(meta.current_page + 1)}
                                    className="flex items-center gap-1"
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
