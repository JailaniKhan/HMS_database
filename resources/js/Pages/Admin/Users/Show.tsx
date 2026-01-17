import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, User, Calendar, Shield, Key, Trash2, Edit, Lock, Info } from 'lucide-react';
import { useState } from 'react';
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
    isSuperAdmin: boolean;
    created_at: string;
    updated_at: string;
    rolePermissions: {
        permission: UserPermission;
    }[];
    userPermissions: UserPermission[];
}

interface ShowUserProps extends PageProps {
    user: User;
    canDelete: boolean;
    canEdit: boolean;
    currentUserRole: string;
}

export default function UserShow({ user, canDelete, canEdit, currentUserRole }: ShowUserProps) {
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/admin/users/${user.id}`, {
            onSuccess: () => {
                setIsDeleteDialogOpen(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
            preserveScroll: true,
        });
    };
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
            
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Profile</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Detailed information about {user.name}</p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/admin/users">
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Users
                                </Button>
                            </Link>
                            
                            {canEdit && (
                                <Link href={`/admin/users/${user.id}/edit`}>
                                    <Button className="gap-2 bg-blue-600 hover:bg-blue-700">
                                        <Edit className="h-4 w-4" />
                                        Edit User
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                    
                    {/* Security Status Banner */}
                    <div className="mb-6">
                        <Alert className={`${user.isSuperAdmin ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                            <Shield className="h-4 w-4" />
                            <AlertDescription>
                                <span className="font-medium">
                                    {user.isSuperAdmin ? '🔒 Protected Account' : '👤 Standard Account'}
                                </span>{' '}
                                - This account {user.isSuperAdmin ? 'cannot be deleted' : 'can be managed normally'}
                            </AlertDescription>
                        </Alert>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* User Information Card */}
                    <Card className="lg:col-span-2 shadow-lg border-0">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center text-xl gap-2">
                                <User className="h-5 w-5 text-blue-600" />
                                Personal Information
                            </CardTitle>
                            <CardDescription>
                                Basic account details and identification information
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Full Name</h3>
                                    <p className="text-lg font-semibold text-gray-900">{user.name}</p>
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Username</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-semibold text-gray-900">{user.username}</span>
                                        <Badge variant="secondary" className="text-xs">@{user.username}</Badge>
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Role & Permissions</h3>
                                    <div className="flex items-center gap-2">
                                        <Badge 
                                            variant={user.isSuperAdmin ? "destructive" : "default"}
                                            className="px-3 py-1 text-sm"
                                        >
                                            {user.role}
                                        </Badge>
                                        {user.isSuperAdmin && (
                                            <Lock className="h-4 w-4 text-red-500" />
                                        )}
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">Account ID</h3>
                                    <p className="text-lg font-mono text-gray-700">#{user.id}</p>
                                </div>
                            </div>
                            
                            <div className="border-t pt-6">
                                <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Account Timeline</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-green-100 rounded-full">
                                            <Calendar className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Created</p>
                                            <p className="text-sm text-gray-600">{formatDate(user.created_at)}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-full">
                                            <Calendar className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Last Updated</p>
                                            <p className="text-sm text-gray-600">{formatDate(user.updated_at)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions Card */}
                    <div className="space-y-6">
                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="h-5 w-5 text-blue-600" />
                                    Account Actions
                                </CardTitle>
                                <CardDescription>
                                    Manage this user account and permissions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Link href={`/admin/users/${user.id}/permissions`}>
                                    <Button 
                                        variant="outline" 
                                        className="w-full gap-2 justify-start h-12"
                                    >
                                        <Key className="h-4 w-4" />
                                        Manage Permissions
                                    </Button>
                                </Link>
                                
                                {canDelete ? (
                                    <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                        <DialogTrigger asChild>
                                            <Button 
                                                variant="destructive" 
                                                className="w-full gap-2 justify-start h-12"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete User
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2">
                                                    <Trash2 className="h-5 w-5 text-red-600" />
                                                    Confirm Account Deletion
                                                </DialogTitle>
                                                <DialogDescription>
                                                    Are you sure you want to delete the account for <strong>{user.name}</strong>? 
                                                    This action cannot be undone and will permanently remove all associated data.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter className="gap-3">
                                                <Button 
                                                    variant="outline" 
                                                    onClick={() => setIsDeleteDialogOpen(false)}
                                                    disabled={isDeleting}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button 
                                                    variant="destructive" 
                                                    onClick={handleDelete}
                                                    disabled={isDeleting}
                                                    className="gap-2"
                                                >
                                                    {isDeleting ? (
                                                        <>
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                            Deleting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Trash2 className="h-4 w-4" />
                                                            Delete Permanently
                                                        </>
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <Button 
                                        variant="outline" 
                                        disabled 
                                        className="w-full gap-2 justify-start h-12 opacity-50 cursor-not-allowed"
                                    >
                                        <Lock className="h-4 w-4" />
                                        Protected Account
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        {/* Security Info Card */}
                        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-blue-900">
                                    <Shield className="h-5 w-5" />
                                    Security Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm text-blue-800">
                                <div className="flex items-start gap-2">
                                    <Lock className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium">Account Protection</p>
                                        <p className="text-blue-700">
                                            {user.isSuperAdmin 
                                                ? 'This is a Super Admin account and cannot be deleted by other users.' 
                                                : 'Standard account with normal deletion permissions.'}
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                    <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium">Your Role</p>
                                        <p className="text-blue-700">You are logged in as <span className="font-semibold">{currentUserRole}</span></p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* User Permissions Section */}
                <div className="space-y-8">
                    {/* Role-Based Permissions */}
                    <Card className="mt-8 shadow-lg border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-purple-600" />
                                Role-Based Permissions
                            </CardTitle>
                            <CardDescription>
                                Permissions granted to this user based on their role ({user.role})
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {user.rolePermissions && user.rolePermissions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {user.rolePermissions.map((rolePermission) => (
                                        <div 
                                            key={`role-${rolePermission.permission.id}`} 
                                            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-gray-900">{rolePermission.permission.name}</h4>
                                                <Badge variant="outline" className="text-xs">
                                                    {rolePermission.permission.action}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3">
                                                {rolePermission.permission.description}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                <Badge variant="secondary" className="text-xs">
                                                    {rolePermission.permission.resource}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <Key className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Role-Based Permissions</h3>
                                    <p className="text-gray-500">This user has no permissions assigned through their role.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* User-Specific Permissions */}
                    <Card className="shadow-lg border-0">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Key className="h-5 w-5 text-green-600" />
                                User-Specific Permissions
                            </CardTitle>
                            <CardDescription>
                                Individual permissions granted specifically to this user
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {user.userPermissions && user.userPermissions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {user.userPermissions.map((permission) => (
                                        <div 
                                            key={`user-${permission.id}`} 
                                            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white border-green-200"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="font-semibold text-gray-900">{permission.name}</h4>
                                                <Badge variant="outline" className="text-xs bg-green-100 border-green-300">
                                                    {permission.action}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mb-3">
                                                {permission.description}
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                <Badge variant="secondary" className="text-xs bg-green-50">
                                                    {permission.resource}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <Key className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No User-Specific Permissions</h3>
                                    <p className="text-gray-500">This user has no individually assigned permissions.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HospitalLayout>
    );
}