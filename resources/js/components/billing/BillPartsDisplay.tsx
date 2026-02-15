/**
 * BillPartsDisplay Component
 *
 * Displays all bill parts with their complete details including
 * part numbers, descriptions, quantities, unit prices, and total costs.
 * Fetches data from the backend API and handles loading/error states.
 */

import * as React from 'react';
import { useApi } from '@/composables/useApi';
import { type BillItem, type BillItemsResponse } from '@/types/bill';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, FileText, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BillPartsDisplayProps {
    className?: string;
    showSummary?: boolean;
}

interface BillSummary {
    totalItems: number;
    totalAmount: number;
    hasDiscounts: boolean;
}

export function BillPartsDisplay({
    className,
    showSummary = true,
}: BillPartsDisplayProps) {
    const { get } = useApi();
    const [items, setItems] = React.useState<BillItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [summary, setSummary] = React.useState<BillSummary>({
        totalItems: 0,
        totalAmount: 0,
        hasDiscounts: false,
    });

    const fetchBillItems = React.useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Use the correct API endpoint for all items
            const response = await get<BillItemsResponse>('/billing/all/items');
            
            if (response.data.success) {
                setItems(response.data.data.items);
                setSummary({
                    totalItems: response.data.data.total_items,
                    totalAmount: response.data.data.total_amount,
                    hasDiscounts: response.data.data.items.some(item => item.has_discount),
                });
            } else {
                setError(response.data.message || 'Failed to fetch bill items');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred while fetching bill items');
        } finally {
            setIsLoading(false);
        }
    }, [get]);

    React.useEffect(() => {
        fetchBillItems();
    }, [fetchBillItems]);

    const formatCurrency = (value: string | number): string => {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'AFN',
        }).format(numValue);
    };

    const getItemTypeBadge = (type: string): React.ReactNode => {
        const typeColors: Record<string, string> = {
            service: 'bg-blue-100 text-blue-800',
            consultation: 'bg-purple-100 text-purple-800',
            procedure: 'bg-orange-100 text-orange-800',
            medication: 'bg-green-100 text-green-800',
            lab_test: 'bg-cyan-100 text-cyan-800',
            room_charge: 'bg-pink-100 text-pink-800',
            equipment: 'bg-gray-100 text-gray-800',
            supply: 'bg-yellow-100 text-yellow-800',
            other: 'bg-slate-100 text-slate-800',
        };

        const colorClass = typeColors[type.toLowerCase()] || typeColors.other;

        return (
            <Badge variant="outline" className={cn('text-xs', colorClass)}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
        );
    };

    const renderLoadingState = (): React.ReactNode => (
        <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading bill items...</p>
        </div>
    );

    const renderErrorState = (): React.ReactNode => (
        <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={fetchBillItems} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
            </Button>
        </div>
    );

    const renderEmptyState = (): React.ReactNode => (
        <div className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No items found for this bill</p>
        </div>
    );

    const renderTable = (): React.ReactNode => (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Type</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-center w-[80px]">Qty</TableHead>
                        <TableHead className="text-right w-[120px]">Unit Price</TableHead>
                        <TableHead className="text-right w-[100px]">Discount</TableHead>
                        <TableHead className="text-right w-[120px]">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{getItemTypeBadge(item.item_type)}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="font-medium">{item.item_description}</span>
                                    {item.category && (
                                        <span className="text-xs text-muted-foreground">
                                            {item.category}
                                        </span>
                                    )}
                                    {item.source && (
                                        <span className="text-xs text-muted-foreground">
                                            Source: {item.source.type}
                                        </span>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">
                                {formatCurrency(item.unit_price)}
                            </TableCell>
                            <TableCell className="text-right">
                                {item.has_discount ? (
                                    <span className="text-green-600">
                                        -{formatCurrency(item.discounted_amount)}
                                    </span>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(item.net_price)}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );

    const renderMobileCards = (): React.ReactNode => (
        <div className="space-y-4 md:hidden">
            {items.map((item) => (
                <Card key={item.id}>
                    <CardContent className="p-4">
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className="flex flex-col gap-1">
                                    {getItemTypeBadge(item.item_type)}
                                    {item.category && (
                                        <span className="text-xs text-muted-foreground">
                                            {item.category}
                                        </span>
                                    )}
                                </div>
                                <span className="font-semibold">
                                    {formatCurrency(item.net_price)}
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium">{item.item_description}</span>
                                {item.source && (
                                    <span className="text-xs text-muted-foreground">
                                        Source: {item.source.type}
                                    </span>
                                )}
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Qty: {item.quantity} × {formatCurrency(item.unit_price)}
                                </span>
                                {item.has_discount && (
                                    <span className="text-green-600">
                                        Discount: -{formatCurrency(item.discounted_amount)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const renderSummary = (): React.ReactNode => {
        if (!showSummary) return null;

        return (
            <Card className="mt-4">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                Total Items: <strong>{summary.totalItems}</strong>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <span className="text-muted-foreground">
                                Total Amount:{' '}
                                <strong className="text-lg">{formatCurrency(summary.totalAmount)}</strong>
                            </span>
                        </div>
                        {summary.hasDiscounts && (
                            <Badge variant="secondary">
                                Discounts Applied
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className={cn('space-y-4', className)}>
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Bill Items</h2>
                <Button
                    onClick={fetchBillItems}
                    variant="ghost"
                    size="sm"
                    disabled={isLoading}
                >
                    <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
                    Refresh
                </Button>
            </div>

            {/* Content */}
            {isLoading && items.length === 0 ? (
                renderLoadingState()
            ) : error && items.length === 0 ? (
                renderErrorState()
            ) : items.length === 0 ? (
                renderEmptyState()
            ) : (
                <>
                    {/* Desktop Table */}
                    <div className="hidden md:block">
                        {renderTable()}
                    </div>

                    {/* Mobile Cards */}
                    {renderMobileCards()}

                    {/* Summary */}
                    {renderSummary()}
                </>
            )}
        </div>
    );
}

export default BillPartsDisplay;
