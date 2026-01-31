import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  CheckCircle2,
  Circle,
  Clock,
  type LucideIcon,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type TimelineStageStatus = 'completed' | 'current' | 'pending';

export interface TimelineStage {
  id: string;
  label: string;
  status: TimelineStageStatus;
  timestamp?: string;
  user?: string;
  description?: string;
}

export interface RequestTimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  stages: TimelineStage[];
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showConnectors?: boolean;
}

const stageConfig: Record<TimelineStageStatus, { icon: LucideIcon; color: string; bgColor: string }> = {
  completed: {
    icon: CheckCircle2,
    color: 'text-lab-completed',
    bgColor: 'bg-lab-completed',
  },
  current: {
    icon: Clock,
    color: 'text-lab-in-progress',
    bgColor: 'bg-lab-in-progress',
  },
  pending: {
    icon: Circle,
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
};

const sizeClasses = {
  sm: {
    container: 'gap-2',
    icon: 'size-6',
    iconContainer: 'w-6 h-6',
    label: 'text-xs',
    timestamp: 'text-xs',
    connector: 'h-0.5',
    verticalConnector: 'w-0.5',
  },
  md: {
    container: 'gap-4',
    icon: 'size-8',
    iconContainer: 'w-8 h-8',
    label: 'text-sm',
    timestamp: 'text-xs',
    connector: 'h-1',
    verticalConnector: 'w-1',
  },
  lg: {
    container: 'gap-6',
    icon: 'size-10',
    iconContainer: 'w-10 h-10',
    label: 'text-base',
    timestamp: 'text-sm',
    connector: 'h-1.5',
    verticalConnector: 'w-1.5',
  },
};

const RequestTimeline = React.forwardRef<HTMLDivElement, RequestTimelineProps>(
  (
    {
      className,
      stages,
      orientation = 'horizontal',
      size = 'md',
      showConnectors = true,
      ...props
    },
    ref
  ) => {
    const sizes = sizeClasses[size];
    const isHorizontal = orientation === 'horizontal';

    return (
      <TooltipProvider delayDuration={200}>
        <div
          ref={ref}
          role="list"
          aria-label="Request timeline"
          className={cn(
            isHorizontal
              ? 'flex items-center'
              : 'flex flex-col',
            sizes.container,
            className
          )}
          {...props}
        >
          {stages.map((stage, index) => {
            const config = stageConfig[stage.status];
            const Icon = config.icon;
            const isLast = index === stages.length - 1;

            return (
              <React.Fragment key={stage.id}>
                {/* Stage Item */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      role="listitem"
                      aria-label={`${stage.label}: ${stage.status}`}
                      className={cn(
                        'flex items-center gap-2',
                        !isHorizontal && 'w-full'
                      )}
                    >
                      {/* Icon Container */}
                      <div
                        className={cn(
                          'flex items-center justify-center rounded-full transition-all duration-300',
                          sizes.iconContainer,
                          stage.status === 'completed' && config.bgColor,
                          stage.status === 'current' && cn(config.bgColor, 'animate-pulse'),
                          stage.status === 'pending' && 'bg-muted border-2 border-muted-foreground/30'
                        )}
                        aria-hidden="true"
                      >
                        <Icon
                          className={cn(
                            sizes.icon,
                            stage.status === 'completed' && 'text-white',
                            stage.status === 'current' && 'text-white',
                            stage.status === 'pending' && 'text-muted-foreground'
                          )}
                          aria-hidden="true"
                        />
                      </div>

                      {/* Label & Info */}
                      <div className={cn('flex flex-col', isHorizontal && 'hidden md:flex')}>
                        <span
                          className={cn(
                            'font-medium',
                            sizes.label,
                            stage.status === 'completed' && 'text-foreground',
                            stage.status === 'current' && config.color,
                            stage.status === 'pending' && 'text-muted-foreground'
                          )}
                        >
                          {stage.label}
                        </span>
                        {stage.timestamp && (
                          <span className={cn('text-muted-foreground', sizes.timestamp)}>
                            {stage.timestamp}
                          </span>
                        )}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent
                    side={isHorizontal ? 'bottom' : 'right'}
                    className="max-w-xs"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{stage.label}</p>
                      {stage.description && (
                        <p className="text-xs text-muted-foreground">{stage.description}</p>
                      )}
                      {stage.timestamp && (
                        <p className="text-xs text-muted-foreground">
                          {stage.timestamp}
                        </p>
                      )}
                      {stage.user && (
                        <p className="text-xs text-muted-foreground">
                          By: {stage.user}
                        </p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>

                {/* Connector */}
                {showConnectors && !isLast && (
                  <div
                    className={cn(
                      'transition-all duration-300',
                      isHorizontal
                        ? cn('flex-1 mx-2 rounded-full', sizes.connector)
                        : cn('h-8 ml-4 rounded-full', sizes.verticalConnector),
                      stage.status === 'completed'
                        ? 'bg-lab-completed'
                        : 'bg-muted'
                    )}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </TooltipProvider>
    );
  }
);

RequestTimeline.displayName = 'RequestTimeline';

export { RequestTimeline };
