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

interface Department {
    id: number;
    name: string;
}

interface DoctorCreateProps {
    departments?: Department[];
}

export default function DoctorCreate({ departments = [] }: DoctorCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        full_name: '',
        father_name: '',
        age: '',
        specialization: '',
        phone_number: '',
        address: '',
        bio: '',
        fees: '',
        salary: '',
        bonus: '',
        department_id: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/doctors', {
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
            <Head title="Add New Doctor" />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Add New Doctor" />
                    
                    <Link href="/doctors">
                        <Button variant="outline">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Doctors
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
                        <CardTitle>Doctor Information</CardTitle>
                        <CardDescription>
                            Enter the doctor's personal and professional details.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Full Name</Label>
                                    <Input
                                        id="full_name"
                                        name="full_name"
                                        value={data.full_name}
                                        onChange={handleChange}
                                        placeholder="Enter doctor's full name"
                                    />
                                    {errors.full_name && (
                                        <p className="text-sm text-red-600">{errors.full_name}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="father_name">Father's Name</Label>
                                    <Input
                                        id="father_name"
                                        name="father_name"
                                        value={data.father_name}
                                        onChange={handleChange}
                                        placeholder="Enter father's name"
                                    />
                                    {errors.father_name && (
                                        <p className="text-sm text-red-600">{errors.father_name}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input
                                        id="age"
                                        name="age"
                                        type="number"
                                        value={data.age}
                                        onChange={handleChange}
                                        placeholder="Enter age"
                                    />
                                    {errors.age && (
                                        <p className="text-sm text-red-600">{errors.age}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="phone_number">Phone Number</Label>
                                    <Input
                                        id="phone_number"
                                        name="phone_number"
                                        value={data.phone_number}
                                        onChange={handleChange}
                                        placeholder="Enter phone number"
                                    />
                                    {errors.phone_number && (
                                        <p className="text-sm text-red-600">{errors.phone_number}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="specialization">Specialization</Label>
                                    <Select 
                                        value={data.specialization} 
                                        onValueChange={(value) => handleSelectChange('specialization', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select specialization" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="cardiology">Cardiology</SelectItem>
                                            <SelectItem value="neurology">Neurology</SelectItem>
                                            <SelectItem value="orthopedics">Orthopedics</SelectItem>
                                            <SelectItem value="pediatrics">Pediatrics</SelectItem>
                                            <SelectItem value="dermatology">Dermatology</SelectItem>
                                            <SelectItem value="general-medicine">General Medicine</SelectItem>
                                            <SelectItem value="surgery">Surgery</SelectItem>
                                            <SelectItem value="ophthalmology">Ophthalmology</SelectItem>
                                            <SelectItem value="psychiatry">Psychiatry</SelectItem>
                                            <SelectItem value="radiology">Radiology</SelectItem>
                                            <SelectItem value="emergency-medicine">Emergency Medicine</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.specialization && (
                                        <p className="text-sm text-red-600">{errors.specialization}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="department_id">Department</Label>
                                    {departments && departments.length > 0 ? (
                                        <Select 
                                            value={data.department_id} 
                                            onValueChange={(value) => handleSelectChange('department_id', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select department" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {departments.map((department) => (
                                                    <SelectItem key={department.id} value={department.id.toString()}>
                                                        {department.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>No departments available. Please create a department first.</span>
                                        </div>
                                    )}
                                    {errors.department_id && (
                                        <p className="text-sm text-red-600">{errors.department_id}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="fees">Consultation Fees</Label>
                                    <Input
                                        id="fees"
                                        name="fees"
                                        type="number"
                                        step="1"
                                        value={data.fees}
                                        onChange={handleChange}
                                        placeholder="Enter consultation fees (؋)"
                                    />
                                    {errors.fees && (
                                        <p className="text-sm text-red-600">{errors.fees}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="salary">Salary</Label>
                                    <Input
                                        id="salary"
                                        name="salary"
                                        type="number"
                                        step="1"
                                        value={data.salary}
                                        onChange={handleChange}
                                        placeholder="Enter salary (؋)"
                                    />
                                    {errors.salary && (
                                        <p className="text-sm text-red-600">{errors.salary}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2">
                                    <Label htmlFor="bonus">Bonus</Label>
                                    <Input
                                        id="bonus"
                                        name="bonus"
                                        type="number"
                                        step="1"
                                        value={data.bonus}
                                        onChange={handleChange}
                                        placeholder="Enter bonus (؋)"
                                    />
                                    {errors.bonus && (
                                        <p className="text-sm text-red-600">{errors.bonus}</p>
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
                                        rows={3}
                                    />
                                    {errors.address && (
                                        <p className="text-sm text-red-600">{errors.address}</p>
                                    )}
                                </div>
                                
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <Textarea
                                        id="bio"
                                        name="bio"
                                        value={data.bio}
                                        onChange={handleChange}
                                        placeholder="Enter doctor's biography"
                                        rows={3}
                                    />
                                    {errors.bio && (
                                        <p className="text-sm text-red-600">{errors.bio}</p>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex justify-end space-x-4 pt-4">
                                <Link href="/doctors">
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </Link>
                                <Button type="submit" disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                                    <Save className="mr-2 h-4 w-4" />
                                    {processing ? 'Saving...' : 'Save Doctor'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}