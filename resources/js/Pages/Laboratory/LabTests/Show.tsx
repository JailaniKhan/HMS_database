import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import { 
  ArrowLeft, 
  Edit, 
  FlaskConical, 
  DollarSign, 
  Clock,
  FileText,
  Activity,
  Droplets,
  Microscope,
  Beaker,
  Tag,
  CheckCircle2,
  AlertCircle,
  Ban,
  Play,
  History,
  Calendar,
  User,
  ClipboardList,
  TrendingUp,
  Printer,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LabTest } from '@/types/lab-test';

interface LabTestShowProps {
  labTest: LabTest;
  recentResults?: {
    id: number;
    patient_name: string;
    patient_id: string;
    result_value: string;
    status: string;
    performed_at: string;
    abnormal_flags: string | null;
  }[];
}

// Category configuration with icons and colors
const categoryConfig: Record<string, { 
  label: string; 
  icon: React.ElementType; 
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  hematology: { 
    label: 'Hematology', 
    icon: Droplets, 
    color: 'text-lab-hematology',
    bgColor: 'bg-lab-hematology/10',
    borderColor: 'border-lab-hematology/30',
  },
  biochemistry: { 
    label: 'Biochemistry', 
    icon: FlaskConical, 
    color: 'text-lab-biochemistry',
    bgColor: 'bg-lab-biochemistry/10',
    borderColor: 'border-lab-biochemistry/30',
  },
  microbiology: { 
    label: 'Microbiology', 
    icon: Microscope, 
    color: 'text-lab-microbiology',
    bgColor: 'bg-lab-microbiology/10',
    borderColor: 'border-lab-microbiology/30',
  },
  immunology: { 
    label: 'Immunology', 
    icon: Activity, 
    color: 'text-lab-immunology',
    bgColor: 'bg-lab-immunology/10',
    borderColor: 'border-lab-immunology/30',
  },
  urinalysis: { 
    label: 'Urinalysis', 
    icon: Beaker, 
    color: 'text-lab-urinalysis',
    bgColor: 'bg-lab-urinalysis/10',
    borderColor: 'border-lab-urinalysis/30',
  },
};

export default function LabTestShow({ labTest, recentResults = [] }: LabTestShowProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatTime = (hours: number) => {
    if (hours < 24) {
      return `${hours} hours`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (remainingHours === 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    }
    return `${days}d ${remainingHours}h`;
  };

  const handleStatusToggle = () => {
    const newStatus = labTest.status === 'active' ? 'inactive' : 'active';
    // Use router.visit with POST method and _method spoofing for PATCH
    router.visit(`/laboratory/lab-tests/${labTest.id}/status`, {
      method: 'post',
      data: {
        status: newStatus,
        _method: 'PATCH',
      },
      preserveScroll: true,
    });
  };

  const handleDuplicate = () => {
    router.post(`/laboratory/lab-tests/${labTest.id}/duplicate`);
  };

  // Default to hematology styling if no category match
  const categoryKey = 'hematology' as keyof typeof categoryConfig;
  const categoryInfo = categoryConfig[categoryKey] || {
    label: 'Laboratory Test',
    icon: FlaskConical,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/30',
  };
  const CategoryIcon = categoryInfo.icon;

  const isActive = labTest.status === 'active';

  return (
    <LaboratoryLayout
      header={
        <div>
          <Heading title={`Lab Test: ${labTest.test_id}`} />
          <p className="text-muted-foreground mt-1">
            View laboratory test details
          </p>
        </div>
      }
    >
      <Head title={`Lab Test - ${labTest.test_id}`} />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Heading title="Lab Test Details" />
            <p className="text-muted-foreground mt-1">
              Viewing test information and recent results
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant={isActive ? 'destructive' : 'default'}
              onClick={handleStatusToggle}
            >
              {isActive ? (
                <>
                  <Ban className="mr-2 h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleDuplicate}>
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Link href={`/laboratory/lab-tests/${labTest.id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Test
              </Button>
            </Link>
            <Link href="/laboratory/lab-tests">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Test Info Card */}
        <Card className={cn(
          "border-l-4 overflow-hidden",
          isActive ? "border-l-green-500" : "border-l-amber-500"
        )}>
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row">
              {/* Left Side - Main Info */}
              <div className="flex-1 p-6">
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "h-16 w-16 rounded-xl flex items-center justify-center shrink-0",
                    categoryInfo.bgColor,
                    categoryInfo.borderColor,
                    "border-2"
                  )}>
                    <CategoryIcon className={cn("h-8 w-8", categoryInfo.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-2xl font-bold">{labTest.name}</h1>
                      <Badge 
                        variant={isActive ? 'default' : 'secondary'}
                        className={cn(
                          isActive ? "bg-green-500 hover:bg-green-600" : "bg-amber-500 hover:bg-amber-600"
                        )}
                      >
                        {isActive ? (
                          <><CheckCircle2 className="mr-1 h-3 w-3" /> Active</>
                        ) : (
                          <><AlertCircle className="mr-1 h-3 w-3" /> Inactive</>
                        )}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                      <Tag className="h-4 w-4" />
                      <span className="font-mono">{labTest.test_id}</span>
                      <span>•</span>
                      <Badge variant="outline" className={cn(categoryInfo.bgColor, categoryInfo.color)}>
                        {categoryInfo.label}
                      </Badge>
                    </div>
                    {labTest.description && (
                      <p className="mt-3 text-muted-foreground">
                        {labTest.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <DollarSign className="h-4 w-4" />
                      <span>Cost</span>
                    </div>
                    <p className="text-lg font-semibold mt-1">{formatCurrency(labTest.cost)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Clock className="h-4 w-4" />
                      <span>Turnaround</span>
                    </div>
                    <p className="text-lg font-semibold mt-1">{formatTime(labTest.turnaround_time)}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <ClipboardList className="h-4 w-4" />
                      <span>Unit</span>
                    </div>
                    <p className="text-lg font-semibold mt-1">{labTest.unit || 'N/A'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <TrendingUp className="h-4 w-4" />
                      <span>Recent Tests</span>
                    </div>
                    <p className="text-lg font-semibold mt-1">{recentResults.length}</p>
                  </div>
                </div>
              </div>

              {/* Right Side - Metadata */}
              <div className="lg:w-72 bg-muted/30 p-6 border-t lg:border-t-0 lg:border-l">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Test Metadata</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="text-sm font-medium">{formatDate(labTest.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Last Updated</p>
                      <p className="text-sm font-medium">{formatDate(labTest.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Normal Values */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <CardTitle>Normal Values</CardTitle>
                  <CardDescription>Reference range for this test</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {labTest.normal_values ? (
                <div className="p-4 rounded-lg bg-green-50/50 border border-green-200">
                  <p className="whitespace-pre-wrap">{labTest.normal_values}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No normal values specified</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Procedure */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <CardTitle>Procedure</CardTitle>
                  <CardDescription>Collection and testing instructions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {labTest.procedure ? (
                <div className="p-4 rounded-lg bg-blue-50/50 border border-blue-200">
                  <p className="whitespace-pre-wrap">{labTest.procedure}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No procedure specified</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Results Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <CardTitle>Recent Test Results</CardTitle>
                  <CardDescription>Latest patient results for this test</CardDescription>
                </div>
              </div>
              <Link href="/laboratory/lab-test-results">
                <Button variant="outline" size="sm">
                  View All Results
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentResults.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{result.patient_name}</p>
                            <p className="text-xs text-muted-foreground">{result.patient_id}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-mono font-medium",
                          result.abnormal_flags ? "text-red-600" : "text-green-600"
                        )}>
                          {result.result_value}
                        </span>
                        {result.abnormal_flags && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            {result.abnormal_flags}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={result.status === 'completed' ? 'default' : 'secondary'}>
                          {result.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(result.performed_at)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/laboratory/lab-test-results/${result.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-medium mb-2">No recent results</h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  This test hasn't been performed yet. Results will appear here once patients complete this test.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => router.visit(`/laboratory/lab-tests/${labTest.id}/edit`)}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-medium">Edit Test</h4>
                <p className="text-sm text-muted-foreground">Modify test details</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer" onClick={handleDuplicate}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Copy className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Duplicate</h4>
                <p className="text-sm text-muted-foreground">Create a copy</p>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-medium transition-shadow cursor-pointer" onClick={() => window.print()}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Printer className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Print</h4>
                <p className="text-sm text-muted-foreground">Print test info</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </LaboratoryLayout>
  );
}
