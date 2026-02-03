import { Head, router } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Lock, 
  Search, 
  Save, 
  RotateCcw, 
  AlertTriangle, 
  Copy, 
  CheckCircle2, 
  Layers,
  Filter,
  History,
  MoreVertical,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { Role, Permission } from '@/types/rbac';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Props {
  permissions: Permission[];
  roles: Role[];
  rolePermissions: Record<number, number[]>;
  categories: string[];
  modules: string[];
  legacyRoles: string[];
  legacyRolePermissions: Record<string, number[]>;
}

export default function PermissionsIndex({ 
  permissions, 
  roles, 
  rolePermissions, 
  modules,
  legacyRoles,
  legacyRolePermissions 
}: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState<number | string>(roles[0]?.id || (legacyRoles[0] || ''));
  const [currentRolePerms, setCurrentRolePerms] = useState<number[]>(
    typeof selectedRoleId === 'number' 
      ? (rolePermissions[selectedRoleId] || []) 
      : (legacyRolePermissions[selectedRoleId] || [])
  );
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('new');
  const [filterModule, setFilterModule] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Handle role change
  const handleRoleChange = (roleId: number | string) => {
    setSelectedRoleId(roleId);
    if (typeof roleId === 'number') {
      setCurrentRolePerms(rolePermissions[roleId] || []);
    } else {
      setCurrentRolePerms(legacyRolePermissions[roleId] || []);
    }
  };

  // Toggle individual permission
  const togglePermission = (permissionId: number) => {
    setCurrentRolePerms(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // Bulk operations
  const selectAllInModule = (moduleName: string) => {
    const modulePerms = permissions.filter(p => p.module === moduleName).map(p => p.id);
    setCurrentRolePerms(prev => Array.from(new Set([...prev, ...modulePerms])));
  };

  const deselectAllInModule = (moduleName: string) => {
    const modulePerms = permissions.filter(p => p.module === moduleName).map(p => p.id);
    setCurrentRolePerms(prev => prev.filter(id => !modulePerms.includes(id)));
  };

  // Filtering logic
  const filteredPermissions = useMemo(() => {
    return permissions.filter(p => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesModule = filterModule === 'all' || p.module === filterModule;
      const matchesRisk = filterRisk === 'all' || p.risk_level === filterRisk;
      
      return matchesSearch && matchesModule && matchesRisk;
    });
  }, [permissions, searchQuery, filterModule, filterRisk]);

  // Grouped by module
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};
    filteredPermissions.forEach(p => {
      const module = p.module || 'System';
      if (!groups[module]) groups[module] = [];
      groups[module].push(p);
    });
    return groups;
  }, [filteredPermissions]);

  // Save changes
  const handleSave = () => {
    setIsSaving(true);
    router.put(`/admin/permissions/roles/${selectedRoleId}`, {
      permissions: currentRolePerms
    }, {
      onSuccess: () => {
        setIsSaving(false);
        // Refresh mapping from props is handled by Inertia
      },
      onError: () => {
        setIsSaving(false);
        alert('Failed to save permissions');
      }
    });
  };

  const resetToDefault = () => {
    if (confirm('Reset permissions for this role to system defaults?')) {
      router.post(`/admin/permissions/roles/${selectedRoleId}/reset`, {}, {
        onSuccess: () => {
          window.location.reload();
        }
      });
    }
  };

  const copyFromRole = (sourceRoleId: number | string) => {
    const sourcePerms = typeof sourceRoleId === 'number' 
      ? (rolePermissions[sourceRoleId] || []) 
      : (legacyRolePermissions[sourceRoleId] || []);
    
    setCurrentRolePerms(sourcePerms);
    setShowCopyDialog(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <HospitalLayout>
      <Head title="Permissions Management" />
      
      <div className="min-h-screen bg-gray-50/50 p-4 md:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
                <Lock className="h-8 w-8 text-blue-600" />
                Permissions Management
              </h1>
              <p className="text-gray-500">Fine-tune system access and security policies across all roles</p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={resetToDefault}
              >
                <RotateCcw className="h-4 w-4" />
                Reset Defaults
              </Button>
              <Button 
                className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-md"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Sidebar: Role Selection */}
            <div className="lg:col-span-3 space-y-6">
              <Card className="shadow-sm border-gray-200 sticky top-6">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-600" />
                    System Roles
                  </CardTitle>
                  <CardDescription>Select a role to configure</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="w-full rounded-none border-b bg-transparent h-12 p-0">
                      <TabsTrigger 
                        value="new" 
                        className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 h-full"
                      >
                        Normalized
                      </TabsTrigger>
                      <TabsTrigger 
                        value="legacy" 
                        className="flex-1 rounded-none data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-blue-600 h-full"
                      >
                        Legacy
                      </TabsTrigger>
                    </TabsList>
                    
                    <div className="max-h-[600px] overflow-y-auto p-2 space-y-1">
                      <TabsContent value="new" className="mt-0 space-y-1">
                        {roles.map(role => (
                          <button
                            key={role.id}
                            onClick={() => handleRoleChange(role.id)}
                            className={cn(
                              "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                              selectedRoleId === role.id 
                                ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100" 
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              <Shield className={cn("h-4 w-4", selectedRoleId === role.id ? "text-blue-600" : "text-gray-400")} />
                              <span className="truncate">{role.name}</span>
                            </div>
                            {role.is_system && <Badge variant="outline" className="text-[10px] h-4">SYS</Badge>}
                          </button>
                        ))}
                      </TabsContent>
                      
                      <TabsContent value="legacy" className="mt-0 space-y-1">
                        {legacyRoles.map(role => (
                          <button
                            key={role}
                            onClick={() => handleRoleChange(role)}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-all",
                              selectedRoleId === role 
                                ? "bg-amber-50 text-amber-700 shadow-sm border border-amber-100" 
                                : "text-gray-600 hover:bg-gray-100"
                            )}
                          >
                            <History className={cn("h-4 w-4", selectedRoleId === role ? "text-amber-600" : "text-gray-400")} />
                            <span className="capitalize">{role.replace(/_/g, ' ')}</span>
                          </button>
                        ))}
                      </TabsContent>
                    </div>
                  </Tabs>
                </CardContent>
                <CardFooter className="pt-4 border-t bg-gray-50/50 rounded-b-xl">
                  <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <Copy className="h-3.5 w-3.5" />
                        Apply Template
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply Permission Template</DialogTitle>
                        <DialogDescription>
                          Choose an existing role to copy all permissions from. This will replace the current selections.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto py-4">
                        <Label className="text-xs font-bold text-gray-500 uppercase px-1">Normalized Roles</Label>
                        {roles.filter(r => r.id !== selectedRoleId).map(role => (
                          <Button 
                            key={role.id} 
                            variant="ghost" 
                            className="justify-start gap-2 h-10"
                            onClick={() => copyFromRole(role.id)}
                          >
                            <Shield className="h-4 w-4 text-blue-500" />
                            {role.name}
                          </Button>
                        ))}
                        <div className="h-4" />
                        <Label className="text-xs font-bold text-gray-500 uppercase px-1">Legacy Roles</Label>
                        {legacyRoles.filter(r => r !== selectedRoleId).map(role => (
                          <Button 
                            key={role} 
                            variant="ghost" 
                            className="justify-start gap-2 h-10"
                            onClick={() => copyFromRole(role)}
                          >
                            <History className="h-4 w-4 text-amber-500" />
                            {role}
                          </Button>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardFooter>
              </Card>
            </div>

            {/* Main Area: Permissions Grid */}
            <div className="lg:col-span-9 space-y-6">
              
              {/* Search and Global Filters */}
              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row items-center gap-4">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        placeholder="Search by permission name or description..." 
                        className="pl-10 h-11 border-gray-200 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white">
                        <Filter className="h-4 w-4 text-gray-400" />
                        <select 
                          className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                          value={filterModule}
                          onChange={(e) => setFilterModule(e.target.value)}
                        >
                          <option value="all">All Modules</option>
                          {modules.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-white">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <select 
                          className="bg-transparent border-none text-sm font-medium focus:ring-0 cursor-pointer"
                          value={filterRisk}
                          onChange={(e) => setFilterRisk(e.target.value)}
                        >
                          <option value="all">All Risk Levels</option>
                          <option value="low">Low Risk</option>
                          <option value="medium">Medium Risk</option>
                          <option value="high">High Risk</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Categorized Permissions */}
              <div className="space-y-8 pb-20">
                {Object.keys(groupedPermissions).length === 0 ? (
                  <Card className="bg-gray-50 border-dashed">
                    <CardContent className="py-12 flex flex-col items-center text-center">
                      <Search className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900">No permissions found</h3>
                      <p className="text-gray-500">Adjust your search or filters to see more results</p>
                    </CardContent>
                  </Card>
                ) : (
                  Object.entries(groupedPermissions).map(([moduleName, modulePerms]) => (
                    <div key={moduleName} className="space-y-4">
                      <div className="flex items-center justify-between sticky top-0 bg-gray-50/95 backdrop-blur z-10 py-2 border-b">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 p-1.5 rounded-lg">
                            <Layers className="h-5 w-5 text-blue-600" />
                          </div>
                          <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{moduleName}</h2>
                          <Badge variant="secondary" className="bg-gray-200 text-gray-700">
                            {modulePerms.length} Capabilities
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => selectAllInModule(moduleName)}
                          >
                            Select All
                          </Button>
                          <span className="text-gray-300">|</span>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => deselectAllInModule(moduleName)}
                          >
                            Deselect All
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {modulePerms.map(p => {
                          const isSelected = currentRolePerms.includes(p.id);
                          return (
                            <div 
                              key={p.id}
                              onClick={() => togglePermission(p.id)}
                              className={cn(
                                "group relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all cursor-pointer",
                                isSelected 
                                  ? "bg-white border-blue-500 shadow-md ring-4 ring-blue-50" 
                                  : "bg-white border-transparent shadow-sm hover:border-gray-200 hover:shadow-md"
                              )}
                            >
                              <div className="mt-1">
                                <div className={cn(
                                  "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                                  isSelected 
                                    ? "bg-blue-600 border-blue-600" 
                                    : "border-gray-300 bg-gray-50"
                                )}>
                                  {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                                </div>
                              </div>
                              
                              <div className="flex-1 space-y-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <h4 className={cn(
                                    "font-bold text-sm truncate",
                                    isSelected ? "text-blue-900" : "text-gray-900"
                                  )}>
                                    {p.name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                                  </h4>
                                  {p.is_critical && (
                                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed h-8">
                                  {p.description || `Grants user ability to ${p.name.replace(/-/g, ' ')}`}
                                </p>
                                
                                <div className="flex items-center gap-2 pt-2">
                                  <Badge className={cn("text-[10px] px-1.5 h-4 uppercase", getRiskColor(p.risk_level))}>
                                    {p.risk_level}
                                  </Badge>
                                  {p.requires_approval && (
                                    <Badge variant="outline" className="text-[10px] px-1.5 h-4 border-amber-200 text-amber-700 bg-amber-50">
                                      Req. Approval
                                    </Badge>
                                  )}
                                </div>
                              </div>

                              {/* Info Popover */}
                              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full">
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Permission Details</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <div className="px-2 py-1.5 space-y-2">
                                      <div className="text-[10px] font-bold text-gray-400 uppercase">System ID</div>
                                      <code className="text-xs bg-gray-100 p-1 rounded block">{p.id}</code>
                                      
                                      <div className="text-[10px] font-bold text-gray-400 uppercase">Internal Name</div>
                                      <code className="text-xs bg-gray-100 p-1 rounded block">{p.name}</code>
                                      
                                      <div className="text-[10px] font-bold text-gray-400 uppercase">Description</div>
                                      <p className="text-xs text-gray-600 italic">
                                        {p.description || "No detailed description provided for this permission."}
                                      </p>
                                    </div>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </HospitalLayout>
  );
}
