import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Heading from '@/components/heading';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import { LabStatusBadge, PriorityBadge } from '@/components/laboratory';
import {
    FlaskConical,
    ClipboardList,
    FileText,
    ArrowRight,
    Clock,
    CheckCircle2,
    Activity,
    Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LaboratoryDashboardStats, LaboratoryActivity } from '@/types/lab-test';
import type { LabTestRequest } from '@/types/lab-test';
import type { LabTestResult } from '@/types/lab-test';

interface LaboratoryIndexProps {
    stats: LaboratoryDashboardStats;
    recentRequests: LabTestRequest[];
    recentResults: LabTestResult[];
    activities: LaboratoryActivity[];
    criticalResults: number;
    statRequests: number;
}

// Quick action cards configuration
const quickActions = [
    {
        id: 'new-request',
        label: 'New Test Request',
        description: 'Create a new laboratory test request',
        href: '/laboratory/lab-test-requests/create',
        icon: ClipboardList,
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    },
    {
        id: 'add-result',
        label: 'Add Test Result',
        description: 'Enter results for a completed test',
        href: '/laboratory/lab-test-results/create',
        icon: FileText,
        color: 'bg-green-500/10 text-green-600 border-green-500/20',
    },
    {
        id: 'manage-tests',
        label: 'Manage Lab Tests',
        description: 'View and manage available tests',
        href: '/laboratory/lab-tests',
        icon: FlaskConical,
        color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    },
    {
        id: 'view-requests',
        label: 'View All Requests',
        description: 'See all pending and completed requests',
        href: '/laboratory/lab-test-requests',
        icon: ClipboardList,
        color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    },
];

export default function LaboratoryIndex({
    stats,
    recentRequests,
    recentResults,
    activities = [],
    criticalResults = 0,
    statRequests = 0,
}: LaboratoryIndexProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
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

    return (
        <LaboratoryLayout
            header={
                <div>
                    <Heading title="Laboratory Dashboard" />
                    <p className="text-muted-foreground mt-1">
                        Overview of laboratory operations and activities
                    </p>
                </div>
            }
            alerts={{
                criticalResults,
                statRequests,
                abnormalResults: stats.abnormalResults,
                pendingRequests: stats.pendingRequests,
            }}
        >
            <Head title="Laboratory Dashboard" />

            <div className="space-y-6">

                {/* Statistics Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Tests</p>
                                    <p className="text-2xl font-bold">{stats.totalTests}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <FlaskConical className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Pending</p>
                                    <p className="text-2xl font-bold text-amber-600">{stats.pendingRequests}</p>
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
                                    <p className="text-2xl font-bold text-indigo-600">{stats.inProgressRequests}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                    <Activity className="h-5 w-5 text-indigo-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Completed Today</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.completedRequests}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Actions */}
                <div>
                    <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {quickActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <Link key={action.id} href={action.href}>
                                    <Card className={cn(
                                        'transition-all duration-200 hover:shadow-medium cursor-pointer border-2',
                                        action.color
                                    )}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className={cn(
                                                    'h-10 w-10 rounded-lg flex items-center justify-center',
                                                    action.color.split(' ')[0]
                                                )}>
                                                    <Icon className="h-5 w-5" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-foreground">{action.label}</h3>
                                                    <p className="text-sm text-muted-foreground mt-0.5">
                                                        {action.description}
                                                    </p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Requests */}
                    <Card className="lg:col-span-2">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg">Recent Test Requests</CardTitle>
                                <CardDescription>Latest laboratory test requests</CardDescription>
                            </div>
                            <Link href="/laboratory/lab-test-requests">
                                <Button variant="ghost" size="sm">
                                    View All
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentRequests.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No recent requests</p>
                                    </div>
                                ) : (
                                    recentRequests.slice(0, 5).map((request) => (
                                        <div
                                            key={request.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                        {getInitials(request.patient?.first_name, request.patient?.father_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-medium text-sm">{request.test_name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {request.patient?.first_name} {request.patient?.father_name} • {formatDate(request.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <PriorityBadge priority={request.test_type} size="sm" />
                                                <LabStatusBadge status={request.status} size="sm" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Results */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <div>
                                <CardTitle className="text-lg">Recent Results</CardTitle>
                                <CardDescription>Latest test results</CardDescription>
                            </div>
                            <Link href="/laboratory/lab-test-results">
                                <Button variant="ghost" size="sm">
                                    View All
                                    <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                            </Link>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentResults.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                        <p>No recent results</p>
                                    </div>
                                ) : (
                                    recentResults.slice(0, 5).map((result) => (
                                        <div
                                            key={result.id}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{result.labTest?.name || 'Unknown Test'}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDate(result.created_at)}
                                                </p>
                                            </div>
                                            <LabStatusBadge
                                                status={result.status === 'pending' ? 'pending' : result.status === 'completed' ? 'in_progress' : 'completed'}
                                                size="sm"
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Feed */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Recent Activity</CardTitle>
                        <CardDescription>Latest laboratory activities and updates</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activities.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                                    <p>No recent activity</p>
                                </div>
                            ) : (
                                activities.map((activity, index) => (
                                    <div key={activity.id} className="flex gap-4">
                                        <div className="flex flex-col items-center">
                                            <div className={cn(
                                                'h-8 w-8 rounded-full flex items-center justify-center',
                                                activity.type === 'request' && 'bg-blue-100 text-blue-600',
                                                activity.type === 'result' && 'bg-green-100 text-green-600',
                                                activity.type === 'test' && 'bg-purple-100 text-purple-600'
                                            )}>
                                                {activity.type === 'request' && <ClipboardList className="h-4 w-4" />}
                                                {activity.type === 'result' && <FileText className="h-4 w-4" />}
                                                {activity.type === 'test' && <FlaskConical className="h-4 w-4" />}
                                            </div>
                                            {index < activities.length - 1 && (
                                                <div className="w-0.5 h-full bg-border mt-2" />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-4">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium">{activity.action}</p>
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDate(activity.timestamp)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5">
                                                {activity.description}
                                            </p>
                                            {activity.user && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    by {activity.user.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Module Links */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link href="/laboratory/lab-tests">
                        <Card className="hover:shadow-medium transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                                        <FlaskConical className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium">Lab Tests</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {stats.activeTests} active tests available
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/laboratory/lab-test-requests">
                        <Card className="hover:shadow-medium transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <ClipboardList className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium">Test Requests</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {stats.pendingRequests + stats.inProgressRequests} pending/processing
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    <Link href="/laboratory/lab-test-results">
                        <Card className="hover:shadow-medium transition-shadow cursor-pointer">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <FileText className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium">Test Results</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {stats.verifiedResults} verified results
                                        </p>
                                    </div>
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </LaboratoryLayout>
    );
}
