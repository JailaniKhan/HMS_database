/**
 * Status styling configuration
 * Centralized status colors and labels for consistent styling across the application
 */

import type { LucideIcon } from 'lucide-react';
import {
    Package,
    AlertTriangle,
    AlertCircle,
    XCircle,
    CalendarCheck,
    CalendarX,
    CheckCircle,
    Clock,
    CreditCard,
    Wallet,
    Landmark,
    Receipt,
} from 'lucide-react';

// Stock Status Types and Styles
export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock' | 'critical';

export const stockStatusConfig: Record<
    StockStatus,
    {
        label: string;
        icon: LucideIcon;
        className: string;
        description: string;
    }
> = {
    'in-stock': {
        label: 'In Stock',
        icon: Package,
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20',
        description: 'Item is available in sufficient quantity',
    },
    'low-stock': {
        label: 'Low Stock',
        icon: AlertTriangle,
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20',
        description: 'Item is running low, consider reordering',
    },
    'out-of-stock': {
        label: 'Out of Stock',
        icon: XCircle,
        className: 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20',
        description: 'Item is currently unavailable',
    },
    'critical': {
        label: 'Critical',
        icon: AlertCircle,
        className: 'bg-red-600/10 text-red-700 border-red-600/30 hover:bg-red-600/20 font-semibold',
        description: 'Item requires immediate attention',
    },
};

// Expiry Status Types and Styles
export type ExpiryStatus = 'valid' | 'expiring-soon' | 'expired';

export const expiryStatusConfig: Record<
    ExpiryStatus,
    {
        label: string;
        icon: LucideIcon;
        className: string;
        description: string;
    }
> = {
    'valid': {
        label: 'Valid',
        icon: CalendarCheck,
        className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/20',
        description: 'Item has not expired',
    },
    'expiring-soon': {
        label: 'Expiring Soon',
        icon: AlertTriangle,
        className: 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20',
        description: 'Item will expire within 30 days',
    },
    'expired': {
        label: 'Expired',
        icon: CalendarX,
        className: 'bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500/20',
        description: 'Item has passed its expiry date',
    },
};

// Sale Status Types and Styles
export type SaleStatus = 'pending' | 'completed' | 'cancelled' | 'refunded';

export const saleStatusConfig: Record<
    SaleStatus,
    {
        label: string;
        icon: LucideIcon;
        className: string;
        description: string;
    }
> = {
    'pending': {
        label: 'Pending',
        icon: Clock,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        description: 'Sale is being processed',
    },
    'completed': {
        label: 'Completed',
        icon: CheckCircle,
        className: 'bg-green-100 text-green-800 border-green-200',
        description: 'Sale has been completed successfully',
    },
    'cancelled': {
        label: 'Cancelled',
        icon: XCircle,
        className: 'bg-red-100 text-red-800 border-red-200',
        description: 'Sale has been cancelled',
    },
    'refunded': {
        label: 'Refunded',
        icon: Receipt,
        className: 'bg-gray-100 text-gray-800 border-gray-200',
        description: 'Sale has been refunded',
    },
};

// Payment Method Types and Styles
export type PaymentMethod = 'cash' | 'card' | 'insurance' | 'credit';

export const paymentMethodConfig: Record<
    PaymentMethod,
    {
        label: string;
        icon: LucideIcon;
        className: string;
    }
> = {
    'cash': {
        label: 'Cash',
        icon: Wallet,
        className: 'bg-green-100 text-green-700 border-green-200',
    },
    'card': {
        label: 'Card',
        icon: CreditCard,
        className: 'bg-blue-100 text-blue-700 border-blue-200',
    },
    'insurance': {
        label: 'Insurance',
        icon: Landmark,
        className: 'bg-purple-100 text-purple-700 border-purple-200',
    },
    'credit': {
        label: 'Credit',
        icon: Receipt,
        className: 'bg-orange-100 text-orange-700 border-orange-200',
    },
};

// Priority Types and Styles
export type Priority = 'low' | 'medium' | 'high' | 'critical';

export const priorityConfig: Record<
    Priority,
    {
        label: string;
        icon: LucideIcon;
        className: string;
    }
> = {
    'low': {
        label: 'Low',
        icon: AlertCircle,
        className: 'bg-blue-500/10 text-blue-500 border-blue-200',
    },
    'medium': {
        label: 'Medium',
        icon: AlertCircle,
        className: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    },
    'high': {
        label: 'High',
        icon: AlertTriangle,
        className: 'bg-orange-500/10 text-orange-500 border-orange-200',
    },
    'critical': {
        label: 'Critical',
        icon: AlertTriangle,
        className: 'bg-red-500/10 text-red-600 border-red-200',
    },
};

// Alert Types
export type AlertType = 'low_stock' | 'expired' | 'expiring_soon' | 'low_stock_expiring';

export const alertTypeConfig: Record<
    AlertType,
    {
        label: string;
        icon: LucideIcon;
    }
> = {
    'low_stock': {
        label: 'Low Stock',
        icon: Package,
    },
    'expired': {
        label: 'Expired',
        icon: AlertCircle,
    },
    'expiring_soon': {
        label: 'Expiring Soon',
        icon: Clock,
    },
    'low_stock_expiring': {
        label: 'Low Stock & Expiring',
        icon: AlertTriangle,
    },
};

// Stats Card Variants
export type StatsCardVariant = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

export const statsCardVariants: Record<
    StatsCardVariant,
    {
        cardClass: string;
        iconClass: string;
    }
> = {
    primary: {
        cardClass: 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20',
        iconClass: 'bg-primary/20 text-primary',
    },
    success: {
        cardClass: 'bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20',
        iconClass: 'bg-green-500/20 text-green-600',
    },
    warning: {
        cardClass: 'bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20',
        iconClass: 'bg-amber-500/20 text-amber-600',
    },
    danger: {
        cardClass: 'bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20',
        iconClass: 'bg-red-500/20 text-red-600',
    },
    info: {
        cardClass: 'bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20',
        iconClass: 'bg-blue-500/20 text-blue-600',
    },
    purple: {
        cardClass: 'bg-gradient-to-br from-purple-500/5 to-purple-500/10 border-purple-500/20',
        iconClass: 'bg-purple-500/20 text-purple-600',
    },
};

// Helper function to get stock status based on quantity
export const getStockStatus = (quantity: number, reorderLevel: number): StockStatus => {
    if (quantity <= 0) {
        return 'out-of-stock';
    }
    if (quantity <= reorderLevel * 0.5) {
        return 'critical';
    }
    if (quantity <= reorderLevel) {
        return 'low-stock';
    }
    return 'in-stock';
};

// Helper function to get expiry status based on date
export const getExpiryStatusFromDate = (
    expiryDate: string | Date | null | undefined,
    warningDays: number = 30
): ExpiryStatus => {
    if (!expiryDate) {
        return 'valid';
    }

    const date = typeof expiryDate === 'string' ? new Date(expiryDate) : expiryDate;
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
        (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry < 0) {
        return 'expired';
    }
    if (daysUntilExpiry <= warningDays) {
        return 'expiring-soon';
    }
    return 'valid';
};