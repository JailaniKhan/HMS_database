import { Head } from '@inertiajs/react';
import LaboratoryLayout from '@/layouts/LaboratoryLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Beaker,
    ClipboardList,
    Clock,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    Activity,
    FileText,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

interface ReportProps {
    stats: {
        total_tests_today: number;
        total_tests_this_month: number;
        pending_requests: number;
        in_progress_requests: number;
        completed_results: number;
        critical_results: number;
        abnormal_results: number;
    };
    categoryStats: {
        hematology: number;
        biochemistry: number;
        microbiology: number;
        urinalysis: number;
        immunology: number;
        other: number;
    };
    monthlyTrends: Array<{
        month: string;
        total_tests: number;
        completed: number;
        critical: number;
        abnormal: number;
    }>;
    recentResults: Array<{
        id: number;
        result_id: string;
        patient_name: string;
        test_name: string;
        status: string;
        performed_at: string | null;
        verified_at: string | null;
    }>;
    topTests: Array<{
        name: string;
        count: number;
    }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    critical: 'bg-red-100 text-red-800',
    abnormal: 'bg-yellow-100 text-yellow-800',
    pending: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-purple-100 text-purple-800',
};

export default function LabReportsIndex({
    stats,
    categoryStats,
    monthlyTrends,
    recentResults,
    topTests,
}: ReportProps) {
    const categoryData = [
        { name: 'Hematology', value: categoryStats.hematology },
        { name: 'Biochemistry', value: categoryStats.biochemistry },
        { name: 'Microbiology', value: categoryStats.microbiology },
        { name: 'Urinalysis', value: categoryStats.urinalysis },
        { name: 'Immunology', value: categoryStats.immunology },
        { name: 'Other', value: categoryStats.other },
    ].filter(item => item.value > 0);

    return (
        <LaboratoryLayout
            header={<h2 className="text-xl font-semibold">Laboratory Reports</h2>}
        >
            <Head title="Laboratory Reports" />

            <div className="space-y-6">
                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Tests Today</CardTitle>
                            <Beaker className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_tests_today}</div>
                            <p className="text-xs text-muted-foreground">
                                Total tests performed today
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">This Month</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_tests_this_month}</div>
                            <p className="text-xs text-muted-foreground">
                                Tests this month
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.pending_requests}</div>
                            <p className="text-xs text-muted-foreground">
                                Pending requests
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Critical</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.critical_results}</div>
                            <p className="text-xs text-muted-foreground">
                                Critical results this month
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Monthly Trends */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Monthly Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyTrends}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="month" />
                                        <YAxis />
                                        <Tooltip />
                                        <Line
                                            type="monotone"
                                            dataKey="total_tests"
                                            stroke="#8884d8"
                                            name="Total Tests"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="completed"
                                            stroke="#00C49F"
                                            name="Completed"
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="critical"
                                            stroke="#FF0000"
                                            name="Critical"
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Test Categories
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                                            }
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Tests & Recent Results */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Top Tests */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="h-5 w-5" />
                                Top Performed Tests
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topTests} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={100} />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#8884d8" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Summary Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5" />
                                Summary Statistics
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium">In Progress Requests</span>
                                <Badge variant="secondary">{stats.in_progress_requests}</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium">Completed This Month</span>
                                <Badge variant="default" className="bg-green-500">{stats.completed_results}</Badge>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <span className="text-sm font-medium">Abnormal Results</span>
                                <Badge variant="destructive">{stats.abnormal_results}</Badge>
                            </div>
                            <div className="pt-4">
                                <Link href="/laboratory/lab-test-results">
                                    <Button variant="outline" className="w-full">
                                        View All Results
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Results Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Test Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Result ID</TableHead>
                                    <TableHead>Patient</TableHead>
                                    <TableHead>Test</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Performed</TableHead>
                                    <TableHead>Verified</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentResults.map((result) => (
                                    <TableRow key={result.id}>
                                        <TableCell className="font-medium">{result.result_id}</TableCell>
                                        <TableCell>{result.patient_name}</TableCell>
                                        <TableCell>{result.test_name}</TableCell>
                                        <TableCell>
                                            <Badge className={statusColors[result.status] || 'bg-gray-100'}>
                                                {result.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{result.performed_at || 'N/A'}</TableCell>
                                        <TableCell>{result.verified_at || 'Pending'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </LaboratoryLayout>
    );
}
