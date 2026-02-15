/**
 * Bill Parts Dashboard
 *
 * A comprehensive dashboard displaying key metrics and statistics
 * for bill parts across the hospital management system.
 */

import * as React from 'react';
import { Head } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
    Legend
} from 'recharts';
import { 
    Currency, 
    FileText, 
    TrendingUp, 
    TrendingDown,
    Calendar,
    RefreshCw,
    Download,
    Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data for demonstration - in production, this would come from the API
const dailyRevenueData = [
    { date: 'Mon', revenue: 12500, transactions: 45 },
    { date: 'Tue', revenue: 15800, transactions: 52 },
    { date: 'Wed', revenue: 14200, transactions: 48 },
    { date: 'Thu', revenue: 18900, transactions: 61 },
    { date: 'Fri', revenue: 21500, transactions: 72 },
    { date: 'Sat', revenue: 9800, transactions: 35 },
    { date: 'Sun', revenue: 7500, transactions: 28 },
];

const categoryDistribution = [
    { name: 'Consultation', value: 35, color: '#8884d8' },
    { name: 'Laboratory', value: 25, color: '#82ca9d' },
    { name: 'Pharmacy', value: 20, color: '#ffc658' },
    { name: 'Procedures', value: 12, color: '#ff7300' },
    { name: 'Room Charges', value: 8, color: '#0088FE' },
];

const monthlyTrendData = [
    { month: 'Jan', revenue: 450000, items: 1250 },
    { month: 'Feb', revenue: 520000, items: 1380 },
    { month: 'Mar', revenue: 480000, items: 1290 },
    { month: 'Apr', revenue: 590000, items: 1520 },
    { month: 'May', revenue: 620000, items: 1680 },
    { month: 'Jun', revenue: 580000, items: 1450 },
];

interface DashboardStats {
    totalRevenue: number;
    totalItems: number;
    averageTransaction: number;
    pendingBills: number;
    revenueChange: number;
    itemsChange: number;
    transactionChange: number;
}

interface StatCardProps {
    title: string;
    value: number | string;
    change: number;
    icon: React.ElementType;
    format?: 'currency' | 'number' | 'percent';
}

function StatCard({ title, value, change, icon: Icon, format = 'number' }: StatCardProps) {
    const isPositive = change >= 0;
    const displayValue = format === 'currency' && typeof value === 'number' 
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'AFN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
        : typeof value === 'number' 
            ? value.toLocaleString() 
            : value;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{displayValue}</div>
                <div className="flex items-center gap-1 mt-1">
                    {isPositive ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                    <span className={cn(
                        "text-xs font-medium",
                        isPositive ? "text-green-500" : "text-red-500"
                    )}>
                        {isPositive ? '+' : ''}{change}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                        vs last period
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

export default function BillPartsDashboard() {
    const [dateRange, setDateRange] = React.useState('week');
    const [isLoading, setIsLoading] = React.useState(false);
    const [stats] = React.useState<DashboardStats>({
        totalRevenue: 125750,
        totalItems: 342,
        averageTransaction: 367.69,
        pendingBills: 28,
        revenueChange: 12.5,
        itemsChange: 8.3,
        transactionChange: -2.1,
    });

    const handleRefresh = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => setIsLoading(false), 1000);
    };

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'AFN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <HospitalLayout header="Bill Parts Dashboard">
            <Head title="Bill Parts Dashboard - Hospital Management System" />

            <div className="space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Bill Parts Dashboard</h1>
                        <p className="text-muted-foreground">
                            Overview of billing performance and bill item analytics
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={dateRange} onValueChange={setDateRange}>
                            <SelectTrigger className="w-[150px]">
                                <Calendar className="mr-2 h-4 w-4" />
                                <SelectValue placeholder="Select range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="quarter">This Quarter</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleRefresh} variant="outline" disabled={isLoading}>
                            <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
                            Refresh
                        </Button>
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="Total Revenue"
                        value={stats.totalRevenue}
                        change={stats.revenueChange}
                        icon={Currency}
                        format="currency"
                    />
                    <StatCard
                        title="Total Items"
                        value={stats.totalItems}
                        change={stats.itemsChange}
                        icon={FileText}
                        format="number"
                    />
                    <StatCard
                        title="Avg. Transaction"
                        value={stats.averageTransaction}
                        change={stats.transactionChange}
                        icon={TrendingUp}
                        format="currency"
                    />
                    <StatCard
                        title="Pending Bills"
                        value={stats.pendingBills}
                        change={-5.2}
                        icon={Calendar}
                        format="number"
                    />
                </div>

                {/* Charts Row */}
                <div className="grid gap-4 lg:grid-cols-2">
                    {/* Daily Revenue Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Currency className="h-5 w-5" />
                                Daily Revenue
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dailyRevenueData}>
                                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                        <XAxis dataKey="date" className="text-xs" />
                                        <YAxis 
                                            className="text-xs"
                                            tickFormatter={(value) => `AFN ${(Number(value) / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip 
                                            formatter={(value: number | string) => [formatCurrency(Number(value)), 'Revenue'] as [string, string]}
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                        />
                                        <Bar dataKey="revenue" fill="#8884d8" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Category Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Items by Category
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={categoryDistribution}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                                        >
                                            {categoryDistribution.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip 
                                            formatter={(value: number | string) => [Number(value), 'Items']}
                                            contentStyle={{ 
                                                backgroundColor: 'hsl(var(--card))',
                                                border: '1px solid hsl(var(--border))',
                                                borderRadius: '8px',
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Monthly Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Monthly Trends
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis dataKey="month" className="text-xs" />
                                    <YAxis 
                                        className="text-xs"
                                        yAxisId="left"
                                        tickFormatter={(value) => `AFN ${(Number(value) / 1000).toFixed(0)}k`}
                                    />
                                    <YAxis 
                                        className="text-xs"
                                        yAxisId="right"
                                        orientation="right"
                                        tickFormatter={(value) => Number(value).toLocaleString()}
                                    />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'hsl(var(--card))',
                                            border: '1px solid hsl(var(--border))',
                                            borderRadius: '8px',
                                        }}
                                        formatter={(value: number | string, name: string) => [
                                            name === 'revenue' ? formatCurrency(Number(value)) : Number(value).toLocaleString(),
                                            name === 'revenue' ? 'Revenue' : 'Items'
                                        ]}
                                    />
                                    <Legend />
                                    <Line 
                                        yAxisId="left"
                                        type="monotone" 
                                        dataKey="revenue" 
                                        stroke="#8884d8" 
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        name="Revenue"
                                    />
                                    <Line 
                                        yAxisId="right"
                                        type="monotone" 
                                        dataKey="items" 
                                        stroke="#82ca9d" 
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                        name="Items"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-3">
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                View All Bills
                            </Button>
                            <Button variant="outline">
                                <Currency className="mr-2 h-4 w-4" />
                                Payment Records
                            </Button>
                            <Button variant="outline">
                                <Calendar className="mr-2 h-4 w-4" />
                                Pending Bills
                            </Button>
                            <Button variant="outline">
                                <Download className="mr-2 h-4 w-4" />
                                Generate Report
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
