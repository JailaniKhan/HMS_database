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
    Heart, 
    Phone, 
    CheckCircle2,
    CircleDashed,
    ChevronRight
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
    const [updateSuccess, setUpdateSuccess] = useState(false);

    const { data, setData, processing, errors, put, wasSuccessful } = useForm<PatientFormData>({
        first_name: patient?.first_name || '',
        father_name: patient?.father_name || '',
        gender: patient?.gender || '',
        phone: patient?.phone || '',
        address: patient?.address || '',
        age: patient?.age?.toString() || '',
        blood_group: patient?.blood_group || '',
        blood_type: patient?.blood_type || '',
        allergies: patient?.allergies || '',
        emergency_contact_name: patient?.emergency_contact_name || '',
        emergency_contact_phone: patient?.emergency_contact_phone || '',
        medical_history: patient?.medical_history || '',
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

        // Construct URL directly since route() helper may have caching issues
        const updateUrl = `/patients/${patient.patient_id}`;

        try {
            put(updateUrl, {
                preserveState: true,
                onSuccess: (page) => {
                    setIsSubmitting(false);
                    setUpdateSuccess(true);
                    console.log('Update successful!', page);
                    // Clear success message after 3 seconds
                    setTimeout(() => setUpdateSuccess(false), 3000);
                },
                onError: (errors: Record<string, string>) => {
                    setIsSubmitting(false);
                    console.error('Update errors:', errors);
                },
            });
        } catch (error) {
            setIsSubmitting(false);
            console.error('Unexpected error:', error);
        }
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
        { id: 'medical', label: 'Medical Details', icon: Heart },
        { id: 'emergency', label: 'Emergency Contact', icon: Phone },
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
                            description="Update patient information and medical details"
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

                {/* Success Message */}
                {(updateSuccess || wasSuccessful) && (
                    <Alert className="bg-green-50 border-green-200">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            Patient information has been updated successfully!
                        </AlertDescription>
                    </Alert>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                        <TabsList className="grid w-full grid-cols-3">
                            {tabs.map((tab) => (
                                <TabsTrigger 
                                    key={tab.id} 
                                    value={tab.id}
                                    className="flex items-center gap-2"
                                >
                                    <tab.icon className="h-4 w-4" />
                                    {tab.label}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {/* Personal Information Tab */}
                        <TabsContent value="personal" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5 text-blue-500" />
                                        Personal Information
                                    </CardTitle>
                                    <CardDescription>
                                        Basic demographic and contact information for the patient.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* First Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="first_name" className="required">
                                                First Name
                                            </Label>
                                            <Input
                                                id="first_name"
                                                name="first_name"
                                                value={data.first_name}
                                                onChange={handleChange}
                                                placeholder="Enter first name"
                                                className={errors.first_name ? 'border-red-500' : ''}
                                            />
                                            {errors.first_name && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.first_name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Father's Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="father_name">Father's Name</Label>
                                            <Input
                                                id="father_name"
                                                name="father_name"
                                                value={data.father_name}
                                                onChange={handleChange}
                                                placeholder="Enter father's name"
                                                className={errors.father_name ? 'border-red-500' : ''}
                                            />
                                            {errors.father_name && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.father_name}
                                                </p>
                                            )}
                                        </div>

                                        {/* Gender */}
                                        <div className="space-y-2">
                                            <Label htmlFor="gender" className="required">Gender</Label>
                                            <Select 
                                                value={data.gender} 
                                                onValueChange={(value) => handleSelectChange('gender', value)}
                                            >
                                                <SelectTrigger className={errors.gender ? 'border-red-500' : ''}>
                                                    <SelectValue placeholder="Select gender" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="male">Male</SelectItem>
                                                    <SelectItem value="female">Female</SelectItem>
                                                    <SelectItem value="other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            {errors.gender && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.gender}
                                                </p>
                                            )}
                                        </div>

                                        {/* Age */}
                                        <div className="space-y-2">
                                            <Label htmlFor="age" className="required">Age</Label>
                                            <Input
                                                id="age"
                                                name="age"
                                                type="number"
                                                min="0"
                                                max="150"
                                                value={data.age}
                                                onChange={handleChange}
                                                placeholder="Enter age"
                                                className={errors.age ? 'border-red-500' : ''}
                                            />
                                            {errors.age && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.age}
                                                </p>
                                            )}
                                        </div>

                                        {/* Phone */}
                                        <div className="space-y-2">
                                            <Label htmlFor="phone">Phone Number</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                value={data.phone}
                                                onChange={handleChange}
                                                placeholder="Enter phone number"
                                                className={errors.phone ? 'border-red-500' : ''}
                                            />
                                            {errors.phone && (
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.phone}
                                                </p>
                                            )}
                                        </div>

                                        {/* Blood Group */}
                                        <div className="space-y-2">
                                            <Label htmlFor="blood_group">Blood Group</Label>
                                            <Select 
                                                value={data.blood_group || ''} 
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
                                                <p className="text-sm text-red-600 flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    {errors.blood_group}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Address</Label>
                                        <Textarea
                                            id="address"
                                            name="address"
                                            value={data.address}
                                            onChange={handleChange}
                                            placeholder="Enter full address"
                                            rows={3}
                                            className={errors.address ? 'border-red-500' : ''}
                                        />
                                        {errors.address && (
                                            <p className="text-sm text-red-600 flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                {errors.address}
                                            </p>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Medical Details Tab */}
                        <TabsContent value="medical" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Heart className="h-5 w-5 text-red-500" />
                                        Medical Information
                                    </CardTitle>
                                    <CardDescription>
                                        Blood type, allergies, and medical history for better patient care.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Blood Type */}
                                        <div className="space-y-2">
                                            <Label htmlFor="blood_type">Blood Type</Label>
                                            <Select 
                                                value={data.blood_type || ''} 
                                                onValueChange={(value) => handleSelectChange('blood_type', value)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select blood type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="A">A</SelectItem>
                                                    <SelectItem value="B">B</SelectItem>
                                                    <SelectItem value="AB">AB</SelectItem>
                                                    <SelectItem value="O">O</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-500">
                                                Different from blood group (e.g., A+ vs A)
                                            </p>
                                        </div>

                                        {/* Allergies */}
                                        <div className="space-y-2">
                                            <Label htmlFor="allergies">Allergies</Label>
                                            <Input
                                                id="allergies"
                                                name="allergies"
                                                value={data.allergies || ''}
                                                onChange={handleChange}
                                                placeholder="e.g., Penicillin, Peanuts, Dust"
                                            />
                                            <p className="text-xs text-gray-500">
                                                List any known allergies separated by commas
                                            </p>
                                        </div>
                                    </div>

                                    {/* Medical History */}
                                    <div className="space-y-2">
                                        <Label htmlFor="medical_history">Medical History</Label>
                                        <Textarea
                                            id="medical_history"
                                            name="medical_history"
                                            value={data.medical_history || ''}
                                            onChange={handleChange}
                                            placeholder="Enter relevant medical history, past surgeries, chronic conditions, etc."
                                            rows={6}
                                        />
                                        <p className="text-xs text-gray-500">
                                            Include any relevant medical information for future reference
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Emergency Contact Tab */}
                        <TabsContent value="emergency" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Phone className="h-5 w-5 text-green-500" />
                                        Emergency Contact
                                    </CardTitle>
                                    <CardDescription>
                                        Contact person to reach in case of emergency.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Emergency Contact Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="emergency_contact_name">
                                                Contact Name
                                            </Label>
                                            <Input
                                                id="emergency_contact_name"
                                                name="emergency_contact_name"
                                                value={data.emergency_contact_name || ''}
                                                onChange={handleChange}
                                                placeholder="e.g., John Doe (Spouse)"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Name and relationship to patient
                                            </p>
                                        </div>

                                        {/* Emergency Contact Phone */}
                                        <div className="space-y-2">
                                            <Label htmlFor="emergency_contact_phone">
                                                Contact Phone
                                            </Label>
                                            <Input
                                                id="emergency_contact_phone"
                                                name="emergency_contact_phone"
                                                value={data.emergency_contact_phone || ''}
                                                onChange={handleChange}
                                                placeholder="+1 (555) 123-4567"
                                            />
                                            <p className="text-xs text-gray-500">
                                                Phone number including country code
                                            </p>
                                        </div>
                                    </div>

                                    <Alert className="bg-blue-50 border-blue-200">
                                        <AlertCircle className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-800">
                                            This contact will be notified in case of medical emergencies.
                                            Please ensure the information is accurate and up to date.
                                        </AlertDescription>
                                    </Alert>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-4 pt-6 mt-6 border-t">
                        <Link href={`/patients/${patient.patient_id}`}>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </Link>
                        <Button 
                            type="submit" 
                            disabled={processing || isSubmitting}
                            className="bg-blue-600 hover:bg-blue-700 min-w-37.5"
                        >
                            {processing || isSubmitting ? (
                                <>
                                    <CircleDashed className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>

                {/* Navigation Hint */}
                <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        {tabs.map((tab, index) => (
                            <React.Fragment key={tab.id}>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1 px-3 py-1 rounded-full transition-colors ${
                                        activeTab === tab.id
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'hover:bg-gray-100'
                                    }`}
                                >
                                    <tab.icon className="h-3 w-3" />
                                    {tab.label}
                                </button>
                                {index < tabs.length - 1 && (
                                    <ChevronRight className="h-4 w-4 text-gray-400" />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}
