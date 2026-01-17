import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { PageProps } from '@/types';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState } from 'react';

interface Permission {
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
}

interface EditPermissionsProps extends PageProps {
    user: User;
    allPermissions: Permission[];
    userPermissionIds: number[];
}

export default function UserEditPermissions({ user, allPermissions, userPermissionIds }: EditPermissionsProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(userPermissionIds);

    const togglePermission = (permissionId: number) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        router.put(`/admin/users/${user.id}/permissions`, {
            permissions: selectedPermissions,
        });
    };

    return (
        <HospitalLayout header="Manage User Permissions">
            <Head title={`Manage Permissions - ${user.name}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Manage User Permissions</h1>
                    <div className="flex gap-2">
                        <a href={`/admin/security`}>
                            <Button variant="outline">
                                <Shield className="mr-2 h-4 w-4" />
                                Security Center
                            </Button>
                        </a>
                        <a href={`/admin/users/${user.id}`}>
                            <Button variant="secondary">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to User
                            </Button>
                        </a>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <Shield className="mr-2 h-5 w-5" />
                            User: {user.name} (@{user.username})
                        </CardTitle>
                        <CardDescription>
                            Role: {user.role}. Grant or revoke specific permissions for this user.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium mb-4">Available Permissions</h3>
                                
                                {allPermissions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {allPermissions.filter(permission => permission.name !== 'view-server-management').map((permission) => (
                                            <div
                                                key={permission.id}
                                                className={`border rounded-lg p-4 flex items-start space-x-3 cursor-pointer ${selectedPermissions.includes(permission.id) ? 'border-blue-500 bg-blue-50' : 'border-blue-200'}`}
                                                onClick={() => togglePermission(permission.id)}
                                            >
                                                <div className="flex items-center h-5">
                                                    {selectedPermissions.includes(permission.id) ? (
                                                        <div className="w-4 h-4 bg-blue-50 border border-blue-500 rounded-sm flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <div className="w-4 h-4 border border-blue-200 rounded-sm"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <label 
                                                        htmlFor={`permission-${permission.id}`} 
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        {permission.name}
                                                    </label>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {permission.description}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {permission.resource}
                                                        </Badge>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {permission.action}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No permissions available.</p>
                                )}
                            </div>
                            
                            <div className="flex justify-end space-x-4">
                                <a href={`/admin/users/${user.id}`}>
                                    <Button type="button" variant="secondary">
                                        Cancel
                                    </Button>
                                </a>
                                <Button type="submit">
                                    <Save className="mr-2 h-4 w-4" />
                                    Update Permissions
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </HospitalLayout>
    );
}