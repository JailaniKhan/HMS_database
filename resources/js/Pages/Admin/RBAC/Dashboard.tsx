import { Head, router } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Key, 
  Users, 
  Clock, 
  AlertTriangle, 
  UserCog,
  Eye,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import type { RBACStats, ActivityLog, Role } from '@/types/rbac';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  description?: string;
  trend?: {
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
  variant?: 'default' | 'warning' | 'danger' | 'success';
}

const StatCard = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend,
  variant = 'default' 
}: StatCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-800';
      case 'danger':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-800';
      default:
        return 'border-blue-200 bg-blue-50 text-blue-800';
    }
  };

  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend.direction === 'up') return <TrendingUp className="h-4 w-4" />;
    if (trend.direction === 'down') return <TrendingDown className="h-4 w-4" />;
    return <BarChart3 className="h-4 w-4" />;
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-medium", getVariantStyles())}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {description && (
              <CardDescription className="text-xs mt-1">{description}</CardDescription>
            )}
          </div>
          <div className={cn(
            "p-2 rounded-lg",
            variant === 'warning' ? 'bg-amber-100 text-amber-600' :
            variant === 'danger' ? 'bg-red-100 text-red-600' :
            variant === 'success' ? 'bg-emerald-100 text-emerald-600' :
            'bg-blue-100 text-blue-600'
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold">{value}</div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 text-sm font-medium",
              trend.direction === 'up' ? 'text-emerald-600' :
              trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
            )}>
              {getTrendIcon()}
              <span>{trend.value}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface RoleDistributionItem {
  role_id: number;
  role_name: string;
  user_count: number;
  percentage: number;
  color: string;
}

interface Props {
  stats: RBACStats;
  roleDistribution: RoleDistributionItem[];
  recentActivities: ActivityLog[];
  topRoles: Role[];
  auth: {
    user: {
      role?: string;
      permissions?: string[];
    };
  };
}

const quickActions = [
  { title: 'Permission Matrix', icon: Key, href: '/admin/permissions', color: 'purple' },
  { title: 'User Assignments', icon: Users, href: '/admin/rbac/user-assignments', color: 'green' },
  { title: 'Audit Logs', icon: UserCog, href: '/admin/rbac/audit-logs', color: 'orange' },
];

export default function RBACDashboard({ 
  stats, 
  roleDistribution, 
  recentActivities = [],
}: Props) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    router.reload({
      onFinish: () => setRefreshing(false)
    });
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-500 hover:bg-blue-600 text-white',
      purple: 'bg-purple-500 hover:bg-purple-600 text-white',
      green: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <HospitalLayout>
      <Head title="RBAC Dashboard" />
      
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                RBAC Dashboard
              </h1>
              <p className="text-gray-600 mt-2">Comprehensive Role-Based Access Control Management</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                Refresh Data
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard 
              title="Total Roles" 
              value={stats.total_roles} 
              icon={Shield} 
              description="Active system roles"
              trend={{ value: "+2 this month", direction: "up" }}
            />
            <StatCard 
              title="Active Permissions" 
              value={stats.active_permissions} 
              icon={Key} 
              description="Currently assigned permissions"
              trend={{ value: "+15 this week", direction: "up" }}
            />
            <StatCard 
              title="Assigned Users" 
              value={stats.assigned_users} 
              icon={Users} 
              description="Users with role assignments"
              trend={{ value: "+8 this week", direction: "up" }}
            />
            <StatCard 
              title="Pending Requests" 
              value={stats.pending_requests} 
              icon={Clock} 
              description="Awaiting approval"
              trend={{ value: "-3 today", direction: "down" }}
              variant="warning"
            />
            <StatCard 
              title="Security Violations" 
              value={stats.security_violations} 
              icon={AlertTriangle} 
              description="Access violations detected"
              trend={{ value: "0 this week", direction: "neutral" }}
              variant="danger"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Role Distribution Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-blue-600" />
                  Role Distribution
                </CardTitle>
                <CardDescription>User allocation across different roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {roleDistribution.map((item, index) => (
                    <div key={item.role_id || index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm font-medium truncate">{item.role_name}</span>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <div className="text-sm font-semibold">{item.user_count}</div>
                        <div className="text-xs text-gray-500">{item.percentage}%</div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 ml-3">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common RBAC management tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action) => (
                    <Button
                      key={action.title}
                      variant="outline"
                      className={cn(
                        "h-20 flex flex-col gap-2 transition-all duration-200 hover:shadow-medium",
                        getColorClasses(action.color)
                      )}
                      onClick={() => window.location.href = action.href}
                    >
                      <action.icon className="h-6 w-6" />
                      <span className="font-medium">{action.title}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

         

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Recent Activities
              </CardTitle>
              <CardDescription>Latest RBAC system events and changes</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivities && recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={activity.id || index} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className={cn(
                        "p-2 rounded-full",
                        activity.action.includes('created') ? 'bg-emerald-100 text-emerald-600' :
                        activity.action.includes('deleted') ? 'bg-red-100 text-red-600' :
                        activity.action.includes('updated') ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      )}>
                        {activity.action.includes('created') ? <CheckCircle className="h-5 w-5" /> :
                         activity.action.includes('deleted') ? <XCircle className="h-5 w-5" /> :
                         activity.action.includes('updated') ? <Activity className="h-5 w-5" /> :
                         <Activity className="h-5 w-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{activity.user_name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {activity.action}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">
                          {activity.details} on {activity.target_type} "{activity.target_name}"
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{new Date(activity.created_at).toLocaleString()}</span>
                          <span>IP: {activity.ip_address}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Eye className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No recent activities to display</p>
                  <p className="text-sm mt-1">Activity logging will appear here once configured</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </HospitalLayout>
  );
}