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
import { Package, Search, PlusCircle, Building2, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface Department {
    id: number;
    name: string;
}

interface DepartmentService {
    id: number;
    name: string;
    description: string | null;
    base_cost: string;
    fee_percentage: string;
    discount_percentage: string;
    is_active: boolean;
    department_id: number;
    department: Department;
    final_cost: number;
}

interface DepartmentServiceIndexProps {
    services: {
        data: DepartmentService[];
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
    departments: Department[];
    filters: {
        search: string;
        department: string;
        status: string;
        per_page: number;
    };
}

export default function DepartmentServiceIndex({ services, departments, filters }: DepartmentServiceIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const departmentFilter = filters.department || '';
    const statusFilter = filters.status || '';

    const filteredServices = services.data.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        service.department.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: string | number | undefined | null) => {
        if (amount === undefined || amount === null || isNaN(Number(amount))) {
            return '؋0.00';
        }
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `؋${num.toFixed(2)}`;
    };

    const getStatusBadgeVariant = (isActive: boolean) => {
        return isActive ? 'default' : 'secondary';
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const url = new URL(window.location.href);
        url.searchParams.set('search', searchTerm);
        if (departmentFilter) url.searchParams.set('department', departmentFilter);
        if (statusFilter) url.searchParams.set('status', statusFilter);
        window.location.href = url.toString();
    };

    const handleFilterChange = (key: string, value: string) => {
        const url = new URL(window.location.href);
        if (value) {
            url.searchParams.set(key, value);
        } else {
            url.searchParams.delete(key);
        }
        window.location.href = url.toString();
    };

    // Calculate statistics
    const totalServices = services.meta?.total || 0;
    const activeServices = services.data.filter(s => s.is_active).length;
    const inactiveServices = services.data.filter(s => !s.is_active).length;

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
                <Head title="Department Services" />
                
                {/* Header Section with gradient */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6">
                    <div>
                        <Heading title="Department Services" />
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage and monitor all department services in the system
                        </p>
                    </div>
                    
                    <Link href="/departments">
                        <Button className="gradient-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add New Service
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="border-l-4 border-l-primary hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                                    <p className="text-2xl font-bold text-primary">{totalServices}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Package className="h-6 w-6 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Active Services</p>
                                    <p className="text-2xl font-bold text-green-600">{activeServices}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-gray-500 hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Inactive Services</p>
                                    <p className="text-2xl font-bold text-gray-600">{inactiveServices}</p>
                                </div>
                                <div className="h-12 w-12 rounded-full bg-gray-500/10 flex items-center justify-center">
                                    <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                            <CardTitle className="text-lg font-semibold">Services Directory</CardTitle>
                            
                            {/* Filters */}
                            <div className="flex flex-wrap gap-2">
                                {/* Department Filter */}
                                <select
                                    value={departmentFilter}
                                    onChange={(e) => handleFilterChange('department', e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">All Departments</option>
                                    {departments.map(dept => (
                                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                                    ))}
                                </select>
                                
                                {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                        
                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative w-full sm:w-80 mt-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search services..."
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </form>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-muted/50 sticky top-0 z-10">
                                    <TableRow className="hover:bg-transparent">
                                        <TableHead className="font-semibold">Service Name</TableHead>
                                        <TableHead className="font-semibold">Department</TableHead>
                                        <TableHead className="font-semibold">Base Cost</TableHead>
                                        <TableHead className="font-semibold">Fee %</TableHead>
                                        <TableHead className="font-semibold">Discount %</TableHead>
                                        <TableHead className="font-semibold">Final Cost</TableHead>
                                        <TableHead className="font-semibold">Status</TableHead>
                                        <TableHead className="text-right font-semibold">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                            </Table>
                        </div>
                        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                            <Table>
                                <TableBody>
                                    {filteredServices.length > 0 ? (
                                        filteredServices.map((service) => (
                                            <TableRow key={service.id} className="hover:bg-muted/50 transition-colors">
                                                <TableCell className="font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-purple-600" />
                                                        </div>
                                                        <span className="font-medium">
                                                            {service.name}
                                                        </span>
                                                    </div>
                                                    {service.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                                                            {service.description}
                                                        </p>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                                            <Building2 className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <span className="font-medium">
                                                            {service.department.name}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {formatCurrency(service.base_cost)}
                                                </TableCell>
                                                <TableCell>
                                                    {service.fee_percentage}%
                                                </TableCell>
                                                <TableCell>
                                                    {service.discount_percentage}%
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-green-600">
                                                        {formatCurrency(service.final_cost)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={getStatusBadgeVariant(service.is_active)} className="capitalize">
                                                        {service.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end space-x-2">
                                                        <Button variant="outline" size="sm" className="hover:bg-blue-50 hover:text-blue-600 hover:border-blue-600">
                                                            <Edit className="h-3 w-3 mr-1" />
                                                            Edit
                                                        </Button>
                                                        <Button variant="outline" size="sm" className="hover:bg-red-50 hover:text-red-600 hover:border-red-600">
                                                            <Trash2 className="h-3 w-3 mr-1" />
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Package className="h-8 w-8 text-muted-foreground/50" />
                                                    <p>No services found</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {services.meta && services.meta.last_page > 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between p-6 border-t bg-muted/30 gap-4">
                            <div className="text-sm text-muted-foreground">
                                Showing <strong className="text-foreground">{services.meta?.from || 0}</strong> to <strong className="text-foreground">{services.meta?.to || 0}</strong> of{' '}
                                <strong className="text-foreground">{services.meta?.total || 0}</strong> services
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(services.meta?.current_page) || services.meta?.current_page <= 1}
                                    onClick={() => window.location.href = `/departments/services?page=${(services.meta?.current_page || 1) - 1}`}
                                    className="hover:bg-primary hover:text-white"
                                >
                                    ← Previous
                                </Button>
                                
                                {/* Page Numbers */}
                                {Array.from({ length: Math.min(5, services.meta.last_page) }, (_, i) => {
                                    let pageNum: number;
                                    if (services.meta.last_page <= 5) {
                                        pageNum = i + 1;
                                    } else if (services.meta.current_page <= 3) {
                                        pageNum = i + 1;
                                    } else if (services.meta.current_page >= services.meta.last_page - 2) {
                                        pageNum = services.meta.last_page - 4 + i;
                                    } else {
                                        pageNum = services.meta.current_page - 2 + i;
                                    }
                                    
                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={services.meta.current_page === pageNum ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => window.location.href = `/departments/services?page=${pageNum}`}
                                            className={services.meta.current_page === pageNum ? "bg-primary" : "hover:bg-primary hover:text-white"}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                                
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={!(services.meta?.current_page) || services.meta?.current_page >= (services.meta?.last_page || 1)}
                                    onClick={() => window.location.href = `/departments/services?page=${(services.meta?.current_page || 1) + 1}`}
                                    className="hover:bg-primary hover:text-white"
                                >
                                    Next →
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
