import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Heading from '@/components/heading';
import HospitalLayout from '@/layouts/HospitalLayout';
import {
  ArrowLeft,
  Save,
  User,
  FlaskConical,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Lock,
  History,
 
} from 'lucide-react';
import { useState, useMemo } from 'react';
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
  unit: string | null;
  normal_values: string | null;
}

interface User {
  id: number;
  name: string;
}

interface ResultParameter {
  parameter_id: string;
  name: string;
  value: string;
  unit: string;
  referenceMin: number;
  referenceMax: number;
  status: 'normal' | 'abnormal' | 'critical';
  notes: string;
}

interface AuditEntry {
  id: number;
  action: string;
  field: string;
  old_value: string | null;
  new_value: string | null;
  performed_by: User;
  performed_at: string;
}

interface LabTestResult {
  id: number;
  result_id: string;
  patient_id: number;
  lab_test_id: number;
  performed_by: number;
  performed_at: string;
  verified_at: string | null;
  verified_by: number | null;
  results: string | ResultParameter[];
  status: 'pending' | 'completed' | 'verified';
  notes: string | null;
  abnormal_flags: string | null;
  created_at: string;
  updated_at: string;
  patient: Patient;
  labTest: LabTest;
  performedBy: User;
  verifiedBy?: User;
  auditTrail?: AuditEntry[];
}

interface LabTestResultEditProps {
  labTestResult: LabTestResult;
  patients: Patient[];
  labTests: LabTest[];
  canVerify: boolean;
}

export default function LabTestResultEdit({ labTestResult, patients, labTests, canVerify }: LabTestResultEditProps) {
  const [showAuditTrail, setShowAuditTrail] = useState(false);

  // Parse results from JSON string or use as-is if already an array
  const parsedResults = useMemo(() => {
    if (Array.isArray(labTestResult.results)) {
      return labTestResult.results;
    }
    try {
      return JSON.parse(labTestResult.results) as ResultParameter[];
    } catch {
      return [];
    }
  }, [labTestResult.results]);

  const isVerified = labTestResult.status === 'verified';
  const isEditable = !isVerified;

  const { data, setData, put, processing, errors } = useForm({
    lab_test_id: labTestResult.lab_test_id?.toString() || '',
    patient_id: labTestResult.patient_id?.toString() || '',
    performed_at: labTestResult.performed_at?.split('T')[0] || '',
    performed_time: labTestResult.performed_at?.split('T')[1]?.slice(0, 5) || '00:00',
    results: parsedResults,
    status: labTestResult.status || 'pending',
    notes: labTestResult.notes || '',
    abnormal_flags: labTestResult.abnormal_flags || '',
  });

  const selectedPatient = patients.find(p => p.id.toString() === data.patient_id);
  const handleParameterChange = (index: number, value: string) => {
    if (!isEditable) return;

    const newResults = [...data.results];
    const param = newResults[index];
    const numValue = parseFloat(value);

    let status: 'normal' | 'abnormal' | 'critical' = 'normal';
    if (value !== '') {
      if (numValue < param.referenceMin || numValue > param.referenceMax) {
        status = 'abnormal';
      }
      // Check for critical values (example thresholds)
      const criticalLow = param.referenceMin * 0.7;
      const criticalHigh = param.referenceMax * 1.3;
      if (numValue < criticalLow || numValue > criticalHigh) {
        status = 'critical';
      }
    }

    newResults[index] = {
      ...param,
      value,
      status,
    };
    setData('results', newResults);
  };

  const handleParameterNotesChange = (index: number, notes: string) => {
    if (!isEditable) return;

    const newResults = [...data.results];
    newResults[index] = { ...newResults[index], notes };
    setData('results', newResults);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const performedDateTime = `${data.performed_at}T${data.performed_time}`;
    put(`/laboratory/lab-test-results/${labTestResult.id}`, {
      ...data,
      performed_at: performedDateTime,
    } as Record<string, unknown>);
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
        return 'border-lab-critical/30 bg-lab-critical/5';
      default:
        return 'border-muted';
    }
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const abnormalCount = data.results.filter(r => r.status === 'abnormal' || r.status === 'critical').length;
  const criticalCount = data.results.filter(r => r.status === 'critical').length;

  return (
    <HospitalLayout>
      <Head title={`Edit Lab Test Result - ${labTestResult.result_id}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title={`Edit Lab Test Result: ${labTestResult.result_id}`} />
            <p className="text-muted-foreground mt-1">
              {isVerified ? 'View verified result (read-only)' : 'Update test results and status'}
            </p>
          </div>

          <div className="flex gap-2">
            <Link href={`/laboratory/lab-test-results/${labTestResult.id}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Details
              </Button>
            </Link>
          </div>
        </div>

        {/* Verification Warning */}
        {isVerified && (
          <Alert className="bg-amber-50 border-amber-200">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Verified Result</AlertTitle>
            <AlertDescription className="text-amber-700">
              This result has been verified and is now locked for editing. 
              Verified by {labTestResult.verifiedBy?.name || 'Unknown'} on {labTestResult.verified_at ? formatDate(labTestResult.verified_at) : 'N/A'}.
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Patient & Test Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Patient Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedPatient && (
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
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

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Age:</span>
                      <p className="font-medium">{selectedPatient?.age} years</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gender:</span>
                      <p className="font-medium">{selectedPatient?.gender}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Blood Group:</span>
                      <p className="font-medium">{selectedPatient?.blood_group || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Patient Selection (only if editable) */}
                  {isEditable && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="patient_id">Change Patient</Label>
                        <Select
                          value={data.patient_id}
                          onValueChange={(value) => setData('patient_id', value)}
                          disabled={!isEditable}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id.toString()}>
                                {patient.first_name} {patient.father_name} (PID: {patient.patient_id})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Test Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5" />
                    Test Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lab Test */}
                  <div className="space-y-2">
                    <Label htmlFor="lab_test_id">Lab Test</Label>
                    <Select
                      value={data.lab_test_id}
                      onValueChange={(value) => setData('lab_test_id', value)}
                      disabled={!isEditable}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {labTests.map((test) => (
                          <SelectItem key={test.id} value={test.id.toString()}>
                            {test.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.lab_test_id && (
                      <p className="text-sm text-red-600">{errors.lab_test_id}</p>
                    )}
                  </div>

                  {/* Performed Date/Time */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="performed_at">Date</Label>
                      <Input
                        id="performed_at"
                        type="date"
                        value={data.performed_at}
                        onChange={(e) => setData('performed_at', e.target.value)}
                        disabled={!isEditable}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="performed_time">Time</Label>
                      <Input
                        id="performed_time"
                        type="time"
                        value={data.performed_time}
                        onChange={(e) => setData('performed_time', e.target.value)}
                        disabled={!isEditable}
                      />
                    </div>
                  </div>

                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={data.status}
                      onValueChange={(value) => setData('status', value as 'pending' | 'completed' | 'verified')}
                      disabled={isVerified}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        {canVerify && (
                          <SelectItem value="verified">Verified</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {isVerified && (
                      <p className="text-xs text-muted-foreground">
                        Verified results cannot be changed
                      </p>
                    )}
                  </div>

                  {/* Performed By */}
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Performed by: <span className="font-medium text-foreground">{labTestResult.performedBy?.name || 'Unknown'}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(labTestResult.performed_at)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Result Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Result Summary</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={data.notes}
                    onChange={(e) => setData('notes', e.target.value)}
                    placeholder="Enter any additional notes or interpretation..."
                    rows={4}
                    disabled={!isEditable}
                  />
                </CardContent>
              </Card>

              {/* Audit Trail Toggle */}
              {labTestResult.auditTrail && labTestResult.auditTrail.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Audit Trail
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAuditTrail(!showAuditTrail)}
                      className="w-full"
                    >
                      {showAuditTrail ? 'Hide' : 'Show'} History ({labTestResult.auditTrail.length} entries)
                    </Button>

                    {showAuditTrail && (
                      <div className="mt-4 space-y-3">
                        {labTestResult.auditTrail.map((entry) => (
                          <div key={entry.id} className="text-sm p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{entry.action}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(entry.performed_at)}
                              </span>
                            </div>
                            <p className="text-muted-foreground">
                              Field: <span className="font-medium">{entry.field}</span>
                            </p>
                            {entry.old_value && (
                              <p className="text-muted-foreground text-xs">
                                From: {entry.old_value}
                              </p>
                            )}
                            {entry.new_value && (
                              <p className="text-muted-foreground text-xs">
                                To: {entry.new_value}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              by {entry.performed_by.name}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Results */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Test Results</CardTitle>
                  <CardDescription>
                    {isEditable
                      ? 'Edit result values. Changes will be tracked in the audit trail.'
                      : 'View result values (read-only)'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.results.map((result, index) => (
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
                              Ref: {result.referenceMin} - {result.referenceMax} {result.unit}
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
                                disabled={!isEditable}
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
                              disabled={!isEditable}
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    {data.results.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No parameters available for this test</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Warning for critical values */}
              {criticalCount > 0 && (
                <Alert className="mt-6 bg-red-50 border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Critical Values Detected</AlertTitle>
                  <AlertDescription className="text-red-700">
                    {criticalCount} parameter(s) have critical values. Please verify these results carefully.
                    Critical values require immediate physician notification.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              {isEditable && (
                <div className="flex justify-end gap-3 mt-6">
                  <Link href={`/laboratory/lab-test-results/${labTestResult.id}`}>
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
                    {processing ? 'Saving...' : 'Update Results'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>
    </HospitalLayout>
  );
}
