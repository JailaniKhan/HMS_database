import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PriceDisplay } from '@/components/pharmacy';
import Heading from '@/components/heading';
import {
    ArrowLeft,
    TrendingUp,
    Package,
    AlertTriangle,
    AlertCircle,
    CheckCircle,
    FileDown,
    PieChart,
    BarChart3,
    DollarSign,
    Boxes,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import type { MedicineCategory } from '@/types/pharmacy';

interface CategoryValuation {
    category: MedicineCategory;
    item_count: number;
    total_value: number;
    percentage: number;
}

interface StatusValuation {
    status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'critical';
    label: string;
    item_count: number;
    total_value: number;
    percentage: number;
}

interface ValuationProps {
    totalValue: number;
    totalItems: number;
    categoryBreakdown: CategoryValuation[];
    statusBreakdown: StatusValuation[];
    topValuedItems: {
        id: number;
        name: string;
        medicine_id: string;
        stock_quantity: number;
        unit_price: number;
        total_value: number;
        category?: MedicineCategory;
    }[];
    trends?: {
        period: string;
        value: number;
    }[];
}

export default function Valuation({
    totalValue,
    totalItems,
    categoryBreakdown,
    statusBreakdown,
    topValuedItems,
}: ValuationProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'in_stock':
                return <CheckCircle className="h-4 w-4 text-green-600" />;
            case 'low_stock':
                return <AlertTriangle className="h-4 w-4 text-amber-600" />;
            case 'out_of_stock':
                return <AlertCircle className="h-4 w-4 text-red-600" />;
            case 'critical':
                return <AlertCircle className="h-4 w-4 text-red-700" />;
            default:
                return <Package className="h-4 w-4" />;
        }
    };

    // Calculate category colors
    const categoryColors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-amber-500',
        'bg-pink-500',
        'bg-cyan-500',
        'bg-red-500',
        'bg-indigo-500',
    ];

    const handleExport = (type: 'pdf' | 'excel') => {
        window.location.href = `/pharmacy/stock/valuation/export?format=${type}`;
    };

    return (
        <PharmacyLayout>
            <div className="space-y-6">
                <Head title="Stock Valuation" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Stock Valuation Report" />
                        <p className="text-muted-foreground mt-1">
                            Comprehensive inventory valuation and analysis
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => handleExport('excel')}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export Excel
                        </Button>
                        <Button variant="outline" onClick={() => handleExport('pdf')}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export PDF
                        </Button>
                        <Link href="/pharmacy/stock">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Stock
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Inventory Value</p>
                                    <p className="text-2xl font-bold">{formatCurrency(totalValue)}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Items</p>
                                    <p className="text-2xl font-bold text-blue-600">{totalItems}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Boxes className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Avg. Value per Item</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatCurrency(totalItems > 0 ? totalValue / totalItems : 0)}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Categories</p>
                                    <p className="text-2xl font-bold text-purple-600">{categoryBreakdown.length}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <PieChart className="h-5 w-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Category Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="h-5 w-5" />
                                Valuation by Category
                            </CardTitle>
                            <CardDescription>
                                Inventory value distribution across categories
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {categoryBreakdown.length > 0 ? (
                                    categoryBreakdown.map((item, index) => (
                                        <div key={item.category.id} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        'w-3 h-3 rounded-full',
                                                        categoryColors[index % categoryColors.length]
                                                    )} />
                                                    <span className="font-medium">{item.category.name}</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {item.item_count} items
                                                    </Badge>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{formatCurrency(item.total_value)}</p>
                                                    <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                                                </div>
                                            </div>
                                            <Progress
                                                value={item.percentage}
                                                className="h-2"
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No category data available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Status Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Valuation by Stock Status
                            </CardTitle>
                            <CardDescription>
                                Inventory value by stock status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {statusBreakdown.length > 0 ? (
                                    statusBreakdown.map((item) => (
                                        <div key={item.status} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(item.status)}
                                                    <span className="font-medium">{item.label}</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {item.item_count} items
                                                    </Badge>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium">{formatCurrency(item.total_value)}</p>
                                                    <p className="text-xs text-muted-foreground">{item.percentage.toFixed(1)}%</p>
                                                </div>
                                            </div>
                                            <Progress
                                                value={item.percentage}
                                                className={cn(
                                                    'h-2',
                                                    item.status === 'in_stock' && '[&>div]:bg-green-500',
                                                    item.status === 'low_stock' && '[&>div]:bg-amber-500',
                                                    item.status === 'out_of_stock' && '[&>div]:bg-red-500',
                                                    item.status === 'critical' && '[&>div]:bg-red-600'
                                                )}
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                        <p>No status data available</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Top Valued Items */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Top Valued Items
                        </CardTitle>
                        <CardDescription>
                            Items with the highest inventory value
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50">
                                        <th className="text-left p-3 text-sm font-medium">Medicine</th>
                                        <th className="text-left p-3 text-sm font-medium">Category</th>
                                        <th className="text-center p-3 text-sm font-medium">Stock Qty</th>
                                        <th className="text-right p-3 text-sm font-medium">Unit Price</th>
                                        <th className="text-right p-3 text-sm font-medium">Total Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {topValuedItems.length > 0 ? (
                                        topValuedItems.map((item) => (
                                            <tr key={item.id} className="border-b last:border-0 hover:bg-muted/50">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{item.name}</p>
                                                            <p className="text-xs text-muted-foreground">{item.medicine_id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-3">
                                                    {item.category ? (
                                                        <Badge variant="outline">{item.category.name}</Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className={cn(
                                                        'text-sm',
                                                        item.stock_quantity <= 0 && 'text-destructive',
                                                        item.stock_quantity > 0 && item.stock_quantity <= 10 && 'text-amber-600'
                                                    )}>
                                                        {item.stock_quantity}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right">
                                                    <PriceDisplay amount={item.unit_price} size="sm" />
                                                </td>
                                                <td className="p-3 text-right">
                                                    <PriceDisplay amount={item.total_value} size="sm" variant="total" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                                <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                                <p>No items found</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PharmacyLayout>
    );
}
