import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import { Phone, MapPin, User, ArrowLeft, Pencil, FileText, Droplet, Users } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Patient } from '@/types/patient';

interface PatientShowProps {
    patient: Patient;
}

export default function PatientShow({ patient }: PatientShowProps) {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

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
            <Head title={`Patient Details - ${patient.patient_id}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title={`Patient: ${patient.patient_id}`} />
                    
                    <div className="flex space-x-2">
                        <Link href={`/patients/${patient.id}/edit`}>
                            <Button variant="outline">
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        
                        <Link href="/patients">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Patients
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Patient Information Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="mr-2 h-5 w-5" />
                                Personal Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Patient ID</h3>
                                    <p className="text-lg font-semibold">{patient.patient_id}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Name</h3>
                                    <p className="text-lg">{patient.first_name || 'N/A'}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Father's Name</h3>
                                    <p className="flex items-center">
                                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {patient.father_name || 'N/A'}
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Gender</h3>
                                    <div className="pt-1">
                                        {patient.gender ? (
                                            <Badge variant={getGenderBadgeVariant(patient.gender as string)}>
                                                {(patient.gender as string).charAt(0).toUpperCase() + (patient.gender as string).slice(1)}
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline">N/A</Badge>
                                        )}

                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Age</h3>
                                    <p>{patient.age || 'N/A'} years</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Blood Group</h3>
                                    <p className="flex items-center">
                                        <Droplet className="mr-2 h-4 w-4 text-muted-foreground" />
                                        {patient.blood_group ? (
                                            <Badge variant="outline">{patient.blood_group}</Badge>
                                        ) : 'N/A'}
                                    </p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                                    <p>{patient.user?.username || 'N/A'}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-4 pt-2">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
                                    <div className="flex items-center pt-1">
                                        <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>{patient.phone || 'N/A'}</span>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
                                    <div className="flex items-start pt-1">
                                        <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-0.5" />
                                        <span>{patient.address || 'N/A'}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Patient Summary Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-2 h-5 w-5" />
                                Patient Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Created</h3>
                                <p className="text-sm">{formatDate(patient.created_at)}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Last Updated</h3>
                                <p className="text-sm">{formatDate(patient.updated_at)}</p>
                            </div>
                            
                            <div>
                                <h3 className="text-sm font-medium text-muted-foreground">Account Status</h3>
                                <Badge variant="outline">Active</Badge>
                            </div>
                            
                            <div className="pt-4">
                                <h3 className="text-sm font-medium text-muted-foreground">Related Actions</h3>
                                <div className="flex flex-col space-y-2 pt-2">
                                    <Link href={`/appointments?patient_id=${patient.id}`}>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            View Appointments
                                        </Button>
                                    </Link>
                                    
                                    <Link href={`/billing?patient_id=${patient.id}`}>
                                        <Button variant="outline" size="sm" className="w-full justify-start">
                                            View Billing
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Additional Information Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>Additional Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="prose max-w-none">
                            <p>This patient profile contains all relevant medical and contact information. 
                            Healthcare providers can use this information to coordinate care and maintain 
                            accurate records.</p>
                            
                            <div className="mt-4 p-4 bg-muted rounded-md">
                                <h4 className="font-medium mb-2">Important Notes</h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm">
                                    <li>All patient information is kept confidential and secure</li>
                                    <li>Medical history and treatment plans can be accessed separately</li>
                                    <li>Emergency contacts are maintained in the patient's profile</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}