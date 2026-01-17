import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Save, RotateCcw, User } from 'lucide-react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState } from 'react';
import { Link } from '@inertiajs/react';

interface Permission {
    id: number;
    name: string;
    description: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    role: string;
}

interface Props {
    user: User;
    allPermissions: Permission[];
    userPermissionIds: number[];
}

export default function EditUserPermissions({ user, allPermissions, userPermissionIds }: Props) {
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(userPermissionIds);
    
    const togglePermission = (permissionId: number) => {
        setSelectedPermissions(prev => 
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const saveUserPermissions = async () => {
        try {
            const response = await fetch(`/admin/permissions/users/${user.id}`, {
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
                alert(`Permissions for ${user.name} saved successfully!`);
            } else {
                alert('Failed to save permissions');
            }
        } catch (error) {
            console.error('Error saving user permissions:', error);
            alert('An error occurred while saving permissions');
        }
    };

    return (
        <HospitalLayout>
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <Head title={`Edit ${user.name} Permissions`} />
                
                <div className="max-w-7xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">Edit User Permissions</h1>
                        <p className="text-gray-600 mt-2">Manage permissions for user <span className="font-semibold">{user.name}</span> ({user.role})</p>
                    </div>
                    
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <div>
                                    <CardTitle>Permissions for {user.name}</CardTitle>
                                    <CardDescription>Toggle permissions assigned to this user</CardDescription>
                                </div>
                                <div className="flex space-x-2">
                                    <Link href="/admin/users">
                                        <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors">
                                            <RotateCcw className="h-4 w-4 mr-2" />
                                            Back to Users
                                        </Button>
                                    </Link>
                                    <Button className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors" onClick={saveUserPermissions}>
                                        <Save className="h-4 w-4 mr-2" />
                                        Save Changes
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4 p-4 bg-blue-50 rounded-md border border-blue-200">
                                <div className="flex items-center">
                                    <User className="h-5 w-5 text-blue-600 mr-2" />
                                    <div>
                                        <h3 className="font-medium text-blue-800">{user.name}</h3>
                                        <p className="text-sm text-blue-600">{user.email} • Role: {user.role}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {allPermissions.filter(permission => permission.name !== 'view-server-management').map(permission => (
                                    <div 
                                        key={permission.id}
                                        className={`p-4 border rounded-md cursor-pointer ${
                                            selectedPermissions.includes(permission.id)
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-blue-200 hover:bg-blue-50'
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