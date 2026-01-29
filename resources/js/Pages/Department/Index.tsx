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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Building, Users, Phone, PlusCircle, Search, Eye, Pencil, Trash2, Activity } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Department } from '@/types/department';

interface DepartmentIndexProps {
    departments: {
        data: Department[];
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

export default function DepartmentIndex({ departments }: DepartmentIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const filteredDepartments = departments.data.filter(department => {
        const searchLower = searchTerm.toLowerCase();
        return (
            (department.department_id?.toLowerCase() || '').includes(searchLower) ||
            (department.name?.toLowerCase() || '').includes(searchLower) ||
            (department.description?.toLowerCase() || '').includes(searchLower) ||
            (department.head_doctor_name?.toLowerCase() || '').includes(searchLower)
        );
    });

    const handleDelete = (id: number, name: string) => {
        if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
            setDeletingId(id);
            router.delete(`/departments/${id}`, {
                onFinish: () => setDeletingId(null),
            });
        }
    };



    return (
        <HospitalLayout>
            <Head title="Departments" />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Departments" />
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage hospital departments and their information
                        </p>
                    </div>
                    
                    <Link href="/departments/create">
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Department
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>All Departments</CardTitle>
                        <CardDescription>
                            View and manage all hospital departments
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search departments..."
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
                                        <TableHead className="w-[100px]">ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Head Doctor</TableHead>
                                        <TableHead>Services</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDepartments.length > 0 ? (
                                        filteredDepartments.map((department, index) => (
                                            <TableRow key={department.id}>
                                                <TableCell className="font-medium text-center">
                                                    {(departments.meta?.from || 1) + index}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        <span className="font-semibold">{department.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs truncate" title={department.description || 'N/A'}>
                                                        {department.description || 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {department.head_doctor_name || 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {department.services_count || 0} Services
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center">
                                                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                                        {department.phone || 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                                        Active
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Link href={`/departments/${department.id}`}>
                                                            <Button variant="ghost" size="sm" title="View details">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/departments/${department.id}/edit`}>
                                                            <Button variant="ghost" size="sm" title="Edit">
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm"
                                                            title="Delete"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            onClick={() => handleDelete(department.id, department.name)}
                                                            disabled={deletingId === department.id}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                No departments found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {departments.meta && (
                        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong>{departments.meta?.from || 0}</strong> to <strong>{departments.meta?.to || 0}</strong> of{' '}
                                <strong>{departments.meta?.total || 0}</strong> departments
                            </div>
                            
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(departments.meta?.current_page) || departments.meta?.current_page <= 1}
                                    onClick={() => window.location.href = `/departments?page=${(departments.meta?.current_page || 1) - 1}`}
                                >
                                    Previous
                                </Button>
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(departments.meta?.current_page) || departments.meta?.current_page >= (departments.meta?.last_page || 1)}
                                    onClick={() => window.location.href = `/departments?page=${(departments.meta?.current_page || 1) + 1}`}
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