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
import Heading from '@/components/heading';
import {
    Truck,
    PlusCircle,
    Search,
    Edit,
    Trash2,
    Eye,
    Mail,
    Phone,
} from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';
import type { Supplier } from '@/types/pharmacy';

interface SupplierIndexProps {
    suppliers: Supplier[];
}

export default function SupplierIndex({ suppliers }: SupplierIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredSuppliers = suppliers.filter(supplier =>
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleDelete = (id: number) => {
        if (confirm('Are you sure you want to delete this supplier?')) {
            router.delete(`/pharmacy/suppliers/${id}`);
        }
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Suppliers" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Supplier Management" />
                        <p className="text-muted-foreground mt-1">
                            Manage your pharmaceutical suppliers and contacts
                        </p>
                    </div>

                    <Link href="/pharmacy/suppliers/create">
                        <Button className="bg-primary hover:bg-primary/90">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Supplier
                        </Button>
                    </Link>
                </div>

                {/* Search */}
                <div className="flex items-center space-x-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search suppliers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pl-8 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                    </div>
                </div>

                {/* Stats Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Total Suppliers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">{filteredSuppliers.length}</p>
                    </CardContent>
                </Card>

                {/* Suppliers Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>All Suppliers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {filteredSuppliers.length > 0 ? (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Supplier Name</TableHead>
                                            <TableHead>Contact Person</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Phone</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredSuppliers.map((supplier) => (
                                            <TableRow key={supplier.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <Truck className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <span className="font-medium">{supplier.name}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {supplier.contact_person || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {supplier.email ? (
                                                        <a href={`mailto:${supplier.email}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                                                            <Mail className="h-4 w-4" />
                                                            {supplier.email}
                                                        </a>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {supplier.phone ? (
                                                        <a href={`tel:${supplier.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                                                            <Phone className="h-4 w-4" />
                                                            {supplier.phone}
                                                        </a>
                                                    ) : '-'}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Link href={`/pharmacy/suppliers/${supplier.id}`}>
                                                            <Button variant="ghost" size="sm">
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/pharmacy/suppliers/${supplier.id}/edit`}>
                                                            <Button variant="ghost" size="sm">
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleDelete(supplier.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Truck className="h-12 w-12 mb-4 opacity-50" />
                                <p>No suppliers found</p>
                                {searchTerm && (
                                    <Button variant="link" onClick={() => setSearchTerm('')} className="mt-2">
                                        Clear search
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
