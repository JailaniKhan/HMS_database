import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  User,
  FlaskConical,
  Calendar,
  FileText,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { useState } from 'react';
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

interface UserType {
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
  test: LabTest;
  performedBy: UserType;
}

interface VerifyProps {
  labTestResult: LabTestResult;
}

export default function Verify({ labTestResult }: VerifyProps) {
  const [processing, setProcessing] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const parseResults = (results: string | ResultParameter[]): ResultParameter[] => {
    if (Array.isArray(results)) return results;
    try {
      return JSON.parse(results);
    } catch {
      return [];
    }
  };

  const getResultStatus = (result: LabTestResult): { hasAbnormal: boolean; hasCritical: boolean; abnormalCount: number } => {
    const params = parseResults(result.results);
    let hasAbnormal = false;
    let hasCritical = false;
    let abnormalCount = 0;

    params.forEach(param => {
      if (param.status === 'abnormal') {
        hasAbnormal = true;
        abnormalCount++;
      }
      if (param.status === 'critical') {
        hasCritical = true;
        abnormalCount++;
      }
    });

    return { hasAbnormal, hasCritical, abnormalCount };
  };

  const handleVerify = () => {
    setProcessing(true);
    router.post(`/laboratory/lab-test-results/${labTestResult.id}/verify`, {}, {
      onFinish: () => setProcessing(false),
    });
  };

  const resultStatus = getResultStatus(labTestResult);
  const params = parseResults(labTestResult.results);

  // Check if already verified
  if (labTestResult.status === 'verified') {
    return (
      <LaboratoryLayout
        header={
          <div>
            <Heading title="Result Already Verified" />
            <p className="text-muted-foreground mt-1">
              This lab test result has already been verified
            </p>
          </div>
        }
      >
        <Head title="Already Verified" />
        
        <div className="space-y-6">
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Already Verified</AlertTitle>
            <AlertDescription className="text-green-700">
              This result was verified on {labTestResult.verified_at ? formatDate(labTestResult.verified_at) : 'N/A'}.
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Link href={`/laboratory/lab-test-results/${labTestResult.id}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Result
              </Button>
            </Link>
            <Link href="/laboratory/lab-test-results">
              <Button variant="outline">View All Results</Button>
            </Link>
          </div>
        </div>
      </LaboratoryLayout>
    );
  }

  return (
    <LaboratoryLayout
      header={
        <div>
          <Heading title={`Verify Result: ${labTestResult.result_id}`} />
          <p className="text-muted-foreground mt-1">
            Review and verify lab test results
          </p>
        </div>
      }
    >
      <Head title={`Verify Result - ${labTestResult.result_id}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Verify Lab Test Result" />
            <p className="text-muted-foreground mt-1">
              Review all details before confirming verification
            </p>
          </div>

          <div className="flex gap-2">
            <Link href={`/laboratory/lab-test-results/${labTestResult.id}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Result
              </Button>
            </Link>
          </div>
        </div>

        {/* Warning Alert */}
        {resultStatus.hasCritical && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertTitle className="text-red-800">Critical Values Detected</AlertTitle>
            <AlertDescription className="text-red-700">
              This result contains critical values. Please verify carefully and ensure physician has been notified.
            </AlertDescription>
          </Alert>
        )}

        {resultStatus.hasAbnormal && !resultStatus.hasCritical && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-800">Abnormal Values Detected</AlertTitle>
            <AlertDescription className="text-amber-700">
              This result contains abnormal values. Please review carefully before verifying.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Result Summary Card */}
            <Card className={cn(
              "border-l-4",
              resultStatus.hasCritical && "border-l-red-500",
              resultStatus.hasAbnormal && !resultStatus.hasCritical && "border-l-amber-500",
              !resultStatus.hasAbnormal && !resultStatus.hasCritical && "border-l-green-500",
            )}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FlaskConical className="h-5 w-5" />
                  Test Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "h-12 w-12 rounded-lg flex items-center justify-center",
                    resultStatus.hasCritical && "bg-red-100",
                    resultStatus.hasAbnormal && !resultStatus.hasCritical && "bg-amber-100",
                    !resultStatus.hasAbnormal && !resultStatus.hasCritical && "bg-green-100",
                  )}>
                    <FlaskConical className={cn(
                      "h-6 w-6",
                      resultStatus.hasCritical && "text-red-600",
                      resultStatus.hasAbnormal && !resultStatus.hasCritical && "text-amber-600",
                      !resultStatus.hasAbnormal && !resultStatus.hasCritical && "text-green-600",
                    )} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{labTestResult.test?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Test ID: {labTestResult.test?.test_id}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{labTestResult.result_id}</Badge>
                      <Badge variant={labTestResult.status === 'completed' ? 'default' : 'secondary'}>
                        {labTestResult.status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Results Preview */}
                <div className="space-y-3">
                  <h4 className="font-medium">Test Results</h4>
                  <div className="space-y-2">
                    {params.map((param, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          'p-3 rounded-lg border-l-4',
                          param.status === 'normal' && 'border-l-green-500 bg-green-50/50',
                          param.status === 'abnormal' && 'border-l-amber-500 bg-amber-50/50',
                          param.status === 'critical' && 'border-l-red-500 bg-red-50/50',
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{param.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Reference: {param.referenceMin} - {param.referenceMax} {param.unit}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              'font-semibold',
                              param.status === 'normal' && 'text-green-600',
                              param.status === 'abnormal' && 'text-amber-600',
                              param.status === 'critical' && 'text-red-600',
                            )}>
                              {param.value} {param.unit}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-xs',
                                param.status === 'normal' && 'border-green-500 text-green-600',
                                param.status === 'abnormal' && 'border-amber-500 text-amber-600',
                                param.status === 'critical' && 'border-red-500 text-red-600',
                              )}
                            >
                              {param.status}
                            </Badge>
                          </div>
                        </div>
                        {param.notes && (
                          <p className="text-sm text-muted-foreground mt-2">
                            Notes: {param.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {labTestResult.notes && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="font-medium flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Additional Notes
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {labTestResult.notes}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Patient & Actions */}
          <div className="space-y-6">
            {/* Patient Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(labTestResult.patient?.first_name, labTestResult.patient?.father_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {labTestResult.patient?.first_name} {labTestResult.patient?.father_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      PID: {labTestResult.patient?.patient_id}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Age:</span>
                    <p className="font-medium">{labTestResult.patient?.age} years</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span>
                    <p className="font-medium">{labTestResult.patient?.gender}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Blood Group:</span>
                    <p className="font-medium">{labTestResult.patient?.blood_group || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performed By */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Performed By</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{labTestResult.performedBy?.name || 'Unknown'}</p>
                <p className="text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 inline mr-1" />
                  {formatDate(labTestResult.performed_at)}
                </p>
              </CardContent>
            </Card>

            {/* Verification Action */}
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="text-base">Verification</CardTitle>
                <CardDescription>
                  Confirm that you have reviewed all results and they are accurate.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={handleVerify}
                  disabled={processing}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {processing ? 'Verifying...' : 'Verify Result'}
                </Button>
                
                <Link href={`/laboratory/lab-test-results/${labTestResult.id}`}>
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </Link>

                <p className="text-xs text-muted-foreground text-center">
                  Once verified, this result cannot be edited.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LaboratoryLayout>
  );
}
