import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  AlertCircle,
  Zap,
  Clock,
  type LucideIcon,
} from 'lucide-react';

export interface PriorityBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  priority: 'routine' | 'urgent' | 'stat';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  animate?: boolean;
}

type PriorityConfig = {
  label: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  turnaround: string;
};

const priorityConfig: Record<PriorityBadgeProps['priority'], PriorityConfig> = {
  routine: {
    label: 'Routine',
    icon: Clock,
    color: 'text-lab-routine',
    bgColor: 'bg-lab-routine/10',
    borderColor: 'border-lab-routine/30',
    description: 'Standard processing time',
    turnaround: '4-24 hours',
  },
  urgent: {
    label: 'Urgent',
    icon: AlertCircle,
    color: 'text-lab-urgent',
    bgColor: 'bg-lab-urgent/10',
    borderColor: 'border-lab-urgent/30',
    description: 'Priority processing required',
    turnaround: '1-2 hours',
  },
  stat: {
    label: 'STAT',
    icon: Zap,
    color: 'text-lab-stat',
    bgColor: 'bg-lab-stat/10',
    borderColor: 'border-lab-stat/30',
    description: 'Immediate processing - critical priority',
    turnaround: '15-30 minutes',
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

const PriorityBadge = React.forwardRef<HTMLDivElement, PriorityBadgeProps>(
  (
    {
      className,
      priority,
      size = 'md',
      showLabel = true,
      animate = false,
      ...props
    },
    ref
  ) => {
    const config = priorityConfig[priority];
    const Icon = config.icon;

    const badge = (
      <div
        ref={ref}
        role="status"
        aria-label={`Priority: ${config.label}`}
        aria-live={animate && priority === 'stat' ? 'assertive' : 'polite'}
        className={cn(
          'inline-flex items-center rounded-full font-semibold border transition-all duration-200',
          config.color,
          config.bgColor,
          config.borderColor,
          sizeClasses[size],
          animate && priority === 'stat' && 'animate-pulse',
          priority === 'stat' && 'uppercase tracking-wider',
          className
        )}
        {...props}
      >
        <Icon
          className={cn(
            iconSizes[size],
            animate && priority === 'stat' && 'animate-bounce'
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
            <div className="space-y-1">
              <p className="font-medium">{config.description}</p>
              <p className="text-xs text-muted-foreground">
                Expected turnaround: {config.turnaround}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }
);

PriorityBadge.displayName = 'PriorityBadge';

export { PriorityBadge };
