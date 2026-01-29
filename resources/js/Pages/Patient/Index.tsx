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
import { Alert, AlertDescription } from '@/components/ui/alert';
import Heading from '@/components/heading';
import { PageProps } from '@/types';
import { PlusCircle, Search, Phone, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Patient } from '@/types/patient';

interface PatientIndexProps extends PageProps {
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
        };
    };
}

export default function PatientIndex({ patients }: PatientIndexProps) {
    const { flash } = usePage<PageProps>().props;
    const [searchTerm, setSearchTerm] = useState('');

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
                            <Table>
                                <TableHeader>
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
                                                        <Link href={`/patients/${patient.id}/edit`}>
                                                            <Button variant="outline" size="sm">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/patients/${patient.id}`}>
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

                        {/* Pagination */}
                        {patients.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong>{patients.meta?.from || 0}</strong> to <strong>{patients.meta?.to || 0}</strong> of{' '}
                                <strong>{patients.meta?.total || 0}</strong> patients
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(patients.meta?.current_page) || patients.meta?.current_page <= 1}
                                    onClick={() => window.location.href = `/patients?page=${(patients.meta?.current_page || 1) - 1}`}
                                >
                                    Previous
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(patients.meta?.current_page) || patients.meta?.current_page >= (patients.meta?.last_page || 1)}
                                    onClick={() => window.location.href = `/patients?page=${(patients.meta?.current_page || 1) + 1}`}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}