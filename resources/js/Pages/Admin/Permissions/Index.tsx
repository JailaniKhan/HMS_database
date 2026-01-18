import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Edit, Save, RotateCcw } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState } from 'react';
import { Link } from '@inertiajs/react';
import Heading from '@/components/heading';

interface Permission {
    id: number;
    name: string;
    description: string;
}

interface RolePermission {
    [role: string]: number[];
}

interface Props {
    permissions: Permission[];
    roles: string[];
    rolePermissions: RolePermission;
    auth: {
        user: {
            role?: string;
            permissions?: string[];
        };
    };
}

export default function PermissionsIndex({ permissions, roles, rolePermissions, auth }: Props) {
    const [selectedRole, setSelectedRole] = useState<string>(roles[0] || '');
    const [rolePerms, setRolePerms] = useState<RolePermission>(rolePermissions);

    if (!(auth.user.role === 'Super Admin' || auth.user.permissions?.includes('manage-permissions'))) {
        return (
            <HospitalLayout>
                <div className="text-center py-8">
                    <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
                    <p className="text-gray-600">You do not have permission to manage permissions.</p>
                </div>
            </HospitalLayout>
        );
    }
    
    const togglePermission = (permissionId: number) => {
        setRolePerms(prev => {
            const currentPerms = prev[selectedRole] || [];
            const newPerms = currentPerms.includes(permissionId)
                ? currentPerms.filter(id => id !== permissionId)
                : [...currentPerms, permissionId];
            
            return {
                ...prev,
                [selectedRole]: newPerms
            };
        });
    };

    const resetRolePermissions = async () => {
        if (!confirm(`Are you sure you want to reset permissions for ${selectedRole} to default values?`)) {
            return;
        }
        
        try {
            const response = await fetch(`/admin/permissions/roles/${encodeURIComponent(selectedRole)}/reset`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Refresh the page to get updated permissions
                window.location.reload();
            } else {
                alert(result.error || 'Failed to reset permissions');
            }
        } catch (error) {
            console.error('Error resetting role permissions:', error);
            alert('An error occurred while resetting permissions');
        }
    };
    
    const saveRolePermissions = async () => {
        try {
            const response = await fetch(`/admin/permissions/roles/${encodeURIComponent(selectedRole)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    permissions: rolePerms[selectedRole] || []
                })
            });

            if (response.ok) {
                alert(`Permissions for ${selectedRole} saved successfully!`);
            } else {
                alert('Failed to save permissions');
            }
        } catch (error) {
            console.error('Error saving role permissions:', error);
            alert('An error occurred while saving permissions');
        }
    };

    return (
        <HospitalLayout>
            <div className="space-y-6">
                <Head title="Manage Permissions" />
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <Heading title="Permissions Management" />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Roles</CardTitle>
                                <CardDescription>Select a role to manage permissions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {roles.map(role => (
                                        <Button
                                            key={role}
                                            className={`w-full justify-start rounded-lg font-medium hover:bg-blue-100 transition-colors ${selectedRole === role ? 'border-blue-500 bg-blue-50 text-blue-800' : 'bg-blue-50 text-blue-800 border border-blue-200'}`}
                                            onClick={() => setSelectedRole(role)}
                                        >
                                            <User className="h-4 w-4 mr-2" />
                                            <span className="capitalize">{role.replace('_', ' ')}</span>
                                        </Button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                    
                    <div className="lg:col-span-3">
                        <Card>
                            <CardHeader>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle>Permissions for {selectedRole.replace('_', ' ')}</CardTitle>
                                        <CardDescription>Manage permissions assigned to this role</CardDescription>
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors" onClick={resetRolePermissions}>
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Reset to Default
                                        </Button>
                                        <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors" onClick={saveRolePermissions}>
                                            <Save className="h-4 w-4 mr-2" />
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {permissions.filter(permission => permission.name !== 'view-server-management').map(permission => (
                                        <div 
                                            key={permission.id}
                                            className={`p-4 border rounded-md cursor-pointer transition-colors ${
                                                (rolePerms[selectedRole] || []).includes(permission.id)
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-blue-200 hover:bg-blue-50'
                                            }`}
                                            onClick={() => togglePermission(permission.id)}
                                        >
                                            <div className="flex items-start">
                                                <div className={`flex items-center h-5 ${
                                                    (rolePerms[selectedRole] || []).includes(permission.id)
                                                        ? 'text-primary'
                                                        : 'text-muted-foreground'
                                                }`}>
                                                    {(rolePerms[selectedRole] || []).includes(permission.id) ? (
                                                        <div className="w-4 h-4 bg-blue-50 border border-blue-500 rounded-sm flex items-center justify-center">
                                                            <svg className="w-3 h-3 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        <div className="w-4 h-4 border border-blue-200 rounded-sm"></div>
                                                    )}
                                                </div>
                                                <div className="ml-3">
                                                    <div className="flex items-center">
                                                        <h3 className="text-sm font-medium">{permission.name.replace(/_/g, ' ')}</h3>
                                                        <Badge variant="outline" className="ml-2 text-xs">
                                                            {permission.id}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">{permission.description}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                
                                <div className="mt-6 pt-4 border-t">
                                    <h3 className="text-lg font-medium mb-3">Quick Actions</h3>
                                    <div className="flex flex-wrap gap-2">
                                        <Link href={`/admin/permissions/roles/${encodeURIComponent(selectedRole)}`}>
                                            <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                                                <Edit className="h-4 w-4 mr-2" />
                                                Edit Role Permissions
                                            </Button>
                                        </Link>
                                        <Link href="/admin/users">
                                            <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                                                <User className="h-4 w-4 mr-2" />
                                                Manage Users
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}