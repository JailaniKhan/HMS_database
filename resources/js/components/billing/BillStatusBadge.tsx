/**
 * BillStatusBadge Component
 * 
 * Displays bill or payment status with appropriate color coding.
 * Uses the Badge component from the UI library.
 */

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import {
  BillStatus,
  PaymentStatus,
  RefundStatus,
} from '@/types/billing';
import { cn } from '@/lib/utils';

// Status type that accepts any of the billing status enums
export type BillStatusType = BillStatus | PaymentStatus | RefundStatus | string;

interface BillStatusBadgeProps {
  /** The status value to display */
  status: BillStatusType;
  /** Optional custom label to override the default formatted status */
  label?: string;
  /** Additional CSS classes */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show a dot indicator */
  showDot?: boolean;
}

/**
 * Get the badge variant based on status
 */
function getStatusVariant(status: BillStatusType): 'default' | 'secondary' | 'destructive' | 'outline' {
  const statusLower = status.toLowerCase();

  // Success states - green
  if (
    statusLower === BillStatus.PAID ||
    statusLower === PaymentStatus.PAID ||
    statusLower === RefundStatus.PROCESSED
  ) {
    return 'default';
  }

  // Warning/Partial states - yellow/orange
  if (
    statusLower === BillStatus.PARTIAL ||
    statusLower === PaymentStatus.PARTIAL ||
    statusLower === BillStatus.PENDING ||
    statusLower === PaymentStatus.PENDING ||
    statusLower === RefundStatus.PENDING
  ) {
    return 'secondary';
  }

  // Error/Negative states - red
  if (
    statusLower === BillStatus.OVERDUE ||
    statusLower === BillStatus.VOID ||
    statusLower === BillStatus.CANCELLED ||
    statusLower === PaymentStatus.FAILED ||
    statusLower === PaymentStatus.REFUNDED ||
    statusLower === RefundStatus.REJECTED
  ) {
    return 'destructive';
  }

  // Draft/Initial states - outline
  if (
    statusLower === BillStatus.DRAFT ||
    statusLower === PaymentStatus.UNPAID ||
    statusLower === RefundStatus.REQUESTED
  ) {
    return 'outline';
  }

  // Default
  return 'default';
}

/**
 * Get custom color classes for specific statuses
 */
function getStatusColorClasses(status: BillStatusType): string {
  const statusLower = status.toLowerCase();

  // Green - Success/Paid
  if (
    statusLower === BillStatus.PAID ||
    statusLower === PaymentStatus.PAID ||
    statusLower === RefundStatus.PROCESSED
  ) {
    return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
  }

  // Yellow - Warning/Partial/Pending
  if (
    statusLower === BillStatus.PARTIAL ||
    statusLower === PaymentStatus.PARTIAL ||
    statusLower === BillStatus.PENDING ||
    statusLower === PaymentStatus.PENDING ||
    statusLower === RefundStatus.PENDING
  ) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
  }

  // Orange - Sent
  if (statusLower === BillStatus.SENT) {
    return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200';
  }

  // Red - Error/Overdue/Void/Rejected
  if (
    statusLower === BillStatus.OVERDUE ||
    statusLower === BillStatus.VOID ||
    statusLower === BillStatus.CANCELLED ||
    statusLower === PaymentStatus.FAILED ||
    statusLower === PaymentStatus.REFUNDED ||
    statusLower === RefundStatus.REJECTED ||
    statusLower === RefundStatus.CANCELLED
  ) {
    return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
  }

  // Blue - Draft/Unpaid/Requested
  if (
    statusLower === BillStatus.DRAFT ||
    statusLower === PaymentStatus.UNPAID ||
    statusLower === RefundStatus.REQUESTED
  ) {
    return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
  }

  // Gray - Default
  return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
}

/**
 * Format status string for display
 */
function formatStatusLabel(status: BillStatusType): string {
  if (!status) return 'Unknown';
  
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get dot color based on status
 */
function getDotColor(status: BillStatusType): string {
  const statusLower = status.toLowerCase();

  if (
    statusLower === BillStatus.PAID ||
    statusLower === PaymentStatus.PAID ||
    statusLower === RefundStatus.PROCESSED
  ) {
    return 'bg-green-500';
  }

  if (
    statusLower === BillStatus.OVERDUE ||
    statusLower === BillStatus.VOID ||
    statusLower === PaymentStatus.FAILED ||
    statusLower === RefundStatus.REJECTED
  ) {
    return 'bg-red-500';
  }

  if (
    statusLower === BillStatus.PENDING ||
    statusLower === PaymentStatus.PENDING ||
    statusLower === RefundStatus.PENDING
  ) {
    return 'bg-yellow-500';
  }

  return 'bg-blue-500';
}

/**
 * BillStatusBadge Component
 * 
 * Displays a status badge with appropriate styling based on the status value.
 * Supports BillStatus, PaymentStatus, and RefundStatus enums.
 */
export function BillStatusBadge({
  status,
  label,
  className,
  size = 'md',
  showDot = false,
}: BillStatusBadgeProps) {
  const displayLabel = label || formatStatusLabel(status);
  const colorClasses = getStatusColorClasses(status);
  const dotColor = getDotColor(status);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-3 py-1',
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium transition-colors',
        colorClasses,
        sizeClasses[size],
        className
      )}
    >
      {showDot && (
        <span
          className={cn(
            'inline-block rounded-full mr-1.5',
            size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
            dotColor
          )}
        />
      )}
      {displayLabel}
    </Badge>
  );
}

/**
 * PaymentStatusBadge - Convenience component for payment status
 */
export function PaymentStatusBadge({
  status,
  ...props
}: Omit<BillStatusBadgeProps, 'status'> & { status: PaymentStatus }) {
  return <BillStatusBadge status={status} {...props} />;
}

/**
 * RefundStatusBadge - Convenience component for refund status
 */
export function RefundStatusBadge({
  status,
  ...props
}: Omit<BillStatusBadgeProps, 'status'> & { status: RefundStatus }) {
  return <BillStatusBadge status={status} {...props} />;
}

export default BillStatusBadge;
