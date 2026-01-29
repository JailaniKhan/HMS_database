import { Head, Link, router, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { 
    Building, Phone, MapPin, Users, ArrowLeft, Pencil, Trash2, 
    Calendar, Stethoscope, Plus, Activity, Edit
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState } from 'react';
import { Department, DepartmentService } from '@/types/department';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

interface DepartmentShowProps {
    department: Department;
}

export default function DepartmentShow({ department }: DepartmentShowProps) {
    const [isDeleting, setIsDeleting] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState<DepartmentService | null>(null);

    const { data, setData, post, put, reset, processing, errors } = useForm({
        name: '',
        description: '',
        base_cost: 0,
        fee_percentage: 0,
        discount_percentage: 0,
        is_active: true,
    });

    const openAddServiceModal = () => {
        setEditingService(null);
        reset();
        setIsServiceModalOpen(true);
    };

    const openEditServiceModal = (service: DepartmentService) => {
        setEditingService(service);
        setData({
            name: service.name,
            description: service.description || '',
            base_cost: service.base_cost,
            fee_percentage: service.fee_percentage,
            discount_percentage: service.discount_percentage,
            is_active: service.is_active,
        });
        setIsServiceModalOpen(true);
    };

    const handleServiceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingService) {
            put(route('departments.services.update', editingService.id), {
                onSuccess: () => {
                    setIsServiceModalOpen(false);
                    reset();
                }
            });
        } else {
            post(route('departments.services.store', department.id), {
                onSuccess: () => {
                    setIsServiceModalOpen(false);
                    reset();
                }
            });
        }
    };

    const handleDeleteService = (service: DepartmentService) => {
        if (confirm(`Are you sure you want to remove the service "${service.name}"?`)) {
            router.delete(route('departments.services.destroy', service.id));
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleDelete = () => {
        if (confirm(`Are you sure you want to delete ${department.name}? This action cannot be undone.`)) {
            setIsDeleting(true);
            router.delete(`/departments/${department.id}`, {
                onFinish: () => setIsDeleting(false),
            });
        }
    };

    return (
        <HospitalLayout>
            <Head title={`Department Details - ${department.department_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title={department.name} />
                        <p className="text-sm text-muted-foreground mt-1">Department ID: {department.department_id}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/departments/${department.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        
                        <Button 
                            variant="outline" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                        
                        <Link href="/departments">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Departments
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5 text-primary" />
                                Department Information
                            </CardTitle>
                            <CardDescription>
                                Department details and contact information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Department ID</p>
                                    <p className="text-base font-semibold">{department.department_id}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Department Name</p>
                                    <p className="text-base">{department.name}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Head Doctor</p>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-base">{department.head_doctor_name || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {department.description && (
                                <div className="border-t pt-4">
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                                    <p className="text-base text-muted-foreground">{department.description}</p>
                                </div>
                            )}
                            
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                                            <p className="text-base">{department.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Address</p>
                                            <p className="text-base">{department.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Sidebar Cards */}
                    <div className="space-y-6">
                        {/* Timeline Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    Timeline
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                                    <p className="text-sm">{formatDate(department.created_at)}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                    <p className="text-sm">{formatDateTime(department.updated_at)}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                        Active
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href={`/doctors?department_id=${department.id}`} className="block">
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Stethoscope className="mr-2 h-4 w-4" />
                                        View Doctors
                                    </Button>
                                </Link>
                                
                                <Link href={`/appointments?department_id=${department.id}`} className="block">
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        View Appointments
                                    </Button>
                                </Link>

                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="w-full justify-start text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={openAddServiceModal}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add New Service
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Services Management Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                Services Offered
                            </CardTitle>
                            <CardDescription>
                                Manage services and pricing for this department
                            </CardDescription>
                        </div>
                        <Button size="sm" onClick={openAddServiceModal}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Service
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Service Name</TableHead>
                                        <TableHead>Base Cost</TableHead>
                                        <TableHead>Fee (%)</TableHead>
                                        <TableHead>Discount (%)</TableHead>
                                        <TableHead>Final Cost</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {department.services && department.services.length > 0 ? (
                                        department.services.map((service) => (
                                            <TableRow key={service.id}>
                                                <TableCell className="font-medium">
                                                    <div>
                                                        <p>{service.name}</p>
                                                        {service.description && (
                                                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                                {service.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>${service.base_cost}</TableCell>
                                                <TableCell>{service.fee_percentage}%</TableCell>
                                                <TableCell>{service.discount_percentage}%</TableCell>
                                                <TableCell className="font-bold text-primary">
                                                    ${service.final_cost}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={service.is_active ? "secondary" : "outline"}>
                                                        {service.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            onClick={() => openEditServiceModal(service)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            className="text-red-600 hover:text-red-700"
                                                            onClick={() => handleDeleteService(service)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                                No services defined for this department.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Service Add/Edit Modal */}
                <Dialog open={isServiceModalOpen} onOpenChange={setIsServiceModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                            <DialogDescription>
                                Set the service details and pricing information.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleServiceSubmit}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Service Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Consultation, Surgery, etc."
                                        required
                                    />
                                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Brief description of the service"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="base_cost">Base Cost ($)</Label>
                                        <Input
                                            id="base_cost"
                                            type="number"
                                            step="0.01"
                                            value={data.base_cost}
                                            onChange={(e) => setData('base_cost', parseFloat(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="is_active">Status</Label>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Switch
                                                id="is_active"
                                                checked={data.is_active}
                                                onCheckedChange={(checked) => setData('is_active', checked)}
                                            />
                                            <Label htmlFor="is_active">Active</Label>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="fee_percentage">Fee Percentage (%)</Label>
                                        <Input
                                            id="fee_percentage"
                                            type="number"
                                            step="0.01"
                                            value={data.fee_percentage}
                                            onChange={(e) => setData('fee_percentage', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
                                        <Input
                                            id="discount_percentage"
                                            type="number"
                                            step="0.01"
                                            value={data.discount_percentage}
                                            onChange={(e) => setData('discount_percentage', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="bg-muted p-3 rounded-md mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium">Estimated Final Cost:</span>
                                        <span className="text-lg font-bold text-primary">
                                            ${(data.base_cost + (data.base_cost * (data.fee_percentage / 100)) - (data.base_cost * (data.discount_percentage / 100))).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsServiceModalOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {editingService ? 'Save Changes' : 'Add Service'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </HospitalLayout>
    );
}