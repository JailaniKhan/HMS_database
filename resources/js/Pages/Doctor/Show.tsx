import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Phone, MapPin, User, ArrowLeft, Pencil, FileText, Currency, Calendar, Building2, Stethoscope, Trash2 } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    username: string;
}

interface Department {
    id: number;
    name: string;
    description?: string;
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
    fee_percentage: number;
    salary: number;
    bonus: number;
    department_id: number;
    status: string;
    created_at: string;
    updated_at: string;
    user: User;
    department?: Department;
}

interface DoctorShowProps {
    doctor: Doctor;
}

export default function DoctorShow({ doctor }: DoctorShowProps) {
    const [isDeleting, setIsDeleting] = useState(false);

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
        if (confirm(`Are you sure you want to delete Dr. ${doctor.full_name}? This action cannot be undone.`)) {
            setIsDeleting(true);
            router.visit(`/doctors/${doctor.id}/delete`, {
                method: 'post',
                onFinish: () => setIsDeleting(false),
            });
        }
    };

    return (
        <HospitalLayout>
            <Head title={`Doctor Details - ${doctor.doctor_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title={`Dr. ${doctor.full_name}`} />
                        <p className="text-sm text-muted-foreground mt-1">Doctor ID: {doctor.doctor_id}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <Link href={`/doctors/${doctor.id}/edit`}>
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
                        
                        <Link href="/doctors">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Doctors
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Information Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>
                                Doctor's personal and professional details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Doctor ID</p>
                                    <p className="text-base font-semibold">{doctor.doctor_id}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Full Name</p>
                                    <p className="text-base">Dr. {doctor.full_name}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Father's Name</p>
                                    <p className="text-base">{doctor.father_name || 'N/A'}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Age</p>
                                    <p className="text-base">{doctor.age || 'N/A'} years</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Username</p>
                                    <p className="text-base font-mono text-sm">{doctor.user.username}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                                        Active
                                    </Badge>
                                </div>
                            </div>
                            
                            <div className="border-t pt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-2">
                                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                                            <p className="text-base">{doctor.phone_number || 'N/A'}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-start gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium text-muted-foreground">Address</p>
                                            <p className="text-base">{doctor.address || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {doctor.bio && (
                                <div className="border-t pt-4">
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                                        <div className="space-y-1 flex-1">
                                            <p className="text-sm font-medium text-muted-foreground">Biography</p>
                                            <p className="text-base text-muted-foreground">{doctor.bio}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Sidebar Cards */}
                    <div className="space-y-6">
                        {/* Professional Details Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-base">
                                    <Stethoscope className="h-5 w-5 text-primary" />
                                    Professional Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Specialization</p>
                                    <Badge variant="outline" className="capitalize">
                                        {doctor.specialization.replace(/-/g, ' ')}
                                    </Badge>
                                </div>
                                
                                {doctor.department && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                                            <Building2 className="h-3 w-3" />
                                            Department
                                        </p>
                                        <p className="text-base">{doctor.department.name}</p>
                                    </div>
                                )}
                                
                                <div className="border-t pt-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Consultation Fees</span>
                                        <span className="font-semibold flex items-center">
                                            <Currency className="h-4 w-4" />
                                            {doctor.fees || 0}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Salary</span>
                                        <span className="font-medium flex items-center">
                                            <Currency className="h-4 w-4" />
                                            {doctor.salary || 0}
                                        </span>
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Bonus</span>
                                        <span className="font-medium flex items-center">
                                            <Currency className="h-4 w-4" />
                                            {doctor.bonus || 0}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Fee Percentage</span>
                                        <span className="font-medium">
                                            {doctor.fee_percentage || 0}%
                                        </span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

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
                                    <p className="text-sm font-medium text-muted-foreground">Joined</p>
                                    <p className="text-sm">{formatDate(doctor.created_at)}</p>
                                </div>
                                
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                    <p className="text-sm">{formatDateTime(doctor.updated_at)}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Actions Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Link href={`/doctors/${doctor.id}/appointments`} className="block">
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        View Reception
                                    </Button>
                                </Link>
                                
                                <Link href={`/billing?doctor_id=${doctor.id}`} className="block">
                                    <Button variant="outline" size="sm" className="w-full justify-start">
                                        <Currency className="mr-2 h-4 w-4" />
                                        View Billing
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}