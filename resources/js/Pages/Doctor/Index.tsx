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
import { Phone, PlusCircle, Search, User } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface UserInterface {
    id: number;
    name: string;
    username: string;
}

interface Doctor {
    id: number;
    doctor_id: string;
    full_name: string;
    father_name: string;
    age: number;
    specialization: string;
    phone_number: string;
    address: string;
    bio: string;
    fees: number;
    salary: number;
    bonus: number;
    created_at: string;
    user: UserInterface;
}

interface DoctorIndexProps {
    doctors: {
        data: Doctor[];
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

export default function DoctorIndex({ doctors }: DoctorIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDoctors = doctors.data.filter(doctor =>
        doctor.doctor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Doctors" />
                
                {/* Header Section with gradient */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2">
                    <div>
                        <Heading title="Doctor Management" />
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage and monitor all doctors in the system
                        </p>
                    </div>
                    
                    <Link href="/doctors/create">
                        <Button className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Doctor
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Doctors</p>
                                    <p className="text-2xl font-bold text-primary">{doctors.meta?.total || 0}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Doctors</p>
                                    <p className="text-2xl font-bold text-green-600">{doctors.data.filter(d => d.user).length}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <PlusCircle className="h-6 w-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Specializations</p>
                                    <p className="text-2xl font-bold text-blue-600">{new Set(doctors.data.map(d => d.specialization)).size}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
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
                            <CardTitle className="text-lg font-semibold">Doctors Directory</CardTitle>
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search by name, ID, or specialization..."
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
                                        <TableHead className="font-semibold w-[100px]">Doctor ID</TableHead>
                                        <TableHead className="font-semibold">Name</TableHead>
                                        <TableHead className="font-semibold">Father Name</TableHead>
                                        <TableHead className="font-semibold">Age</TableHead>
                                        <TableHead className="font-semibold">Specialization</TableHead>
                                        <TableHead className="font-semibold">Contact</TableHead>
                                        <TableHead className="font-semibold">Fees</TableHead>
                                        <TableHead className="font-semibold">Salary</TableHead>
                                        <TableHead className="text-right font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDoctors.length > 0 ? (
                                        filteredDoctors.map((doctor) => (
                                            <TableRow key={doctor.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium">
                                                    <Badge variant="outline" className="font-mono text-xs">
                                                        {doctor.doctor_id}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                            {doctor.full_name.charAt(0)}
                                                        </div>
                                                        Dr. {doctor.full_name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {doctor.father_name || <span className="text-gray-400 italic">N/A</span>}
                                                </TableCell>
                                                <TableCell>
                                                    {doctor.age ? (
                                                        <Badge variant="secondary" className="font-normal">
                                                            {doctor.age} yrs
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-gray-400 italic">N/A</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize bg-primary/5 border-primary/20 text-primary">
                                                        {doctor.specialization.replace(/-/g, ' ')}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{doctor.phone_number || 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-green-600">؋{doctor.fees || 0}</span>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-blue-600">؋{doctor.salary || 0}</span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/doctors/${doctor.id}/edit`}>
                                                            <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                                                Edit
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/doctors/${doctor.id}`}>
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
                                            <TableCell colSpan={9} className="h-32 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <User className="h-12 w-12 mb-2 opacity-20" />
                                                    <p className="font-medium">No doctors found</p>
                                                    <p className="text-sm">Try adjusting your search</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {doctors.meta && (
                            <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t bg-muted/30 gap-4">
                                <div className="text-sm text-muted-foreground">
                                    Showing <strong className="text-foreground">{doctors.meta.from || 0}</strong> to{' '}
                                    <strong className="text-foreground">{doctors.meta.to || 0}</strong> of{' '}
                                    <strong className="text-foreground">{doctors.meta.total || 0}</strong> doctors
                                </div>

                                <div className="flex items-center gap-2">
                                    {/* Previous */}
                                    {doctors.meta.current_page <= 1 ? (
                                        <Button variant="outline" size="sm" disabled>
                                            Previous
                                        </Button>
                                    ) : (
                                        <Link href={`/doctors?page=${doctors.meta.current_page - 1}`}>
                                            <Button variant="outline" size="sm" className="hover:bg-primary hover:text-primary-foreground transition-colors">
                                                Previous
                                            </Button>
                                        </Link>
                                    )}

                                    {/* Current / Total pages */}
                                    <div className="flex items-center gap-1 px-3 py-1 rounded-md bg-muted text-sm font-medium">
                                        <span>{doctors.meta.current_page}</span>
                                        <span className="text-muted-foreground">/</span>
                                        <span className="text-muted-foreground">{doctors.meta.last_page}</span>
                                    </div>

                                    {/* Next */}
                                    {doctors.meta.current_page >= doctors.meta.last_page ? (
                                        <Button variant="outline" size="sm" disabled>
                                            Next
                                        </Button>
                                    ) : (
                                        <Link href={`/doctors?page=${doctors.meta.current_page + 1}`}>
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