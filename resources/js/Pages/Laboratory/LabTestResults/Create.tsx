import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import {
  ArrowLeft,
  Save,
  Search,
  User,
  FlaskConical,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface Patient {
  id: number;
  patient_id: string;
  first_name: string | null;
  father_name: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
}

interface LabTest {
  id: number;
  test_id: string;
  name: string;
  category: string;
  unit: string | null;
  normal_values: string | null;
  parameters?: TestParameter[];
}

interface TestParameter {
  id: string;
  name: string;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  isCriticalLow?: number;
  isCriticalHigh?: number;
}

interface LabTestRequest {
  id: number;
  request_id: string;
  patient_id: number;
  test_name: string;
  status: string;
  patient: Patient;
}

interface PatientTestRequest {
  test_name: string;
  request_id: string;
  status: string;
}

interface LabTestResultCreateProps {
  patients: Patient[];
  labTests: LabTest[];
  requests: LabTestRequest[];
  patientTestRequests: Record<number, PatientTestRequest[]>;
}

interface ResultParameter {
  parameter_id: string;
  name: string;
  value: string;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  status: 'normal' | 'abnormal' | 'critical' | 'pending';
  notes: string;
}

// Predefined test templates with parameters
const testTemplates: Record<string, TestParameter[]> = {
  'CBC': [
    { id: 'wbc', name: 'WBC', unit: '10³/μL', referenceMin: 4.5, referenceMax: 11.0, isCriticalLow: 2.0, isCriticalHigh: 30.0 },
    { id: 'rbc', name: 'RBC', unit: '10⁶/μL', referenceMin: 4.5, referenceMax: 5.5, isCriticalLow: 2.0, isCriticalHigh: 8.0 },
    { id: 'hgb', name: 'Hemoglobin', unit: 'g/dL', referenceMin: 13.5, referenceMax: 17.5, isCriticalLow: 7.0, isCriticalHigh: 20.0 },
    { id: 'hct', name: 'Hematocrit', unit: '%', referenceMin: 38.0, referenceMax: 50.0, isCriticalLow: 20.0, isCriticalHigh: 60.0 },
    { id: 'plt', name: 'Platelets', unit: '10³/μL', referenceMin: 150, referenceMax: 400, isCriticalLow: 50, isCriticalHigh: 1000 },
    { id: 'mcv', name: 'MCV', unit: 'fL', referenceMin: 80, referenceMax: 100 },
    { id: 'mch', name: 'MCH', unit: 'pg', referenceMin: 27, referenceMax: 33 },
    { id: 'mchc', name: 'MCHC', unit: 'g/dL', referenceMin: 32, referenceMax: 36 },
  ],
  'BMP': [
    { id: 'glucose', name: 'Glucose', unit: 'mg/dL', referenceMin: 70, referenceMax: 100, isCriticalLow: 40, isCriticalHigh: 400 },
    { id: 'bun', name: 'BUN', unit: 'mg/dL', referenceMin: 7, referenceMax: 20 },
    { id: 'creatinine', name: 'Creatinine', unit: 'mg/dL', referenceMin: 0.6, referenceMax: 1.2, isCriticalHigh: 10 },
    { id: 'sodium', name: 'Sodium', unit: 'mEq/L', referenceMin: 135, referenceMax: 145, isCriticalLow: 120, isCriticalHigh: 160 },
    { id: 'potassium', name: 'Potassium', unit: 'mEq/L', referenceMin: 3.5, referenceMax: 5.0, isCriticalLow: 2.5, isCriticalHigh: 6.5 },
    { id: 'chloride', name: 'Chloride', unit: 'mEq/L', referenceMin: 98, referenceMax: 106 },
    { id: 'co2', name: 'CO2', unit: 'mEq/L', referenceMin: 23, referenceMax: 29 },
    { id: 'calcium', name: 'Calcium', unit: 'mg/dL', referenceMin: 8.5, referenceMax: 10.5 },
  ],
  'Lipid': [
    { id: 'total_chol', name: 'Total Cholesterol', unit: 'mg/dL', referenceMin: 0, referenceMax: 200 },
    { id: 'ldl', name: 'LDL Cholesterol', unit: 'mg/dL', referenceMin: 0, referenceMax: 100 },
    { id: 'hdl', name: 'HDL Cholesterol', unit: 'mg/dL', referenceMin: 40, referenceMax: 200 },
    { id: 'triglycerides', name: 'Triglycerides', unit: 'mg/dL', referenceMin: 0, referenceMax: 150 },
  ],
  'LFT': [
    { id: 'alt', name: 'ALT', unit: 'U/L', referenceMin: 7, referenceMax: 56 },
    { id: 'ast', name: 'AST', unit: 'U/L', referenceMin: 10, referenceMax: 40 },
    { id: 'alp', name: 'ALP', unit: 'U/L', referenceMin: 44, referenceMax: 147 },
    { id: 'bilirubin_total', name: 'Total Bilirubin', unit: 'mg/dL', referenceMin: 0.1, referenceMax: 1.2, isCriticalHigh: 15 },
    { id: 'bilirubin_direct', name: 'Direct Bilirubin', unit: 'mg/dL', referenceMin: 0, referenceMax: 0.3 },
    { id: 'albumin', name: 'Albumin', unit: 'g/dL', referenceMin: 3.5, referenceMax: 5.0 },
    { id: 'total_protein', name: 'Total Protein', unit: 'g/dL', referenceMin: 6.0, referenceMax: 8.3 },
  ],
  'TSH': [
    { id: 'tsh', name: 'TSH', unit: 'μIU/mL', referenceMin: 0.4, referenceMax: 4.0 },
  ],
  'HbA1c': [
    { id: 'hba1c', name: 'HbA1c', unit: '%', referenceMin: 4.0, referenceMax: 5.7 },
  ],
};

export default function LabTestResultCreate({ patients, labTests, requests, patientTestRequests }: LabTestResultCreateProps) {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [activeTab, setActiveTab] = useState('patient');

  const { data, setData, post, processing, errors } = useForm({
    lab_test_id: '',
    patient_id: '',
    request_id: '',
    performed_at: new Date().toISOString().split('T')[0],
    performed_time: new Date().toTimeString().slice(0, 5),
    results: [] as ResultParameter[],
    status: 'pending' as 'pending' | 'completed' | 'verified',
    notes: '',
    abnormal_flags: '',
  });

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!patientSearch) return patients.slice(0, 10);
    const search = patientSearch.toLowerCase();
    return patients.filter(p =>
      p.patient_id.toLowerCase().includes(search) ||
      (p.first_name?.toLowerCase() || '').includes(search) ||
      (p.father_name?.toLowerCase() || '').includes(search)
    ).slice(0, 10);
  }, [patients, patientSearch]);

  // Get lab tests specific to the selected patient
  const patientSpecificTests = useMemo(() => {
    if (!selectedPatient) return labTests;
    
    const patientTests = patientTestRequests[selectedPatient.id] || [];
    const patientTestNames = patientTests.map(t => t.test_name);
    
    return labTests.filter(test => patientTestNames.includes(test.name));
  }, [selectedPatient, labTests, patientTestRequests]);

  // Get test parameters based on selected test
  const testParameters = useMemo(() => {
    if (!selectedTest) return [];
    // Check if we have a template for this test
    const testName = selectedTest.name.toUpperCase();
    for (const [key, params] of Object.entries(testTemplates)) {
      if (testName.includes(key)) {
        return params;
      }
    }
    // Return single parameter for simple tests
    return [{
      id: 'result',
      name: selectedTest.name,
      unit: selectedTest.unit || '',
      referenceMin: 0,
      referenceMax: 0,
    }];
  }, [selectedTest]);

  // Initialize result parameters when test changes
  useEffect(() => {
    if (testParameters.length > 0 && data.results.length === 0) {
      const initialResults = testParameters.map(param => ({
        parameter_id: param.id,
        name: param.name,
        value: '',
        unit: param.unit,
        referenceMin: param.referenceMin,
        referenceMax: param.referenceMax,
        status: 'pending' as const,
        notes: '',
      }));
      setData('results', initialResults);
    }
  }, [testParameters]);

  const handlePatientSelect = (patientId: string) => {
    const patient = patients.find(p => p.id.toString() === patientId);
    setSelectedPatient(patient || null);
    setData('patient_id', patientId);
  };

  const handleTestSelect = (testId: string) => {
    const test = labTests.find(t => t.id.toString() === testId);
    setSelectedTest(test || null);
    setData('lab_test_id', testId);
    setData('results', []);
  };

  const handleParameterChange = (index: number, value: string) => {
    const newResults = [...data.results];
    const param = testParameters[index];
    const numValue = parseFloat(value);

    let status: 'normal' | 'abnormal' | 'critical' | 'pending' = 'pending';
    if (value !== '') {
      status = 'normal';
      if (param.isCriticalLow !== undefined && numValue < param.isCriticalLow) {
        status = 'critical';
      } else if (param.isCriticalHigh !== undefined && numValue > param.isCriticalHigh) {
        status = 'critical';
      } else if (numValue < param.referenceMin || numValue > param.referenceMax) {
        status = 'abnormal';
      }
    }

    newResults[index] = {
      ...newResults[index],
      value,
      status,
    };
    setData('results', newResults);
  };

  const handleParameterNotesChange = (index: number, notes: string) => {
    const newResults = [...data.results];
    newResults[index] = { ...newResults[index], notes };
    setData('results', newResults);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircle2 className="h-4 w-4 text-lab-normal" />;
      case 'abnormal':
        return <AlertCircle className="h-4 w-4 text-lab-abnormal" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-lab-critical" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'normal':
        return 'border-lab-normal/30 bg-lab-normal/5';
      case 'abnormal':
        return 'border-lab-abnormal/30 bg-lab-abnormal/5';
      case 'critical':
        return 'border-lab-critical/30 bg-lab-critical/5 animate-pulse';
      default:
        return 'border-muted';
    }
  };

  const abnormalCount = data.results.filter(r => r.status === 'abnormal' || r.status === 'critical').length;
  const criticalCount = data.results.filter(r => r.status === 'critical').length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const performedDateTime = `${data.performed_at}T${data.performed_time}`;
    post('/laboratory/lab-test-results', {
      ...data,
      performed_at: performedDateTime,
    } as Record<string, unknown>);
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  return (
    <LaboratoryLayout
      header={
        <div>
          <Heading title="Add New Lab Test Result" />
          <p className="text-muted-foreground mt-1">
            Enter test results with automatic flagging
          </p>
        </div>
      }
    >
      <Head title="Add New Lab Test Result" />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Add New Lab Test Result" />
            <p className="text-muted-foreground mt-1">
              Enter test results with automatic flagging
            </p>
          </div>

          <Link href="/laboratory/lab-test-results">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Results
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="patient">Patient</TabsTrigger>
              <TabsTrigger value="test">Test & Results</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            {/* Patient Selection Tab */}
            <TabsContent value="patient" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Select Patient</CardTitle>
                  <CardDescription>Search and select the patient for this test result</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Patient Search */}
                  <div className="space-y-2">
                    <Label>Search Patient</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or patient ID..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Patient List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto">
                    {filteredPatients.map((patient) => (
                      <button
                        key={patient.id}
                        type="button"
                        onClick={() => handlePatientSelect(patient.id.toString())}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                          data.patient_id === patient.id.toString()
                            ? 'border-primary bg-primary/5'
                            : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                        )}
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(patient.first_name, patient.father_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {patient.first_name} {patient.father_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            PID: {patient.patient_id} • {patient.age}y • {patient.gender}
                          </p>
                        </div>
                        {data.patient_id === patient.id.toString() && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    ))}
                  </div>

                  {filteredPatients.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No patients found matching your search
                    </div>
                  )}

                  {errors.patient_id && (
                    <p className="text-sm text-red-600">{errors.patient_id}</p>
                  )}

                  {/* Selected Patient Info */}
                  {selectedPatient && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Selected Patient</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium">{selectedPatient.first_name} {selectedPatient.father_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Patient ID:</span>
                          <p className="font-medium">{selectedPatient.patient_id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Age:</span>
                          <p className="font-medium">{selectedPatient.age} years</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Blood Group:</span>
                          <p className="font-medium">{selectedPatient.blood_group || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setActiveTab('test')}
                      disabled={!data.patient_id}
                    >
                      Continue to Test Selection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Test Selection & Results Tab */}
            <TabsContent value="test" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Test Selection */}
                <div className="lg:col-span-1 space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Test Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Lab Test Selection */}
                      <div className="space-y-2">
                        <Label htmlFor="lab_test_id">Lab Test *</Label>
                        {!selectedPatient ? (
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                            Please select a patient first to view their lab tests
                          </div>
                        ) : patientSpecificTests.length === 0 ? (
                          <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                            All lab tests for this patient already have results entered
                          </div>
                        ) : (
                          <Select
                            value={data.lab_test_id}
                            onValueChange={handleTestSelect}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select lab test" />
                            </SelectTrigger>
                            <SelectContent>
                              {patientSpecificTests.map((test) => (
                                <SelectItem key={test.id} value={test.id.toString()}>
                                  {test.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {errors.lab_test_id && (
                          <p className="text-sm text-red-600">{errors.lab_test_id}</p>
                        )}
                      </div>

                      {/* Request Linking (Optional) */}
                      <div className="space-y-2">
                        <Label htmlFor="request_id">Link to Request (Optional)</Label>
                        <Select
                          value={data.request_id}
                          onValueChange={(value) => setData('request_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select request" />
                          </SelectTrigger>
                          <SelectContent>
                            {requests.map((req) => (
                              <SelectItem key={req.id} value={req.id.toString()}>
                                {req.request_id} - {req.test_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Performed Date/Time */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="performed_at">Date *</Label>
                          <Input
                            id="performed_at"
                            type="date"
                            value={data.performed_at}
                            onChange={(e) => setData('performed_at', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="performed_time">Time *</Label>
                          <Input
                            id="performed_time"
                            type="time"
                            value={data.performed_time}
                            onChange={(e) => setData('performed_time', e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Status */}
                      <div className="space-y-2">
                        <Label htmlFor="status">Status *</Label>
                        <Select
                          value={data.status}
                          onValueChange={(value) => setData('status', value as 'pending' | 'completed' | 'verified')}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="verified">Verified</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Result Summary */}
                      {data.results.length > 0 && (
                        <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                          <p className="text-sm font-medium">Result Summary</p>
                          <div className="flex gap-2 flex-wrap">
                            <Badge variant="outline" className="bg-lab-normal/10 text-lab-normal">
                              {data.results.filter(r => r.status === 'normal').length} Normal
                            </Badge>
                            {abnormalCount > 0 && (
                              <Badge variant="outline" className="bg-lab-abnormal/10 text-lab-abnormal">
                                {abnormalCount} Abnormal
                              </Badge>
                            )}
                            {criticalCount > 0 && (
                              <Badge variant="destructive">
                                {criticalCount} Critical
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Notes */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Additional Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={data.notes}
                        onChange={(e) => setData('notes', e.target.value)}
                        placeholder="Enter any additional notes or interpretation..."
                        rows={4}
                      />
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Result Entry */}
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Result Entry</CardTitle>
                      <CardDescription>
                        {selectedTest
                          ? `Enter values for ${selectedTest.name}. Values will be automatically flagged based on reference ranges.`
                          : 'Select a test to enter results'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {!selectedTest ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Select a lab test to begin entering results</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {data.results.map((result, index) => {
                            const param = testParameters[index];
                            return (
                              <div
                                key={result.parameter_id}
                                className={cn(
                                  'p-4 rounded-lg border-l-4 transition-all',
                                  getStatusClass(result.status)
                                )}
                              >
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                  {/* Parameter Name */}
                                  <div className="md:col-span-3">
                                    <Label className="font-medium">{result.name}</Label>
                                    <p className="text-xs text-muted-foreground">
                                      Ref: {param?.referenceMin} - {param?.referenceMax} {result.unit}
                                    </p>
                                  </div>

                                  {/* Value Input */}
                                  <div className="md:col-span-3">
                                    <div className="relative">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        value={result.value}
                                        onChange={(e) => handleParameterChange(index, e.target.value)}
                                        placeholder="Enter value"
                                        className={cn(
                                          'pr-12',
                                          result.status === 'critical' && 'border-lab-critical'
                                        )}
                                      />
                                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                        {result.unit}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Status Indicator */}
                                  <div className="md:col-span-2 flex items-center gap-2">
                                    {getStatusIcon(result.status)}
                                    <span className={cn(
                                      'text-sm font-medium capitalize',
                                      result.status === 'normal' && 'text-lab-normal',
                                      result.status === 'abnormal' && 'text-lab-abnormal',
                                      result.status === 'critical' && 'text-lab-critical',
                                    )}>
                                      {result.status}
                                    </span>
                                  </div>

                                  {/* Notes */}
                                  <div className="md:col-span-4">
                                    <Input
                                      placeholder="Notes (optional)"
                                      value={result.notes}
                                      onChange={(e) => handleParameterNotesChange(index, e.target.value)}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}

                          {data.results.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>No parameters available for this test</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              <div className="flex justify-between">
                <Button type="button" variant="outline" onClick={() => setActiveTab('patient')}>
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveTab('review')}
                  disabled={!data.lab_test_id || data.results.length === 0}
                >
                  Review Results
                </Button>
              </div>
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Results</CardTitle>
                  <CardDescription>Review all entered values before saving</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Patient Summary */}
                  {selectedPatient && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Patient Information
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Name:</span>
                          <p className="font-medium">{selectedPatient.first_name} {selectedPatient.father_name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Patient ID:</span>
                          <p className="font-medium">{selectedPatient.patient_id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Age:</span>
                          <p className="font-medium">{selectedPatient.age} years</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gender:</span>
                          <p className="font-medium">{selectedPatient.gender}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Test Summary */}
                  {selectedTest && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FlaskConical className="h-4 w-4" />
                        Test Information
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Test:</span>
                          <p className="font-medium">{selectedTest.name}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Performed:</span>
                          <p className="font-medium">{data.performed_at} at {data.performed_time}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <p className="font-medium capitalize">{data.status}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Result ID:</span>
                          <p className="font-medium">Auto-generated</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results Summary */}
                  <div>
                    <h4 className="font-medium mb-3">Test Results</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium">Parameter</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Value</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Reference Range</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium">Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {data.results.map((result, idx) => (
                            <tr key={idx} className={cn(
                              result.status === 'critical' && 'bg-red-50',
                              result.status === 'abnormal' && 'bg-orange-50'
                            )}>
                              <td className="px-4 py-3 text-sm font-medium">{result.name}</td>
                              <td className="px-4 py-3 text-sm">
                                {result.value ? `${result.value} ${result.unit}` : '-'}
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {result.referenceMin} - {result.referenceMax} {result.unit}
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  {getStatusIcon(result.status)}
                                  <span className={cn(
                                    'text-sm capitalize',
                                    result.status === 'normal' && 'text-lab-normal',
                                    result.status === 'abnormal' && 'text-lab-abnormal',
                                    result.status === 'critical' && 'text-lab-critical',
                                  )}>
                                    {result.status}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-sm text-muted-foreground">
                                {result.notes || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Warning for critical values */}
                  {criticalCount > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-red-800">Critical Values Detected</h4>
                          <p className="text-sm text-red-700 mt-1">
                            {criticalCount} parameter(s) have critical values. Please verify these results carefully before saving.
                            Critical values require immediate physician notification.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {data.notes && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <h4 className="font-medium mb-2">Additional Notes</h4>
                      <p className="text-sm text-muted-foreground">{data.notes}</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-between pt-4 border-t">
                    <Button type="button" variant="outline" onClick={() => setActiveTab('test')}>
                      Back to Edit
                    </Button>
                    <div className="flex gap-3">
                      <Link href="/laboratory/lab-test-results">
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </Link>
                      <Button
                        type="submit"
                        disabled={processing || data.results.length === 0}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {processing ? 'Saving...' : 'Save Results'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </div>
    </LaboratoryLayout>
  );
}
