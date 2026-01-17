import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Calendar } from 'lucide-react';
import { PageProps } from '@/types';
import HospitalLayout from '@/layouts/HospitalLayout';

interface UserPermission {
    id: number;
    name: string;
    description: string;
    resource: string;
    action: string;
}

interface User {
    id: number;
    name: string;
    username: string;
    role: string;
    created_at: string;
    updated_at: string;
    rolePermissions: {
        permission: UserPermission;
    }[];
}

interface ShowUserProps extends PageProps {
    user: User;
}

export default function UserShow({ user }: ShowUserProps) {
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <HospitalLayout header="User Details">
            <Head title={`User Details - ${user.name}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
                    <Link href="/admin/users">
                        <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Users
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User Information Card */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <User className="mr-2 h-5 w-5" />
                                User Information
                            </CardTitle>
                            <CardDescription>
                                Basic information about the user
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Full Name</h3>
                                    <p className="text-lg font-semibold">{user.name}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                                    <p className="text-lg font-semibold">{user.username}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">Role</h3>
                                    <div className="pt-1">
                                        <Badge variant="default">
                                            {user.role}
                                        </Badge>
                                    </div>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground">ID</h3>
                                    <p className="text-lg font-semibold">#{user.id}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Created
                                    </h3>
                                    <p className="pt-1">{formatDate(user.created_at)}</p>
                                </div>
                                
                                <div>
                                    <h3 className="text-sm font-medium text-muted-foreground flex items-center">
                                        <Calendar className="mr-2 h-4 w-4" />
                                        Last Updated
                                    </h3>
                                    <p className="pt-1">{formatDate(user.updated_at)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                            <CardDescription>
                                Manage this user account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href={`/admin/users/${user.id}/edit`}>
                                <Button className="bg-blue-50 text-blue-800 border border-blue-200 w-full rounded-lg font-medium hover:bg-blue-100 transition-colors py-2">
                                    <User className="mr-2 h-4 w-4" />
                                    Edit User
                                </Button>
                            </Link>
                            
                            <Link href={`/admin/users/${user.id}/permissions`}>
                                <Button className="bg-blue-50 text-blue-800 border border-blue-200 w-full rounded-lg font-medium hover:bg-blue-100 transition-colors py-2">
                                    Manage Permissions
                                </Button>
                            </Link>
                            
                            <Link href="/admin/users">
                                <Button className="bg-blue-50 text-blue-800 border border-blue-200 w-full rounded-lg font-medium hover:bg-blue-100 transition-colors py-2">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Users
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* User Permissions Section */}
                <Card>
                    <CardHeader>
                        <CardTitle>User Permissions</CardTitle>
                        <CardDescription>
                            Permissions granted to this user based on their role
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {user.rolePermissions && user.rolePermissions.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {user.rolePermissions.map((rolePermission) => (
                                    <div key={rolePermission.permission.id} className="border rounded-lg p-4">
                                        <h4 className="font-medium">{rolePermission.permission.name}</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {rolePermission.permission.description}
                                        </p>
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            <Badge variant="secondary" className="text-xs">
                                                {rolePermission.permission.resource}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs">
                                                {rolePermission.permission.action}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No permissions assigned to this user.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}