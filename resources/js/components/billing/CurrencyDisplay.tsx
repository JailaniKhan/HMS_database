/**
 * CurrencyDisplay Component
 * 
 * Formats and displays currency amounts with consistent styling.
 * Supports different formats, locales, and visual variations.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

// Currency code type
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'AFN' | string;

interface CurrencyDisplayProps {
  /** The amount to display */
  amount: number | string | null | undefined;
  /** Currency code (default: USD) */
  currency?: CurrencyCode;
  /** Locale for formatting (default: en-US) */
  locale?: string;
  /** Number of decimal places (default: 2) */
  decimals?: number;
  /** Visual size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Font weight variant */
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  /** Color variant */
  color?: 'default' | 'muted' | 'success' | 'danger' | 'warning' | 'primary';
  /** Whether to show the currency symbol */
  showSymbol?: boolean;
  /** Whether to show + sign for positive numbers */
  showPositiveSign?: boolean;
  /** Whether to show zero values or display a placeholder */
  hideZero?: boolean;
  /** Placeholder to show when amount is null/undefined/zero (if hideZero is true) */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether to use parentheses for negative values instead of minus sign */
  useParentheses?: boolean;
  /** Optional prefix (e.g., for labels like "Balance: $") */
  prefix?: string;
  /** Optional suffix */
  suffix?: string;
  /** Whether to align the text to the right (useful for tables) */
  align?: 'left' | 'right' | 'center';
}

/**
 * Default currency configurations
 */
const CURRENCY_CONFIGS: Record<string, { locale: string; currency: CurrencyCode }> = {
  USD: { locale: 'en-US', currency: 'USD' },
  EUR: { locale: 'de-DE', currency: 'EUR' },
  GBP: { locale: 'en-GB', currency: 'GBP' },
  AFN: { locale: 'fa-AF', currency: 'AFN' },
};

/**
 * Format a number as currency
 */
export function formatCurrency(
  amount: number,
  options: {
    currency?: CurrencyCode;
    locale?: string;
    decimals?: number;
    showSymbol?: boolean;
    useParentheses?: boolean;
  } = {}
): string {
  const {
    currency = 'USD',
    locale = 'en-US',
    decimals = 2,
    showSymbol = true,
    useParentheses = false,
  } = options;

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatter = new Intl.NumberFormat(locale, {
    style: showSymbol ? 'currency' : 'decimal',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  const formatted = formatter.format(absAmount);

  if (isNegative) {
    return useParentheses ? `(${formatted})` : `-${formatted}`;
  }

  return formatted;
}

/**
 * Format a number as a compact currency (e.g., $1.2K, $1.5M)
 */
export function formatCompactCurrency(
  amount: number,
  currency: CurrencyCode = 'USD',
  locale: string = 'en-US'
): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  return formatter.format(amount);
}

/**
 * CurrencyDisplay Component
 * 
 * Displays formatted currency amounts with consistent styling.
 */
export function CurrencyDisplay({
  amount,
  currency = 'USD',
  locale = 'en-US',
  decimals = 2,
  size = 'md',
  weight = 'normal',
  color = 'default',
  showSymbol = true,
  showPositiveSign = false,
  hideZero = false,
  placeholder = '-',
  className,
  useParentheses = false,
  prefix,
  suffix,
  align = 'left',
}: CurrencyDisplayProps) {
  // Parse amount
  const numericAmount = React.useMemo((): number => {
    if (amount === null || amount === undefined) return NaN;
    const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(parsed) ? NaN : parsed;
  }, [amount]);

  // Check if should show placeholder
  const showPlaceholder = React.useMemo((): boolean => {
    if (isNaN(numericAmount)) return true;
    if (hideZero && numericAmount === 0) return true;
    return false;
  }, [numericAmount, hideZero]);

  // Format the currency
  const formattedValue = React.useMemo((): string => {
    if (showPlaceholder) return placeholder;

    const isNegative = numericAmount < 0;
    const absAmount = Math.abs(numericAmount);

    const formatter = new Intl.NumberFormat(locale, {
      style: showSymbol ? 'currency' : 'decimal',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });

    const formatted = formatter.format(absAmount);

    if (isNegative) {
      return useParentheses ? `(${formatted})` : `-${formatted}`;
    }

    if (showPositiveSign && numericAmount > 0) {
      return `+${formatted}`;
    }

    return formatted;
  }, [
    numericAmount,
    currency,
    locale,
    decimals,
    showSymbol,
    showPositiveSign,
    useParentheses,
    showPlaceholder,
    placeholder,
  ]);

  // Size classes
  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  // Weight classes
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  };

  // Color classes
  const colorClasses = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    success: 'text-green-600',
    danger: 'text-red-600',
    warning: 'text-yellow-600',
    primary: 'text-primary',
  };

  // Alignment classes
  const alignClasses = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  };

  // Determine color based on amount (if color is not explicitly set)
  const effectiveColor = React.useMemo((): typeof color => {
    if (color !== 'default') return color;
    if (numericAmount < 0) return 'danger';
    if (numericAmount > 0) return 'success';
    return 'default';
  }, [color, numericAmount]);

  return (
    <span
      className={cn(
        'inline-block tabular-nums',
        sizeClasses[size],
        weightClasses[weight],
        colorClasses[effectiveColor],
        alignClasses[align],
        className
      )}
      title={showPlaceholder ? undefined : `${numericAmount.toFixed(decimals)} ${currency}`}
    >
      {prefix && <span className="mr-1">{prefix}</span>}
      {formattedValue}
      {suffix && <span className="ml-1">{suffix}</span>}
    </span>
  );
}

/**
 * CurrencyInputDisplay - For displaying currency in input-like format
 */
export function CurrencyInputDisplay({
  amount,
  currency = 'USD',
  className,
  ...props
}: Omit<CurrencyDisplayProps, 'size' | 'weight'>) {
  return (
    <div
      className={cn(
        'inline-flex items-center px-3 py-2 border rounded-md bg-muted/50',
        className
      )}
    >
      <span className="text-muted-foreground mr-2">
        {currency === 'USD' ? '$' : currency}
      </span>
      <CurrencyDisplay
        amount={amount}
        currency={currency}
        showSymbol={false}
        size="md"
        weight="medium"
        {...props}
      />
    </div>
  );
}

/**
 * CompactCurrencyDisplay - For compact number display (K, M, B)
 */
export function CompactCurrencyDisplay({
  amount,
  currency = 'USD',
  locale = 'en-US',
  className,
  ...props
}: Omit<CurrencyDisplayProps, 'decimals'>) {
  const numericAmount = React.useMemo((): number => {
    if (amount === null || amount === undefined) return NaN;
    const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(parsed) ? NaN : parsed;
  }, [amount]);

  const formatted = React.useMemo((): string => {
    if (isNaN(numericAmount)) return '-';

    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      notation: 'compact',
      maximumFractionDigits: 1,
    });

    return formatter.format(numericAmount);
  }, [numericAmount, currency, locale]);

  return (
    <span className={cn('tabular-nums', className)} {...props}>
      {formatted}
    </span>
  );
}

/**
 * BalanceDisplay - Specialized component for showing balance
 */
export function BalanceDisplay({
  amount,
  label = 'Balance',
  showZeroAsPaid = true,
  className,
  ...props
}: CurrencyDisplayProps & { label?: string; showZeroAsPaid?: boolean }) {
  const numericAmount = React.useMemo((): number => {
    if (amount === null || amount === undefined) return NaN;
    const parsed = typeof amount === 'string' ? parseFloat(amount) : amount;
    return isNaN(parsed) ? NaN : parsed;
  }, [amount]);

  const isPaid = numericAmount === 0;

  if (showZeroAsPaid && isPaid) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        {label && <span className="text-muted-foreground text-sm">{label}:</span>}
        <span className="text-green-600 font-medium">Paid</span>
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && <span className="text-muted-foreground text-sm">{label}:</span>}
      <CurrencyDisplay
        amount={amount}
        color={numericAmount > 0 ? 'danger' : 'default'}
        weight="semibold"
        {...props}
      />
    </div>
  );
}

export default CurrencyDisplay;
