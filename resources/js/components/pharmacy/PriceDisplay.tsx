import * as React from 'react';
import { cn } from '@/lib/utils';
import {
    DollarSign,
    Tag,
    Receipt,
    type LucideIcon,
} from 'lucide-react';

export type PriceSize = 'sm' | 'md' | 'lg' | 'xl';
export type PriceVariant = 'default' | 'discounted' | 'total' | 'subtotal';

export interface PriceDisplayProps extends React.HTMLAttributes<HTMLSpanElement> {
    amount: number | null | undefined;
    currency?: string;
    size?: PriceSize;
    variant?: PriceVariant;
    showIcon?: boolean;
    showDecimal?: boolean;
    strikethrough?: boolean;
    originalAmount?: number;
}

const sizeConfig: Record<PriceSize, { text: string; icon: string }> = {
    sm: { text: 'text-sm', icon: 'size-3' },
    md: { text: 'text-base', icon: 'size-4' },
    lg: { text: 'text-lg', icon: 'size-5' },
    xl: { text: 'text-2xl', icon: 'size-6' },
};

const variantConfig: Record<PriceVariant, { icon: LucideIcon; className: string }> = {
    default: {
        icon: DollarSign,
        className: 'text-foreground',
    },
    discounted: {
        icon: Tag,
        className: 'text-emerald-600 font-medium',
    },
    total: {
        icon: Receipt,
        className: 'text-foreground font-bold',
    },
    subtotal: {
        icon: DollarSign,
        className: 'text-muted-foreground',
    },
};

const formatAmount = (amount: number | null | undefined, currency: string, showDecimal: boolean): string => {
    if (amount === null || amount === undefined || isNaN(amount)) {
        return '$0.00';
    }
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: showDecimal ? 2 : 0,
        maximumFractionDigits: showDecimal ? 2 : 0,
    });
    return formatter.format(amount);
};

const PriceDisplay = React.forwardRef<HTMLSpanElement, PriceDisplayProps>(
    (
        {
            amount,
            currency = 'USD',
            size = 'md',
            variant = 'default',
            showIcon = false,
            showDecimal = true,
            strikethrough = false,
            originalAmount,
            className,
            ...props
        },
        ref
    ) => {
        const config = variantConfig[variant];
        const Icon = config.icon;
        const sizeClasses = sizeConfig[size];

        return (
            <span
                ref={ref}
                className={cn(
                    'inline-flex items-center gap-1',
                    sizeClasses.text,
                    config.className,
                    className
                )}
                {...props}
            >
                {showIcon && <Icon className={sizeClasses.icon} />}
                <span className={cn(strikethrough && 'line-through opacity-50')}>
                    {formatAmount(amount, currency, showDecimal)}
                </span>
                {originalAmount !== undefined && originalAmount > (amount || 0) && (
                    <span className="ml-2 text-muted-foreground line-through text-sm">
                        {formatAmount(originalAmount, currency, showDecimal)}
                    </span>
                )}
            </span>
        );
    }
);

PriceDisplay.displayName = 'PriceDisplay';

// Convenience components for common use cases
export const DiscountedPrice: React.FC<Omit<PriceDisplayProps, 'variant'>> = (props) => (
    <PriceDisplay {...props} variant="discounted" />
);

export const TotalPrice: React.FC<Omit<PriceDisplayProps, 'variant'>> = (props) => (
    <PriceDisplay {...props} variant="total" showIcon />
);

export const SubtotalPrice: React.FC<Omit<PriceDisplayProps, 'variant'>> = (props) => (
    <PriceDisplay {...props} variant="subtotal" />
);

export { PriceDisplay };
