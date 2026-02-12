import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import { PriorityBadge, LabStatusBadge, RequestTimeline } from '@/components/laboratory';
import {
  ArrowLeft,
  Edit,
  RotateCcw,
  ClipboardList,
  User,
  Stethoscope,
  Calendar,
  CheckCircle,
  Clock,
  Play,
  XCircle,
  Printer,
  FileText,
  History,
  AlertCircle,
  FlaskConical,
} from 'lucide-react';
import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Patient } from '@/types/patient';
import type { Doctor } from '@/types/doctor';
import type { LabTestRequest, LabTestRequestStatus } from '@/types/lab-test';

interface LabTestResult {
  id: number;
  result_id: string;
  results: string;
  status: string;
  performed_at: string;
  abnormal_flags: string | null;
}

interface UserType {
  id: number;
  name: string;
}

interface LabTestRequestShowProps {
  labTestRequest: LabTestRequest & {
    patient: Patient;
    doctor: Doctor;
    createdBy: UserType;
    results: LabTestResult[];
  };
}

export default function LabTestRequestShow({ labTestRequest }: LabTestRequestShowProps) {
  const canEdit = labTestRequest.status !== 'completed' && labTestRequest.status !== 'cancelled';
  const canRestore = labTestRequest.status === 'cancelled';

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const handleStatusTransition = (newStatus: LabTestRequestStatus) => {
    // Use router.visit with POST method and _method spoofing for PATCH
    router.visit(`/laboratory/lab-test-requests/${labTestRequest.id}/status`, {
      method: 'post',
      data: {
        status: newStatus,
        _method: 'PATCH',
      },
      preserveScroll: true,
    });
  };

  const handlePrint = () => {
    window.print();
  };

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

  // Get contextual actions based on status
  const getContextualActions = () => {
    const actions = [];

    if (labTestRequest.status === 'pending') {
      actions.push(
        {
          label: 'Start Processing',
          icon: Play,
          onClick: () => handleStatusTransition('in_progress'),
          variant: 'default' as const,
          className: 'bg-blue-600 hover:bg-blue-700',
        },
        {
          label: 'Cancel Request',
          icon: XCircle,
          onClick: () => handleStatusTransition('cancelled'),
          variant: 'destructive' as const,
        }
      );
    } else if (labTestRequest.status === 'in_progress') {
      actions.push(
        {
          label: 'Mark Completed',
          icon: CheckCircle,
          onClick: () => handleStatusTransition('completed'),
          variant: 'default' as const,
          className: 'bg-green-600 hover:bg-green-700',
        },
        {
          label: 'Enter Results',
          icon: FileText,
          onClick: () => router.visit(`/laboratory/lab-test-results/create?request_id=${labTestRequest.id}`),
          variant: 'outline' as const,
        },
        {
          label: 'Cancel Request',
          icon: XCircle,
          onClick: () => handleStatusTransition('cancelled'),
          variant: 'destructive' as const,
        }
      );
    } else if (labTestRequest.status === 'completed') {
      actions.push(
        {
          label: 'View Results',
          icon: FileText,
          onClick: () => router.visit(`/laboratory/lab-test-results?request_id=${labTestRequest.id}`),
          variant: 'default' as const,
        },
        {
          label: 'Print Report',
          icon: Printer,
          onClick: handlePrint,
          variant: 'outline' as const,
        }
      );
    }

    return actions;
  };

  const contextualActions = getContextualActions();

  return (
    <LaboratoryLayout
      header={
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <Heading title={`Request Details`} />
            <p className="text-muted-foreground mt-1">
              Request ID: <span className="font-mono">{labTestRequest.request_id}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={labTestRequest.test_type} size="sm" animate={labTestRequest.test_type === 'stat'} />
            <LabStatusBadge status={labTestRequest.status} size="sm" animate />
          </div>
        </div>
      }
    >
      <Head title={`Request - ${labTestRequest.request_id}`} />

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <Heading title={`Request Details`} />
              <p className="text-muted-foreground mt-1">
                Request ID: <span className="font-mono">{labTestRequest.request_id}</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={labTestRequest.test_type} size="sm" animate={labTestRequest.test_type === 'stat'} />
              <LabStatusBadge status={labTestRequest.status} size="sm" animate />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {canEdit && (
              <Link href={`/laboratory/lab-test-requests/${labTestRequest.id}/edit`}>
                <Button>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Request
                </Button>
              </Link>
            )}
            {canRestore && (
              <Button
                onClick={() => handleStatusTransition('pending')}
                variant="outline"
                className="bg-green-50 hover:bg-green-100 text-green-700"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Restore Request
              </Button>
            )}
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            <Link href="/laboratory/lab-test-requests">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        {/* Contextual Action Bar */}
        {contextualActions.length > 0 && (
          <Card className={cn(
            "border-l-4",
            labTestRequest.status === 'pending' && "border-l-amber-500 bg-amber-50/30",
            labTestRequest.status === 'in_progress' && "border-l-blue-500 bg-blue-50/30",
            labTestRequest.status === 'completed' && "border-l-green-500 bg-green-50/30",
          )}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    labTestRequest.status === 'pending' && "bg-amber-100",
                    labTestRequest.status === 'in_progress' && "bg-blue-100",
                    labTestRequest.status === 'completed' && "bg-green-100",
                  )}>
                    {labTestRequest.status === 'pending' && <Clock className="h-5 w-5 text-amber-600" />}
                    {labTestRequest.status === 'in_progress' && <Play className="h-5 w-5 text-blue-600" />}
                    {labTestRequest.status === 'completed' && <CheckCircle className="h-5 w-5 text-green-600" />}
                  </div>
                  <div>
                    <p className="font-medium">
                      {labTestRequest.status === 'pending' && 'This request is waiting to be processed'}
                      {labTestRequest.status === 'in_progress' && 'This request is currently being processed'}
                      {labTestRequest.status === 'completed' && 'This request has been completed'}
                      {labTestRequest.status === 'cancelled' && 'This request has been cancelled'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {labTestRequest.status === 'pending' && 'Start processing or cancel the request'}
                      {labTestRequest.status === 'in_progress' && 'Mark as complete when finished or enter results'}
                      {labTestRequest.status === 'completed' && 'View results or print the report'}
                      {labTestRequest.status === 'cancelled' && 'This request can be restored if needed'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {contextualActions.map((action, idx) => (
                    <Button
                      key={idx}
                      variant={action.variant}
                      onClick={action.onClick}
                      className={action.className}
                    >
                      <action.icon className="mr-2 h-4 w-4" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Request Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              Request Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RequestTimeline stages={timelineStages} orientation="horizontal" size="md" />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Info Card */}
            <Card className={cn(
              "border-l-4 overflow-hidden",
              labTestRequest.status === 'completed' && "border-l-green-500",
              labTestRequest.status === 'in_progress' && "border-l-blue-500",
              labTestRequest.status === 'pending' && "border-l-amber-500",
              labTestRequest.status === 'cancelled' && "border-l-red-500",
            )}>
              <CardContent className="p-0">
                <div className="flex flex-col lg:flex-row">
                  {/* Left Side - Main Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "h-16 w-16 rounded-xl flex items-center justify-center shrink-0",
                        labTestRequest.test_type === 'stat' && "bg-red-100",
                        labTestRequest.test_type === 'urgent' && "bg-orange-100",
                        labTestRequest.test_type === 'routine' && "bg-blue-100",
                      )}>
                        <ClipboardList className={cn(
                          "h-8 w-8",
                          labTestRequest.test_type === 'stat' && "text-red-600",
                          labTestRequest.test_type === 'urgent' && "text-orange-600",
                          labTestRequest.test_type === 'routine' && "text-blue-600",
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h1 className="text-2xl font-bold">{labTestRequest.test_name}</h1>
                          <PriorityBadge priority={labTestRequest.test_type} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                          <span className="font-mono">{labTestRequest.request_id}</span>
                          <span>•</span>
                          <LabStatusBadge status={labTestRequest.status} size="sm" />
                        </div>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Calendar className="h-4 w-4" />
                          <span>Scheduled</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">
                          {new Date(labTestRequest.scheduled_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <Clock className="h-4 w-4" />
                          <span>Time</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">
                          {new Date(labTestRequest.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <History className="h-4 w-4" />
                          <span>Created</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">
                          {new Date(labTestRequest.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                          <CheckCircle className="h-4 w-4" />
                          <span>Completed</span>
                        </div>
                        <p className="text-sm font-semibold mt-1">
                          {labTestRequest.completed_at 
                            ? new Date(labTestRequest.completed_at).toLocaleDateString()
                            : 'Pending'
                          }
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Metadata */}
                  <div className="lg:w-72 bg-muted/30 p-6 border-t lg:border-t-0 lg:border-l">
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">Request Metadata</h3>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Created</p>
                          <p className="text-sm font-medium">{formatDate(labTestRequest.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <History className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Last Updated</p>
                          <p className="text-sm font-medium">{formatDate(labTestRequest.updated_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Created By</p>
                          <p className="text-sm font-medium">{labTestRequest.createdBy?.name ?? 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Patient Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle>Patient Information</CardTitle>
                    <CardDescription>Patient details for this test request</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {getInitials(labTestRequest.patient.first_name, labTestRequest.patient.father_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {labTestRequest.patient.first_name} {labTestRequest.patient.father_name}
                    </h3>
                    <p className="text-muted-foreground">Patient ID: {labTestRequest.patient.patient_id}</p>
                    <div className="flex flex-wrap gap-4 mt-3">
                      {labTestRequest.patient.gender && (
                        <Badge variant="outline">{labTestRequest.patient.gender}</Badge>
                      )}
                      {labTestRequest.patient.blood_group && (
                        <Badge variant="outline" className="text-red-600">
                          Blood: {labTestRequest.patient.blood_group}
                        </Badge>
                      )}
                      {labTestRequest.patient.age && (
                        <Badge variant="outline">Age: {labTestRequest.patient.age}</Badge>
                      )}
                    </div>
                    {labTestRequest.patient.phone && (
                      <p className="text-sm text-muted-foreground mt-3">
                        Phone: {labTestRequest.patient.phone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Doctor Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Stethoscope className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle>Requesting Doctor</CardTitle>
                    <CardDescription>Doctor who requested this test</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarFallback className="bg-green-500/10 text-green-600 text-lg">
                      {getInitials(labTestRequest.doctor.full_name, null)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">Dr. {labTestRequest.doctor.full_name}</h3>
                    <p className="text-muted-foreground">Doctor ID: {labTestRequest.doctor.doctor_id}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {labTestRequest.doctor.specialization && (
                        <Badge>{labTestRequest.doctor.specialization}</Badge>
                      )}
                    </div>
                    {labTestRequest.doctor.phone_number && (
                      <p className="text-sm text-muted-foreground mt-3">
                        Phone: {labTestRequest.doctor.phone_number}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Section */}
            {labTestRequest.notes && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle>Notes & Clinical Indications</CardTitle>
                      <CardDescription>Additional information about this request</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="whitespace-pre-wrap">{labTestRequest.notes}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Results Section */}
            {labTestRequest.results && labTestRequest.results.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                        <FlaskConical className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <CardTitle>Test Results</CardTitle>
                        <CardDescription>Results for this test request</CardDescription>
                      </div>
                    </div>
                    <Link href={`/laboratory/lab-test-results?request_id=${labTestRequest.id}`}>
                      <Button variant="outline" size="sm">
                        View All Results
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {labTestRequest.results.map((result) => (
                      <div
                        key={result.id}
                        className={cn(
                          "p-4 border rounded-lg",
                          result.abnormal_flags ? "bg-red-50/50 border-red-200" : "bg-muted/30"
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">Result ID: {result.result_id}</p>
                            <p className="text-sm text-muted-foreground">
                              Performed: {formatDate(result.performed_at)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.abnormal_flags && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {result.abnormal_flags}
                              </Badge>
                            )}
                            <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                              {result.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm mt-2">{result.results}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-base">Quick Actions</CardTitle>
                <CardDescription>Available actions for this request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {canEdit && (
                  <Link href={`/laboratory/lab-test-requests/${labTestRequest.id}/edit`}>
                    <Button className="w-full" variant="default">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Request
                    </Button>
                  </Link>
                )}
                
                {labTestRequest.status === 'pending' && (
                  <>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700" 
                      onClick={() => handleStatusTransition('in_progress')}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Start Processing
                    </Button>
                    <Button 
                      className="w-full" 
                      variant="destructive"
                      onClick={() => handleStatusTransition('cancelled')}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Request
                    </Button>
                  </>
                )}

                {labTestRequest.status === 'in_progress' && (
                  <>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700" 
                      onClick={() => handleStatusTransition('completed')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Completed
                    </Button>
                    <Link href={`/laboratory/lab-test-results/create?request_id=${labTestRequest.id}`}>
                      <Button className="w-full" variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Enter Results
                      </Button>
                    </Link>
                    <Button 
                      className="w-full" 
                      variant="destructive"
                      onClick={() => handleStatusTransition('cancelled')}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancel Request
                    </Button>
                  </>
                )}

                {labTestRequest.status === 'completed' && (
                  <>
                    <Link href={`/laboratory/lab-test-results?request_id=${labTestRequest.id}`}>
                      <Button className="w-full">
                        <FileText className="mr-2 h-4 w-4" />
                        View Results
                      </Button>
                    </Link>
                    <Button className="w-full" variant="outline" onClick={handlePrint}>
                      <Printer className="mr-2 h-4 w-4" />
                      Print Report
                    </Button>
                  </>
                )}

                {canRestore && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700" 
                    onClick={() => handleStatusTransition('pending')}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore Request
                  </Button>
                )}

                <Separator className="my-2" />

                <Link href="/laboratory/lab-test-requests">
                  <Button className="w-full" variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Requests
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Request Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Status</p>
                  <LabStatusBadge status={labTestRequest.status} size="md" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Priority</p>
                  <PriorityBadge priority={labTestRequest.test_type} size="md" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Test Name</p>
                  <p className="font-medium">{labTestRequest.test_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Scheduled</p>
                  <p className="text-sm">{formatDate(labTestRequest.scheduled_at)}</p>
                </div>
                {labTestRequest.completed_at && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Completed</p>
                    <p className="text-sm">{formatDate(labTestRequest.completed_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LaboratoryLayout>
  );
}
