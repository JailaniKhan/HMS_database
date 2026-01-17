import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Shield } from 'lucide-react';
import { PageProps } from '@/types';
import HospitalLayout from '@/layouts/HospitalLayout';

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
}

interface EditPermissionsProps extends PageProps {
    user: User;
    allPermissions: Permission[];
    userPermissionIds: number[];
}

export default function UserEditPermissions({ user, allPermissions, userPermissionIds }: EditPermissionsProps) {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        // Get all checked permissions
        const permissions: number[] = [];
        const checkboxes = e.currentTarget.querySelectorAll('input[type="checkbox"]:checked');
        checkboxes.forEach((checkbox: Element) => {
            permissions.push(parseInt((checkbox as HTMLInputElement).value));
        });
        
        router.put(`/admin/users/${user.id}/permissions`, {
            permissions: permissions,
        });
    };

    return (
        <HospitalLayout header="Manage User Permissions">
            <Head title={`Manage Permissions - ${user.name}`} />
            
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Manage User Permissions</h1>
                    <a href={`/admin/users/${user.id}`}>
                        <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to User
                        </Button>
                    </a>
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
                                                className={`border rounded-lg p-4 flex items-start space-x-3 ${userPermissionIds.includes(permission.id) ? 'border-blue-500 bg-blue-50' : 'border-blue-200'}`}
                                            >
                                                <Checkbox 
                                                    id={`permission-${permission.id}`}
                                                    value={permission.id.toString()}
                                                    defaultChecked={userPermissionIds.includes(permission.id)}
                                                />
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
                                    <Button type="button" className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                                        Cancel
                                    </Button>
                                </a>
                                <Button type="submit" className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
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