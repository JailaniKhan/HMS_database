/**
 * PaymentMethodIcon Component
 * 
 * Displays payment method with an appropriate icon and label.
 * Supports all payment methods defined in the PaymentMethod enum.
 */

import * as React from 'react';
import { cn } from '@/lib/utils';
import { PaymentMethod } from '@/types/billing';

// Import Lucide icons
import {
  Banknote,
  CreditCard,
  Landmark,
  FileText,
  Shield,
  Globe,
  Smartphone,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

interface PaymentMethodIconProps {
  /** The payment method to display */
  method: PaymentMethod | string;
  /** Size of the icon */
  iconSize?: number;
  /** Whether to show the label text */
  showLabel?: boolean;
  /** Size variant for the entire component */
  size?: 'sm' | 'md' | 'lg';
  /** Visual variant */
  variant?: 'default' | 'outlined' | 'filled' | 'ghost';
  /** Additional CSS classes */
  className?: string;
  /** Custom label to override default */
  customLabel?: string;
  /** Whether to show the icon */
  showIcon?: boolean;
  /** Alignment of icon and label */
  align?: 'left' | 'right';
  /** Click handler */
  onClick?: () => void;
  /** Whether the component is disabled */
  disabled?: boolean;
}

/**
 * Payment method configuration with icons and labels
 */
const PAYMENT_METHOD_CONFIG: Record<
  PaymentMethod,
  {
    icon: LucideIcon;
    label: string;
    color: string;
    bgColor: string;
  }
> = {
  [PaymentMethod.CASH]: {
    icon: Banknote,
    label: 'Cash',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  [PaymentMethod.CREDIT_CARD]: {
    icon: CreditCard,
    label: 'Credit Card',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  [PaymentMethod.DEBIT_CARD]: {
    icon: CreditCard,
    label: 'Debit Card',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
  },
  [PaymentMethod.CHECK]: {
    icon: FileText,
    label: 'Check',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  [PaymentMethod.BANK_TRANSFER]: {
    icon: Landmark,
    label: 'Bank Transfer',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  [PaymentMethod.INSURANCE]: {
    icon: Shield,
    label: 'Insurance',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  [PaymentMethod.ONLINE]: {
    icon: Globe,
    label: 'Online Payment',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
  },
  [PaymentMethod.MOBILE_PAYMENT]: {
    icon: Smartphone,
    label: 'Mobile Payment',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
  },
};

/**
 * Get payment method configuration
 */
function getPaymentMethodConfig(
  method: PaymentMethod | string
): (typeof PAYMENT_METHOD_CONFIG)[PaymentMethod] {
  const config = PAYMENT_METHOD_CONFIG[method as PaymentMethod];
  if (config) {
    return config;
  }

  // Fallback for unknown methods
  return {
    icon: Wallet,
    label: method
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' '),
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  };
}

/**
 * PaymentMethodIcon Component
 * 
 * Displays a payment method with its associated icon and label.
 */
export function PaymentMethodIcon({
  method,
  iconSize = 16,
  showLabel = true,
  size = 'md',
  variant = 'default',
  className,
  customLabel,
  showIcon = true,
  align = 'left',
  onClick,
  disabled = false,
}: PaymentMethodIconProps) {
  const config = getPaymentMethodConfig(method);
  const Icon = config.icon;
  const label = customLabel || config.label;

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'gap-1.5',
      icon: iconSize > 0 ? iconSize : 14,
      label: 'text-xs',
      padding: variant === 'filled' || variant === 'outlined' ? 'px-2 py-1' : '',
    },
    md: {
      container: 'gap-2',
      icon: iconSize > 0 ? iconSize : 18,
      label: 'text-sm',
      padding: variant === 'filled' || variant === 'outlined' ? 'px-3 py-1.5' : '',
    },
    lg: {
      container: 'gap-2.5',
      icon: iconSize > 0 ? iconSize : 22,
      label: 'text-base',
      padding: variant === 'filled' || variant === 'outlined' ? 'px-4 py-2' : '',
    },
  };

  const currentSize = sizeConfig[size];

  // Variant styles
  const variantStyles = {
    default: '',
    outlined: `border rounded-md ${config.color} border-current`,
    filled: `rounded-md ${config.color} ${config.bgColor}`,
    ghost: `rounded-md hover:bg-muted ${config.color}`,
  };

  const content = (
    <>
      {showIcon && (
        <Icon
          size={currentSize.icon}
          className={cn('shrink-0', config.color)}
          aria-hidden="true"
        />
      )}
      {showLabel && (
        <span className={cn('font-medium', currentSize.label)}>{label}</span>
      )}
    </>
  );

  const containerClasses = cn(
    'inline-flex items-center',
    currentSize.container,
    currentSize.padding,
    variantStyles[variant],
    onClick && !disabled && 'cursor-pointer',
    disabled && 'opacity-50 cursor-not-allowed',
    align === 'right' && 'flex-row-reverse',
    className
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={containerClasses}
        aria-label={`Payment method: ${label}`}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={containerClasses} aria-label={`Payment method: ${label}`}>
      {content}
    </span>
  );
}

/**
 * PaymentMethodBadge - Compact badge-style display
 */
export function PaymentMethodBadge({
  method,
  className,
  ...props
}: Omit<PaymentMethodIconProps, 'variant' | 'size' | 'showLabel'>) {
  return (
    <PaymentMethodIcon
      method={method}
      variant="filled"
      size="sm"
      showLabel={true}
      className={cn('rounded-full', className)}
      {...props}
    />
  );
}

/**
 * PaymentMethodSelect - Display method in a selectable format
 */
export function PaymentMethodSelect({
  method,
  isSelected = false,
  onClick,
  className,
}: {
  method: PaymentMethod;
  isSelected?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const config = getPaymentMethodConfig(method);
  const Icon = config.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all',
        'min-w-[100px] min-h-[80px]',
        isSelected
          ? `border-current ${config.color} ${config.bgColor}`
          : 'border-border hover:border-muted-foreground hover:bg-muted/50',
        className
      )}
    >
      <Icon size={24} className={isSelected ? config.color : 'text-muted-foreground'} />
      <span className={cn('text-xs font-medium text-center', isSelected ? config.color : 'text-foreground')}>
        {config.label}
      </span>
    </button>
  );
}

/**
 * PaymentMethodList - Grid of payment methods for selection
 */
export function PaymentMethodList({
  selectedMethod,
  onSelect,
  excludedMethods = [],
  className,
}: {
  selectedMethod?: PaymentMethod;
  onSelect?: (method: PaymentMethod) => void;
  excludedMethods?: PaymentMethod[];
  className?: string;
}) {
  const availableMethods = React.useMemo(() => {
    return Object.values(PaymentMethod).filter(
      (method) => !excludedMethods.includes(method)
    );
  }, [excludedMethods]);

  return (
    <div className={cn('grid grid-cols-2 sm:grid-cols-4 gap-3', className)}>
      {availableMethods.map((method) => (
        <PaymentMethodSelect
          key={method}
          method={method}
          isSelected={selectedMethod === method}
          onClick={() => onSelect?.(method)}
        />
      ))}
    </div>
  );
}

/**
 * PaymentMethodIconOnly - Display just the icon
 */
export function PaymentMethodIconOnly({
  method,
  size = 16,
  className,
}: {
  method: PaymentMethod | string;
  size?: number;
  className?: string;
}) {
  const config = getPaymentMethodConfig(method);
  const Icon = config.icon;

  return (
    <Icon
      size={size}
      className={cn('shrink-0', config.color, className)}
      aria-label={`Payment method: ${config.label}`}
    />
  );
}

/**
 * PaymentMethodLabel - Display just the label
 */
export function PaymentMethodLabel({
  method,
  className,
}: {
  method: PaymentMethod | string;
  className?: string;
}) {
  const config = getPaymentMethodConfig(method);

  return <span className={cn('font-medium', config.color, className)}>{config.label}</span>;
}

export default PaymentMethodIcon;
