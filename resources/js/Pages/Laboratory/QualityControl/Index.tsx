import { Head } from '@inertiajs/react';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    CheckCircle2,
    AlertTriangle,
    Activity,
    Clock,
    RefreshCw,
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
    BarChart,
    Bar,
} from 'recharts';

interface QualityControlProps {
    stats: {
        total_tests_today: number;
        total_tests_this_month: number;
        critical_results: number;
        abnormal_results: number;
        verified_results: number;
        pending_verification: number;
    };
    qualityMetrics: {
        verification_rate: number;
        critical_value_notification_rate: number;
        turnaround_time_average: number;
        error_rate: number;
    };
    monthlyTrends: Array<{
        month: string;
        total_tests: number;
        critical_results: number;
        abnormal_results: number;
        verification_rate: number;
    }>;
    controlChartData: Array<{
        date: string;
        value_1: number;
        value_2: number;
        mean_1: number;
        mean_2: number;
        plus_2sd_1: number;
        minus_2sd_1: number;
        plus_3sd_1: number;
        minus_3sd_1: number;
    }>;
    qcSamples: Array<{
        id: string;
        name: string;
        lot_number: string;
        expiry_date: string;
        status: 'in_range' | 'warning' | 'out_of_range';
        last_run: string;
        mean: number;
        sd: number;
        current_value: number;
    }>;
    ruleViolations: Array<{
        rule: string;
        description: string;
        count_this_month: number;
        severity: 'none' | 'warning' | 'attention' | 'critical';
        action_required: string;
    }>;
}

export default function QualityControlIndex({
    stats,
    qualityMetrics,
    monthlyTrends,
    controlChartData,
    qcSamples,
    ruleViolations,
}: QualityControlProps) {
    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'in_range':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">In Range</Badge>;
            case 'warning':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
            case 'out_of_range':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Out of Range</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    const getSeverityBadge = (severity: string) => {
        switch (severity) {
            case 'none':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Normal</Badge>;
            case 'warning':
                return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Warning</Badge>;
            case 'attention':
                return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Attention</Badge>;
            case 'critical':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Critical</Badge>;
            default:
                return <Badge variant="secondary">Unknown</Badge>;
        }
    };

    return (
        <LaboratoryLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Quality Control Dashboard</h2>
                        <p className="text-muted-foreground">
                            Monitor laboratory quality metrics and QC samples
                        </p>
                    </div>
                    <Button variant="outline" size="sm">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Data
                    </Button>
                </div>
            }
        >
            <Head title="Quality Control" />

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tests Today</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_tests_today}</div>
                        <p className="text-xs text-muted-foreground">
                            {stats.total_tests_this_month} this month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{qualityMetrics.verification_rate}%</div>
                        <Progress value={qualityMetrics.verification_rate} className="mt-2" />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Critical Results</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.critical_results}</div>
                        <p className="text-xs text-muted-foreground">
                            This month
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Turnaround</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{qualityMetrics.turnaround_time_average}h</div>
                        <p className="text-xs text-muted-foreground">
                            From request to verification
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="control-charts">Control Charts</TabsTrigger>
                    <TabsTrigger value="qc-samples">QC Samples</TabsTrigger>
                    <TabsTrigger value="westgard">Westgard Rules</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Trends</CardTitle>
                                <CardDescription>Test volume and verification rates</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={monthlyTrends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="total_tests" fill="#3b82f6" name="Total Tests" />
                                        <Bar dataKey="critical_results" fill="#ef4444" name="Critical" />
                                        <Bar dataKey="abnormal_results" fill="#f59e0b" name="Abnormal" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Quality Metrics</CardTitle>
                                <CardDescription>Key performance indicators</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">Verification Rate</span>
                                        <span className="text-sm">{qualityMetrics.verification_rate}%</span>
                                    </div>
                                    <Progress value={qualityMetrics.verification_rate} />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">Critical Value Notification</span>
                                        <span className="text-sm">{qualityMetrics.critical_value_notification_rate}%</span>
                                    </div>
                                    <Progress value={qualityMetrics.critical_value_notification_rate} />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <span className="text-sm font-medium">Error Rate</span>
                                        <span className="text-sm">{qualityMetrics.error_rate}%</span>
                                    </div>
                                    <Progress value={qualityMetrics.error_rate} className="bg-red-100" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Control Charts Tab */}
                <TabsContent value="control-charts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Levey-Jennings Control Chart</CardTitle>
                            <CardDescription>QC Level 1 - Glucose Control</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <LineChart data={controlChartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString()} />
                                    <YAxis domain={[85, 105]} />
                                    <Tooltip />
                                    <ReferenceLine y={95} stroke="#3b82f6" strokeDasharray="3 3" label="Mean" />
                                    <ReferenceLine y={99} stroke="#f59e0b" strokeDasharray="3 3" label="+2SD" />
                                    <ReferenceLine y={91} stroke="#f59e0b" strokeDasharray="3 3" label="-2SD" />
                                    <ReferenceLine y={101} stroke="#ef4444" strokeDasharray="3 3" label="+3SD" />
                                    <ReferenceLine y={89} stroke="#ef4444" strokeDasharray="3 3" label="-3SD" />
                                    <Line
                                        type="monotone"
                                        dataKey="value_1"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        dot={{ fill: '#3b82f6' }}
                                        name="Control Value"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* QC Samples Tab */}
                <TabsContent value="qc-samples">
                    <Card>
                        <CardHeader>
                            <CardTitle>Active QC Samples</CardTitle>
                            <CardDescription>Current control materials and their status</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sample ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Lot Number</TableHead>
                                        <TableHead>Expiry Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Current Value</TableHead>
                                        <TableHead>Mean ± SD</TableHead>
                                        <TableHead>Last Run</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {qcSamples.map((sample) => (
                                        <TableRow key={sample.id}>
                                            <TableCell className="font-medium">{sample.id}</TableCell>
                                            <TableCell>{sample.name}</TableCell>
                                            <TableCell>{sample.lot_number}</TableCell>
                                            <TableCell>{sample.expiry_date}</TableCell>
                                            <TableCell>{getStatusBadge(sample.status)}</TableCell>
                                            <TableCell>{sample.current_value.toFixed(1)}</TableCell>
                                            <TableCell>{sample.mean} ± {sample.sd}</TableCell>
                                            <TableCell>{sample.last_run}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Westgard Rules Tab */}
                <TabsContent value="westgard">
                    <Card>
                        <CardHeader>
                            <CardTitle>Westgard Rules Violations</CardTitle>
                            <CardDescription>QC rule violations this month</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Rule</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Count</TableHead>
                                        <TableHead>Severity</TableHead>
                                        <TableHead>Action Required</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {ruleViolations.map((violation) => (
                                        <TableRow key={violation.rule}>
                                            <TableCell className="font-medium">{violation.rule}</TableCell>
                                            <TableCell>{violation.description}</TableCell>
                                            <TableCell>{violation.count_this_month}</TableCell>
                                            <TableCell>{getSeverityBadge(violation.severity)}</TableCell>
                                            <TableCell>{violation.action_required}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </LaboratoryLayout>
    );
}
