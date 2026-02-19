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
import Heading from '@/components/heading';
import {
    ArrowLeft,
    ArrowUpDown,
    Package,
    RotateCcw,
    TrendingUp,
    TrendingDown,
    FileDown,
    User,
    Calendar,
    Search,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import PharmacyLayout from '@/layouts/PharmacyLayout';
import type { Medicine } from '@/types/pharmacy';

// Helper function to decode HTML entities safely
const decodeHtmlEntity = (html: string): string => {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
};

interface StockMovement {
    id: number;
    medicine_id: number;
    type: 'in' | 'out' | 'adjustment' | 'return';
    quantity: number;
    previous_stock: number;
    new_stock: number;
    reference_type: 'purchase' | 'sale' | 'adjustment' | 'return' | 'expired';
    reference_id: number | null;
    notes: string | null;
    user_id: number;
    created_at: string;
    medicine: Medicine;
    user: {
        id: number;
        name: string;
    };
}

interface MovementsProps {
    movements: {
        data: StockMovement[];
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
    medicines: Medicine[];
    filters?: {
        query?: string;
        medicine_id?: string;
        type?: string;
        date_from?: string;
        date_to?: string;
    };
}

export default function Movements({ movements, medicines, filters = {} }: MovementsProps) {
    const [localFilters, setLocalFilters] = useState<FilterState>({
        query: filters.query || '',
        medicine_id: filters.medicine_id || '',
        type: filters.type || '',
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
    });

    // Medicine options for filter
    const medicineOptions = useMemo(() =>
        medicines.map(m => ({
            label: m.name,
            value: m.id.toString(),
        })),
        [medicines]
    );

    // Filter configurations
    const filterConfigs: FilterConfig[] = useMemo(() => [
        {
            id: 'medicine_id',
            label: 'Medicine',
            type: 'select',
            options: medicineOptions,
        },
        {
            id: 'type',
            label: 'Movement Type',
            type: 'select',
            options: [
                { label: 'In', value: 'in' },
                { label: 'Out', value: 'out' },
                { label: 'Adjustment', value: 'adjustment' },
                { label: 'Return', value: 'return' },
            ],
        },
        {
            id: 'date_range',
            label: 'Date Range',
            type: 'date-range',
        },
    ], [medicineOptions]);

    const handleFilterChange = (newFilters: FilterState) => {
        setLocalFilters(newFilters);

        const params: Record<string, string> = {};
        if (newFilters.query) params.query = newFilters.query as string;
        if (newFilters.medicine_id && newFilters.medicine_id !== 'all') params.medicine_id = newFilters.medicine_id as string;
        if (newFilters.type && newFilters.type !== 'all') params.type = newFilters.type as string;
        if (newFilters.date_from) params.date_from = newFilters.date_from as string;
        if (newFilters.date_to) params.date_to = newFilters.date_to as string;

        router.get('/pharmacy/stock/movements', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        setLocalFilters({});
        router.get('/pharmacy/stock/movements', {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleExport = () => {
        const params = new URLSearchParams();
        if (localFilters.query) params.append('query', localFilters.query as string);
        if (localFilters.medicine_id) params.append('medicine_id', localFilters.medicine_id as string);
        if (localFilters.type) params.append('type', localFilters.type as string);
        if (localFilters.date_from) params.append('date_from', localFilters.date_from as string);
        if (localFilters.date_to) params.append('date_to', localFilters.date_to as string);

        window.location.href = `/pharmacy/stock/movements/export?${params.toString()}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getMovementTypeBadge = (type: string) => {
        switch (type) {
            case 'in':
                return (
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/30">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        In
                    </Badge>
                );
            case 'out':
                return (
                    <Badge className="bg-red-500/10 text-red-600 border-red-500/30">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        Out
                    </Badge>
                );
            case 'adjustment':
                return (
                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Adjustment
                    </Badge>
                );
            case 'return':
                return (
                    <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                        <ArrowUpDown className="h-3 w-3 mr-1" />
                        Return
                    </Badge>
                );
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    const getReferenceTypeBadge = (type: string) => {
        switch (type) {
            case 'purchase':
                return <Badge variant="outline" className="text-green-600">Purchase</Badge>;
            case 'sale':
                return <Badge variant="outline" className="text-blue-600">Sale</Badge>;
            case 'adjustment':
                return <Badge variant="outline" className="text-purple-600">Adjustment</Badge>;
            case 'return':
                return <Badge variant="outline" className="text-amber-600">Return</Badge>;
            case 'expired':
                return <Badge variant="outline" className="text-red-600">Expired</Badge>;
            default:
                return <Badge variant="outline">{type}</Badge>;
        }
    };

    return (
        <PharmacyLayout>
            <div className="space-y-6">
                <Head title="Stock Movements" />

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <Heading title="Stock Movements" />
                        <p className="text-muted-foreground mt-1">
                            Track all stock movements and transactions
                        </p>
                    </div>

                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleExport}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Link href="/pharmacy/stock">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Stock
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filter Bar */}
                <FilterBar
                    filters={filterConfigs}
                    value={localFilters}
                    onChange={handleFilterChange}
                    onReset={handleReset}
                    searchPlaceholder="Search by notes or reference..."
                    showFilterChips={true}
                />

                {/* Movements Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Movement History</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Showing {movements.data?.length || 0} of {movements.meta?.total || 0} movements
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Medicine</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-center">Quantity</TableHead>
                                        <TableHead className="text-center">Stock Change</TableHead>
                                        <TableHead>Reference</TableHead>
                                        <TableHead>User</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {movements.data.length > 0 ? (
                                        movements.data.map((movement) => (
                                            <TableRow key={movement.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{formatDate(movement.created_at)}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                            <Package className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{movement.medicine.name}</p>
                                                            <p className="text-xs text-muted-foreground">{movement.medicine.medicine_id}</p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getMovementTypeBadge(movement.type)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={cn(
                                                        'font-medium',
                                                        movement.type === 'in' ? 'text-green-600' :
                                                        movement.type === 'out' ? 'text-red-600' :
                                                        'text-blue-600'
                                                    )}>
                                                        {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}
                                                        {movement.quantity}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className="text-sm text-muted-foreground">
                                                        {movement.previous_stock} → {movement.new_stock}
                                                    </span>
                                                    {movement.new_stock > movement.previous_stock ? (
                                                        <TrendingUp className="inline h-3 w-3 ml-1 text-green-600" />
                                                    ) : movement.new_stock < movement.previous_stock ? (
                                                        <TrendingDown className="inline h-3 w-3 ml-1 text-red-600" />
                                                    ) : null}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        {getReferenceTypeBadge(movement.reference_type)}
                                                        {movement.reference_id && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Ref: #{movement.reference_id}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{movement.user.name}</span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                    <Search className="h-8 w-8 mb-2 opacity-50" />
                                                    <p>No movements found</p>
                                                    {(localFilters.query || localFilters.medicine_id || localFilters.type) && (
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
                        {(movements.meta?.last_page || 0) > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <p className="text-sm text-muted-foreground">
                                    Showing {movements.meta?.from || 0} to {movements.meta?.to || 0} of {movements.meta?.total || 0} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={movements.links.prev || '#'}
                                        className={cn(
                                            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                                            'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                                            !movements.links.prev && 'pointer-events-none opacity-50'
                                        )}
                                    >
                                        Previous
                                    </Link>
                                    <div className="flex items-center gap-1">
                                        {movements.meta.links
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
                                                    dangerouslySetInnerHTML={{ __html: decodeHtmlEntity(link.label) }}
                                                />
                                            ))}
                                    </div>
                                    <Link
                                        href={movements.links.next || '#'}
                                        className={cn(
                                            'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
                                            'h-9 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                                            !movements.links.next && 'pointer-events-none opacity-50'
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
