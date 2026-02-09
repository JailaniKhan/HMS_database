import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import { StockBadge } from '@/components/pharmacy';
import { ExpiryBadge } from '@/components/pharmacy';
import { PriceDisplay } from '@/components/pharmacy';
import type { PharmacyDashboardStats, PharmacyActivity } from '@/types/pharmacy';
import {
    Pill,
    ShoppingCart,
    Package,
    ClipboardList,
    AlertTriangle,
    ArrowRight,
    DollarSign,
    AlertCircle,
    Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PharmacyDashboardProps {
    stats: PharmacyDashboardStats;
    recentActivities: PharmacyActivity[];
    lowStockMedicines: Array<{
        id: number;
        name: string;
        quantity: number;
    }>;
    expiringMedicines: Array<{
        id: number;
        name: string;
        expiry_date: string;
        daysUntilExpiry: number;
    }>;
}

// Quick action cards configuration
const quickActions = [
    {
        id: 'new-sale',
        label: 'New Sale',
        description: 'Create a new sales transaction',
        href: '/pharmacy/sales/create',
        icon: ShoppingCart,
        color: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    },
    {
        id: 'add-medicine',
        label: 'Add Medicine',
        description: 'Add a new medicine to inventory',
        href: '/pharmacy/medicines/create',
        icon: Pill,
        color: 'bg-green-500/10 text-green-600 border-green-500/20',
    },
    {
        id: 'purchase-order',
        label: 'Purchase Order',
        description: 'Create a new purchase order',
        href: '/pharmacy/purchase-orders/create',
        icon: ClipboardList,
        color: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    },
    {
        id: 'view-alerts',
        label: 'View Alerts',
        description: 'Check stock and expiry alerts',
        href: '/pharmacy/alerts',
        icon: AlertTriangle,
        color: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    },
];

// Stats card configuration
const statCards = [
    {
        id: 'total-medicines',
        label: 'Total Medicines',
        key: 'totalMedicines' as const,
        icon: Pill,
        color: 'text-blue-600 bg-blue-500/10',
    },
    {
        id: 'today-sales',
        label: "Today's Sales",
        key: 'todaySales' as const,
        icon: ShoppingCart,
        color: 'text-green-600 bg-green-500/10',
        format: (val: number) => val.toString(),
    },
    {
        id: 'today-revenue',
        label: "Today's Revenue",
        key: 'todayRevenue' as const,
        icon: DollarSign,
        color: 'text-emerald-600 bg-emerald-500/10',
        isCurrency: true,
    },
    {
        id: 'low-stock',
        label: 'Low Stock Items',
        key: 'lowStockCount' as const,
        icon: Package,
        color: 'text-amber-600 bg-amber-500/10',
        alert: true,
    },
    {
        id: 'expiring-soon',
        label: 'Expiring Soon',
        key: 'expiringSoonCount' as const,
        icon: AlertCircle,
        color: 'text-orange-600 bg-orange-500/10',
        alert: true,
    },
    {
        id: 'critical-alerts',
        label: 'Critical Alerts',
        key: 'criticalAlerts' as const,
        icon: AlertTriangle,
        color: 'text-red-600 bg-red-500/10',
        alert: true,
    },
];

export default function PharmacyDashboard({
    stats,
    recentActivities = [],
    lowStockMedicines = [],
    expiringMedicines = [],
}: PharmacyDashboardProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActivityIcon = (type: PharmacyActivity['type']) => {
        switch (type) {
            case 'sale':
                return ShoppingCart;
            case 'purchase':
                return ClipboardList;
            case 'stock_adjustment':
                return Package;
            case 'alert':
                return AlertTriangle;
            case 'medicine_added':
                return Pill;
            default:
                return Activity;
        }
    };

    return (
        <PharmacyLayout
            header={<h1 className="text-xl font-semibold">Pharmacy Dashboard</h1>}
            alerts={{
                lowStock: stats.lowStockCount,
                expiringSoon: stats.expiringSoonCount,
                expired: stats.expiredCount,
                critical: stats.criticalAlerts,
            }}
        >
            <Head title="Pharmacy Dashboard" />

            {/* Quick Actions */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {quickActions.map((action) => (
                    <Link key={action.id} href={action.href} className="block">
                        <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/50 cursor-pointer group">
                            <CardContent className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        'p-3 rounded-lg border transition-transform group-hover:scale-105',
                                        action.color
                                    )}>
                                        <action.icon className="size-6" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-semibold text-foreground">{action.label}</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {action.description}
                                        </p>
                                    </div>
                                    <ArrowRight className="size-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {statCards.map((stat) => {
                    const value = stats[stat.key];
                    const Icon = stat.icon;

                    return (
                        <Card key={stat.id}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={cn('p-3 rounded-lg', stat.color)}>
                                            <Icon className="size-6" />
                                        </div>
                                        <div>
                                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                                            <p className="text-2xl font-bold">
                                                {stat.isCurrency ? (
                                                    <PriceDisplay amount={value as number} size="lg" />
                                                ) : (
                                                    stat.format ? stat.format(value as number) : value
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    {stat.alert && (value as number) > 0 && (
                                        <Badge variant="destructive" className="h-6 px-2">
                                            {(value as number).toString()}
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Low Stock Medicines */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="size-5 text-amber-600" />
                                    Low Stock Medicines
                                </CardTitle>
                                <CardDescription>
                                    Medicines with low inventory (≤10 units)
                                </CardDescription>
                            </div>
                            <Link href="/pharmacy/stock">
                                <Button variant="ghost" size="sm">
                                    View All
                                    <ArrowRight className="size-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {lowStockMedicines.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <Package className="size-12 mx-auto mb-3 opacity-50" />
                                <p>All medicines are well stocked</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {lowStockMedicines.slice(0, 5).map((medicine) => (
                                    <div
                                        key={medicine.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div>
                                            <p className="font-medium">{medicine.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Available: {medicine.quantity} units
                                            </p>
                                        </div>
                                        <StockBadge
                                            status={medicine.quantity === 0 ? 'out-of-stock' : 'low-stock'}
                                            quantity={medicine.quantity}
                                            size="sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Expiring Medicines */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="size-5 text-orange-600" />
                                    Expiring Soon
                                </CardTitle>
                                <CardDescription>
                                    Medicines expiring within 30 days
                                </CardDescription>
                            </div>
                            <Link href="/pharmacy/alerts">
                                <Button variant="ghost" size="sm">
                                    View All
                                    <ArrowRight className="size-4 ml-1" />
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {expiringMedicines.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <AlertCircle className="size-12 mx-auto mb-3 opacity-50" />
                                <p>No medicines expiring soon</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {expiringMedicines.slice(0, 5).map((medicine) => (
                                    <div
                                        key={medicine.id}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                                    >
                                        <div>
                                            <p className="font-medium">{medicine.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Expires: {formatDate(medicine.expiry_date)}
                                            </p>
                                        </div>
                                        <ExpiryBadge
                                            status={medicine.daysUntilExpiry < 0 ? 'expired' : 'expiring-soon'}
                                            daysUntilExpiry={medicine.daysUntilExpiry}
                                            size="sm"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Activity className="size-5" />
                            Recent Activity
                        </CardTitle>
                        <Link href="/pharmacy/reports">
                            <Button variant="ghost" size="sm">
                                View Reports
                                <ArrowRight className="size-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentActivities.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Activity className="size-12 mx-auto mb-3 opacity-50" />
                            <p>No recent activity</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {recentActivities.slice(0, 5).map((activity) => {
                                const Icon = getActivityIcon(activity.type);
                                return (
                                    <div
                                        key={activity.id}
                                        className="flex items-start gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="p-2 rounded-md bg-muted">
                                            <Icon className="size-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium">{activity.action}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {activity.description}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(activity.timestamp)}
                                            </p>
                                            {activity.user && (
                                                <p className="text-xs text-muted-foreground">
                                                    by {activity.user.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </PharmacyLayout>
    );
}
