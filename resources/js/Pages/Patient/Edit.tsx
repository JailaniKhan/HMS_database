import React, { useState, type FormEvent, type ChangeEvent } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Heading from '@/components/heading';
import { Link } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Save, 
    AlertCircle, 
    User, 
    CheckCircle2,
    CircleDashed
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Patient, PatientFormData } from '@/types/patient';

interface PatientEditProps {
    patient: Patient;
}

type TabValue = 'personal' | 'medical' | 'emergency';

export default function PatientEdit({ patient }: PatientEditProps) {
    const [activeTab, setActiveTab] = useState<TabValue>('personal');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data, setData, processing, errors, put, wasSuccessful } = useForm<PatientFormData>({
        first_name: patient?.first_name || '',
        father_name: patient?.father_name || '',
        gender: patient?.gender || '',
        phone: patient?.phone || '',
        address: patient?.address || '',
        age: patient?.age?.toString() || '',
        blood_group: patient?.blood_group || '',
    });

    // Validation checks
    if (!patient) {
        return (
            <HospitalLayout>
                <div className="p-6">
                    <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            Error: No patient data received. Please go back and try again.
                        </AlertDescription>
                    </Alert>
                </div>
            </HospitalLayout>
        );
    }

    if (!patient.patient_id) {
        return (
            <HospitalLayout>
                <div className="p-6">
                    <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            Error: Patient ID is missing. Please go back and try again.
                        </AlertDescription>
                    </Alert>
                </div>
            </HospitalLayout>
        );
    }

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validate patient ID exists
        if (!patient.patient_id) {
            console.error('Patient ID is missing!');
            setIsSubmitting(false);
            return;
        }

        // Use the route helper with the patient ID
        const updateUrl = route('patients.update', { patient: patient.patient_id });

        put(updateUrl, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
            },
        });
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData(name as keyof typeof data, value);
    };

    const handleSelectChange = (name: string, value: string) => {
        setData(name as keyof typeof data, value);
    };

    const tabs: { id: TabValue; label: string; icon: typeof User }[] = [
        { id: 'personal', label: 'Personal Info', icon: User },
    ];

    const totalErrors = Object.keys(errors).length;
    const completedFields = [
        data.first_name,
        data.father_name,
        data.gender,
        data.phone,
        data.age,
    ].filter(Boolean).length;

    return (
        <HospitalLayout>
            <Head title={`Edit Patient - ${patient.patient_id}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading 
                            title={`Edit Patient: ${patient.patient_id}`}
                            description="Update patient information"
                        />
                    </div>
                    
                    <Link href={`/patients/${patient.patient_id}`}>
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Details
                        </Button>
                    </Link>
                </div>

                {/* Progress Indicator */}
                <Card className="bg-linear-to-r from-blue-50 to-indigo-50 border-blue-100">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                {wasSuccessful ? (
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                ) : (
                                    <CircleDashed className="h-6 w-6 text-blue-500 animate-pulse" />
                                )}
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {wasSuccessful ? 'Patient updated successfully!' : 'Editing Patient Record'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {completedFields} of 5 required fields completed
                                    </p>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500">
                                {processing || isSubmitting ? (
                                    <span className="flex items-center text-blue-600">
                                        <CircleDashed className="animate-spin h-4 w-4 mr-2" />
                                        Saving changes...
                                    </span>
                                ) : wasSuccessful ? (
                                    <span className="flex items-center text-green-600">
                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                        Saved!
                                    </span>
                                ) : (
                                    <span>Ready to save</span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Error Alert */}
                {totalErrors > 0 && (
                    <Alert className="bg-red-50 border-red-200">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                            Please fix the {totalErrors} error{totalErrors > 1 ? 's' : ''} below before submitting.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Success Message from Backend Flash */}
                {wasSuccessful && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            Patient has been updated successfully!
                        </AlertDescription>
                    </Alert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                        <TabsList className="grid w-full grid-cols-1">
                            {tabs.map((tab) => (
                                <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* Personal Info Tab */}
                        <TabsContent value="personal" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Basic Information
                                    </CardTitle>
                                    <CardDescription>
                                        Enter the patient's basic personal details
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="first_name">First Name *</Label>
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                value={data.first_name}
                                                onChange={handleChange}
                                                placeholder="Enter first name"
                                                required
                                            />
                                            {errors.first_name && (
                                                <p className="text-sm text-red-500">{errors.first_name}</p>
                                            )}
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <Label htmlFor="father_name">Father's Name *</Label>
                                            <Input
                                                id="father_name"
                                                name="father_name"
                                                value={data.father_name}
                                                onChange={handleChange}
                                                placeholder="Enter father's name"
                                                required
                                            />
                                            {errors.father_name && (
                                                <p className="text-sm text-red-500">{errors.father_name}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="age">Age *</Label>
                                            <Input
                                                id="age"
                                                name="age"
                                                type="number"
                                                min="0"
                                                max="150"
                                                value={data.age}
                                                onChange={handleChange}
                                                placeholder="Enter age"
                                                required
                                            />
                                            {errors.age && (
                                                <p className="text-sm text-red-500">{errors.age}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="gender">Gender *</Label>
                                            <Select 
                                                value={data.gender} 
                                                onValueChange={(value) => handleSelectChange('gender', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.gender && (
                                                <p className="text-sm text-red-500">{errors.gender}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number *</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={data.phone}
                                                onChange={handleChange}
                                                placeholder="Enter phone number"
                                                required
                                            />
                                            {errors.phone && (
                                                <p className="text-sm text-red-500">{errors.phone}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="blood_group">Blood Group</Label>
                                            <Select 
                                                value={data.blood_group} 
                                                onValueChange={(value) => handleSelectChange('blood_group', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select blood group" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A+">A+</SelectItem>
                                                    <SelectItem value="A-">A-</SelectItem>
                                                    <SelectItem value="B+">B+</SelectItem>
                                                    <SelectItem value="B-">B-</SelectItem>
                                                    <SelectItem value="AB+">AB+</SelectItem>
                                                    <SelectItem value="AB-">AB-</SelectItem>
                                                    <SelectItem value="O+">O+</SelectItem>
                                                    <SelectItem value="O-">O-</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.blood_group && (
                                                <p className="text-sm text-red-500">{errors.blood_group}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Textarea
                                            id="address"
                                            name="address"
                                            value={data.address}
                                            onChange={handleChange}
                                            placeholder="Enter full address"
                                            rows={3}
                                        />
                                        {errors.address && (
                                            <p className="text-sm text-red-500">{errors.address}</p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 mt-6">
                        <Link href={`/patients/${patient.patient_id}`}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button type="submit" disabled={processing || isSubmitting}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing || isSubmitting ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </HospitalLayout>
    );
}
