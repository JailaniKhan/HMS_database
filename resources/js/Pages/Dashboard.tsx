import { Head, Link, router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Stethoscope, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Package,
  FlaskConical,
  Clock,
  CreditCard,
  AlertTriangle,
  Activity,
  Shield,
  UserCheck,
  Building2,
  Activity as ActivityIcon
} from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState } from 'react';
import type { PageProps } from '@/types';

// ============================================================================
// Types
// ============================================================================
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  trend?: {
    value: number;
    label: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

interface AdminActivity {
  id: number;
  user_name: string;
  user_role: string;
  action: string;
  description: string;
  module: string;
  severity: 'high' | 'medium' | 'low';
  time: string;
  timestamp: string;
  ip_address?: string;
}

interface AdminStats {
  total_admins: number;
  online_admins: number;
  admin_users: Array<{
    id: number;
    name: string;
    username: string;
    role: string;
    last_login: string;
    activity_count: number;
    is_online: boolean;
  }>;
  activity_by_module: Record<string, number>;
  total_activities_24h: number;
  total_activities_7d: number;
}

interface DashboardProps extends PageProps {
  summary: {
    total_patients: number;
    new_patients: number;
    total_doctors: number;
    total_departments: number;
    total_appointments: number;
    completed_appointments: number;
    total_revenue: number;
    appointment_revenue: number;
    pharmacy_revenue: number;
    pending_bills: number;
    outstanding_amount: number;
  };
  financial: {
    total_revenue: number;
    appointment_revenue: number;
    pharmacy_revenue: number;
    outstanding_bills: number;
    outstanding_amount: number;
    aging: {
      current: number;
      '30_60': number;
      '60_90': number;
      '90_plus': number;
    };
  };
  appointments: {
    total: number;
    upcoming_count: number;
    today_schedule: Array<{
      id: number;
      patient_name: string;
      time: string;
      status: string;
    }>;
  };
  pharmacy: {
    today_revenue: number;
    low_stock_count: number;
    expiring_count: number;
    expired_count: number;
    pending_prescriptions: number;
  };
  laboratory: {
    total_today: number;
    completed_today: number;
    pending_count: number;
  };
  recent_activities: Array<{
    id: number;
    title: string;
    description: string;
    time: string;
    type: string;
  }>;
  admin_activities?: AdminActivity[];
  admin_stats?: AdminStats;
  period: string;
  last_updated: string;
  error?: string;
}

// ============================================================================
// Utility Functions
// ============================================================================
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('en-US').format(value);
};

// ============================================================================
// Components
// ============================================================================

const StatCard = ({ title, value, subtitle, icon, bgColor, trend, onClick }: StatCardProps) => {
  return (
    <Card className={onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-full ${bgColor}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="flex items-center text-xs mt-2">
            {trend.isPositive !== false ? (
              <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
            )}
            <span className={trend.isPositive !== false ? 'text-green-600' : 'text-red-600'}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-muted-foreground ml-1">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const RevenueCard = ({ title, amount, subtitle, icon, bgColor }: { 
  title: string; 
  amount: number; 
  subtitle?: string;
  icon: React.ReactNode;
  bgColor: string;
}) => (
  <Card className="bg-gradient-to-br from-white to-gray-50">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <div className={`p-3 rounded-full ${bgColor}`}>
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-gray-900">{formatCurrency(amount)}</div>
      {subtitle && (
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      )}
    </CardContent>
  </Card>
);

const ActivityItem = ({ activity }: { activity: AdminActivity }) => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  const getModuleIcon = (module: string) => {
    switch (module.toLowerCase()) {
      case 'patients': return <Users className="h-4 w-4" />;
      case 'appointments': return <Calendar className="h-4 w-4" />;
      case 'billing': return <CreditCard className="h-4 w-4" />;
      case 'pharmacy': return <Package className="h-4 w-4" />;
      case 'laboratory': return <FlaskConical className="h-4 w-4" />;
      case 'user management': return <Shield className="h-4 w-4" />;
      default: return <ActivityIcon className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="p-2 rounded-full bg-blue-100 text-blue-600">
        {getModuleIcon(activity.module)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm">{activity.user_name}</p>
          <Badge variant="outline" className={`text-xs ${getSeverityColor(activity.severity)}`}>
            {activity.severity}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{activity.description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">{activity.user_role}</Badge>
          <span className="text-xs text-muted-foreground">{activity.time}</span>
        </div>
      </div>
    </div>
  );
};

const AdminUserCard = ({ admin }: { admin: AdminStats['admin_users'][0] }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
          {admin.name.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div>
        <p className="font-medium text-sm">{admin.name}</p>
        <p className="text-xs text-muted-foreground">@{admin.username}</p>
      </div>
    </div>
    <div className="text-right">
      <Badge variant={admin.is_online ? 'default' : 'secondary'} className="text-xs">
        {admin.is_online ? 'Online' : 'Offline'}
      </Badge>
      <p className="text-xs text-muted-foreground mt-1">{admin.last_login}</p>
    </div>
  </div>
);

// ============================================================================
// Main Dashboard Component
// ============================================================================

export default function Dashboard({
  summary,
  appointments,
  pharmacy,
  laboratory,
  recent_activities,
  admin_activities,
  admin_stats,
  period,
  last_updated,
  error,
  auth
}: DashboardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isSuperAdmin = auth?.user?.is_super_admin;
  const canViewAdminActivities = isSuperAdmin || auth?.user?.permissions?.includes('view-admin-activities');

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.reload({
      onFinish: () => setIsRefreshing(false),
    });
  };

  return (
    <HospitalLayout>
      <Head title="Hospital Dashboard" />

      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hospital Management Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Last updated: {last_updated ? new Date(last_updated).toLocaleString() : 'Never'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800">{error}</p>
            </div>
          )}

          {/* Revenue Overview - Prominent Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <RevenueCard
              title="Total Revenue"
              amount={summary?.total_revenue || 0}
              subtitle="Combined revenue from all sources"
              icon={<DollarSign className="h-6 w-6 text-purple-600" />}
              bgColor="bg-purple-100"
            />
            <RevenueCard
              title="Appointment Revenue"
              amount={summary?.appointment_revenue || 0}
              subtitle="Revenue from appointments"
              icon={<Calendar className="h-6 w-6 text-blue-600" />}
              bgColor="bg-blue-100"
            />
            <RevenueCard
              title="Pharmacy Revenue"
              amount={summary?.pharmacy_revenue || 0}
              subtitle="Revenue from pharmacy sales"
              icon={<Package className="h-6 w-6 text-green-600" />}
              bgColor="bg-green-100"
            />
            {/* <RevenueCard
              title="Outstanding Amount"
              amount={summary?.outstanding_amount || 0}
              subtitle="Pending bill payments"
              icon={<CreditCard className="h-6 w-6 text-red-600" />}
              bgColor="bg-red-100"
            /> */}
          </div>

          {/* Main Stats - Vertical Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Key Metrics */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Key Metrics</h2>
              <StatCard
                title="Total Patients"
                value={formatNumber(summary?.total_patients || 0)}
                subtitle={`${summary?.new_patients || 0} new this ${period}`}
                icon={<Users className="h-5 w-5 text-blue-600" />}
                bgColor="bg-blue-100"
                iconColor="text-blue-600"
              />
              <StatCard
                title="Total Doctors"
                value={formatNumber(summary?.total_doctors || 0)}
                icon={<Stethoscope className="h-5 w-5 text-green-600" />}
                bgColor="bg-green-100"
                iconColor="text-green-600"
              />
              <StatCard
                title="Appointments"
                value={formatNumber(summary?.total_appointments || 0)}
                subtitle={`${summary?.completed_appointments || 0} completed`}
                icon={<Calendar className="h-5 w-5 text-yellow-600" />}
                bgColor="bg-yellow-100"
                iconColor="text-yellow-600"
              />
              {/* <StatCard
                title="Pending Bills"
                value={formatNumber(summary?.pending_bills || 0)}
                subtitle="Require attention"
                icon={<FileText className="h-5 w-5 text-orange-600" />}
                bgColor="bg-orange-100"
                iconColor="text-orange-600"
              /> */}
            </div>

            {/* Middle Column - Department Status */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Department Status</h2>
              <StatCard
                title="Pharmacy"
                value={formatCurrency(pharmacy?.today_revenue || 0)}
                subtitle={`${pharmacy?.pending_prescriptions || 0} pending prescriptions`}
                icon={<Package className="h-5 w-5 text-indigo-600" />}
                bgColor="bg-indigo-100"
                iconColor="text-indigo-600"
              />
              <StatCard
                title="Laboratory"
                value={`${laboratory?.completed_today || 0}/${laboratory?.total_today || 0}`}
                subtitle={`${laboratory?.pending_count || 0} pending tests`}
                icon={<FlaskConical className="h-5 w-5 text-cyan-600" />}
                bgColor="bg-cyan-100"
                iconColor="text-cyan-600"
              />
              <StatCard
                title="Today's Appointments"
                value={formatNumber(appointments?.today_schedule?.length || 0)}
                subtitle={`${appointments?.upcoming_count || 0} upcoming`}
                icon={<Clock className="h-5 w-5 text-pink-600" />}
                bgColor="bg-pink-100"
                iconColor="text-pink-600"
              />
              <StatCard
                title="Departments"
                value={formatNumber(summary?.total_departments || 0)}
                subtitle="Active departments"
                icon={<Building2 className="h-5 w-5 text-teal-600" />}
                bgColor="bg-teal-100"
                iconColor="text-teal-600"
              />
            </div>

            {/* Right Column - Alerts */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Alerts & Notifications</h2>
              {(pharmacy?.low_stock_count || 0) > 0 && (
                <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Low Stock Alert</p>
                    <p className="text-sm text-yellow-600">{pharmacy.low_stock_count} medicines below reorder level</p>
                  </div>
                </div>
              )}
              {(pharmacy?.expiring_count || 0) > 0 && (
                <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <Clock className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="font-medium text-orange-800">Expiring Soon</p>
                    <p className="text-sm text-orange-600">{pharmacy.expiring_count} medicines expiring in 30 days</p>
                  </div>
                </div>
              )}
              {(pharmacy?.expired_count || 0) > 0 && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium text-red-800">Expired Medicines</p>
                    <p className="text-sm text-red-600">{pharmacy.expired_count} medicines expired</p>
                  </div>
                </div>
              )}
              {(summary?.pending_bills || 0) > 0 && (
                <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Pending Bills</p>
                    <p className="text-sm text-blue-600">{summary.pending_bills} bills awaiting payment</p>
                  </div>
                </div>
              )}
              {/* Show "No alerts" message when there are no alerts */}
              {(pharmacy?.low_stock_count || 0) === 0 &&
               (pharmacy?.expiring_count || 0) === 0 &&
               (pharmacy?.expired_count || 0) === 0 &&
               (summary?.pending_bills || 0) === 0 && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">No Active Alerts</p>
                    <p className="text-sm text-green-600">All systems are operating normally</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Admin Activity Section - Only for Super Admins */}
          {canViewAdminActivities && admin_stats && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Admin Activities */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Admin Activity Log
                      </CardTitle>
                      <CardDescription>Recent administrative actions</CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">{admin_stats.total_activities_24h}</p>
                      <p className="text-xs text-muted-foreground">Activities (24h)</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {admin_activities && admin_activities.length > 0 ? (
                      admin_activities.slice(0, 10).map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} />
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No admin activities found</p>
                    )}
                  </div>
                  {isSuperAdmin && (
                    <div className="mt-4 pt-4 border-t">
                      <Link href="/admin/activity-logs">
                        <Button variant="outline" className="w-full">View All Activity Logs</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Admin Users */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <UserCheck className="h-5 w-5" />
                        Admin Users
                      </CardTitle>
                      <CardDescription>System administrators status</CardDescription>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <p className="text-2xl font-bold">{admin_stats.total_admins}</p>
                        <p className="text-xs text-muted-foreground">Total</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{admin_stats.online_admins}</p>
                        <p className="text-xs text-muted-foreground">Online</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {admin_stats.admin_users?.map((admin) => (
                      <AdminUserCard key={admin.id} admin={admin} />
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <Link href="/admin/users">
                      <Button variant="outline" className="w-full">Manage Admin Users</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent System Activities
              </CardTitle>
              <CardDescription>Latest activities across all modules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recent_activities && recent_activities.length > 0 ? (
                  recent_activities.slice(0, 9).map((activity) => (
                    <div 
                      key={activity.id} 
                      className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className={`p-2 rounded-full ${
                        activity.type === 'patient' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'appointment' ? 'bg-yellow-100 text-yellow-600' :
                        activity.type === 'billing' ? 'bg-purple-100 text-purple-600' :
                        activity.type === 'pharmacy' ? 'bg-green-100 text-green-600' :
                        activity.type === 'laboratory' ? 'bg-cyan-100 text-cyan-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {activity.type === 'patient' && <Users className="h-4 w-4" />}
                        {activity.type === 'appointment' && <Calendar className="h-4 w-4" />}
                        {activity.type === 'billing' && <CreditCard className="h-4 w-4" />}
                        {activity.type === 'pharmacy' && <Package className="h-4 w-4" />}
                        {activity.type === 'laboratory' && <FlaskConical className="h-4 w-4" />}
                        {activity.type === 'doctor' && <Stethoscope className="h-4 w-4" />}
                        {activity.type === 'system' && <ActivityIcon className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{activity.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4 col-span-3">No recent activities</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </HospitalLayout>
  );
}
