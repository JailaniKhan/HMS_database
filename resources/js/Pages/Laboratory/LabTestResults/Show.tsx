import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import Heading from '@/components/heading';
import HospitalLayout from '@/layouts/HospitalLayout';
import { LabStatusBadge } from '@/components/laboratory';
import {
  ArrowLeft,
  Edit,
  FileCheck,
  Printer,
  Mail,
  Download,
  User,
  FlaskConical,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

interface Patient {
  id: number;
  patient_id: string;
  first_name: string | null;
  father_name: string | null;
  age: number | null;
  gender: string | null;
  blood_group: string | null;
  phone: string | null;
  address: string | null;
}

interface LabTest {
  id: number;
  test_id: string;
  name: string;
  description: string | null;
  unit: string | null;
  normal_values: string | null;
  category: string;
}

interface User {
  id: number;
  name: string;
  signature?: string;
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

interface RelatedResult {
  id: number;
  result_id: string;
  performed_at: string;
  status: string;
  hasAbnormal: boolean;
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
  interpretation: string | null;
  created_at: string;
  updated_at: string;
  patient: Patient;
  labTest: LabTest;
  performedBy: User;
  verifiedBy?: User;
  relatedResults?: RelatedResult[];
  previousResult?: {
    performed_at: string;
    results: ResultParameter[];
  };
}

interface LabTestResultShowProps {
  labTestResult: LabTestResult;
  canEdit: boolean;
  canVerify: boolean;
  canPrint: boolean;
  canEmail: boolean;
}

export default function LabTestResultShow({
  labTestResult,
  canEdit,
  canVerify,
  canPrint,
  canEmail,
}: LabTestResultShowProps) {
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

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

  // Parse previous results for trend comparison
  const previousResults = useMemo(() => {
    if (!labTestResult.previousResult) return {};
    const prev = labTestResult.previousResult.results;
    const map: Record<string, number> = {};
    prev.forEach(p => {
      map[p.parameter_id] = parseFloat(p.value);
    });
    return map;
  }, [labTestResult.previousResult]);

  const isVerified = labTestResult.status === 'verified';

  const abnormalCount = parsedResults.filter(r => r.status === 'abnormal' || r.status === 'critical').length;
  const criticalCount = parsedResults.filter(r => r.status === 'critical').length;
  const normalCount = parsedResults.filter(r => r.status === 'normal').length;

  const getInitials = (firstName: string | null, lastName: string | null) => {
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

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleVerify = () => {
    router.post(`/laboratory/lab-test-results/${labTestResult.id}/verify`);
    setShowVerifyDialog(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    window.open(`/laboratory/lab-test-results/${labTestResult.id}/pdf`, '_blank');
  };

  const getTrend = (paramId: string, currentValue: string): 'up' | 'down' | 'stable' | null => {
    const prevValue = previousResults[paramId];
    if (!prevValue || !currentValue) return null;
    const current = parseFloat(currentValue);
    if (isNaN(current)) return null;

    const diff = current - prevValue;
    const percentChange = (diff / prevValue) * 100;

    if (Math.abs(percentChange) < 5) return 'stable';
    return diff > 0 ? 'up' : 'down';
  };

  return (
    <HospitalLayout>
      <Head title={`Lab Test Result - ${labTestResult.result_id}`} />

      <div className="space-y-6 print:space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <div>
            <Heading title={`Lab Test Result: ${labTestResult.result_id}`} />
            <p className="text-muted-foreground mt-1">
              Full laboratory report
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {canEdit && !isVerified && (
              <Link href={`/laboratory/lab-test-results/${labTestResult.id}/edit`}>
                <Button variant="outline">
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </Link>
            )}

            {canVerify && !isVerified && (
              <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <FileCheck className="mr-2 h-4 w-4" />
                    Verify
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Verify Lab Test Result</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to verify this result? Once verified, it cannot be edited.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Verification Confirmation</AlertTitle>
                      <AlertDescription>
                        By verifying, you confirm that all results have been reviewed and are accurate.
                        This action will lock the result from further editing.
                      </AlertDescription>
                    </Alert>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowVerifyDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleVerify} className="bg-green-600 hover:bg-green-700">
                      <FileCheck className="mr-2 h-4 w-4" />
                      Confirm Verification
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            {canPrint && (
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
            )}

            {canEmail && (
              <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Mail className="mr-2 h-4 w-4" />
                    Email
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Email Lab Report</DialogTitle>
                    <DialogDescription>
                      Send this lab report to the patient or physician.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Recipient Email</Label>
                      <Input type="email" placeholder="Enter email address" />
                    </div>
                    <div className="space-y-2">
                      <Label>Message (Optional)</Label>
                      <Textarea placeholder="Add a message..." rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setEmailDialogOpen(false)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Report
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}

            <Button variant="outline" onClick={handleDownloadPDF}>
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>

            <Link href="/laboratory/lab-test-results">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        {/* Print Header - Only visible when printing */}
        <div className="hidden print:block border-b pb-4 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Laboratory Report</h1>
              <p className="text-muted-foreground">Hospital Management System</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg">{labTestResult.result_id}</p>
              <p className="text-sm text-muted-foreground">
                Generated: {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>

        {/* Critical Values Alert */}
        {criticalCount > 0 && (
          <Alert className="bg-red-50 border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <AlertTitle className="text-red-800 text-lg">Critical Values Detected</AlertTitle>
            <AlertDescription className="text-red-700">
              This report contains {criticalCount} critical value(s) that require immediate physician attention.
              Please review carefully and follow up as necessary.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient & Test Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Information Card */}
            <Card className="print:shadow-none print:border-0">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Patient Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-14 w-14 print:hidden">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(labTestResult.patient?.first_name, labTestResult.patient?.father_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-lg">
                      {labTestResult.patient?.first_name} {labTestResult.patient?.father_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Patient ID: {labTestResult.patient?.patient_id}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Age</span>
                    <p className="font-medium">{labTestResult.patient?.age} years</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Gender</span>
                    <p className="font-medium capitalize">{labTestResult.patient?.gender}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Blood Group</span>
                    <p className="font-medium">{labTestResult.patient?.blood_group || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Phone</span>
                    <p className="font-medium">{labTestResult.patient?.phone || 'N/A'}</p>
                  </div>
                </div>

                {labTestResult.patient?.address && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-muted-foreground block text-xs uppercase tracking-wide">Address</span>
                      <p className="text-sm">{labTestResult.patient.address}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Test Information Card */}
            <Card className="print:shadow-none print:border-0">
              <CardHeader className="print:pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FlaskConical className="h-5 w-5" />
                  Test Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-muted-foreground block text-xs uppercase tracking-wide">Test Name</span>
                  <p className="font-semibold text-lg">{labTestResult.labTest?.name ?? 'Unknown Test'}</p>
                  <p className="text-xs text-muted-foreground">Test ID: {labTestResult.labTest?.test_id ?? 'N/A'}</p>
                </div>

                {labTestResult.labTest?.description && (
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Description</span>
                    <p className="text-sm">{labTestResult.labTest.description}</p>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Status</span>
                    <div className="mt-1">
                      <LabStatusBadge
                        status={labTestResult.status === 'pending' ? 'pending' : labTestResult.status === 'completed' ? 'in_progress' : 'completed'}
                        size="md"
                      />
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-xs uppercase tracking-wide">Performed</span>
                    <p className="text-sm font-medium">{formatDate(labTestResult.performed_at)}</p>
                    <p className="text-xs text-muted-foreground">
                      by {labTestResult.performedBy?.name || 'Unknown'}
                    </p>
                  </div>

                  {isVerified && labTestResult.verifiedBy && (
                    <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 text-green-800">
                        <FileCheck className="h-4 w-4" />
                        <span className="text-sm font-medium">Verified</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        by {labTestResult.verifiedBy.name}
                      </p>
                      <p className="text-xs text-green-700">
                        {labTestResult.verified_at ? formatDate(labTestResult.verified_at) : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Result Summary */}
            <Card className="print:shadow-none print:border-0">
              <CardHeader className="print:pb-2">
                <CardTitle className="text-lg">Result Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{normalCount}</p>
                    <p className="text-xs text-green-700">Normal</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">{abnormalCount - criticalCount}</p>
                    <p className="text-xs text-orange-700">Abnormal</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-2xl font-bold text-red-600">{criticalCount}</p>
                    <p className="text-xs text-red-700">Critical</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Results */}
            {labTestResult.relatedResults && labTestResult.relatedResults.length > 0 && (
              <Card className="print:hidden">
                <CardHeader>
                  <CardTitle className="text-lg">Related Results</CardTitle>
                  <CardDescription>Previous results for this patient</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {labTestResult.relatedResults.map((related) => (
                      <Link
                        key={related.id}
                        href={`/laboratory/lab-test-results/${related.id}`}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{related.result_id}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateShort(related.performed_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {related.hasAbnormal && (
                            <AlertCircle className="h-4 w-4 text-lab-abnormal" />
                          )}
                          <LabStatusBadge
                            status={related.status === 'pending' ? 'pending' : related.status === 'completed' ? 'in_progress' : 'completed'}
                            size="sm"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Results Table */}
          <div className="lg:col-span-2">
            <Card className="print:shadow-none print:border-0">
              <CardHeader className="print:pb-2">
                <CardTitle className="text-lg">Test Results</CardTitle>
                <CardDescription>
                  Detailed results with reference ranges and status indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Results Table */}
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium">Parameter</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Result</th>
                        <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Reference Range</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                        {labTestResult.previousResult && (
                          <th className="px-4 py-3 text-left text-sm font-medium hidden lg:table-cell">Trend</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {parsedResults.map((result, idx) => {
                        const trend = getTrend(result.parameter_id, result.value);
                        return (
                          <tr
                            key={idx}
                            className={cn(
                              result.status === 'critical' && 'bg-red-50',
                              result.status === 'abnormal' && 'bg-orange-50/50'
                            )}
                          >
                            <td className="px-4 py-3">
                              <p className="font-medium">{result.name}</p>
                              {result.notes && (
                                <p className="text-xs text-muted-foreground mt-1">{result.notes}</p>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  'font-semibold',
                                  result.status === 'normal' && 'text-lab-normal',
                                  result.status === 'abnormal' && 'text-lab-abnormal',
                                  result.status === 'critical' && 'text-lab-critical',
                                )}>
                                  {result.value}
                                </span>
                                <span className="text-sm text-muted-foreground">{result.unit}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                              {result.referenceMin} - {result.referenceMax} {result.unit}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {result.status === 'normal' && <CheckCircle2 className="h-4 w-4 text-lab-normal" />}
                                {result.status === 'abnormal' && <AlertCircle className="h-4 w-4 text-lab-abnormal" />}
                                {result.status === 'critical' && <AlertTriangle className="h-4 w-4 text-lab-critical" />}
                                <span className={cn(
                                  'text-sm font-medium capitalize',
                                  result.status === 'normal' && 'text-lab-normal',
                                  result.status === 'abnormal' && 'text-lab-abnormal',
                                  result.status === 'critical' && 'text-lab-critical',
                                )}>
                                  {result.status}
                                </span>
                              </div>
                            </td>
                            {labTestResult.previousResult && (
                              <td className="px-4 py-3 hidden lg:table-cell">
                                {trend && (
                                  <div className="flex items-center gap-1">
                                    {trend === 'up' && (
                                      <>
                                        <TrendingUp className="h-4 w-4 text-lab-abnormal" />
                                        <span className="text-xs text-lab-abnormal">Increased</span>
                                      </>
                                    )}
                                    {trend === 'down' && (
                                      <>
                                        <TrendingDown className="h-4 w-4 text-lab-normal" />
                                        <span className="text-xs text-lab-normal">Decreased</span>
                                      </>
                                    )}
                                    {trend === 'stable' && (
                                      <span className="text-xs text-muted-foreground">No change</span>
                                    )}
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Interpretation */}
                {(labTestResult.interpretation || labTestResult.notes) && (
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Interpretation / Notes
                    </h4>
                    {labTestResult.interpretation && (
                      <p className="text-sm mb-2">{labTestResult.interpretation}</p>
                    )}
                    {labTestResult.notes && (
                      <p className="text-sm text-muted-foreground">{labTestResult.notes}</p>
                    )}
                  </div>
                )}

                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-4 text-sm print:hidden">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Normal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span>Abnormal</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Critical</span>
                  </div>
                </div>

                {/* Print Footer - Only visible when printing */}
                <div className="hidden print:block mt-8 pt-4 border-t">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-sm font-medium">Performed by:</p>
                      <p className="text-sm">{labTestResult.performedBy?.name || 'Unknown'}</p>
                      {labTestResult.performedBy?.signature && (
                        <p className="text-xs text-muted-foreground mt-1">{labTestResult.performedBy.signature}</p>
                      )}
                    </div>
                    {isVerified && labTestResult.verifiedBy && (
                      <div className="text-right">
                        <p className="text-sm font-medium">Verified by:</p>
                        <p className="text-sm">{labTestResult.verifiedBy.name}</p>
                        {labTestResult.verifiedBy.signature && (
                          <p className="text-xs text-muted-foreground mt-1">{labTestResult.verifiedBy.signature}</p>
                        )}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-8">
                    This is a computer-generated report and does not require a physical signature.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </HospitalLayout>
  );
}
