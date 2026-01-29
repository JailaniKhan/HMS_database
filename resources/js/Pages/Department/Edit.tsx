import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Heading from '@/components/heading';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';

interface Doctor {
    id: number;
    doctor_id: string;
    first_name: string;
    last_name: string;
    specialization: string;
}

interface Department {
    id: number;
    department_id: string;
    name: string;
    description?: string | null;
    head_doctor_id?: number | null;
    head_doctor_name?: string | null;
    phone?: string | null;
    address?: string | null;
    created_at: string;
    updated_at: string;
}

interface DepartmentEditProps {
    department: Department;
    doctors?: Doctor[];
}

export default function DepartmentEdit({ department, doctors = [] }: DepartmentEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        name: department.name,
        description: department.description || '',
        head_doctor_id: department.head_doctor_id?.toString() || '',
        phone: department.phone || '',
        address: department.address || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/departments/${department.id}`, {
            preserveScroll: true,
            onError: (errors) => {
                console.error('Form submission errors:', errors);
            },
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    return (
        <HospitalLayout>
            <Head title={`Edit Department - ${department.department_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title={`Edit Department: ${department.department_id}`} />
                    
                    <Link href={`/departments/${department.id}`}>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Details
                        </Button>
                    </Link>
                </div>

                {/* Error Alert */}
                {Object.keys(errors).length > 0 && (
                    <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            Please fix the errors below before submitting.
                        </AlertDescription>
                    </Alert>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Department Information</CardTitle>
                        <CardDescription>
                            Update the department's details and contact information.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Department Name</Label>
                                    <Input
                                        id="name"
                                        name="name"
                                        value={data.name}
                                        onChange={handleChange}
                                        placeholder="Enter department name"
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600">{errors.name}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="head_doctor_id">Head Doctor</Label>
                                    <Select 
                                        value={data.head_doctor_id} 
                                        onValueChange={(value) => handleSelectChange('head_doctor_id', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select head doctor" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {doctors && doctors.length > 0 ? (
                                                doctors.map(doctor => (
                                                    <SelectItem key={doctor.id} value={doctor.id.toString()}>
                                                        {doctor.doctor_id} - {doctor.first_name} {doctor.last_name} ({doctor.specialization})
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>
                                                    No doctors available
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {errors.head_doctor_id && (
                                        <p className="text-sm text-red-600">{errors.head_doctor_id}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        value={data.description}
                                        onChange={handleChange}
                                        placeholder="Enter department description"
                                        rows={3}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-600">{errors.description}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        value={data.phone}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-red-600">{errors.phone}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Textarea
                                        id="address"
                                        name="address"
                                        value={data.address}
                                        onChange={handleChange}
                                        placeholder="Enter address"
                                        rows={2}
                                    />
                                    {errors.address && (
                                        <p className="text-sm text-red-600">{errors.address}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-4 pt-4">
                                <Link href="/departments">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Update Department'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}