import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState } from 'react';
import { Link } from '@inertiajs/react';

interface Permission {
    id: number;
    name: string;
    description: string;
}

interface Props {
    role: string;
    permissions: Permission[];
    assignedPermissionIds: number[];
}

export default function EditRolePermissions({ role, permissions, assignedPermissionIds }: Props) {
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(assignedPermissionIds);
    
    const togglePermission = (permissionId: number) => {
        setSelectedPermissions(prev => 
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const saveRolePermissions = async () => {
        try {
            const response = await fetch(`/admin/permissions/roles/${encodeURIComponent(role)}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    permissions: selectedPermissions
                })
            });
            
            if (response.ok) {
                alert(`Permissions for ${role} saved successfully!`);
            } else {
                alert('Failed to save permissions');
            }
        } catch (error) {
            console.error('Error saving permissions:', error);
            alert('An error occurred while saving permissions');
        }
    };

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title={`Edit ${role} Permissions`} />
                
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Edit Role Permissions</h1>
                        <p className="text-gray-600 mt-2">Manage permissions for the <span className="font-semibold capitalize">{role.replace('_', ' ')}</span> role</p>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Permissions for {role.replace('_', ' ')}</CardTitle>
                                    <CardDescription>Toggle permissions assigned to this role</CardDescription>
                                </div>
                                <div className="flex space-x-2">
                                    <Link href="/admin/permissions">
                                        <Button variant="outline">
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Back to Roles
                                        </Button>
                                    </Link>
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
                                            selectedPermissions.includes(permission.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:bg-gray-50'
                                        }`}
                                        onClick={() => togglePermission(permission.id)}
                                    >
                                        <div className="flex items-start">
                                            <div className={`flex items-center h-5 ${
                                                selectedPermissions.includes(permission.id)
                                                    ? 'text-blue-600'
                                                    : 'text-gray-400'
                                            }`}>
                                                {selectedPermissions.includes(permission.id) ? (
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </HospitalLayout>
    );
}