import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import {
  LabStatusBadge,
  ResultValueDisplay,
  FilterBar,
  type FilterConfig,
  type FilterState,
} from '@/components/laboratory';
import {
  Plus,
  ArrowLeft,
  FileText,
  FlaskConical,
  User,
  Calendar,
  Eye,
  Edit,
  CheckCircle2,
  AlertTriangle,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  CheckCircle,
  FileCheck,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import HospitalLayout from '@/layouts/HospitalLayout';

interface Patient {
  id: number;
  patient_id: string;
  first_name: string | null;
  father_name: string | null;
  age: number | null;
  gender: string | null;
}

interface LabTest {
  id: number;
  test_id: string;
  name: string;
  unit: string | null;
  normal_values: string | null;
}

interface ResultParameter {
  name: string;
  value: string | number;
  unit: string;
  referenceRange: { min: number; max: number };
  status: 'normal' | 'abnormal' | 'critical';
}

interface LabTestResult {
  id: number;
  result_id: string;
  patient_id: number;
  lab_test_id: number;
  performed_at: string;
  verified_at: string | null;
  results: string | ResultParameter[];
  status: 'pending' | 'completed' | 'verified';
  notes: string | null;
  abnormal_flags: string | null;
  created_at: string;
  updated_at: string;
  patient: Patient;
  labTest: LabTest;
  hasAbnormalValues?: boolean;
  hasCriticalValues?: boolean;
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

interface LabTestResultIndexProps {
  labTestResults: {
    data: LabTestResult[];
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
    lab_test_id?: string;
    date_from?: string;
    date_to?: string;
    abnormal_only?: string;
    query?: string;
  };
  patients?: Patient[];
  labTests?: LabTest[];
  stats?: {
    total: number;
    pending: number;
    completed: number;
    verified: number;
    abnormal: number;
    critical: number;
  };
}

export default function LabTestResultIndex({
  labTestResults,
  filters,
  patients = [],
  labTests = [],
  stats = { total: 0, pending: 0, completed: 0, verified: 0, abnormal: 0, critical: 0 },
}: LabTestResultIndexProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilters, setActiveFilters] = useState<FilterState>({
    query: filters.query || '',
    status: filters.status || '',
    lab_test_id: filters.lab_test_id || '',
    patient_id: filters.patient_id || '',
    date_from: filters.date_from || '',
    date_to: filters.date_to || '',
    abnormal_only: filters.abnormal_only || '',
  });

  // Filter configurations
  const filterConfigs: FilterConfig[] = useMemo(() => [
    {
      id: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending', icon: Clock },
        { label: 'Completed', value: 'completed', icon: CheckCircle },
        { label: 'Verified', value: 'verified', icon: FileCheck },
      ],
    },
    {
      id: 'abnormal_only',
      label: 'Results',
      type: 'select',
      options: [
        { label: 'All Results', value: 'all', icon: FileText },
        { label: 'Abnormal Only', value: 'true', icon: AlertCircle },
      ],
    },
    ...(labTests.length > 0 ? [{
      id: 'lab_test_id' as const,
      label: 'Test Type',
      type: 'select' as const,
      options: labTests.map(t => ({
        label: t.name,
        value: t.id.toString(),
      })),
    }] : []),
    ...(patients.length > 0 ? [{
      id: 'patient_id' as const,
      label: 'Patient',
      type: 'select' as const,
      options: patients.map(p => ({
        label: `${p.first_name || ''} ${p.father_name || ''}`,
        value: p.id.toString(),
      })),
    }] : []),
  ], [labTests, patients]);

  const handleFilterChange = (newFilters: FilterState) => {
    setActiveFilters(newFilters);
    router.get('/laboratory/lab-test-results', newFilters, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleReset = () => {
    setActiveFilters({});
    router.get('/laboratory/lab-test-results', {}, {
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

  const getStatusActions = (result: LabTestResult) => {
    const actions = [];

    actions.push({
      label: 'View',
      icon: Eye,
      href: `/laboratory/lab-test-results/${result.id}`,
      variant: 'default' as const,
    });

    if (result.status !== 'verified') {
      actions.push({
        label: 'Edit',
        icon: Edit,
        href: `/laboratory/lab-test-results/${result.id}/edit`,
        variant: 'outline' as const,
      });
    }

    if (result.status === 'completed') {
      actions.push({
        label: 'Verify',
        icon: CheckCircle2,
        href: `/laboratory/lab-test-results/${result.id}/verify`,
        variant: 'outline' as const,
      });
    }

    return actions;
  };

  const ResultCard = ({ result }: { result: LabTestResult }) => {
    const actions = getStatusActions(result);
    const cardResultStatus = getResultStatus(result);
    const params = parseResults(result.results);
    const displayParams = params.slice(0, 3);
    const remainingCount = params.length - 3;

    return (
      <Card className={cn(
        'group transition-all duration-200 hover:shadow-medium border-l-4',
        cardResultStatus.hasCritical && 'border-l-lab-critical',
        cardResultStatus.hasAbnormal && !cardResultStatus.hasCritical && 'border-l-lab-abnormal',
        !cardResultStatus.hasAbnormal && !cardResultStatus.hasCritical && 'border-l-lab-normal',
      )}>
        <CardContent className="p-5">
          {/* Header with Status and Result ID */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <LabStatusBadge
                status={result.status === 'pending' ? 'pending' : result.status === 'completed' ? 'in_progress' : 'completed'}
                size="sm"
                animate={result.status === 'pending'}
              />
              {cardResultStatus.hasCritical && (
                <Badge variant="destructive" className="animate-pulse">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Critical
                </Badge>
              )}
              {cardResultStatus.hasAbnormal && !cardResultStatus.hasCritical && (
                <Badge variant="secondary" className="bg-lab-abnormal/10 text-lab-abnormal border-lab-abnormal/30">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Abnormal
                </Badge>
              )}
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {result.result_id}
            </span>
          </div>

          {/* Test Name */}
          <h3 className="font-semibold text-lg mb-1 line-clamp-1">
            {result.labTest?.name ?? 'Unknown Test'}
          </h3>

          {/* Patient Info */}
          <div className="flex items-center gap-3 mt-4 mb-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(result.patient?.first_name, result.patient?.father_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {result.patient?.first_name || ''} {result.patient?.father_name || ''}
              </p>
              <p className="text-xs text-muted-foreground">
                PID: {result.patient?.patient_id} • {result.patient?.age}y • {result.patient?.gender}
              </p>
            </div>
          </div>

          {/* Quick Results Preview */}
          {displayParams.length > 0 && (
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Key Results</p>
              <div className="flex flex-wrap gap-2">
                {displayParams.map((param, idx) => (
                  <ResultValueDisplay
                    key={idx}
                    value={param.value}
                    unit={param.unit}
                    referenceRange={param.referenceRange}
                    status={param.status}
                    size="sm"
                  />
                ))}
                {remainingCount > 0 && (
                  <Badge variant="outline" className="h-8 px-2">
                    +{remainingCount} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Performed Date */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(result.performed_at)}</span>
            {result.verified_at && (
              <>
                <span>•</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-lab-completed" />
                <span className="text-lab-completed">Verified</span>
              </>
            )}
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
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <HospitalLayout>
      <Head title="Lab Test Results" />

      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Laboratory Test Results" />
            <p className="text-muted-foreground mt-1">
              View and manage patient lab test results
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/laboratory/lab-test-results/create">
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                New Result
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
                  <FileText className="h-5 w-5 text-blue-600" />
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

          <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Abnormal</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.abnormal}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Critical Results Alert */}
        {stats.critical > 0 && (
          <Card className="bg-gradient-to-r from-red-500/5 to-orange-500/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-red-700">
                    {stats.critical} Critical Result{stats.critical > 1 ? 's' : ''} Requiring Attention
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Critical values detected - immediate physician notification required
                  </p>
                </div>
                <Link href="/laboratory/lab-test-results?abnormal_only=true" className="ml-auto">
                  <Button variant="outline" size="sm" className="border-red-500/30 text-red-700 hover:bg-red-50">
                    View All
                  </Button>
                </Link>
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
          searchPlaceholder="Search by result ID, test name, patient..."
          showFilterChips={true}
        />

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {labTestResults.data?.length || 0} of {labTestResults.meta?.total || 0} results
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

        {/* Results Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labTestResults.data.map((result) => (
              <ResultCard key={result.id} result={result} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {labTestResults.data.map((result) => {
                  const actions = getStatusActions(result);
                  const resultStatus = getResultStatus(result);
                  return (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          'h-10 w-10 rounded-lg flex items-center justify-center',
                          resultStatus.hasCritical && 'bg-red-100 text-red-600',
                          resultStatus.hasAbnormal && !resultStatus.hasCritical && 'bg-orange-100 text-orange-600',
                          !resultStatus.hasAbnormal && !resultStatus.hasCritical && 'bg-green-100 text-green-600',
                        )}>
                          <FlaskConical className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{result.labTest?.name ?? 'Unknown Test'}</h3>
                            <LabStatusBadge
                              status={result.status === 'pending' ? 'pending' : result.status === 'completed' ? 'in_progress' : 'completed'}
                              size="sm"
                            />
                            {resultStatus.hasCritical && (
                              <Badge variant="destructive" className="text-xs">Critical</Badge>
                            )}
                            {resultStatus.hasAbnormal && !resultStatus.hasCritical && (
                              <Badge variant="secondary" className="text-xs bg-lab-abnormal/10 text-lab-abnormal">Abnormal</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {result.patient?.first_name} {result.patient?.father_name}
                            </span>
                            <span>•</span>
                            <span>PID: {result.patient?.patient_id}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {formatDate(result.performed_at)}
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
        {(labTestResults.data?.length || 0) === 0 && (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No lab test results found</h3>
              <p className="text-muted-foreground max-w-sm mb-4">
                {activeFilters.query || activeFilters.status || activeFilters.abnormal_only
                  ? 'Try adjusting your filters to see more results.'
                  : 'Get started by creating your first lab test result.'}
              </p>
              {(activeFilters.query || activeFilters.status || activeFilters.abnormal_only) && (
                <Button variant="outline" onClick={handleReset}>
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {(labTestResults.meta?.last_page || 0) > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {labTestResults.meta?.from || 0} to {labTestResults.meta?.to || 0} of {labTestResults.meta?.total || 0} results
            </p>
            <div className="flex items-center gap-2">
              <Link
                href={labTestResults.links.prev || '#'}
                className={cn(
                  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                  'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                  !labTestResults.links.prev && 'pointer-events-none opacity-50'
                )}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Link>
              <div className="flex items-center gap-1">
                {labTestResults.meta.links
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
                href={labTestResults.links.next || '#'}
                className={cn(
                  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                  'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                  !labTestResults.links.next && 'pointer-events-none opacity-50'
                )}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </HospitalLayout>
  );
}
