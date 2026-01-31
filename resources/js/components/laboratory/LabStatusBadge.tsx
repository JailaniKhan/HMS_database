import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

export interface LabStatusBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  showLabel?: boolean;
}

type StatusConfig = {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
};

const statusConfig: Record<LabStatusBadgeProps['status'], StatusConfig> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-lab-pending',
    bgColor: 'bg-lab-pending/10',
    borderColor: 'border-lab-pending/30',
    description: 'Test is waiting to be processed',
  },
  in_progress: {
    label: 'In Progress',
    icon: Loader2,
    color: 'text-lab-in-progress',
    bgColor: 'bg-lab-in-progress/10',
    borderColor: 'border-lab-in-progress/30',
    description: 'Test is currently being processed',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-lab-completed',
    bgColor: 'bg-lab-completed/10',
    borderColor: 'border-lab-completed/30',
    description: 'Test results are available',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    color: 'text-lab-cancelled',
    bgColor: 'bg-lab-cancelled/10',
    borderColor: 'border-lab-cancelled/30',
    description: 'Test has been cancelled',
  },
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs gap-1',
  md: 'px-2.5 py-1 text-sm gap-1.5',
  lg: 'px-3 py-1.5 text-base gap-2',
};

const iconSizes = {
  sm: 'size-3',
  md: 'size-4',
  lg: 'size-5',
};

const LabStatusBadge = React.forwardRef<HTMLDivElement, LabStatusBadgeProps>(
  (
    {
      className,
      status,
      size = 'md',
      animate = false,
      showLabel = true,
      ...props
    },
    ref
  ) => {
    const config = statusConfig[status];
    const Icon = config.icon;

    const badge = (
      <div
        ref={ref}
        role="status"
        aria-label={`Status: ${config.label}`}
        aria-live={animate ? 'polite' : undefined}
        className={cn(
          'inline-flex items-center rounded-full font-medium border transition-all duration-200',
          config.color,
          config.bgColor,
          config.borderColor,
          sizeClasses[size],
          animate && status === 'in_progress' && 'animate-pulse',
          animate && status === 'pending' && 'animate-pulse',
          className
        )}
        {...props}
      >
        <Icon
          className={cn(
            iconSizes[size],
            status === 'in_progress' && animate && 'animate-spin'
          )}
          aria-hidden="true"
        />
        {showLabel && <span>{config.label}</span>}
      </div>
    );

    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

LabStatusBadge.displayName = 'LabStatusBadge';

export { LabStatusBadge };
