import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Heading from '@/components/heading';
import { PriorityBadge, LabStatusBadge, RequestTimeline } from '@/components/laboratory';
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
  Play,
  XCircle,
  RotateCcw,
  Eye,
  History,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/types/patient';
import type { Doctor } from '@/types/doctor';
import type { LabTestRequest, LabTestRequestType, LabTestRequestStatus } from '@/types/lab-test';

interface LabTestRequestEditProps {
  labTestRequest: LabTestRequest & {
    patient: Patient;
    doctor: Doctor;
  };
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

export default function LabTestRequestEdit({ labTestRequest, patients, doctors }: LabTestRequestEditProps) {
  const [patientSearch, setPatientSearch] = useState(
    `${labTestRequest.patient.first_name} ${labTestRequest.patient.father_name}`
  );
  const [showPatientDropdown, setShowPatientDropdown] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState(`Dr. ${labTestRequest.doctor.full_name}`);
  const [showDoctorDropdown, setShowDoctorDropdown] = useState(false);

  const { data, setData, put, processing, errors, reset } = useForm({
    patient_id: labTestRequest.patient_id.toString(),
    doctor_id: labTestRequest.doctor_id.toString(),
    test_name: labTestRequest.test_name,
    test_type: labTestRequest.test_type,
    status: labTestRequest.status,
    scheduled_at: labTestRequest.scheduled_at.slice(0, 16),
    notes: labTestRequest.notes || '',
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

  const canEdit = labTestRequest.status !== 'completed' && labTestRequest.status !== 'cancelled';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(`/laboratory/lab-test-requests/${labTestRequest.id}`);
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

  const handleStatusTransition = (newStatus: LabTestRequestStatus) => {
    setData('status', newStatus);
    setTimeout(() => {
      put(`/laboratory/lab-test-requests/${labTestRequest.id}`);
    }, 100);
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const selectedPriority = priorityOptions.find(p => p.value === data.test_type);

  // Generate timeline stages based on current status
  const timelineStages = useMemo((): import('@/components/laboratory/RequestTimeline').TimelineStage[] => {
    if (labTestRequest.status === 'cancelled') {
      return [
        { id: 'created', label: 'Created', status: 'completed', timestamp: formatDate(labTestRequest.created_at) },
        { id: 'cancelled', label: 'Cancelled', status: 'current' },
      ];
    }

    if (labTestRequest.status === 'pending') {
      return [
        { id: 'created', label: 'Created', status: 'completed', timestamp: formatDate(labTestRequest.created_at) },
        { id: 'pending', label: 'Pending', status: 'current' },
        { id: 'in_progress', label: 'In Progress', status: 'pending' },
        { id: 'completed', label: 'Completed', status: 'pending' },
      ];
    }

    if (labTestRequest.status === 'in_progress') {
      return [
        { id: 'created', label: 'Created', status: 'completed', timestamp: formatDate(labTestRequest.created_at) },
        { id: 'pending', label: 'Pending', status: 'completed' },
        { id: 'in_progress', label: 'In Progress', status: 'current' },
        { id: 'completed', label: 'Completed', status: 'pending' },
      ];
    }

    if (labTestRequest.status === 'completed') {
      return [
        { id: 'created', label: 'Created', status: 'completed', timestamp: formatDate(labTestRequest.created_at) },
        { id: 'pending', label: 'Pending', status: 'completed' },
        { id: 'in_progress', label: 'In Progress', status: 'completed' },
        { id: 'completed', label: 'Completed', status: 'completed', timestamp: labTestRequest.completed_at ? formatDate(labTestRequest.completed_at) : undefined },
      ];
    }

    return [
      { id: 'created', label: 'Created', status: 'completed', timestamp: formatDate(labTestRequest.created_at) },
      { id: 'pending', label: 'Pending', status: 'pending' },
      { id: 'in_progress', label: 'In Progress', status: 'pending' },
      { id: 'completed', label: 'Completed', status: 'pending' },
    ];
  }, [labTestRequest]);

  return (
    <>
      <Head title={`Edit Request - ${labTestRequest.request_id}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <Heading title={`Edit Request`} />
              <p className="text-muted-foreground mt-1">
                Request ID: <span className="font-mono">{labTestRequest.request_id}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={data.test_type} size="sm" />
              <LabStatusBadge status={data.status} size="sm" animate />
            </div>
          </div>

          <div className="flex gap-2">
            <Link href={`/laboratory/lab-test-requests/${labTestRequest.id}`}>
              <Button variant="outline">
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </Button>
            </Link>
            <Link href="/laboratory/lab-test-requests">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Requests
              </Button>
            </Link>
          </div>
        </div>

        {/* Status Workflow Controls */}
        {canEdit && (
          <Card className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <History className="h-4 w-4" />
                Status Workflow
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {labTestRequest.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleStatusTransition('in_progress')}
                      disabled={processing}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Processing
                    </Button>
                    <Button
                      onClick={() => handleStatusTransition('cancelled')}
                      disabled={processing}
                      variant="destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Request
                    </Button>
                  </>
                )}
                {labTestRequest.status === 'in_progress' && (
                  <>
                    <Button
                      onClick={() => handleStatusTransition('completed')}
                      disabled={processing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Mark Completed
                    </Button>
                    <Button
                      onClick={() => handleStatusTransition('cancelled')}
                      disabled={processing}
                      variant="destructive"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Request
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Request Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <RequestTimeline stages={timelineStages} orientation="horizontal" size="md" />
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Request Info Banner */}
              <Card className={cn(
                "border-l-4",
                labTestRequest.status === 'completed' && "border-l-green-500 bg-green-50/30",
                labTestRequest.status === 'in_progress' && "border-l-blue-500 bg-blue-50/30",
                labTestRequest.status === 'pending' && "border-l-amber-500 bg-amber-50/30",
                labTestRequest.status === 'cancelled' && "border-l-red-500 bg-red-50/30",
              )}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-lg flex items-center justify-center",
                        labTestRequest.status === 'completed' && "bg-green-100",
                        labTestRequest.status === 'in_progress' && "bg-blue-100",
                        labTestRequest.status === 'pending' && "bg-amber-100",
                        labTestRequest.status === 'cancelled' && "bg-red-100",
                      )}>
                        <ClipboardList className={cn(
                          "h-6 w-6",
                          labTestRequest.status === 'completed' && "text-green-600",
                          labTestRequest.status === 'in_progress' && "text-blue-600",
                          labTestRequest.status === 'pending' && "text-amber-600",
                          labTestRequest.status === 'cancelled' && "text-red-600",
                        )} />
                      </div>
                      <div>
                        <h2 className="font-semibold text-lg">{labTestRequest.test_name}</h2>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span className="font-mono">{labTestRequest.request_id}</span>
                          <span>•</span>
                          <span>Created: {formatDate(labTestRequest.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <PriorityBadge priority={data.test_type} size="sm" />
                      <LabStatusBadge status={data.status} size="sm" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Patient Selection */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Patient Information</CardTitle>
                      <CardDescription>Update patient for this request</CardDescription>
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
                        disabled={!canEdit}
                        className={cn("pl-9", errors.patient_id && "border-destructive")}
                      />
                    </div>
                    
                    {/* Patient Dropdown */}
                    {showPatientDropdown && canEdit && (
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
                      <CardDescription>Update the doctor requesting this test</CardDescription>
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
                        disabled={!canEdit}
                        className={cn("pl-9", errors.doctor_id && "border-destructive")}
                      />
                    </div>
                    
                    {/* Doctor Dropdown */}
                    {showDoctorDropdown && canEdit && (
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
                      <CardDescription>Update test details and priority</CardDescription>
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
                      disabled={!canEdit}
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
                            onClick={() => canEdit && setData('test_type', option.value)}
                            disabled={!canEdit}
                            className={cn(
                              'relative flex flex-col items-center p-4 border-2 rounded-lg transition-all',
                              isSelected ? option.color : 'border-muted bg-background hover:bg-muted/50',
                              !canEdit && 'opacity-50 cursor-not-allowed'
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
                        disabled={!canEdit}
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
                      <CardDescription>Update notes and clinical indications</CardDescription>
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
                      disabled={!canEdit}
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
                      disabled={!canEdit}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              {canEdit && (
                <div className="flex flex-col sm:flex-row justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => reset()}
                    disabled={processing}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reset Changes
                  </Button>
                  <Link href={`/laboratory/lab-test-requests/${labTestRequest.id}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={processing}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {processing ? 'Saving...' : 'Update Request'}
                  </Button>
                </div>
              )}
            </div>

            {/* Preview Sidebar */}
            <div className="space-y-6">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base">Request Summary</CardTitle>
                  <CardDescription>Current request details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Request ID */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Request ID</p>
                    <p className="font-mono text-sm">{labTestRequest.request_id}</p>
                  </div>

                  <Separator />

                  {/* Priority Badge */}
                  <div className="flex justify-center">
                    <PriorityBadge priority={data.test_type} size="lg" />
                  </div>

                  <Separator />

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

                  <Separator />

                  {/* Created/Updated */}
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Created</p>
                    <p className="text-sm">{formatDate(labTestRequest.created_at)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</p>
                    <p className="text-sm">{formatDate(labTestRequest.updated_at)}</p>
                  </div>

                  {!canEdit && (
                    <>
                      <Separator />
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          This request cannot be edited because it is {labTestRequest.status}.
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}
