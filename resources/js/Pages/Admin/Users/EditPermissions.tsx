import { Head, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Shield, CheckCircle, XCircle, Settings, Filter, Search, ChevronDown, ChevronRight, AlertTriangle, Link, Zap, Undo, Layout } from 'lucide-react';
import { PageProps } from '@/types';
import HospitalLayout from '@/layouts/HospitalLayout';
import { useState, useEffect, useCallback } from 'react';

interface Permission {
    id: number;
    name: string;
    description: string;
    resource: string;
    action: string;
    category?: string;
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

interface PermissionTemplate {
    name: string;
    description: string;
    permission_ids: number[];
}

interface PermissionImpact {
    user: {
        id: number;
        name: string;
        role: string;
    };
    changes: {
        added: Permission[];
        removed: Permission[];
        unchanged: Permission[];
    };
    dependency_warnings: string[];
    security_risks: string[];
    impact_level: 'low' | 'medium' | 'high';
    category_summary: {
        current: Record<string, number>;
        proposed: Record<string, number>;
    };
}

interface PermissionCategory {
    name: string;
    permissions: Permission[];
    collapsed: boolean;
    count: number;
    selectedCount: number;
}

export default function UserEditPermissions({ user, allPermissions, userPermissionIds }: EditPermissionsProps) {
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>(userPermissionIds);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [showImpactDialog, setShowImpactDialog] = useState(false);
    const [permissionImpact, setPermissionImpact] = useState<PermissionImpact | null>(null);
    const [undoTimeout, setUndoTimeout] = useState<NodeJS.Timeout | null>(null);
    const [canUndo, setCanUndo] = useState(false);
    const [lastChange, setLastChange] = useState<{ added: number[]; removed: number[] } | null>(null);
    const [categories, setCategories] = useState<PermissionCategory[]>([]);
    const [templates, setTemplates] = useState<Record<string, PermissionTemplate>>({});
    const [showTemplateDialog, setShowTemplateDialog] = useState(false);

    // Group permissions by category
    const groupPermissionsByCategory = useCallback((permissions: Permission[]): PermissionCategory[] => {
        const categoryMap = new Map<string, Permission[]>();

        permissions.forEach(permission => {
            const category = permission.category || 'General';
            if (!categoryMap.has(category)) {
                categoryMap.set(category, []);
            }
            categoryMap.get(category)!.push(permission);
        });

        return Array.from(categoryMap.entries()).map(([name, perms]) => ({
            name,
            permissions: perms,
            collapsed: false,
            count: perms.length,
            selectedCount: perms.filter(p => selectedPermissions.includes(p.id)).length
        })).sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedPermissions]);

    // Initialize categories
    useEffect(() => {
        setCategories(groupPermissionsByCategory(allPermissions));
    }, [allPermissions, groupPermissionsByCategory]);

    // Load permission templates
    useEffect(() => {
        fetch('/admin/users/permission-templates')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setTemplates(data.templates);
                }
            })
            .catch(console.error);
    }, []);

    // Get permission risk level
    const getPermissionRiskLevel = (permission: Permission): 'low' | 'medium' | 'high' => {
        const highRiskNames = ['manage-users', 'manage-permissions', 'delete-users', 'view-server-management'];
        const mediumRiskNames = ['delete-', 'manage-', 'admin'];

        if (highRiskNames.some(risk => permission.name.includes(risk))) {
            return 'high';
        }
        if (mediumRiskNames.some(risk => permission.name.includes(risk))) {
            return 'medium';
        }
        return 'low';
    };

    // Filter categories based on search term and category filter
    const filteredCategories = categories
        .map(category => ({
            ...category,
            permissions: category.permissions.filter(permission => {
                const matchesSearch = permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                      permission.description.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesCategory = filterCategory === 'all' || permission.category === filterCategory;
                return matchesSearch && matchesCategory && permission.name !== 'view-server-management';
            })
        }))
        .filter(category => category.permissions.length > 0);

    // Get currently selected permissions for display
    const currentPermissions = allPermissions.filter(permission => selectedPermissions.includes(permission.id));

    // Toggle permission with undo functionality
    const togglePermission = (permissionId: number) => {
        const wasSelected = selectedPermissions.includes(permissionId);
        const newPermissions = wasSelected
            ? selectedPermissions.filter(id => id !== permissionId)
            : [...selectedPermissions, permissionId];

        setSelectedPermissions(newPermissions);

        // Set up undo functionality
        if (undoTimeout) {
            clearTimeout(undoTimeout);
        }
        setCanUndo(true);
        setLastChange({
            added: wasSelected ? [] : [permissionId],
            removed: wasSelected ? [permissionId] : []
        });

        const timeout = setTimeout(() => {
            setCanUndo(false);
            setLastChange(null);
        }, 5000); // 5 seconds

        setUndoTimeout(timeout);
    };

    // Undo last change
    const undoLastChange = () => {
        if (lastChange && canUndo) {
            setSelectedPermissions(prev => {
                let newPerms = [...prev];
                // Remove added permissions
                newPerms = newPerms.filter(id => !lastChange.added.includes(id));
                // Add back removed permissions
                newPerms = [...newPerms, ...lastChange.removed];
                return newPerms;
            });
            setCanUndo(false);
            setLastChange(null);
            if (undoTimeout) {
                clearTimeout(undoTimeout);
                setUndoTimeout(null);
            }
        }
    };

    // Apply template
    const applyTemplate = (template: PermissionTemplate) => {
        setSelectedPermissions(template.permission_ids);
        setShowTemplateDialog(false);
    };

    // Analyze impact before submission
    const analyzeImpact = async () => {
        try {
            const response = await fetch('/admin/users/analyze-permission-impact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                },
                body: JSON.stringify({
                    user_id: user.id,
                    proposed_permissions: selectedPermissions
                })
            });

            const data = await response.json();
            if (data.success) {
                setPermissionImpact(data.impact);
                setShowImpactDialog(true);
            }
        } catch (error) {
            console.error('Error analyzing impact:', error);
        }
    };

    // Handle form submission with confirmation
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // Analyze impact first
        await analyzeImpact();

        // Show confirmation dialog
        setShowConfirmDialog(true);
    };

    // Confirm and submit
    const confirmSubmit = () => {
        setShowConfirmDialog(false);
        setShowImpactDialog(false);
        setIsSubmitting(true);

        // Use router.visit with POST method and _method spoofing for PUT
        router.visit(`/admin/users/${user.id}/permissions`, {
            method: 'post',
            data: {
                permissions: selectedPermissions,
                _method: 'PUT',
            },
            onSuccess: () => {
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
            },
            preserveScroll: true,
        });
    };

    // Toggle category collapse
    const toggleCategoryCollapse = (categoryName: string) => {
        setCategories(prev => prev.map(cat =>
            cat.name === categoryName ? { ...cat, collapsed: !cat.collapsed } : cat
        ));
    };

    // Get unique categories for filter dropdown
    const availableCategories = Array.from(new Set(allPermissions.map(p => p.category || 'General'))).sort();

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
                            <Button variant="outline" onClick={() => setShowTemplateDialog(true)} className="gap-2">
                                <Layout className="h-4 w-4" />
                                Templates
                            </Button>
                            {canUndo && (
                                <Button variant="outline" onClick={undoLastChange} className="gap-2 text-orange-600">
                                    <Undo className="h-4 w-4" />
                                    Undo ({Math.ceil((undoTimeout ? 5 : 0))}s)
                                </Button>
                            )}
                            <a href={`/admin/users/${user.id}`}>
                                <Button variant="outline" className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to User
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
                                        {currentPermissions.map(permission => {
                                            const riskLevel = getPermissionRiskLevel(permission);
                                            return (
                                                <div key={permission.id} className="flex items-start justify-between gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                                                    <div className="flex items-center gap-1">
                                                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                                        {riskLevel === 'high' && <AlertTriangle className="h-3 w-3 text-red-500" />}
                                                        {riskLevel === 'medium' && <AlertTriangle className="h-3 w-3 text-orange-500" />}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm truncate">{permission.name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{permission.category || 'General'}</p>
                                                    </div>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => togglePermission(permission.id)}
                                                        className="bg-red-100 hover:bg-red-200 text-white shrink-0"
                                                    >
                                                        <XCircle className="h-4 w-4 mr-1" />
                                                        Remove
                                                    </Button>
                                                </div>
                                            );
                                        })}
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
                            </CardHeader>

                            <CardContent>
                                {/* Filters */}
                                <div className="bg-white mb-6 flex flex-col sm:flex-row gap-4">
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
                                        value={filterCategory}
                                        onChange={(e) => setFilterCategory(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Categories</option>
                                        {availableCategories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Permission Categories */}
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {filteredCategories.length > 0 ? (
                                        <div className="space-y-4">
                                            {filteredCategories.map((category) => (
                                                <Collapsible key={category.name} open={!category.collapsed}>
                                                    <Card className="border">
                                                        <CollapsibleTrigger asChild>
                                                            <CardHeader
                                                                className="cursor-pointer hover:bg-gray-50 transition-colors"
                                                                onClick={() => toggleCategoryCollapse(category.name)}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3">
                                                                        {category.collapsed ? (
                                                                            <ChevronRight className="h-4 w-4" />
                                                                        ) : (
                                                                            <ChevronDown className="h-4 w-4" />
                                                                        )}
                                                                        <CardTitle className="text-lg">{category.name}</CardTitle>
                                                                        <Badge variant="outline">
                                                                            {category.selectedCount}/{category.permissions.length}
                                                                        </Badge>
                                                                    </div>
                                                                </div>
                                                            </CardHeader>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent>
                                                            <CardContent className="pt-0">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                                    {category.permissions.map((permission) => {
                                                                        const riskLevel = getPermissionRiskLevel(permission);
                                                                        const isSelected = selectedPermissions.includes(permission.id);

                                                                        return (
                                                                            <div
                                                                                key={permission.id}
                                                                                className={`border rounded-lg p-4 flex items-start space-x-3 cursor-pointer transition-all duration-150 ${
                                                                                    isSelected
                                                                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-100'
                                                                                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                                                                }`}
                                                                                onClick={() => togglePermission(permission.id)}
                                                                            >
                                                                                <div className="flex items-center h-5 mt-0.5">
                                                                                    {isSelected ? (
                                                                                        <div className="w-5 h-5 bg-blue-500 border border-blue-500 rounded-sm flex items-center justify-center">
                                                                                            <CheckCircle className="w-4 h-4 text-white" />
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="w-5 h-5 border border-gray-300 rounded-sm"></div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <label className="text-sm font-medium leading-none cursor-pointer">
                                                                                            {permission.name}
                                                                                        </label>
                                                                                        {riskLevel === 'high' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                                                                                        {riskLevel === 'medium' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                                                                                    </div>
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
                                                                                        {permission.category && (
                                                                                            <Badge variant="secondary" className="text-xs">
                                                                                                {permission.category}
                                                                                            </Badge>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </CardContent>
                                                        </CollapsibleContent>
                                                    </Card>
                                                </Collapsible>
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
                                        <Button type="button" variant="outline" onClick={analyzeImpact}>
                                            <Zap className="h-4 w-4 mr-2" />
                                            Analyze Impact
                                        </Button>
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

                {/* Impact Analysis Dialog */}
                <Dialog open={showImpactDialog} onOpenChange={setShowImpactDialog}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-orange-500" />
                                Permission Change Impact Analysis
                            </DialogTitle>
                            <DialogDescription>
                                Review the impact of your permission changes before proceeding.
                            </DialogDescription>
                        </DialogHeader>

                        {permissionImpact && (
                            <div className="space-y-4">
                                {/* Impact Level */}
                                <Alert className={permissionImpact.impact_level === 'high' ? 'border-red-200 bg-red-50' :
                                                permissionImpact.impact_level === 'medium' ? 'border-orange-200 bg-orange-50' :
                                                'border-green-200 bg-green-50'}>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        <strong>Impact Level: {permissionImpact.impact_level.toUpperCase()}</strong>
                                        {permissionImpact.impact_level === 'high' && ' - High risk changes detected'}
                                        {permissionImpact.impact_level === 'medium' && ' - Medium risk changes detected'}
                                        {permissionImpact.impact_level === 'low' && ' - Low risk changes'}
                                    </AlertDescription>
                                </Alert>

                                {/* Changes Summary */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">+{permissionImpact.changes.added.length}</div>
                                        <div className="text-sm text-gray-600">Added</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">-{permissionImpact.changes.removed.length}</div>
                                        <div className="text-sm text-gray-600">Removed</div>
                                    </div>
                                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{permissionImpact.changes.unchanged.length}</div>
                                        <div className="text-sm text-gray-600">Unchanged</div>
                                    </div>
                                </div>

                                {/* Warnings */}
                                {(permissionImpact.dependency_warnings.length > 0 || permissionImpact.security_risks.length > 0) && (
                                    <div className="space-y-2">
                                        {permissionImpact.dependency_warnings.map((warning, index) => (
                                            <Alert key={index} className="border-orange-200 bg-orange-50">
                                                <Link className="h-4 w-4" />
                                                <AlertDescription>{warning}</AlertDescription>
                                            </Alert>
                                        ))}
                                        {permissionImpact.security_risks.map((risk, index) => (
                                            <Alert key={index} className="border-red-200 bg-red-50">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertDescription>{risk}</AlertDescription>
                                            </Alert>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowImpactDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={confirmSubmit} className={
                                permissionImpact?.impact_level === 'high' ? 'bg-red-600 hover:bg-red-700' :
                                permissionImpact?.impact_level === 'medium' ? 'bg-orange-600 hover:bg-orange-700' :
                                'bg-green-600 hover:bg-green-700'
                            }>
                                Proceed with Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Confirmation Dialog */}
                <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                    <DialogContent className='bg-white p-6 rounded-lg'>
                        <DialogHeader>
                            <DialogTitle>Confirm Permission Changes</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to update permissions for {user.name}? This action will be logged.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                                Cancel
                            </Button>
                            <Button onClick={confirmSubmit}>
                                Confirm Changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Template Dialog */}
                <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                    <DialogContent className="max-w-2xl bg-white p-6 rounded-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <Layout className="h-5 w-5" />
                                Permission Templates
                            </DialogTitle>
                            <DialogDescription>
                                Apply predefined permission sets to quickly configure user access.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4">
                            {Object.entries(templates).map(([key, template]) => (
                                <Card key={key} className="cursor-pointer hover:bg-gray-50 transition-colors"
                                      onClick={() => applyTemplate(template)}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-semibold">{template.name}</h4>
                                                <p className="text-sm text-gray-600">{template.description}</p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {template.permission_ids.length} permissions
                                                </p>
                                            </div>
                                            <Button size="sm">
                                                Apply Template
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                                Cancel
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </HospitalLayout>
    );
}
