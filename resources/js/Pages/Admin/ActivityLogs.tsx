import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Activity, Eye, Filter, Search, Clock, Cpu, Globe, Server } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState, useEffect } from 'react';

interface AuditLog {
    id: number;
    user: string;
    action: string;
    details: string;
    time: string;
    severity: 'high' | 'low' | 'medium' | 'info' | 'critical';
    user_role?: string;
    module?: string;
    response_time?: number;
    memory_usage?: number;
    ip_address?: string;
    request_method?: string;
    request_url?: string;
}



export default function ActivityLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [filters, setFilters] = useState({
        searchTerm: '',
        severity: '',
        dateFrom: '',
        dateTo: '',
        module: '',
        per_page: '50'
    });

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const csrfToken = document.head.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                
                const response = await fetch('/api/v1/admin/audit-logs', {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken || '',
                    },
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setLogs(data);
                } else if (response.status === 401) {
                    console.error('Authentication required. Please log in.');
                    alert('You must be logged in to view activity logs.');
                } else if (response.status === 403) {
                    console.error('Access forbidden. You may not have sufficient permissions.');
                    alert('You do not have permission to view activity logs. Only Super Admins can access this page.');
                } else {
                    console.error('Failed to load activity logs:', response.status, response.statusText);
                    // Load sample data for demonstration purposes
                    setLogs([
                        { id: 1, user: 'System', action: 'System Initialized', details: 'Hospital Management System initialized', time: '2026-01-13 00:00:00', severity: 'info', user_role: 'System' },
                        { id: 2, user: 'Admin User', action: 'User Created', details: 'Created new user account for John Doe', time: '2026-01-13 08:30:00', severity: 'info', user_role: 'Super Admin' },
                        { id: 3, user: 'System', action: 'Backup Completed', details: 'Daily system backup completed successfully', time: '2026-01-13 02:00:00', severity: 'info', user_role: 'System' },
                    ]);
                }
            } catch (error) {
                console.error('Error fetching activity logs:', error);
                // Load sample data as fallback
                setLogs([
                    { id: 1, user: 'Sample User', action: 'Sample Action', details: 'This is sample data because the API call failed', time: '2026-01-13 00:00:00', severity: 'info', user_role: 'Sample Role' },
                    { id: 2, user: 'Another User', action: 'Another Action', details: 'Showing sample audit log entry', time: '2026-01-13 00:01:00', severity: 'low', user_role: 'Sample Role' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, []);

    const getSeverityBadgeVariant = (severity: string) => {
        switch(severity.toLowerCase()) {
            case 'critical':
                return 'destructive';
            case 'high':
                return 'destructive';
            case 'medium':
                return 'default';
            case 'low':
                return 'secondary';
            case 'info':
                return 'secondary';
            default:
                return 'secondary';
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = filters.searchTerm === '' || 
            log.user.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            log.action.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(filters.searchTerm.toLowerCase());
        
        const matchesSeverity = filters.severity === '' || log.severity === filters.severity;
        
        return matchesSearch && matchesSeverity;
    });

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Activity Logs" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
                        <p className="text-gray-600 mt-2">Monitor all user activities and system events</p>
                    </div>
                    
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>Filter Logs</CardTitle>
                            <CardDescription>Apply filters to narrow down the logs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="flex items-center space-x-2">
                                    <Search className="h-4 w-4 text-gray-500" />
                                    <input
                                        type="text"
                                        placeholder="Search logs..."
                                        className="border rounded px-3 py-2 w-full"
                                        value={filters.searchTerm}
                                        onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                                    />
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <Filter className="h-4 w-4 text-gray-500" />
                                    <select
                                        className="border rounded px-3 py-2 w-full"
                                        value={filters.severity}
                                        onChange={(e) => setFilters({...filters, severity: e.target.value})}
                                    >
                                        <option value="">All Severities</option>
                                        <option value="info">Info</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="critical">Critical</option>
                                    </select>
                                </div>
                                
                                <input
                                    type="date"
                                    className="border rounded px-3 py-2 w-full"
                                    value={filters.dateFrom}
                                    onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                                />
                                
                                <input
                                    type="date"
                                    className="border rounded px-3 py-2 w-full"
                                    value={filters.dateTo}
                                    onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                                />
                            </div>
                            
                            <div className="mt-4 flex justify-end">
                                <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors" onClick={() => {
                                    setFilters({
                                        searchTerm: '',
                                        severity: '',
                                        dateFrom: '',
                                        dateTo: '',
                                        module: '',
                                        per_page: '50'
                                    });
                                }}>
                                    Clear Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activities</CardTitle>
                            <CardDescription>{filteredLogs.length} log entries found</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                                    <p className="mt-2 text-gray-600">Loading logs...</p>
                                </div>
                            ) : filteredLogs.length > 0 ? (
                                <div className="space-y-4">
                                    {filteredLogs.map((log) => (
                                        <div key={log.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <h3 className="font-medium">{log.user}</h3>
                                                    {log.user_role && (
                                                        <Badge variant="outline" className="capitalize">
                                                            {log.user_role}
                                                        </Badge>
                                                    )}
                                                    <Badge variant={getSeverityBadgeVariant(log.severity)}>
                                                        {log.severity}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600 mt-1">{log.action}</p>
                                                <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500">{log.time}</p>
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-medium hover:bg-blue-100 transition-colors mt-2"
                                                    onClick={() => {
                                                        setSelectedLog(log);
                                                        setIsDetailsOpen(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View Details
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Activity className="h-12 w-12 text-gray-400 mx-auto" />
                                    <h3 className="mt-2 text-lg font-medium">No logs found</h3>
                                    <p className="text-gray-500">Try adjusting your filters</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Details Dialog */}
                    <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                        <DialogContent className="max-w-2xl bg-white">
                            <DialogHeader>
                                <DialogTitle className="flex items-center">
                                    <Activity className="mr-2 h-5 w-5" />
                                    Activity Log Details
                                </DialogTitle>
                                <DialogDescription>
                                    Detailed information about the selected activity log entry
                                </DialogDescription>
                            </DialogHeader>

                            {selectedLog && (
                                <div className="space-y-6">
                                    {/* Basic Information */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">User</label>
                                            <p className="text-sm">{selectedLog.user}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Role</label>
                                            <p className="text-sm capitalize">{selectedLog.user_role || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Action</label>
                                            <p className="text-sm">{selectedLog.action}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Module</label>
                                            <p className="text-sm">{selectedLog.module || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Severity</label>
                                            <Badge variant={getSeverityBadgeVariant(selectedLog.severity)}>
                                                {selectedLog.severity.toUpperCase()}
                                            </Badge>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium text-gray-500">Timestamp</label>
                                            <p className="text-sm">{selectedLog.time}</p>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div>
                                        <label className="text-sm font-medium text-gray-500">Details</label>
                                        <p className="text-sm mt-1 p-3 bg-gray-100 rounded">{selectedLog.details}</p>
                                    </div>

                                    {/* Performance Metrics */}
                                    {(selectedLog.response_time || selectedLog.memory_usage) && (
                                        <div className="border-t pt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                                <Server className="mr-2 h-4 w-4 text-gray-700" />
                                                Performance Metrics
                                            </h4>
                                            <div className="grid grid-cols-2 gap-4">
                                                {selectedLog.response_time && (
                                                    <div className="flex items-center">
                                                        <Clock className="mr-2 h-4 w-4 text-blue-700" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Response Time</p>
                                                            <p className="text-sm font-medium">{selectedLog.response_time.toFixed(2)}s</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedLog.memory_usage && (
                                                    <div className="flex items-center">
                                                        <Cpu className="mr-2 h-4 w-4 text-green-700" />
                                                        <div>
                                                            <p className="text-xs text-gray-500">Memory Usage</p>
                                                            <p className="text-sm font-medium">{(selectedLog.memory_usage / 1024 / 1024).toFixed(2)} MB</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Network Information */}
                                    {(selectedLog.ip_address || selectedLog.request_method || selectedLog.request_url) && (
                                        <div className="border-t pt-4">
                                            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                                                <Globe className="mr-2 h-4 w-4 text-gray-700" />
                                                Network Information
                                            </h4>
                                            <div className="space-y-2">
                                                {selectedLog.request_method && selectedLog.request_url && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">Request</p>
                                                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                                                            {selectedLog.request_method} {selectedLog.request_url}
                                                        </code>
                                                    </div>
                                                )}
                                                {selectedLog.ip_address && (
                                                    <div>
                                                        <p className="text-xs text-gray-500">IP Address</p>
                                                        <p className="text-sm">{selectedLog.ip_address}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </HospitalLayout>
    );
}