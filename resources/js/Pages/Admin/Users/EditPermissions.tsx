import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, Shield, CheckCircle, XCircle, Settings, Filter, Search } from 'lucide-react';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [filterResource, setFilterResource] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter permissions based on search term and resource
    const filteredPermissions = allPermissions.filter(permission => {
        const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                             permission.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesResource = filterResource === 'all' || permission.resource.toLowerCase() === filterResource.toLowerCase();
        return matchesSearch && matchesResource && permission.name !== 'view-server-management';
    });

    // Get currently selected permissions for display
    const currentPermissions = allPermissions.filter(permission => selectedPermissions.includes(permission.id));

    const togglePermission = (permissionId: number) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId]
        );
    };

    const handleSelectAll = () => {
        const allFilteredIds = filteredPermissions.map(p => p.id);
        setSelectedPermissions(prev => {
            const newSelected = [...new Set([...prev, ...allFilteredIds])];
            return newSelected;
        });
    };

    const handleDeselectAll = () => {
        const allFilteredIds = filteredPermissions.map(p => p.id);
        setSelectedPermissions(prev => prev.filter(id => !allFilteredIds.includes(id)));
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        router.put(`/admin/users/${user.id}/permissions`, {
            permissions: selectedPermissions,
        }, {
            onSuccess: () => {
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
            preserveScroll: true,
        });
    };

    // Get unique resources for filter dropdown
    const resources = Array.from(new Set(allPermissions.map(p => p.resource))).filter(r => r !== 'server-management');

    return (
        <HospitalLayout header="Manage User Permissions">
            <Head title={`Manage Permissions - ${user.name}`} />
            
            <div className="container mx-auto px-4 py-6 max-w-7xl">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage User Permissions</h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-2">Configure specific permissions for {user.name}</p>
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                            <a href={`/admin/users/${user.id}`}>
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to User
                                </Button>
                            </a>
                            
                            <a href="/admin/security">
                                <Button variant="outline" className="gap-2">
                                    <Shield className="h-4 w-4" />
                                    Security Center
                                </Button>
                            </a>
                        </div>
                    </div>

                    {/* User Info Banner */}
                    <Card className="border-blue-200 bg-blue-50">
                        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <Shield className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">User: {user.name}</h3>
                                    <p className="text-sm text-gray-600">@{user.username} • Role: {user.role}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Badge variant={user.isSuperAdmin ? "destructive" : "default"}>
                                    {user.isSuperAdmin ? '🔒 Super Admin' : '👤 Standard User'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Current Permissions Sidebar */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-lg border-0">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                    Current Permissions
                                </CardTitle>
                                <CardDescription>
                                    {currentPermissions.length} permission{currentPermissions.length !== 1 ? 's' : ''} currently assigned
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {currentPermissions.length > 0 ? (
                                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                                        {currentPermissions.map(permission => (
                                            <div key={permission.id} className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate">{permission.name}</p>
                                                    <p className="text-xs text-gray-500 truncate">{permission.resource}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <XCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 text-sm">No permissions assigned</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Permission Selection Area */}
                    <div className="lg:col-span-3">
                        <Card className="shadow-lg border-0">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Settings className="h-5 w-5 text-blue-600" />
                                        Available Permissions
                                    </CardTitle>
                                    <CardDescription>
                                        Select permissions to grant to this user
                                    </CardDescription>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                    <Button variant="outline" size="sm" onClick={handleSelectAll}>
                                        Select All
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                                        Deselect All
                                    </Button>
                                </div>
                            </CardHeader>
                            
                            <CardContent>
                                {/* Filters */}
                                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search permissions..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </div>
                                    </div>
                                    
                                    <select
                                        value={filterResource}
                                        onChange={(e) => setFilterResource(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Resources</option>
                                        {resources.map(resource => (
                                            <option key={resource} value={resource}>{resource}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Permissions Grid */}
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {filteredPermissions.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {filteredPermissions.map((permission) => (
                                                <div
                                                    key={permission.id}
                                                    className={`border rounded-lg p-4 flex items-start space-x-3 cursor-pointer transition-all duration-150 ${
                                                        selectedPermissions.includes(permission.id) 
                                                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100' 
                                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                    }`}
                                                    onClick={() => togglePermission(permission.id)}
                                                >
                                                    <div className="flex items-center h-5 mt-0.5">
                                                        {selectedPermissions.includes(permission.id) ? (
                                                            <div className="w-5 h-5 bg-blue-500 border border-blue-500 rounded-sm flex items-center justify-center">
                                                                <CheckCircle className="w-4 h-4 text-white" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-5 h-5 border border-gray-300 rounded-sm"></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                            {permission.name}
                                                        </label>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {permission.description}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            <Badge variant="outline" className="text-xs">
                                                                {permission.resource}
                                                            </Badge>
                                                            <Badge variant="outline" className="text-xs">
                                                                {permission.action}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="mx-auto h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                                <Filter className="h-6 w-6 text-gray-400" />
                                            </div>
                                            <h3 className="text-lg font-medium text-gray-900 mb-1">No permissions found</h3>
                                            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
                                        </div>
                                    )}
                                    
                                    {/* Action Buttons */}
                                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t">
                                        <a href={`/admin/users/${user.id}`}>
                                            <Button type="button" variant="outline">
                                                Cancel
                                            </Button>
                                        </a>
                                        <Button type="submit" disabled={isSubmitting} className="gap-2">
                                            {isSubmitting ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    Update Permissions ({selectedPermissions.length} selected)
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </HospitalLayout>
    );
}