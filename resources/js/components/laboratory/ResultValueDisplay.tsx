import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';

export interface ResultValueDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string | number;
  unit?: string;
  referenceRange?: { min: number; max: number };
  status: 'normal' | 'abnormal' | 'critical';
  previousValue?: number;
  precision?: number;
  size?: 'sm' | 'md' | 'lg';
}

type StatusConfig = {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
};

const statusConfig: Record<ResultValueDisplayProps['status'], StatusConfig> = {
  normal: {
    label: 'Normal',
    icon: CheckCircle2,
    color: 'text-lab-normal',
    bgColor: 'bg-lab-normal/10',
    borderColor: 'border-lab-normal/30',
    description: 'Value is within normal range',
  },
  abnormal: {
    label: 'Abnormal',
    icon: AlertCircle,
    color: 'text-lab-abnormal',
    bgColor: 'bg-lab-abnormal/10',
    borderColor: 'border-lab-abnormal/30',
    description: 'Value is outside normal range',
  },
  critical: {
    label: 'Critical',
    icon: AlertTriangle,
    color: 'text-lab-critical',
    bgColor: 'bg-lab-critical/10',
    borderColor: 'border-lab-critical/30',
    description: 'Critical value - immediate attention required',
  },
};

const sizeClasses = {
  sm: {
    container: 'p-2 gap-1',
    value: 'text-sm font-semibold',
    unit: 'text-xs',
    range: 'text-xs',
    icon: 'size-3',
  },
  md: {
    container: 'p-3 gap-2',
    value: 'text-base font-semibold',
    unit: 'text-sm',
    range: 'text-sm',
    icon: 'size-4',
  },
  lg: {
    container: 'p-4 gap-3',
    value: 'text-lg font-bold',
    unit: 'text-base',
    range: 'text-base',
    icon: 'size-5',
  },
};

function calculateTrend(
  current: number,
  previous: number
): { icon: LucideIcon; label: string; color: string } | null {
  const diff = current - previous;
  const percentChange = (diff / previous) * 100;

  if (Math.abs(percentChange) < 5) {
    return { icon: Minus, label: 'No significant change', color: 'text-muted-foreground' };
  }

  if (diff > 0) {
    return {
      icon: TrendingUp,
      label: `Increased by ${percentChange.toFixed(1)}%`,
      color: 'text-lab-abnormal',
    };
  }

  return {
    icon: TrendingDown,
    label: `Decreased by ${Math.abs(percentChange).toFixed(1)}%`,
    color: 'text-lab-normal',
  };
}

const ResultValueDisplay = React.forwardRef<HTMLDivElement, ResultValueDisplayProps>(
  (
    {
      className,
      value,
      unit,
      referenceRange,
      status,
      previousValue,
      precision = 2,
      size = 'md',
      ...props
    },
    ref
  ) => {
    const config = statusConfig[status];
    const StatusIcon = config.icon;
    const sizes = sizeClasses[size];

    // Format the value
    const numericValue = typeof value === 'string' ? parseFloat(value) : value;
    const formattedValue = isNaN(numericValue)
      ? value
      : numericValue.toFixed(precision);

    // Calculate trend if previous value exists
    const trend =
      previousValue !== undefined && !isNaN(numericValue)
        ? calculateTrend(numericValue, previousValue)
        : null;

    const TrendIcon = trend?.icon;

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              ref={ref}
              role="status"
              aria-label={`Result: ${formattedValue} ${unit || ''}, Status: ${config.label}`}
              aria-live={status === 'critical' ? 'assertive' : 'polite'}
              className={cn(
                'inline-flex flex-col rounded-lg border transition-all duration-200',
                config.bgColor,
                config.borderColor,
                sizes.container,
                status === 'critical' && 'animate-pulse',
                className
              )}
              {...props}
            >
              {/* Value Row */}
              <div className="flex items-center gap-2">
                <StatusIcon className={cn(sizes.icon, config.color)} aria-hidden="true" />
                <span className={cn(sizes.value, config.color)}>
                  {formattedValue}
                </span>
                {unit && (
                  <span className={cn(sizes.unit, 'text-muted-foreground')}>
                    {unit}
                  </span>
                )}
                {trend && TrendIcon && (
                  <TrendIcon className={cn(sizes.icon, trend.color)} aria-hidden="true" />
                )}
              </div>

              {/* Reference Range */}
              {referenceRange && (
                <div className={cn(sizes.range, 'text-muted-foreground')}
                >
                  Ref: {referenceRange.min} - {referenceRange.max}
                  {unit && ` ${unit}`}
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p className="font-medium">{config.description}</p>
              {trend && <p className="text-xs text-muted-foreground">{trend.label}</p>}
              {referenceRange && (
                <p className="text-xs text-muted-foreground">
                  Reference: {referenceRange.min} - {referenceRange.max}
                  {unit && ` ${unit}`}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

ResultValueDisplay.displayName = 'ResultValueDisplay';

export { ResultValueDisplay };
