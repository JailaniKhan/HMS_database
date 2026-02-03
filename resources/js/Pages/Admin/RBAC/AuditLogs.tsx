import { Head, router } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Search, 
  Clock, 
  User, 
  Shield, 
  Activity,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: number;
  user_id: number | null;
  user_name: string;
  user_role: string;
  action: string;
  description: string | null;
  ip_address: string | null;
  module: string | null;
  severity: string;
  logged_at: string;
  request_method: string | null;
  request_url: string | null;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface PaginatedLogs {
  data: AuditLog[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  prev_page_url: string | null;
  next_page_url: string | null;
  links: PaginationLink[];
}

interface Props {
  auditLogs: PaginatedLogs;
  filters: {
    severity?: string;
    module?: string;
    search?: string;
  };
}

export default function AuditLogs({ auditLogs, filters }: Props) {
  const [search, setSearch] = useState(filters.search || '');
  const [severity, setSeverity] = useState(filters.severity || 'all');
  const [module, setModule] = useState(filters.module || 'all');

  const handleFilter = () => {
    router.get('/admin/rbac/audit-logs', {
      search,
      severity: severity === 'all' ? undefined : severity,
      module: module === 'all' ? undefined : module,
    }, {
      preserveState: true,
      replace: true,
    });
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== (filters.search || '')) {
        handleFilter();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const getSeverityBadge = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
      case 'error':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> {severity}</Badge>;
      case 'warning':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1"><AlertTriangle className="h-3 w-3" /> {severity}</Badge>;
      case 'success':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 gap-1"><CheckCircle className="h-3 w-3" /> {severity}</Badge>;
      case 'info':
      default:
        return <Badge variant="secondary" className="gap-1"><Info className="h-3 w-3" /> {severity}</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (action.includes('delete')) return <XCircle className="h-4 w-4 text-red-500" />;
    if (action.includes('update')) return <Activity className="h-4 w-4 text-blue-500" />;
    return <Info className="h-4 w-4 text-gray-500" />;
  };

  return (
    <HospitalLayout>
      <Head title="RBAC Audit Logs" />
      
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FileText className="h-8 w-8 text-blue-600" />
                Audit Logs
              </h1>
              <p className="text-gray-600 mt-2">Track all security and RBAC system changes</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative md:col-span-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search logs by action, description, or user..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={severity} onValueChange={(val) => { setSeverity(val); handleFilter(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={module} onValueChange={(val) => { setModule(val); handleFilter(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Module" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Modules</SelectItem>
                    <SelectItem value="rbac">RBAC</SelectItem>
                    <SelectItem value="auth">Auth</SelectItem>
                    <SelectItem value="users">Users</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Logs List */}
          <div className="space-y-4">
            {auditLogs.data.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium">No audit logs found</p>
                  <p className="text-sm text-gray-400">Try adjusting your filters or search query</p>
                </CardContent>
              </Card>
            ) : (
              auditLogs.data.map((log) => (
                <Card key={log.id} className="hover:shadow-md transition-shadow overflow-hidden">
                  <div className={cn(
                    "h-1 w-full",
                    log.severity === 'critical' || log.severity === 'error' ? 'bg-red-500' :
                    log.severity === 'warning' ? 'bg-amber-500' :
                    log.severity === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                  )} />
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row">
                      {/* Left Side: Meta */}
                      <div className="p-6 md:w-64 bg-gray-50/50 border-r border-gray-100 flex flex-col justify-between gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{log.user_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Shield className="h-4 w-4 text-gray-400" />
                            <span>{log.user_role}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{new Date(log.logged_at).toLocaleString()}</span>
                          </div>
                        </div>
                        <div>
                          {getSeverityBadge(log.severity)}
                        </div>
                      </div>

                      {/* Right Side: Details */}
                      <div className="p-6 flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <h3 className="font-bold text-gray-900 uppercase text-xs tracking-wider">
                                {log.action}
                              </h3>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {log.description}
                            </p>
                          </div>
                          {log.module && (
                            <Badge variant="outline" className="capitalize">
                              {log.module}
                            </Badge>
                          )}
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-x-6 gap-y-2 text-[10px] text-gray-400 font-mono">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 uppercase">IP:</span>
                            {log.ip_address}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500 uppercase">Method:</span>
                            {log.request_method}
                          </div>
                          <div className="flex items-center gap-1 truncate max-w-xs md:max-w-md">
                            <span className="text-gray-500 uppercase">URL:</span>
                            {log.request_url}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {auditLogs.last_page > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{(auditLogs.current_page - 1) * auditLogs.per_page + 1}</span> to <span className="font-medium">{Math.min(auditLogs.current_page * auditLogs.per_page, auditLogs.total)}</span> of <span className="font-medium">{auditLogs.total}</span> logs
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!auditLogs.prev_page_url}
                  onClick={() => auditLogs.prev_page_url && router.get(auditLogs.prev_page_url)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!auditLogs.next_page_url}
                  onClick={() => auditLogs.next_page_url && router.get(auditLogs.next_page_url)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </HospitalLayout>
  );
}
