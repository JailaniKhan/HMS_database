import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LabStatusBadge } from './LabStatusBadge';
import { PriorityBadge } from './PriorityBadge';
import {
  FlaskConical,
  Clock,
  DollarSign,
  FileText,
  User,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Ban,
  Play,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface LabTest {
  id: string | number;
  name: string;
  code: string;
  category: 'hematology' | 'biochemistry' | 'microbiology' | 'immunology' | 'urinalysis';
  status: 'active' | 'inactive';
  cost?: number;
  turnaroundTime?: string;
  description?: string;
}

export interface LabTestRequest {
  id: string | number;
  testName: string;
  testCode: string;
  category: 'hematology' | 'biochemistry' | 'microbiology' | 'immunology' | 'urinalysis';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  patientName?: string;
  patientId?: string;
  doctorName?: string;
  scheduledAt?: string;
  requestedAt?: string;
}

type Action = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
};

export interface LabTestCardProps extends React.HTMLAttributes<HTMLDivElement> {
  test: LabTest | LabTestRequest;
  type: 'test' | 'request';
  actions?: Action[];
  compact?: boolean;
  onView?: () => void;
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDeactivate?: () => void;
  onProcess?: () => void;
  onCancel?: () => void;
}

const categoryConfig: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  hematology: { label: 'Hematology', color: 'text-lab-hematology bg-lab-hematology/10 border-lab-hematology/30', icon: FlaskConical },
  biochemistry: { label: 'Biochemistry', color: 'text-lab-biochemistry bg-lab-biochemistry/10 border-lab-biochemistry/30', icon: FlaskConical },
  microbiology: { label: 'Microbiology', color: 'text-lab-microbiology bg-lab-microbiology/10 border-lab-microbiology/30', icon: FlaskConical },
  immunology: { label: 'Immunology', color: 'text-lab-immunology bg-lab-immunology/10 border-lab-immunology/30', icon: FlaskConical },
  urinalysis: { label: 'Urinalysis', color: 'text-lab-urinalysis bg-lab-urinalysis/10 border-lab-urinalysis/30', icon: FlaskConical },
};

const LabTestCard = React.forwardRef<HTMLDivElement, LabTestCardProps>(
  (
    {
      className,
      test,
      type,
      actions,
      compact = false,
      onView,
      onEdit,
      onDuplicate,
      onDeactivate,
      onProcess,
      onCancel,
      ...props
    },
    ref
  ) => {
    const isTest = type === 'test';
    const labTest = test as LabTest;
    const request = test as LabTestRequest;

    const category = isTest ? labTest.category : request.category;
    const categoryInfo = categoryConfig[category] || categoryConfig.hematology;
    const CategoryIcon = categoryInfo.icon;

    // Default actions based on type and status
    const getDefaultActions = (): Action[] => {
      if (isTest) {
        return [
          { label: 'View', icon: Eye, onClick: onView || (() => {}) },
          { label: 'Edit', icon: Edit, onClick: onEdit || (() => {}) },
          { label: 'Duplicate', icon: Copy, onClick: onDuplicate || (() => {}) },
          {
            label: labTest.status === 'active' ? 'Deactivate' : 'Activate',
            icon: Ban,
            onClick: onDeactivate || (() => {}),
            variant: labTest.status === 'active' ? 'destructive' : 'default',
          },
        ];
      } else {
        const requestActions: Action[] = [{ label: 'View', icon: Eye, onClick: onView || (() => {}) }];
        
        if (request.status === 'pending') {
          requestActions.push(
            { label: 'Start', icon: Play, onClick: onProcess || (() => {}) },
            { label: 'Cancel', icon: Ban, onClick: onCancel || (() => {}), variant: 'destructive' }
          );
        } else if (request.status === 'in_progress') {
          requestActions.push(
            { label: 'Complete', icon: CheckCircle2, onClick: onProcess || (() => {}) },
            { label: 'Cancel', icon: Ban, onClick: onCancel || (() => {}), variant: 'destructive' }
          );
        }
        
        return requestActions;
      }
    };

    const displayActions = actions || getDefaultActions();

    return (
      <Card
        ref={ref}
        className={cn(
          'transition-all duration-200 hover:shadow-medium',
          compact ? 'p-4' : 'p-6',
          className
        )}
        {...props}
      >
        <CardHeader className={cn('flex flex-row items-start justify-between p-0', compact ? 'pb-3' : 'pb-4')}>
          <div className="flex items-start gap-3">
            <div className={cn(
              'flex items-center justify-center rounded-lg border',
              categoryInfo.color,
              compact ? 'size-10' : 'size-12'
            )}>
              <CategoryIcon className={compact ? 'size-5' : 'size-6'} />
            </div>
            <div className="space-y-1">
              <h3 className={cn('font-semibold leading-tight', compact ? 'text-base' : 'text-lg')}>
                {isTest ? labTest.name : request.testName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className={cn('text-xs', categoryInfo.color)}>
                  {categoryInfo.label}
                </Badge>
                {!isTest && request.testCode && (
                  <span>• {request.testCode}</span>
                )}
                {isTest && labTest.code && (
                  <span>• {labTest.code}</span>
                )}
              </div>
            </div>
          </div>
          
          {!isTest && (
            <div className="flex flex-col items-end gap-2">
              <PriorityBadge priority={request.priority} size="sm" />
              <LabStatusBadge status={request.status} size="sm" />
            </div>
          )}
          
          {isTest && labTest.status && (
            <Badge variant={labTest.status === 'active' ? 'default' : 'secondary'}>
              {labTest.status === 'active' ? 'Active' : 'Inactive'}
            </Badge>
          )}
        </CardHeader>

        <CardContent className={cn('p-0', compact ? 'pb-3' : 'pb-4')}>
          {/* Test Details */}
          {isTest && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {labTest.turnaroundTime && (
                <div className="flex items-center gap-1">
                  <Clock className="size-4" />
                  <span>{labTest.turnaroundTime}</span>
                </div>
              )}
              {typeof labTest.cost === 'number' && !isNaN(labTest.cost) && (
                <div className="flex items-center gap-1">
                  <DollarSign className="size-4" />
                  <span>{labTest.cost.toFixed(2)}</span>
                </div>
              )}
            </div>
          )}

          {/* Request Details */}
          {!isTest && (
            <div className="space-y-2">
              {request.patientName && (
                <div className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-muted-foreground" />
                  <span>{request.patientName}</span>
                  {request.patientId && (
                    <span className="text-muted-foreground">(PID: {request.patientId})</span>
                  )}
                </div>
              )}
              {request.doctorName && (
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="size-4 text-muted-foreground" />
                  <span>Dr. {request.doctorName}</span>
                </div>
              )}
              {(request.scheduledAt || request.requestedAt) && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span>{request.scheduledAt || request.requestedAt}</span>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {isTest && labTest.description && !compact && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
              {labTest.description}
            </p>
          )}
        </CardContent>

        <CardFooter className={cn('flex items-center justify-between p-0 pt-0', compact ? 'pt-3' : 'pt-4')}>
          <div className="flex items-center gap-2">
            {displayActions.slice(0, compact ? 2 : 3).map((action, index) => (
              <Button
                key={index}
                variant={action.variant === 'destructive' ? 'destructive' : 'outline'}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled}
                className="gap-1.5"
              >
                <action.icon className="size-4" />
                {!compact && action.label}
              </Button>
            ))}
          </div>
          
          {displayActions.length > (compact ? 2 : 3) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="size-8 p-0">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {displayActions.slice(compact ? 2 : 3).map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                      'gap-2',
                      action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                    )}
                  >
                    <action.icon className="size-4" />
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardFooter>
      </Card>
    );
  }
);

LabTestCard.displayName = 'LabTestCard';

export { LabTestCard };
export type { Action };
