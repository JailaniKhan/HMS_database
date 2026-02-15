import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Heading from '@/components/heading';
import {
    FileText,
    Currency,
    TrendingUp,
    TrendingDown,
    PieChart,
    BarChart3,
    Clock,
    AlertCircle,
    Shield,
    CreditCard,
    Download,
    Calendar,
    ArrowRight,
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { CurrencyDisplay } from '@/components/billing/CurrencyDisplay';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface ReportCardProps {
    title: string;
    description: string;
    icon: React.ElementType;
    href: string;
    badge?: string;
    color: string;
}

function ReportCard({ title, description, icon: Icon, href, badge, color }: ReportCardProps) {
    return (
        <Link href={href}>
            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div className={`h-12 w-12 rounded-lg ${color} flex items-center justify-center mb-4`}>
                            <Icon className="h-6 w-6 text-white" />
                        </div>
                        {badge && (
                            <Badge variant="secondary">{badge}</Badge>
                        )}
                    </div>
                    <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-sm text-muted-foreground">{description}</p>
                    <div className="mt-4 flex items-center text-sm text-primary">
                        <span>View Report</span>
                        <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

interface QuickStatProps {
    title: string;
    value: React.ReactNode;
    subtitle?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
}

function QuickStat({ title, value, subtitle, trend, trendValue }: QuickStatProps) {
    return (
        <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
            {trend && trendValue && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                    trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
                }`}>
                    {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : 
                     trend === 'down' ? <TrendingDown className="h-4 w-4" /> : null}
                    <span>{trendValue}</span>
                </div>
            )}
        </div>
    );
}

interface BillingReportsIndexProps {
    summary?: {
        total_revenue_today: number;
        total_revenue_this_month: number;
        outstanding_payments: number;
        pending_claims: number;
        revenue_change_percent: number;
        outstanding_change_percent: number;
    };
    recentReports?: Array<{
        id: number;
        name: string;
        type: string;
        generated_at: string;
        download_url: string;
    }>;
}

export default function BillingReportsIndex({ summary, recentReports = [] }: BillingReportsIndexProps) {
    const today = format(new Date(), 'yyyy-MM-dd');
    const monthStart = format(startOfMonth(new Date()), 'yyyy-MM-dd');
    const monthEnd = format(endOfMonth(new Date()), 'yyyy-MM-dd');
    const last30Days = format(subDays(new Date(), 30), 'yyyy-MM-dd');

    const reportCategories = [
        {
            title: 'Revenue Reports',
            description: 'Track income and financial performance',
            reports: [
                {
                    title: 'Revenue Summary',
                    description: 'Daily, weekly, monthly revenue breakdown',
                    icon: Currency,
                    href: '/reports/billing/revenue',
                    color: 'bg-green-500',
                },
                {
                    title: 'Payment Trends',
                    description: 'Analyze payment patterns over time',
                    icon: TrendingUp,
                    href: '/reports/billing/payment-trends',
                    badge: 'Popular',
                    color: 'bg-blue-500',
                },
                {
                    title: 'Department Revenue',
                    description: 'Revenue breakdown by department',
                    icon: BarChart3,
                    href: '/reports/billing/department-revenue',
                    color: 'bg-purple-500',
                },
            ],
        },
        {
            title: 'Outstanding & Collections',
            description: 'Monitor unpaid bills and collection status',
            reports: [
                {
                    title: 'Outstanding Payments',
                    description: 'Aging report for unpaid bills',
                    icon: Clock,
                    href: '/reports/billing/outstanding',
                    color: 'bg-orange-500',
                },
                {
                    title: 'Overdue Bills',
                    description: 'Bills past their due date',
                    icon: AlertCircle,
                    href: '/reports/billing/overdue',
                    badge: 'Action Required',
                    color: 'bg-red-500',
                },
                {
                    title: 'Collection Summary',
                    description: 'Payment collection efficiency',
                    icon: TrendingDown,
                    href: '/reports/billing/collections',
                    color: 'bg-yellow-500',
                },
            ],
        },
        {
            title: 'Payment Analysis',
            description: 'Detailed payment method and transaction reports',
            reports: [
                {
                    title: 'Payment Methods',
                    description: 'Breakdown by payment type',
                    icon: CreditCard,
                    href: '/reports/billing/payment-methods',
                    color: 'bg-indigo-500',
                },
                {
                    title: 'Daily Transactions',
                    description: 'Transaction log and summary',
                    icon: FileText,
                    href: '/reports/billing/transactions',
                    color: 'bg-cyan-500',
                },
                {
                    title: 'Refund Report',
                    description: 'Track refunds and adjustments',
                    icon: TrendingDown,
                    href: '/reports/billing/refunds',
                    color: 'bg-pink-500',
                },
            ],
        },
        {
            title: 'Insurance Reports',
            description: 'Insurance claims and provider analytics',
            reports: [
                {
                    title: 'Claims Summary',
                    description: 'Insurance claims status overview',
                    icon: Shield,
                    href: '/reports/billing/insurance-claims',
                    color: 'bg-teal-500',
                },
                {
                    title: 'Provider Performance',
                    description: 'Claims by insurance provider',
                    icon: PieChart,
                    href: '/reports/billing/provider-performance',
                    color: 'bg-emerald-500',
                },
                {
                    title: 'Pending Claims',
                    description: 'Claims awaiting approval',
                    icon: Clock,
                    href: '/reports/billing/pending-claims',
                    color: 'bg-amber-500',
                },
            ],
        },
    ];

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Billing Reports" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Billing Reports" />
                        <p className="text-muted-foreground mt-1">
                            Comprehensive financial and billing analytics
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/billing">
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                Back to Billing
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Quick Stats */}
                {summary && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Quick Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <QuickStat
                                    title="Today's Revenue"
                                    value={<CurrencyDisplay amount={summary.total_revenue_today} />}
                                    trend={summary.revenue_change_percent >= 0 ? 'up' : 'down'}
                                    trendValue={`${Math.abs(summary.revenue_change_percent).toFixed(1)}% vs yesterday`}
                                />
                                <QuickStat
                                    title="This Month"
                                    value={<CurrencyDisplay amount={summary.total_revenue_this_month} />}
                                    subtitle="Total revenue"
                                />
                                <QuickStat
                                    title="Outstanding"
                                    value={<CurrencyDisplay amount={summary.outstanding_payments} />}
                                    trend={summary.outstanding_change_percent <= 0 ? 'up' : 'down'}
                                    trendValue={`${Math.abs(summary.outstanding_change_percent).toFixed(1)}% vs last month`}
                                />
                                <QuickStat
                                    title="Pending Claims"
                                    value={summary.pending_claims}
                                    subtitle="Awaiting approval"
                                />
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Report Categories */}
                {reportCategories.map((category) => (
                    <div key={category.title}>
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">{category.title}</h2>
                            <p className="text-sm text-muted-foreground">{category.description}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.reports.map((report) => (
                                <ReportCard key={report.title} {...report} />
                            ))}
                        </div>
                    </div>
                ))}

                {/* Quick Links */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Quick Date Range Reports</CardTitle>
                        <CardDescription>
                            Generate common reports with pre-defined date ranges
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Link href={`/reports/billing/revenue?period=daily&date_from=${today}&date_to=${today}`}>
                                <Button variant="outline" className="w-full justify-between">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Today
                                    </span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href={`/reports/billing/revenue?period=custom&date_from=${last30Days}&date_to=${today}`}>
                                <Button variant="outline" className="w-full justify-between">
                                    <span className="flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Last 30 Days
                                    </span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href={`/reports/billing/revenue?period=monthly&date_from=${monthStart}&date_to=${monthEnd}`}>
                                <Button variant="outline" className="w-full justify-between">
                                    <span className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        This Month
                                    </span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Link href="/reports/billing/outstanding">
                                <Button variant="outline" className="w-full justify-between">
                                    <span className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4" />
                                        All Outstanding
                                    </span>
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Reports */}
                {recentReports.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Recently Generated Reports</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {recentReports.map((report) => (
                                    <div
                                        key={report.id}
                                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                    >
                                        <div className="flex items-center gap-3">
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{report.name}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {report.type} • Generated {format(new Date(report.generated_at), 'MMM dd, yyyy HH:mm')}
                                                </p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" asChild>
                                            <a href={report.download_url} download>
                                                <Download className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Export Options */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Bulk Export</CardTitle>
                        <CardDescription>
                            Download comprehensive billing data for external analysis
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <Button variant="outline" className="justify-start">
                                <Download className="mr-2 h-4 w-4" />
                                Export All Bills (CSV)
                            </Button>
                            <Button variant="outline" className="justify-start">
                                <Download className="mr-2 h-4 w-4" />
                                Export All Payments (CSV)
                            </Button>
                            <Button variant="outline" className="justify-start">
                                <Download className="mr-2 h-4 w-4" />
                                Export All Claims (CSV)
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}
