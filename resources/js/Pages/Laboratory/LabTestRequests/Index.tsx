import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import {
  PriorityBadge,
  LabStatusBadge,
  FilterBar,
  type FilterConfig,
  type FilterState,
} from '@/components/laboratory';
import {
  Plus,
  ArrowLeft,
  ClipboardList,
  Clock,
  User,
  Stethoscope,
  Calendar,
  Eye,
  Edit,
  Play,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  AlertCircle,
  Zap,
  CheckCircle,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { LabTestRequest } from '@/types/lab-test';
import type { Patient } from '@/types/patient';
import type { Doctor } from '@/types/doctor';
import type { Department } from '@/types/department';
import type { User as UserType } from '@/types/index.d';

interface LabTestRequestWithRelations extends LabTestRequest {
  patient: Patient;
  doctor: Doctor;
  createdBy: UserType;
}

interface PaginationMeta {
  current_page: number;
  from: number;
  last_page: number;
  links: {
    url: string | null;
    label: string;
    active: boolean;
  }[];
  path: string;
  per_page: number;
  to: number;
  total: number;
}

interface LabTestRequestIndexProps {
  labTestRequests: {
    data: LabTestRequestWithRelations[];
    links: {
      first: string;
      last: string;
      prev: string | null;
      next: string | null;
    };
    meta: PaginationMeta;
  };
  filters: {
    status?: string;
    patient_id?: string;
    doctor_id?: string;
    department_id?: string;
    test_type?: string;
    date_from?: string;
    date_to?: string;
    query?: string;
  };
  patients?: Patient[];
  doctors?: Doctor[];
  departments?: Department[];
}

export default function LabTestRequestIndex({ 
  labTestRequests, 
  filters,
  patients = [],
  doctors = [],
  departments = [],
}: LabTestRequestIndexProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    query: filters.query || '',
    status: filters.status || '',
    test_type: filters.test_type || '',
    patient_id: filters.patient_id || '',
    doctor_id: filters.doctor_id || '',
    department_id: filters.department_id || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
  });

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending', icon: Clock },
        { label: 'In Progress', value: 'in_progress', icon: AlertCircle },
        { label: 'Completed', value: 'completed', icon: CheckCircle },
        { label: 'Cancelled', value: 'cancelled', icon: XCircle },
      ],
    },
    {
      id: 'test_type',
      label: 'Priority',
      type: 'select',
      options: [
        { label: 'Routine', value: 'routine', icon: Clock },
        { label: 'Urgent', value: 'urgent', icon: AlertCircle },
        { label: 'STAT', value: 'stat', icon: Zap },
      ],
    },
    ...(departments.length > 0 ? [{
      id: 'department_id',
      label: 'Department',
      type: 'select' as const,
      options: departments.map(d => ({
        label: d.name,
        value: d.id.toString(),
      })),
    }] : []),
    ...(patients.length > 0 ? [{
      id: 'patient_id',
      label: 'Patient',
      type: 'select' as const,
      options: patients.map(p => ({
        label: `${p.first_name} ${p.father_name}`,
        value: p.id.toString(),
      })),
    }] : []),
    ...(doctors.length > 0 ? [{
      id: 'doctor_id',
      label: 'Doctor',
      type: 'select' as const,
      options: doctors.map(d => ({
        label: d.full_name,
        value: d.id.toString(),
      })),
    }] : []),
  ], [patients, doctors, departments]);

  // Statistics
  const stats = useMemo(() => {
    const data = labTestRequests.data || [];
    const total = labTestRequests.meta?.total || 0;
    const pending = data.filter(r => r.status === 'pending').length || 0;
    const inProgress = data.filter(r => r.status === 'in_progress').length || 0;
    const completed = data.filter(r => r.status === 'completed').length || 0;
    const statCount = data.filter(r => r.test_type === 'stat').length || 0;
    return { total, pending, inProgress, completed, statCount };
  }, [labTestRequests]);

  const handleFilterChange = (newFilters: FilterState) => {
    setActiveFilters(newFilters);
    router.get('/laboratory/lab-test-requests', newFilters, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleReset = () => {
    setActiveFilters({});
    router.get('/laboratory/lab-test-requests', {}, {
      preserveState: true,
      preserveScroll: true,
    });
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

  const getInitials = (firstName: string, lastName?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase();
  };

  const getStatusActions = (request: LabTestRequestWithRelations) => {
    const actions = [];
    
    actions.push({
      label: 'View',
      icon: Eye,
      href: `/laboratory/lab-test-requests/${request.id}`,
      variant: 'default' as const,
    });

    if (request.status === 'pending') {
      actions.push({
        label: 'Start',
        icon: Play,
        href: `/laboratory/lab-test-requests/${request.id}/edit`,
        variant: 'outline' as const,
      });
    }

    if (request.status !== 'completed' && request.status !== 'cancelled') {
      actions.push({
        label: 'Edit',
        icon: Edit,
        href: `/laboratory/lab-test-requests/${request.id}/edit`,
        variant: 'outline' as const,
      });
    }

    return actions;
  };

  const RequestCard = ({ request }: { request: LabTestRequestWithRelations }) => {
    const actions = getStatusActions(request);
    
    return (
      <Card className={cn(
        'group transition-all duration-200 hover:shadow-medium border-l-4',
        request.test_type === 'stat' && 'border-l-lab-stat',
        request.test_type === 'urgent' && 'border-l-lab-urgent',
        request.test_type === 'routine' && 'border-l-lab-routine',
      )}>
        <CardContent className="p-5">
          {/* Header with Priority and Status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <PriorityBadge 
                priority={request.test_type} 
                size="sm" 
                animate={request.test_type === 'stat'}
              />
              <LabStatusBadge status={request.status} size="sm" animate />
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {request.request_id}
            </span>
          </div>

          {/* Test Name */}
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {request.test_name}
          </h3>

          {/* Patient Info */}
          <div className="flex items-center gap-3 mt-4 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(request.patient.first_name || '', request.patient.father_name || '') || ''}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {request.patient.first_name || ''} {request.patient.father_name || ''}
              </p>
              <p className="text-xs text-muted-foreground">
                PID: {request.patient.patient_id || ''}
              </p>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Stethoscope className="h-3.5 w-3.5" />
            <span className="truncate">Dr. {request.doctor.full_name || ''}</span>
          </div>

          {/* Scheduled Time */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(request.scheduled_at)}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t">
            {actions.slice(0, 2).map((action, idx) => {
              const ActionIcon = action.icon;
              return (
                <Link key={idx} href={action.href}>
                  <Button
                    variant={action.variant}
                    size="sm"
                    className="gap-1.5"
                  >
                    <ActionIcon className="h-3.5 w-3.5" />
                    {action.label}
                  </Button>
                </Link>
              );
            })}
            {actions.length > 2 && (
              <Link href={actions[2].href}>
                <Button variant="ghost" size="sm">
                  {(() => {
                    const IconComponent = actions[2].icon;
                    return <IconComponent className="h-3.5 w-3.5" />;
                  })()}
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <LaboratoryLayout
      header={
        <div>
          <Heading title="Lab Test Requests" />
          <p className="text-muted-foreground mt-1">
            Manage and track laboratory test requests
          </p>
        </div>
      }
    >
      <Head title="Lab Test Requests" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Lab Test Requests" />
            <p className="text-muted-foreground mt-1">
              Manage and track laboratory test requests
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/laboratory/lab-test-requests/create">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New Request
              </Button>
            </Link>
            <Link href="/laboratory">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lab
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-500/5 to-indigo-500/10 border-indigo-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-indigo-600">{stats.inProgress}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* STAT Priority Alert */}
        {stats.statCount > 0 && (
          <Card className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                  <Zap className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-700">
                    {stats.statCount} STAT Request{stats.statCount > 1 ? 's' : ''} Pending
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Immediate processing required for critical priority tests
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filter Bar */}
        <FilterBar
          filters={filterConfigs}
          value={activeFilters}
          onChange={handleFilterChange}
          onReset={handleReset}
          searchPlaceholder="Search by request ID, test name, patient..."
          showFilterChips={true}
        />

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {labTestRequests.data?.length || 0} of {labTestRequests.meta?.total || 0} requests
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">View:</span>
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                className="h-8 px-2"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Requests Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labTestRequests.data.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {labTestRequests.data.map((request) => {
                  const actions = getStatusActions(request);
                  return (
                    <div
                      key={request.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center',
                          request.test_type === 'stat' && 'bg-red-100 text-red-600',
                          request.test_type === 'urgent' && 'bg-orange-100 text-orange-600',
                          request.test_type === 'routine' && 'bg-blue-100 text-blue-600',
                        )}>
                          <ClipboardList className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{request.test_name}</h3>
                            <PriorityBadge priority={request.test_type} size="sm" />
                            <LabStatusBadge status={request.status} size="sm" />
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {request.patient.first_name} {request.patient.father_name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Stethoscope className="h-3.5 w-3.5" />
                              Dr. {request.doctor.full_name}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(request.scheduled_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {actions.map((action, idx) => (
                          <Link key={idx} href={action.href}>
                            <Button variant="ghost" size="sm">
                              <action.icon className="h-4 w-4 mr-1" />
                              {action.label}
                            </Button>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {(labTestRequests.data?.length || 0) === 0 && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ClipboardList className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No lab test requests found</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                {activeFilters.query || activeFilters.status || activeFilters.test_type
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first lab test request.'}
              </p>
              {(activeFilters.query || activeFilters.status || activeFilters.test_type) && (
                <Button variant="outline" onClick={handleReset}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {(labTestRequests.meta?.last_page || 0) > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {labTestRequests.meta?.from || 0} to {labTestRequests.meta?.to || 0} of {labTestRequests.meta?.total || 0} results
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={labTestRequests.links.prev || '#'}
                className={cn(
                  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                  'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                  !labTestRequests.links.prev && 'pointer-events-none opacity-50'
                )}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Link>
              <div className="flex items-center gap-1">
                {labTestRequests.meta.links
                  .filter(link => !link.label.includes('Previous') && !link.label.includes('Next'))
                  .map((link, index) => (
                    <Link
                      key={index}
                      href={link.url || '#'}
                      className={cn(
                        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 w-9',
                        link.active
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                        !link.url && 'pointer-events-none opacity-50'
                      )}
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
              </div>
              <Link
                href={labTestRequests.links.next || '#'}
                className={cn(
                  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                  'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                  !labTestRequests.links.next && 'pointer-events-none opacity-50'
                )}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </LaboratoryLayout>
  );
}
