import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, Edit, Save, RotateCcw } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState } from 'react';
import { Link } from '@inertiajs/react';

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
}

export default function PermissionsIndex({ permissions, roles, rolePermissions }: Props) {
    const [selectedRole, setSelectedRole] = useState<string>(roles[0] || '');
    const [rolePerms, setRolePerms] = useState<RolePermission>(rolePermissions);
    
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

    const saveRolePermissions = () => {
        // In a real implementation, this would make an API call
        console.log(`Saving permissions for role: ${selectedRole}`, rolePerms[selectedRole]);
        alert(`Permissions for ${selectedRole} saved successfully!`);
    };

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title="Manage Permissions" />
                
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Permissions Management</h1>
                        <p className="text-gray-600 mt-2">Manage user roles and their permissions</p>
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
                                            <button
                                                key={role}
                                                className={`w-full text-left p-3 rounded-md ${
                                                    selectedRole === role 
                                                        ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                                                        : 'hover:bg-gray-100'
                                                }`}
                                                onClick={() => setSelectedRole(role)}
                                            >
                                                <div className="flex items-center">
                                                    <User className="h-4 w-4 mr-2" />
                                                    <span className="capitalize">{role.replace('_', ' ')}</span>
                                                </div>
                                            </button>
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
                                            <Button variant="outline" onClick={() => {
                                                // Reset to initial state
                                                setRolePerms(rolePermissions);
                                            }}>
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                                Reset
                                            </Button>
                                            <Button onClick={saveRolePermissions}>
                                                <Save className="h-4 w-4 mr-2" />
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {permissions.map(permission => (
                                            <div 
                                                key={permission.id}
                                                className={`p-4 border rounded-md cursor-pointer ${
                                                    (rolePerms[selectedRole] || []).includes(permission.id)
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:bg-gray-50'
                                                }`}
                                                onClick={() => togglePermission(permission.id)}
                                            >
                                                <div className="flex items-start">
                                                    <div className={`flex items-center h-5 ${
                                                        (rolePerms[selectedRole] || []).includes(permission.id)
                                                            ? 'text-blue-600'
                                                            : 'text-gray-400'
                                                    }`}>
                                                        {(rolePerms[selectedRole] || []).includes(permission.id) ? (
                                                            <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                                                                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                                                </svg>
                                                            </div>
                                                        ) : (
                                                            <div className="w-4 h-4 border border-gray-300 rounded-sm"></div>
                                                        )}
                                                    </div>
                                                    <div className="ml-3">
                                                        <div className="flex items-center">
                                                            <h3 className="text-sm font-medium text-gray-900">{permission.name.replace(/_/g, ' ')}</h3>
                                                            <Badge variant="outline" className="ml-2 text-xs">
                                                                {permission.id}
                                                            </Badge>
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-1">{permission.description}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t">
                                        <h3 className="text-lg font-medium mb-3">Quick Actions</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Link href={`/admin/permissions/roles/${encodeURIComponent(selectedRole)}`}>
                                                <Button variant="outline">
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit Role Permissions
                                                </Button>
                                            </Link>
                                            <Link href="/admin/users">
                                                <Button variant="outline">
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
            </div>
        </HospitalLayout>
    );
}