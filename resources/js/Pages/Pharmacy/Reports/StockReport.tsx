import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import {
    Package,
    ArrowLeft,
    Download,
    AlertTriangle,
    TrendingDown,
    Search,
    BarChart3,
    Layers,
} from 'lucide-react';
import { useState } from 'react';
import type { Medicine } from '@/types/pharmacy';

interface StockReportProps {
    medicines: {
        data: Medicine[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        stock_status?: string;
        category?: string;
        search?: string;
    };
    summary: {
        totalMedicines: number;
        totalValue: number;
        lowStockCount: number;
        outOfStockCount: number;
        categoryBreakdown: Array<{
            name: string;
            count: number;
            value: number;
        }>;
    };
    categories: Array<{
        id: number;
        name: string;
    }>;
}

const stockStatusColors: Record<string, string> = {
    in_stock: 'bg-green-100 text-green-800',
    low_stock: 'bg-yellow-100 text-yellow-800',
    out_of_stock: 'bg-red-100 text-red-800',
};

const stockStatusLabels: Record<string, string> = {
    in_stock: 'In Stock',
    low_stock: 'Low Stock',
    out_of_stock: 'Out of Stock',
};

export default function StockReport({ medicines, filters, summary, categories }: StockReportProps) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('pharmacy.reports.stock'),
            { ...filters, [key]: value, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearch = () => {
        router.get(
            route('pharmacy.reports.stock'),
            { ...filters, search: searchQuery, page: 1 },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleExport = () => {
        window.open(route('pharmacy.stock.export'), '_blank');
    };

    const handlePageChange = (page: number) => {
        router.get(route('pharmacy.reports.stock'), { ...filters, page }, { preserveState: true });
    };

    const getStockStatus = (medicine: Medicine) => {
        if (medicine.stock_quantity === 0) return 'out_of_stock';
        if (medicine.stock_quantity <= medicine.reorder_level) return 'low_stock';
        return 'in_stock';
    };

    return (
        <PharmacyLayout header="Stock Report">
            <Head title="Stock Report" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/pharmacy/reports">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Reports
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Stock Report</h1>
                        <p className="text-muted-foreground">Inventory status and valuation</p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                                <Package className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Medicines</p>
                                <p className="text-2xl font-bold">{summary.totalMedicines.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-green-100 text-green-600">
                                <Layers className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Total Value</p>
                                <p className="text-2xl font-bold">${summary.totalValue.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
                                <AlertTriangle className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Low Stock</p>
                                <p className="text-2xl font-bold">{summary.lowStockCount.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-red-100 text-red-600">
                                <TrendingDown className="size-6" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Out of Stock</p>
                                <p className="text-2xl font-bold">{summary.outOfStockCount.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Category Breakdown */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Category Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {summary.categoryBreakdown.map((category) => (
                            <div key={category.name} className="p-4 rounded-lg bg-muted">
                                <p className="text-sm text-muted-foreground">{category.name}</p>
                                <p className="text-xl font-bold">{category.count} items</p>
                                <p className="text-xs text-muted-foreground">
                                    ${category.value.toLocaleString()} value
                                </p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Filters */}
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="w-full md:w-64">
                            <label className="text-sm font-medium mb-2 block">Search</label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Search medicines..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                <Button size="icon" variant="outline" onClick={handleSearch}>
                                    <Search className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="w-full md:w-48">
                            <label className="text-sm font-medium mb-2 block">Stock Status</label>
                            <Select
                                value={filters.stock_status || 'all'}
                                onValueChange={(value) => handleFilterChange('stock_status', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="in_stock">In Stock</SelectItem>
                                    <SelectItem value="low_stock">Low Stock</SelectItem>
                                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-full md:w-48">
                            <label className="text-sm font-medium mb-2 block">Category</label>
                            <Select
                                value={filters.category || 'all'}
                                onValueChange={(value) => handleFilterChange('category', value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All Categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Categories</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id.toString()}>
                                            {cat.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stock Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Inventory ({medicines.total})</CardTitle>
                    <CardDescription>Detailed stock information for all medicines</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4 font-medium">Medicine</th>
                                    <th className="text-left py-3 px-4 font-medium">Category</th>
                                    <th className="text-right py-3 px-4 font-medium">Stock</th>
                                    <th className="text-right py-3 px-4 font-medium">Reorder Level</th>
                                    <th className="text-right py-3 px-4 font-medium">Unit Price</th>
                                    <th className="text-right py-3 px-4 font-medium">Value</th>
                                    <th className="text-center py-3 px-4 font-medium">Status</th>
                                    <th className="text-right py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {medicines.data.map((medicine) => {
                                    const status = getStockStatus(medicine);
                                    const stockValue = Number(medicine.stock_quantity) * Number(medicine.unit_price);
                                    return (
                                        <tr key={medicine.id} className="border-b hover:bg-muted/50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{medicine.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {medicine.medicine_id}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm">
                                                {medicine.category?.name || 'N/A'}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className={`font-medium ${
                                                    status === 'out_of_stock' ? 'text-red-600' :
                                                    status === 'low_stock' ? 'text-yellow-600' :
                                                    'text-green-600'
                                                }`}>
                                                    {medicine.stock_quantity}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right text-sm">
                                                {medicine.reorder_level}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                ${Number(medicine.unit_price).toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-right font-medium">
                                                ${Number(stockValue).toFixed(2)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge className={stockStatusColors[status]}>
                                                    {stockStatusLabels[status]}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <Link href={route('pharmacy.medicines.show', medicine.id)}>
                                                    <Button variant="ghost" size="sm">
                                                        View
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {medicines.last_page > 1 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={medicines.current_page === 1}
                                onClick={() => handlePageChange(medicines.current_page - 1)}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {medicines.current_page} of {medicines.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={medicines.current_page === medicines.last_page}
                                onClick={() => handlePageChange(medicines.current_page + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </PharmacyLayout>
    );
}
