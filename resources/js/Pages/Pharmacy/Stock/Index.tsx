import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FilterBar, type FilterConfig, type FilterState } from '@/components/pharmacy/FilterBar';
import { StockBadge } from '@/components/pharmacy/StockBadge';
import Heading from '@/components/heading';
import {
    Package,
    AlertCircle,
    Search,
    FileDown,
    Eye,
    SlidersHorizontal,
    ArrowUpDown,
    TrendingUp,
    TrendingDown,
    Boxes,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import type { Medicine, MedicineCategory } from '@/types/pharmacy';

interface StockItem extends Medicine {
    category?: MedicineCategory;
}

interface StockIndexProps {
    medicines: {
        data: StockItem[];
        links: {
            first: string;
            last: string;
            prev: string | null;
            next: string | null;
        };
        meta: {
            current_page: number;
            from: number;
            last_page: number;
            links: {
                url: string | null;
                label: string;
                active: boolean;
            }[];
            path: string;
            per_page: number;
            to: number;
            total: number;
        };
    };
    categories: MedicineCategory[];
    stats: {
        total_items: number;
        in_stock: number;
        low_stock: number;
        out_of_stock: number;
        critical_stock: number;
        total_value: number;
    };
    filters?: {
        query?: string;
        category_id?: string;
        stock_status?: string;
    };
}

export default function StockIndex({ medicines, categories, stats, filters = {} }: StockIndexProps) {
    const [localFilters, setLocalFilters] = useState<FilterState>({
        query: filters.query || '',
        category_id: filters.category_id || '',
        stock_status: filters.stock_status || '',
    });

    // Category options for filter
    const categoryOptions = useMemo(() =>
        categories.map(cat => ({
            label: cat.name,
            value: cat.id.toString(),
        })),
        [categories]
    );

    // Filter configurations
    const filterConfigs: FilterConfig[] = useMemo(() => [
        {
            id: 'category_id',
            label: 'Category',
            type: 'select',
            options: categoryOptions,
        },
        {
            id: 'stock_status',
            label: 'Stock Status',
            type: 'select',
            options: [
                { label: 'In Stock', value: 'in_stock' },
                { label: 'Low Stock', value: 'low_stock' },
                { label: 'Out of Stock', value: 'out_of_stock' },
                { label: 'Critical', value: 'critical' },
            ],
        },
    ], [categoryOptions]);

    const handleFilterChange = (newFilters: FilterState) => {
        setLocalFilters(newFilters);

        const params: Record<string, string> = {};
        if (newFilters.query) params.query = newFilters.query as string;
        if (newFilters.category_id && newFilters.category_id !== 'all') params.category_id = newFilters.category_id as string;
        if (newFilters.stock_status && newFilters.stock_status !== 'all') params.stock_status = newFilters.stock_status as string;

        router.get('/pharmacy/stock', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setLocalFilters({});
        router.get('/pharmacy/stock', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (localFilters.query) params.append('query', localFilters.query as string);
        if (localFilters.category_id) params.append('category_id', localFilters.category_id as string);
        if (localFilters.stock_status) params.append('stock_status', localFilters.stock_status as string);

        window.location.href = `/pharmacy/stock/export?${params.toString()}`;
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    // Determine stock status
    const getStockStatus = (medicine: StockItem): import('@/components/pharmacy').StockStatus => {
        if (medicine.stock_quantity <= 0) return 'out-of-stock';
        if (medicine.stock_quantity <= medicine.reorder_level * 0.5) return 'critical';
        if (medicine.stock_quantity <= medicine.reorder_level) return 'low-stock';
        return 'in-stock';
    };

    return (
        <PharmacyLayout>
            <div className="space-y-6">
                <Head title="Stock Management" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Stock Management" />
                        <p className="text-muted-foreground mt-1">
                            Monitor inventory levels, track stock movements, and manage adjustments
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Link href="/pharmacy/stock/adjustments">
                            <Button variant="outline">
                                <SlidersHorizontal className="mr-2 h-4 w-4" />
                                Adjustments
                            </Button>
                        </Link>
                        <Link href="/pharmacy/stock/movements">
                            <Button variant="outline">
                                <ArrowUpDown className="mr-2 h-4 w-4" />
                                Movements
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Items</p>
                                    <p className="text-2xl font-bold">{stats.total_items}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <Boxes className="h-5 w-5 text-primary" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">In Stock</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.in_stock}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Package className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Low Stock</p>
                                    <p className="text-2xl font-bold text-amber-600">{stats.low_stock}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <TrendingDown className="h-5 w-5 text-amber-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Out of Stock</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.out_of_stock}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">Total Value</p>
                                    <p className="text-2xl font-bold text-purple-600">{formatCurrency(stats.total_value)}</p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filter Bar */}
                <FilterBar
                    filters={filterConfigs}
                    value={localFilters}
                    onChange={handleFilterChange}
                    onReset={handleReset}
                    searchPlaceholder="Search by medicine name, code, or manufacturer..."
                    showFilterChips={true}
                />

                {/* Stock Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Stock Overview</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Showing {medicines.data?.length || 0} of {medicines.meta?.total || 0} items
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-center">Current Stock</TableHead>
                                        <TableHead className="text-center">Min Level</TableHead>
                                        <TableHead className="text-center">Reorder Point</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {medicines.data.length > 0 ? (
                                        medicines.data.map((medicine) => {
                                            const stockStatus = getStockStatus(medicine);
                                            return (
                                                <TableRow key={medicine.id}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <Package className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium">{medicine.name}</p>
                                                                <p className="text-xs text-muted-foreground">{medicine.medicine_id}</p>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {medicine.category ? (
                                                            <Badge variant="outline">{medicine.category.name}</Badge>
                                                        ) : (
                                                            <span className="text-muted-foreground">-</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={cn(
                                                            'font-medium',
                                                            medicine.stock_quantity <= 0 && 'text-destructive',
                                                            medicine.stock_quantity > 0 && medicine.stock_quantity <= medicine.reorder_level && 'text-amber-600'
                                                        )}>
                                                            {medicine.stock_quantity}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-muted-foreground">
                                                            {medicine.reorder_level || '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <span className="text-muted-foreground">
                                                            {medicine.reorder_level ? Math.ceil(medicine.reorder_level * 1.5) : '-'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <StockBadge status={stockStatus} />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Link href={`/pharmacy/medicines/${medicine.id}`}>
                                                                <Button variant="ghost" size="sm">
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                            <Link href={`/pharmacy/stock/adjustments?medicine_id=${medicine.id}`}>
                                                                <Button variant="ghost" size="sm">
                                                                    <SlidersHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <Search className="h-8 w-8 mb-2 opacity-50" />
                                                    <p>No stock items found</p>
                                                    {(localFilters.query || localFilters.category_id || localFilters.stock_status) && (
                                                        <Button variant="link" onClick={handleReset} className="mt-2">
                                                            Clear filters
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        {(medicines.meta?.last_page || 0) > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <p className="text-sm text-muted-foreground">
                                    Showing {medicines.meta?.from || 0} to {medicines.meta?.to || 0} of {medicines.meta?.total || 0} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={medicines.links.prev || '#'}
                                        className={cn(
                                            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                                            'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                                            !medicines.links.prev && 'pointer-events-none opacity-50'
                                        )}
                                    >
                                        Previous
                                    </Link>
                                    <div className="flex items-center gap-1">
                                        {medicines.meta.links
                                            .filter(link => !link.label.includes('Previous') && !link.label.includes('Next'))
                                            .map((link, index) => (
                                                <Link
                                                    key={index}
                                                    href={link.url || '#'}
                                                    className={cn(
                                                        'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 w-9',
                                                        link.active
                                                            ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                                            : 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                                                        !link.url && 'pointer-events-none opacity-50'
                                                    )}
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            ))}
                                    </div>
                                    <Link
                                        href={medicines.links.next || '#'}
                                        className={cn(
                                            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                                            'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                                            !medicines.links.next && 'pointer-events-none opacity-50'
                                        )}
                                    >
                                        Next
                                    </Link>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PharmacyLayout>
    );
}
