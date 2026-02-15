import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PriceDisplay, TotalPrice } from './PriceDisplay';
import type { CartItem } from '@/types/pharmacy';
import {
    ShoppingCart,
    Trash2,
    Minus,
    Plus,
    Package,
    AlertCircle,
    Receipt,
    X,
} from 'lucide-react';

export interface CartProps extends React.HTMLAttributes<HTMLDivElement> {
    items: CartItem[];
    onUpdateQuantity: (medicineId: number, quantity: number) => void;
    onRemoveItem: (medicineId: number) => void;
    onClearCart: () => void;
    onCheckout?: () => void;
    discount?: number;
    tax?: number;
    taxRate?: number;
    maxHeight?: string;
    readOnly?: boolean;
    emptyMessage?: string;
}

interface CartSummaryProps {
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    itemCount: number;
}

const CartSummary: React.FC<CartSummaryProps> = ({
    subtotal,
    discount,
    tax,
    total,
    itemCount,
}) => (
    <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal ({itemCount} items)</span>
            <PriceDisplay amount={subtotal} size="sm" />
        </div>
        {discount > 0 && (
            <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-emerald-600">-{formatCurrency(discount)}</span>
            </div>
        )}
        <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <PriceDisplay amount={tax} size="sm" />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <TotalPrice amount={total} size="lg" />
        </div>
    </div>
);

const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'AFN',
    }).format(amount);
};

const Cart = React.forwardRef<HTMLDivElement, CartProps>(
    (
        {
            className,
            items,
            onUpdateQuantity,
            onRemoveItem,
            onClearCart,
            onCheckout,
            discount = 0,
            tax = 0,
            taxRate = 0,
            maxHeight = '400px',
            readOnly = false,
            emptyMessage = 'Your cart is empty',
            ...props
        },
        ref
    ) => {
        // Calculate totals
        const subtotal = items.reduce((sum, item) => {
            const itemDiscount = item.discount || 0;
            const itemTotal = item.quantity * item.unit_price * (1 - itemDiscount / 100);
            return sum + itemTotal;
        }, 0);

        const calculatedTax = tax > 0 ? tax : subtotal * (taxRate / 100);
        const total = subtotal - discount + calculatedTax;
        const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

        // Check if any item exceeds stock
        const stockWarnings = items.filter((item) => item.quantity > item.stock_quantity);

        return (
            <Card ref={ref} className={cn('w-full', className)} {...props}>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ShoppingCart className="size-5" />
                            Cart
                            {itemCount > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {itemCount}
                                </Badge>
                            )}
                        </CardTitle>
                        {items.length > 0 && !readOnly && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClearCart}
                                className="text-destructive hover:text-destructive"
                            >
                                <Trash2 className="size-4 mr-1" />
                                Clear
                            </Button>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <ShoppingCart className="size-12 text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground">{emptyMessage}</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                                Add medicines to get started
                            </p>
                        </div>
                    ) : (
                        <>
                            {stockWarnings.length > 0 && (
                                <div className="mx-6 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                    <div className="flex items-start gap-2">
                                        <AlertCircle className="size-4 text-amber-600 mt-0.5" />
                                        <div className="text-sm text-amber-800">
                                            <p className="font-medium">Stock Warning</p>
                                            <p className="text-amber-700/80">
                                                Some items exceed available stock.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={cn('px-6 overflow-y-auto', maxHeight && `max-h-[${maxHeight}]`)}>
                                <div className="space-y-4 pr-4">
                                    {items.map((item) => (
                                        <CartItemRow
                                            key={item.medicine_id}
                                            item={item}
                                            onUpdateQuantity={onUpdateQuantity}
                                            onRemove={onRemoveItem}
                                            readOnly={readOnly}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>

                {items.length > 0 && (
                    <>
                        <Separator className="my-4" />
                        <CardFooter className="flex flex-col gap-4 pt-0">
                            <CartSummary
                                subtotal={subtotal}
                                discount={discount}
                                tax={calculatedTax}
                                total={total}
                                itemCount={itemCount}
                            />
                            {!readOnly && onCheckout && (
                                <Button
                                    className="w-full"
                                    size="lg"
                                    onClick={onCheckout}
                                    disabled={stockWarnings.length > 0}
                                >
                                    <Receipt className="size-4 mr-2" />
                                    Checkout
                                </Button>
                            )}
                        </CardFooter>
                    </>
                )}
            </Card>
        );
    }
);

Cart.displayName = 'Cart';

// Individual cart item row component
interface CartItemRowProps {
    item: CartItem;
    onUpdateQuantity: (medicineId: number, quantity: number) => void;
    onRemove: (medicineId: number) => void;
    readOnly?: boolean;
}

const CartItemRow: React.FC<CartItemRowProps> = ({
    item,
    onUpdateQuantity,
    onRemove,
    readOnly = false,
}) => {
    const isOverStock = item.quantity > item.stock_quantity;
    const itemTotal = item.quantity * item.unit_price * (1 - (item.discount || 0) / 100);

    return (
        <div className={cn(
            'flex items-start gap-3 p-3 rounded-lg border',
            isOverStock ? 'bg-amber-50 border-amber-200' : 'bg-card'
        )}>
            <div className="flex items-center justify-center size-10 rounded-md bg-muted shrink-0">
                <Package className="size-5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                            {item.dosage_form} {item.strength}
                        </p>
                    </div>
                    {!readOnly && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="size-6 p-0 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={() => onRemove(item.medicine_id)}
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center justify-between mt-2">
                    {!readOnly ? (
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="size-7 p-0"
                                onClick={() => onUpdateQuantity(item.medicine_id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                            >
                                <Minus className="size-3" />
                            </Button>
                            <Input
                                type="number"
                                min={1}
                                max={item.stock_quantity}
                                value={item.quantity}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value) || 1;
                                    onUpdateQuantity(item.medicine_id, Math.max(1, val));
                                }}
                                className="w-14 h-7 text-center px-1"
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                className="size-7 p-0"
                                onClick={() => onUpdateQuantity(item.medicine_id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock_quantity}
                            >
                                <Plus className="size-3" />
                            </Button>
                        </div>
                    ) : (
                        <span className="text-sm text-muted-foreground">
                            Qty: {item.quantity}
                        </span>
                    )}

                    <div className="text-right">
                        <PriceDisplay amount={itemTotal} size="sm" />
                        {item.discount && item.discount > 0 && (
                            <p className="text-xs text-emerald-600">
                                {item.discount}% off
                            </p>
                        )}
                    </div>
                </div>

                {isOverStock && (
                    <p className="text-xs text-amber-600 mt-1">
                        Only {item.stock_quantity} available in stock
                    </p>
                )}
            </div>
        </div>
    );
};

export { Cart, CartSummary };
export type { CartSummaryProps };
