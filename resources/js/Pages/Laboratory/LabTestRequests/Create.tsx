import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Heading from '@/components/heading';
import { PriorityBadge } from '@/components/laboratory';
import {
  ArrowLeft,
  Save,
  ClipboardList,
  Calendar,
  Search,
  User,
  Stethoscope,
  Clock,
  AlertCircle,
  Zap,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/types/patient';
import type { Doctor } from '@/types/doctor';
import type { LabTestRequestType } from '@/types/lab-test';

interface LabTestRequestCreateProps {
  patients: Patient[];
  doctors: Doctor[];
}

interface PriorityOption {
  value: LabTestRequestType;
  label: string;
  description: string;
  turnaround: string;
  icon: React.ElementType;
  color: string;
}

const priorityOptions: PriorityOption[] = [
  {
    value: 'routine',
    label: 'Routine',
    description: 'Standard processing time',
    turnaround: '4-24 hours',
    icon: Clock,
    color: 'border-blue-500 bg-blue-50 hover:bg-blue-100',
  },
  {
    value: 'urgent',
    label: 'Urgent',
    description: 'Priority processing required',
    turnaround: '1-2 hours',
    icon: AlertTriangle,
    color: 'border-orange-500 bg-orange-50 hover:bg-orange-100',
  },
  {
    value: 'stat',
    label: 'STAT',
    description: 'Immediate processing - critical',
    turnaround: '15-30 minutes',
    icon: Zap,
    color: 'border-red-500 bg-red-50 hover:bg-red-100',
  },
];

export default function LabTestRequestCreate({ patients, doctors }: LabTestRequestCreateProps) {
  const [patientSearch, setPatientSearch] = useState('');
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState('');
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const { data, setData, post, processing, errors, reset } = useForm({
    patient_id: '',
    doctor_id: '',
    test_name: '',
    test_type: 'routine' as LabTestRequestType,
    scheduled_at: new Date().toISOString().slice(0, 16),
    notes: '',
    clinical_indications: '',
  });

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 10);
    const search = patientSearch.toLowerCase();
    return patients.filter(p => 
      p.first_name?.toLowerCase().includes(search) ||
      p.father_name?.toLowerCase().includes(search) ||
      p.patient_id.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [patients, patientSearch]);

  // Filter doctors based on search
  const filteredDoctors = useMemo(() => {
    if (!doctorSearch) return doctors.slice(0, 10);
    const search = doctorSearch.toLowerCase();
    return doctors.filter(d => 
      d.full_name.toLowerCase().includes(search) ||
      d.doctor_id.toLowerCase().includes(search) ||
      d.specialization?.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [doctors, doctorSearch]);

  // Get selected patient and doctor
  const selectedPatient = patients.find(p => p.id.toString() === data.patient_id);
  const selectedDoctor = doctors.find(d => d.id.toString() === data.doctor_id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/laboratory/lab-test-requests');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData(name as keyof typeof data, value);
  };

  const handlePatientSelect = (patientId: string, patientName: string) => {
    setData('patient_id', patientId);
    setPatientSearch(patientName);
    setShowPatientDropdown(false);
  };

  const handleDoctorSelect = (doctorId: string, doctorName: string) => {
    setData('doctor_id', doctorId);
    setDoctorSearch(doctorName);
    setShowDoctorDropdown(false);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const selectedPriority = priorityOptions.find(p => p.value === data.test_type);

  return (
    <>
      <Head title="Create Lab Test Request" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Create Lab Test Request" />
            <p className="text-muted-foreground mt-1">
              Submit a new laboratory test request for a patient
            </p>
          </div>

          <Link href="/laboratory/lab-test-requests">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Requests
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Patient Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Patient Information</CardTitle>
                      <CardDescription>Select the patient for this test request</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Label htmlFor="patient_search">Patient *</Label>
                    <div className="relative mt-1.5">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="patient_search"
                        value={patientSearch}
                        onChange={(e) => {
                          setPatientSearch(e.target.value);
                          setShowPatientDropdown(true);
                          if (!e.target.value) {
                            setData('patient_id', '');
                          }
                        }}
                        onFocus={() => setShowPatientDropdown(true)}
                        placeholder="Search by name or patient ID..."
                        className={cn("pl-9", errors.patient_id && "border-destructive")}
                      />
                    </div>
                    
                    {/* Patient Dropdown */}
                    {showPatientDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowPatientDropdown(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredPatients.length > 0 ? (
                            filteredPatients.map((patient) => (
                              <button
                                key={patient.id}
                                type="button"
                                onClick={() => handlePatientSelect(
                                  patient.id.toString(),
                                  `${patient.first_name} ${patient.father_name}`
                                )}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                    {getInitials(patient.first_name, patient.father_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">
                                    {patient.first_name} {patient.father_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    PID: {patient.patient_id}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                              No patients found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {errors.patient_id && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.patient_id}
                      </p>
                    )}
                  </div>

                  {/* Selected Patient Display */}
                  {selectedPatient && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(selectedPatient.first_name, selectedPatient.father_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {selectedPatient.first_name} {selectedPatient.father_name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PID: {selectedPatient.patient_id}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Doctor Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Stethoscope className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Requesting Doctor</CardTitle>
                      <CardDescription>Select the doctor requesting this test</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative">
                    <Label htmlFor="doctor_search">Doctor *</Label>
                    <div className="relative mt-1.5">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="doctor_search"
                        value={doctorSearch}
                        onChange={(e) => {
                          setDoctorSearch(e.target.value);
                          setShowDoctorDropdown(true);
                          if (!e.target.value) {
                            setData('doctor_id', '');
                          }
                        }}
                        onFocus={() => setShowDoctorDropdown(true)}
                        placeholder="Search by name or doctor ID..."
                        className={cn("pl-9", errors.doctor_id && "border-destructive")}
                      />
                    </div>
                    
                    {/* Doctor Dropdown */}
                    {showDoctorDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowDoctorDropdown(false)}
                        />
                        <div className="absolute z-20 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                          {filteredDoctors.length > 0 ? (
                            filteredDoctors.map((doctor) => (
                              <button
                                key={doctor.id}
                                type="button"
                                onClick={() => handleDoctorSelect(
                                  doctor.id.toString(),
                                  doctor.full_name
                                )}
                                className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                              >
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-green-500/10 text-green-600 text-xs">
                                    {getInitials(doctor.full_name, null)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm">Dr. {doctor.full_name}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {doctor.specialization} • DID: {doctor.doctor_id}
                                  </p>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                              No doctors found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {errors.doctor_id && (
                      <p className="text-sm text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.doctor_id}
                      </p>
                    )}
                  </div>

                  {/* Selected Doctor Display */}
                  {selectedDoctor && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-green-500/10 text-green-600">
                          {getInitials(selectedDoctor.full_name, null)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">Dr. {selectedDoctor.full_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedDoctor.specialization} • DID: {selectedDoctor.doctor_id}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Test Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <ClipboardList className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Test Information</CardTitle>
                      <CardDescription>Enter test details and priority</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Test Name */}
                  <div className="space-y-2">
                    <Label htmlFor="test_name">Test Name *</Label>
                    <Input
                      id="test_name"
                      name="test_name"
                      value={data.test_name}
                      onChange={handleChange}
                      placeholder="e.g., Complete Blood Count, Lipid Panel..."
                      className={cn(errors.test_name && "border-destructive")}
                    />
                    {errors.test_name && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.test_name}
                      </p>
                    )}
                  </div>

                  {/* Priority Selection */}
                  <div className="space-y-2">
                    <Label>Priority Level *</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {priorityOptions.map((option) => {
                        const Icon = option.icon;
                        const isSelected = data.test_type === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setData('test_type', option.value)}
                            className={cn(
                              'relative flex flex-col items-center p-4 border-2 rounded-lg transition-all',
                              isSelected ? option.color : 'border-muted bg-background hover:bg-muted/50',
                            )}
                          >
                            <Icon className={cn(
                              'h-6 w-6 mb-2',
                              isSelected ? 'text-foreground' : 'text-muted-foreground'
                            )} />
                            <span className="font-semibold">{option.label}</span>
                            <span className="text-xs text-muted-foreground mt-1">
                              {option.turnaround}
                            </span>
                            {isSelected && (
                              <div className="absolute top-2 right-2">
                                <CheckCircle2 className="h-4 w-4 text-foreground" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {selectedPriority && (
                      <p className="text-sm text-muted-foreground">
                        {selectedPriority.description}. Expected turnaround: {selectedPriority.turnaround}
                      </p>
                    )}
                  </div>

                  {/* Scheduled Date */}
                  <div className="space-y-2">
                    <Label htmlFor="scheduled_at">Scheduled Date & Time *</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="scheduled_at"
                        name="scheduled_at"
                        type="datetime-local"
                        value={data.scheduled_at}
                        onChange={handleChange}
                        className={cn("pl-9", errors.scheduled_at && "border-destructive")}
                      />
                    </div>
                    {errors.scheduled_at && (
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.scheduled_at}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Clinical Information */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <ClipboardList className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle>Clinical Information</CardTitle>
                      <CardDescription>Add notes and clinical indications</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="clinical_indications">Clinical Indications</Label>
                    <Textarea
                      id="clinical_indications"
                      name="clinical_indications"
                      value={data.clinical_indications}
                      onChange={handleChange}
                      placeholder="Enter clinical indications or reasons for ordering this test..."
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={data.notes}
                      onChange={handleChange}
                      placeholder="Any additional notes or special instructions..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base">Request Preview</CardTitle>
                  <CardDescription>Review before submitting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Priority Badge */}
                  <div className="flex justify-center">
                    <PriorityBadge priority={data.test_type} size="lg" />
                  </div>

                  {/* Patient */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Patient</p>
                    {selectedPatient ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {getInitials(selectedPatient.first_name, selectedPatient.father_name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {selectedPatient.first_name} {selectedPatient.father_name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Not selected</span>
                    )}
                  </div>

                  {/* Doctor */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Doctor</p>
                    {selectedDoctor ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="bg-green-500/10 text-green-600 text-xs">
                            {getInitials(selectedDoctor.full_name, null)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">Dr. {selectedDoctor.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Not selected</span>
                    )}
                  </div>

                  {/* Test Name */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Test</p>
                    <p className="font-medium">{data.test_name || 'Not specified'}</p>
                  </div>

                  {/* Scheduled */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Scheduled</p>
                    <p className="text-sm">
                      {data.scheduled_at 
                        ? new Date(data.scheduled_at).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Not scheduled'
                      }
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Expected turnaround: {selectedPriority?.turnaround}</span>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 space-y-2">
                    <Button
                      type="submit"
                      disabled={processing}
                      className="w-full"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {processing ? 'Creating...' : 'Create Request'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => reset()}
                      disabled={processing}
                      className="w-full"
                    >
                      Reset Form
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
