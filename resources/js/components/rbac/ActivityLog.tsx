import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  Search,
  Filter,
  Download,
  User,
  Activity,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type { ActivityLog } from '@/types/rbac';

interface ActivityLogProps extends React.HTMLAttributes<HTMLDivElement> {
  logs: ActivityLog[];
  onExport?: () => void;
  isLoading?: boolean;
}

const ActivityLog = React.forwardRef<HTMLDivElement, ActivityLogProps>(
  (
    {
      className,
      logs,
      onExport,
      isLoading = false,
      ...props
    },
    ref
  ) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterAction, setFilterAction] = React.useState('all');
    const [filterUser, setFilterUser] = React.useState('all');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    const actionTypes = [
      'all',
      'created',
      'updated', 
      'deleted',
      'assigned',
      'revoked',
      'login',
      'logout'
    ];

    const uniqueUsers = [...new Set(logs.map(log => log.user_name))];

    const filteredLogs = logs.filter(log => {
      const matchesSearch = log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.target_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           log.details.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesAction = filterAction === 'all' || log.action.includes(filterAction);
      const matchesUser = filterUser === 'all' || log.user_name === filterUser;
      
      return matchesSearch && matchesAction && matchesUser;
    });

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    const getActionIcon = (action: string) => {
      if (action.includes('created')) return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      if (action.includes('deleted')) return <XCircle className="h-4 w-4 text-red-600" />;
      if (action.includes('updated')) return <Activity className="h-4 w-4 text-blue-600" />;
      if (action.includes('login')) return <CheckCircle className="h-4 w-4 text-green-600" />;
      if (action.includes('logout')) return <XCircle className="h-4 w-4 text-gray-600" />;
      return <Activity className="h-4 w-4 text-gray-600" />;
    };

    const getActionVariant = (action: string) => {
      if (action.includes('created')) return 'default';
      if (action.includes('deleted')) return 'destructive';
      if (action.includes('updated')) return 'secondary';
      if (action.includes('login')) return 'default';
      if (action.includes('logout')) return 'outline';
      return 'secondary';
    };

    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const formatRelativeTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    };

    return (
      <Card ref={ref} className={cn('overflow-hidden', className)} {...props}>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Activity Log
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track all RBAC system events and user activities
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onExport}
                disabled={isLoading || filteredLogs.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Select value={filterAction} onValueChange={setFilterAction}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>
                      {action === 'all' ? 'All Actions' : action.charAt(0).toUpperCase() + action.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="w-[160px]">
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead className="text-right">IP Address</TableHead>
                  <TableHead className="text-right">Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex justify-center">
                          {getActionIcon(log.action)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="bg-muted rounded-full p-1">
                            <User className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{log.user_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionVariant(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{log.target_name}</div>
                          <div className="text-sm text-muted-foreground capitalize">
                            {log.target_type}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {log.details}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="text-xs font-mono">
                          {log.ip_address}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                          <div className="font-medium text-sm">{formatDate(log.created_at)}</div>
                          <div className="text-xs text-muted-foreground">{formatRelativeTime(log.created_at)}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Activity className="h-8 w-8 opacity-50" />
                        <p>No activities found</p>
                        <p className="text-sm">Try adjusting your filters or search terms</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Navigation */}
          {totalPages > 1 && (
            <div className="border-t bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Summary Footer */}
          <div className="border-t bg-muted/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredLogs.length)} of {filteredLogs.length} activities
                </span>
                {searchTerm && (
                  <Badge variant="secondary" className="gap-1">
                    <Search className="h-3 w-3" />
                    Filtered
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                <span>Total Records: {logs.length}</span>
                <span>Last Updated: Just now</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

ActivityLog.displayName = 'ActivityLog';

export { ActivityLog };