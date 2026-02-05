import { Head, Link, usePage } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, User, Settings, KeyRound, Activity,AlertTriangle, Calendar, Stethoscope, TestTube, BarChart3 } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import axios from 'axios';


interface User {
    id: number;
    name: string;
    email: string;
    role?: string;
    permissions?: string[];
    profile_photo_url?: string;
}

interface Activity {
    id: number;
    user: string;
    action: string;
    time: string;
    role: string;
}

interface AuditLog {
    id: number;
    user: string;
    action: string;
    details: string;
    time: string;
    severity: 'high' | 'low' | 'medium';
}

interface PageProps extends Record<string, unknown> {
    auth: {
        user: User;
    };
}

export default function AdminDashboard() {
    const { auth } = usePage<PageProps>().props;
    const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        // Fetch real data from backend API
        const fetchData = async () => {
            try {
                // Fetch recent activity using Axios
                try {
                    const activityResponse = await axios.get('/api/v1/admin/recent-activity');
                    setRecentActivity(activityResponse.data.slice(0, 5));
                } catch (error) {
                    console.error('Failed to fetch recent activity:', error);
                }
                
                // Fetch audit logs using Axios
                try {
                    const auditResponse = await axios.get('/api/v1/admin/audit-logs');
                    setAuditLogs(auditResponse.data.slice(0, 5));
                    // Clear error state if both API calls succeed
                    setError(null);
                } catch (error) {
                    console.error('Failed to fetch audit logs:', error);
                }
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                if (error instanceof TypeError && error.message.includes('fetch')) {
                    console.warn('Network error or CORS issue detected. Showing sample data.');
                }
                // Set error state to indicate data loading failed
                setError('Failed to load dashboard data. Please refresh the page or contact support if the issue persists.');
                // Clear the previous data to show the error state
                setRecentActivity([]);
                setAuditLogs([]);
            }
        };
        
        fetchData();
    }, []);
    
    // Guard against undefined auth
    if (!auth || !auth.user) {
        return (
            <HospitalLayout>
                <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center py-12">
                            <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
                            <p className="text-gray-600 mb-4">Please log in to access the admin dashboard.</p>
                            <Link href="/login">
                                <Button>Go to Login</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </HospitalLayout>
        );
    }
    
    const getUserRoleBadge = (role: string) => {
        switch(role.toLowerCase()) {
            case 'super admin':
                return <Badge variant="destructive" className="ml-2">SUPER ADMIN</Badge>;
            case 'sub super admin':
                return <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-800">SUB SUPER ADMIN</Badge>;
            case 'reception admin':
                return <Badge variant="secondary" className="ml-2 bg-teal-100 text-teal-800">RECEPTION ADMIN</Badge>;
            case 'reception':
                return <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">RECEPTION</Badge>;
            case 'pharmacy admin':
                return <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-800">PHARMACY</Badge>;
            case 'laboratory admin':
                return <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-800">LABORATORY</Badge>;
            default:
                return <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-800">{role.toUpperCase()}</Badge>;
        }
    };
    
    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Admin Dashboard" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Administrator Dashboard</h1>
                        <p className="text-gray-600 mt-2">Manage system settings users and permissions</p>
                        <div className="mt-4 flex items-center">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={auth?.user?.profile_photo_url} alt={auth?.user?.name || 'User'} />
                                <AvatarFallback>{auth?.user?.name?.charAt(0) || 'U'}</AvatarFallback>
                            </Avatar>
                            <div className="ml-3">
                                <p className="font-medium">{auth?.user?.name || 'Unknown User'}</p>
                                {getUserRoleBadge(auth?.user?.role || 'User')}
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <Link href="/admin/users" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <div>
                                        <CardTitle className="text-lg">User Management</CardTitle>
                                        <CardDescription>Manage system users and roles</CardDescription>
                                    </div>
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <User className="h-6 w-6 text-blue-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button className="bg-blue-50 text-blue-800 border border-blue-200 w-full rounded-lg font-medium hover:bg-blue-100 transition-colors py-2">
                                        Manage Users
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                        <Link href="/admin/settings" className="block">
                            <Card className="hover:shadow-md transition-shadow">
                                <CardHeader className="flex flex-row items-center justify-between pb-4">
                                    <div>
                                        <CardTitle className="text-lg">System Settings</CardTitle>
                                        <CardDescription>Configure system-wide settings</CardDescription>
                                    </div>
                                    <div className="bg-green-100 p-3 rounded-full">
                                        <Settings className="h-6 w-6 text-green-600" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Button className="bg-blue-50 text-blue-800 border border-blue-200 w-full rounded-lg font-medium hover:bg-blue-100 transition-colors py-2">
                                        Configure
                                    </Button>
                                </CardContent>
                            </Card>
                        </Link>
                        
                            <Link href="/admin/security" className="block">
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                                        <div>
                                            <CardTitle className="text-lg">Security Center</CardTitle>
                                            <CardDescription>Manage users & admin accounts</CardDescription>
                                        </div>
                                        <div className="bg-yellow-100 p-3 rounded-full">
                                            <Shield className="h-6 w-6 text-yellow-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="bg-blue-50 text-blue-800 border border-blue-200 w-full rounded-lg font-medium hover:bg-blue-100 transition-colors py-2">
                                            Access Security Center
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        
                        {(auth?.user?.role === 'Super Admin' || auth?.user?.role === 'Sub Super Admin' || auth?.user?.permissions?.includes('manage-permissions')) && (
                            <Link href="/admin/permissions" className="block">
                                <Card className="hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                                        <div>
                                            <CardTitle className="text-lg">Permissions</CardTitle>
                                            <CardDescription>Manage users & admin permissions</CardDescription>
                                        </div>
                                        <div className="bg-purple-100 p-3 rounded-full">
                                            <KeyRound className="h-6 w-6 text-purple-600" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <Button className="bg-blue-50 text-blue-800 border border-blue-200 w-full rounded-lg font-medium hover:bg-blue-100 transition-colors py-2">
                                            Set Permissions
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Link>
                        )}
                    </div>
                    

                    
                    {/* <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                            <Users className="mr-2 h-5 w-5" /> User Management
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="font-medium">Super Admin Protection</h4>
                                <Badge variant="destructive">ACTIVE</Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                                Deletion of Super Admin accounts is restricted. This protection prevents accidental removal of critical administrative accounts.
                            </p>
                            <div className="flex items-center text-sm text-yellow-600 mt-2">
                                <AlertTriangle className="mr-1 h-4 w-4" />
                                Super Admin accounts cannot be deleted through the interface
                            </div>
                        </div>
                    </div> */}
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <Activity className="mr-2 h-5 w-5" /> Recent Activity
                            </h2>
                            <div className="space-y-4">
                                {error ? (
                                    <div className="text-center py-8">
                                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                        <p className="text-red-600 font-medium">{error}</p>
                                        <p className="text-gray-500 mt-2">Data could not be loaded from the server</p>
                                    </div>
                                ) : recentActivity.length > 0 ? (
                                    recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{activity.user}</p>
                                                <p className="text-sm text-gray-600">{activity.action}</p>
                                                <div className="flex items-center mt-1">
                                                    {getUserRoleBadge(activity.role)}
                                                    <span className="text-xs text-gray-500 ml-2">{activity.time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No recent activity found</p>
                                        <p className="text-gray-500 text-sm mt-2">Activity logs will appear here when available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 flex items-center">
                                <BarChart3 className="mr-2 h-5 w-5" /> Audit Logs
                            </h2>
                            <div className="space-y-4">
                                {error ? (
                                    <div className="text-center py-8">
                                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                        <p className="text-red-600 font-medium">{error}</p>
                                        <p className="text-gray-500 mt-2">Data could not be loaded from the server</p>
                                    </div>
                                ) : auditLogs.length > 0 ? (
                                    auditLogs.map((log) => (
                                        <div key={log.id} className="flex items-start justify-between border-b pb-3 last:border-0 last:pb-0">
                                            <div>
                                                <p className="font-medium">{log.user}</p>
                                                <p className="text-sm text-gray-600">{log.action}</p>
                                                <p className="text-xs text-gray-500 mt-1">{log.details}</p>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <Badge variant={log.severity === 'high' ? 'destructive' : 'secondary'} className="capitalize">
                                                    {log.severity}
                                                </Badge>
                                                <span className="text-xs text-gray-500 mt-1">{log.time}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8">
                                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-600">No audit logs found</p>
                                        <p className="text-gray-500 text-sm mt-2">Audit logs will appear here when available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
                        <h2 className="text-xl font-semibold mb-4">Quick Access</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Link href="/admin/users/create" className="block">
                                <Card className="hover:shadow-md transition-shadow p-4 text-center">
                                    <User className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                                    <h3 className="font-medium">Add User</h3>
                                </Card>
                            </Link>
                            <Link href="/patients/create" className="block">
                                <Card className="hover:shadow-md transition-shadow p-4 text-center">
                                    <Stethoscope className="mx-auto h-8 w-8 text-green-600 mb-2" />
                                    <h3 className="font-medium">New Patient</h3>
                                </Card>
                            </Link>
                            <Link href="/appointments/create" className="block">
                                <Card className="hover:shadow-md transition-shadow p-4 text-center">
                                    <Calendar className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                                    <h3 className="font-medium">Schedule</h3>
                                </Card>
                            </Link>
                            <Link href="/lab-tests" className="block">
                                <Card className="hover:shadow-md transition-shadow p-4 text-center">
                                    <TestTube className="mx-auto h-8 w-8 text-orange-600 mb-2" />
                                    <h3 className="font-medium">Lab Tests</h3>
                                </Card>
                            </Link>
                        </div>
                    </div>
                    
                    <div className="bg-white rounded-lg p-6 shadow-sm">
                        <h2 className="text-xl font-semibold mb-4">Administrative Functions</h2>
                        <p className="text-gray-600 mb-4">
                            As an administrator, you have access to advanced system management features including
                            user management, role assignments, and system configuration.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            <Link href="/admin/users">
                                <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-6 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors">Go to User Management</Button>
                            </Link>
                            {(auth?.user?.role === 'Super Admin' || auth?.user?.permissions?.includes('view-activity-logs')) && (
                                <Link href="/admin/activity-logs">
                                    <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-6 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors">View Activity Logs</Button>
                                </Link>
                            )}
                            <Link href="/admin/backup">
                                <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-6 py-3 rounded-lg font-medium hover:bg-blue-100 transition-colors">System Backup</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}