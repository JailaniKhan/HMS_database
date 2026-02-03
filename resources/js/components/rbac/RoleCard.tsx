import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash,
  Shield,
  Crown,
  UserCog,
  User,
  UserCircle,
  Users,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Role } from '@/types/rbac';

type Action = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
};

export interface RoleCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'role'> {
  roleData: Role;
  actions?: Action[];
  compact?: boolean;
  onEdit?: (role: Role) => void;
  onDelete?: (role: Role) => void;
  onViewDetails?: (role: Role) => void;
}

const RoleCard = React.forwardRef<HTMLDivElement, RoleCardProps>(
  (
    {
      className,
      roleData: role,
      actions,
      compact = false,
      onEdit,
      onDelete,
      onViewDetails,
      ...props
    },
    ref
  ) => {
    const getPriorityColor = (): string => {
      if (role.priority >= 90) return 'text-red-600 bg-red-500/10 border-red-500/30';
      if (role.priority >= 80) return 'text-orange-600 bg-orange-500/10 border-orange-500/30';
      if (role.priority >= 60) return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30';
      if (role.priority >= 50) return 'text-green-600 bg-green-500/10 border-green-500/30';
      return 'text-blue-600 bg-blue-500/10 border-blue-500/30';
    };

    const renderPriorityIcon = () => {
      const iconClass = compact ? 'size-5' : 'size-6';
      
      if (role.priority >= 90) return <Crown className={iconClass} />;
      if (role.priority >= 80) return <Shield className={iconClass} />;
      if (role.priority >= 60) return <UserCog className={iconClass} />;
      if (role.priority >= 50) return <User className={iconClass} />;
      return <UserCircle className={iconClass} />;
    };

    // Default actions
    const getDefaultActions = (): Action[] => [
      { label: 'View Details', icon: Eye, onClick: () => onViewDetails?.(role) },
      { label: 'Edit Role', icon: Edit, onClick: () => onEdit?.(role), disabled: role.is_system },
      {
        label: 'Delete Role',
        icon: Trash,
        onClick: () => onDelete?.(role),
        variant: 'destructive',
        disabled: role.is_system,
      },
    ];

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
              getPriorityColor(),
              compact ? 'size-10' : 'size-12'
            )}>
              {renderPriorityIcon()}
            </div>
            <div className="space-y-1 min-w-0">
              <h3 className={cn('font-semibold leading-tight truncate', compact ? 'text-base' : 'text-lg')}>
                {role.name}
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={role.is_system ? "destructive" : "outline"} className="text-xs">
                  {role.is_system ? 'System Role' : 'Custom Role'}
                </Badge>
                {role.slug && (
                  <span className="text-xs">• {role.slug}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className={cn('text-xs font-medium', getPriorityColor())}>
              Priority: {role.priority}
            </Badge>
            {role.parent_role && (
              <Badge variant="outline" className="text-xs">
                Reports to: {role.parent_role.name}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className={cn('p-0', compact ? 'pb-3' : 'pb-4')}>
          {/* Role Description */}
          <p className={cn('text-muted-foreground', compact ? 'text-sm' : 'text-base', 'mb-4 line-clamp-2')}>
            {role.description}
          </p>
          
          {/* Role Metrics */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Users className="size-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{role.users_count || 0}</div>
                  <div className="text-muted-foreground text-xs">Assigned Users</div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Lock className="size-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{role.permissions_count || 0}</div>
                  <div className="text-muted-foreground text-xs">Permissions</div>
                </div>
              </div>
            </div>
            
            {/* Module Access Summary */}
            {role.module_access && role.module_access.length > 0 && (
              <div className="pt-2 border-t">
                <div className="text-xs text-muted-foreground mb-2">Module Access:</div>
                <div className="flex flex-wrap gap-1">
                  {role.module_access.slice(0, compact ? 3 : 5).map((module: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </Badge>
                  ))}
                  {role.module_access.length > (compact ? 3 : 5) && (
                    <Badge variant="outline" className="text-xs">
                      +{role.module_access.length - (compact ? 3 : 5)} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
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

RoleCard.displayName = 'RoleCard';

export { RoleCard };
export type { Action };