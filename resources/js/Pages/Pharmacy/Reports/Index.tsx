import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import {
    TrendingUp,
    Package,
    AlertCircle,
    Currency,
    FileText,
    Download,
    BarChart3,
    Calendar,
} from 'lucide-react';

interface ReportsIndexProps {
    stats: {
        totalSales: number;
        totalRevenue: number;
        totalMedicines: number;
        lowStockCount: number;
        expiringSoonCount: number;
        expiredCount: number;
    };
}

const reportCards = [
    {
        id: 'sales',
        title: 'Sales Report',
        description: 'View detailed sales analytics and trends',
        icon: TrendingUp,
        color: 'bg-blue-500/10 text-blue-600',
        href: '/pharmacy/reports/sales',
        features: ['Daily/Monthly sales', 'Revenue trends', 'Top selling medicines', 'Payment method breakdown'],
    },
    {
        id: 'stock',
        title: 'Stock Report',
        description: 'Inventory status and valuation reports',
        icon: Package,
        color: 'bg-green-500/10 text-green-600',
        href: '/pharmacy/reports/stock',
        features: ['Current stock levels', 'Stock valuation', 'Movement history', 'Low stock items'],
    },
    {
        id: 'expiry',
        title: 'Expiry Report',
        description: 'Track medicines nearing expiration',
        icon: AlertCircle,
        color: 'bg-red-500/10 text-red-600',
        href: '/pharmacy/reports/expiry',
        features: ['Expiring soon', 'Already expired', 'Batch tracking', 'Expiry alerts'],
    },
];
// Removed Purchase Report section (Purchase orders and supplier analysis)

export default function ReportsIndex({ stats }: ReportsIndexProps) {
    return (
        <PharmacyLayout header="Pharmacy Reports">
            <Head title="Pharmacy Reports" />

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6 mb-6">
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                                <Currency className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Revenue</p>
                                <p className="text-lg font-bold">${stats?.totalRevenue?.toLocaleString() || '0'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-100 text-green-600">
                                <TrendingUp className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Sales</p>
                                <p className="text-lg font-bold">{stats?.totalSales?.toLocaleString() || '0'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                                <Package className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Medicines</p>
                                <p className="text-lg font-bold">{stats?.totalMedicines?.toLocaleString() || '0'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-yellow-100 text-yellow-600">
                                <AlertCircle className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Low Stock</p>
                                <p className="text-lg font-bold">{stats?.lowStockCount || '0'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
                                <Calendar className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Expiring Soon</p>
                                <p className="text-lg font-bold">{stats?.expiringSoonCount || '0'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-red-100 text-red-600">
                                <AlertCircle className="size-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Expired</p>
                                <p className="text-lg font-bold">{stats?.expiredCount || '0'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Report Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                {reportCards.map((report) => {
                    const Icon = report.icon;
                    return (
                        <Card key={report.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-3 rounded-lg ${report.color}`}>
                                            <Icon className="size-6" />
                                        </div>
                                        <div>
                                            <CardTitle>{report.title}</CardTitle>
                                            <CardDescription>{report.description}</CardDescription>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 mb-4">
                                    {report.features.map((feature, index) => (
                                        <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <BarChart3 className="size-4 text-primary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                                <div className="flex gap-2">
                                    <Link href={report.href} className="flex-1">
                                        <Button className="w-full">
                                            <FileText className="size-4 mr-2" />
                                            View Report
                                        </Button>
                                    </Link>
                                    <Link href={`${report.href}?export=pdf`}>
                                        <Button variant="outline">
                                            <Download className="size-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Quick Actions */}
            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>Generate and export reports quickly</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        <Link href="/pharmacy/sales/export">
                            <Button variant="outline">
                                <Download className="size-4 mr-2" />
                                Export Sales (CSV)
                            </Button>
                        </Link>
                        <Link href="/pharmacy/stock/export">
                            <Button variant="outline">
                                <Download className="size-4 mr-2" />
                                Export Stock (CSV)
                            </Button>
                        </Link>
                        <Link href="/pharmacy/stock/movements/export">
                            <Button variant="outline">
                                <Download className="size-4 mr-2" />
                                Export Movements (CSV)
                            </Button>
                        </Link>
                        <Link href="/pharmacy/medicines/expired">
                            <Button variant="outline">
                                <AlertCircle className="size-4 mr-2" />
                                View Expired Medicines
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </PharmacyLayout>
    );
}
