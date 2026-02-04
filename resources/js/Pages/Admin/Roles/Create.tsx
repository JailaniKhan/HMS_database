import { useMemo } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ArrowLeft, 
  Save, 
  Lock, 
  Info,
  AlertCircle,
  CheckCircle,
  Loader2,
  Sparkles,
  Eye,
  Trash
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Permission {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

interface Props {
  permissions: Record<string, Permission[]>;
}

export default function RoleCreate({ permissions }: Props) {
  const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
    name: '',
    display_name: '',
    description: '',
    priority: 50,
    permissions: [] as number[],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/admin/roles');
  };

  // Memoize checkbox state to avoid unnecessary recalculations
  const checkboxState = useMemo(() => {
    const state: Record<string, { checked: boolean; indeterminate: boolean }> = {};
    Object.keys(permissions).forEach(resource => {
      const selectedCount = permissions[resource].filter(p => data.permissions.includes(p.id)).length;
      const totalCount = permissions[resource].length;
      state[resource] = {
        checked: selectedCount === totalCount,
        indeterminate: selectedCount > 0 && selectedCount < totalCount,
      };
    });
    return state;
  }, [data.permissions, permissions]);

  const togglePermission = (id: number) => {
    const newPermissions = data.permissions.includes(id)
      ? data.permissions.filter(pId => pId !== id)
      : [...data.permissions, id];
    setData('permissions', newPermissions);
  };

  const toggleResourcePermissions = (resource: string, checked: boolean) => {
    const resourcePermissionIds = permissions[resource].map(p => p.id);
    let newPermissions = [...data.permissions];
    
    if (checked) {
      // Add all resource permissions
      resourcePermissionIds.forEach(id => {
        if (!newPermissions.includes(id)) {
          newPermissions.push(id);
        }
      });
    } else {
      // Remove all resource permissions
      newPermissions = newPermissions.filter(id => !resourcePermissionIds.includes(id));
    }
    
    setData('permissions', newPermissions);
  };

  const isResourceSelected = (resource: string) => checkboxState[resource]?.checked ?? false;
  const isResourcePartiallySelected = (resource: string) => checkboxState[resource]?.indeterminate ?? false;

  return (
    <HospitalLayout>
      <Head title="Create New Role" />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/roles">
                <Button variant="outline" size="sm" className="gap-2 border-gray-200 hover:border-gray-300">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Shield className="h-8 w-8 text-blue-600" />
                    <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500 animate-pulse" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Create New Role</h1>
                    <p className="text-sm text-gray-600">Define a new system role and its capabilities</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Success State */}
            {recentlySuccessful && (
              <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="text-sm">
                  <span className="font-medium text-green-800">Role created successfully!</span>
                </div>
              </div>
            )}
          </div>

          {/* Global Error Display */}
          {Object.keys(errors).length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800">Please fix the following errors:</h3>
                  <ul className="mt-1 text-sm text-red-700 space-y-1">
                    {Object.entries(errors).map(([field, error]) => (
                      <li key={field} className="flex items-center gap-2">
                        <span className="font-medium capitalize">{field}:</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Basic Info */}
              <div className="lg:col-span-1 space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Info className="h-5 w-5 text-blue-600" />
                      Role Details
                    </CardTitle>
                    <CardDescription>Configure the basic information for this role</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Internal Name (Slug) <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={data.name}
                        onChange={e => setData('name', e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                        placeholder="e.g. system-admin"
                        className={cn(
                          "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                          errors.name && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}
                      />
                      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                      <p className="text-xs text-gray-500">Auto-formatted to lowercase with hyphens</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="display_name" className="text-sm font-medium">
                        Display Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="display_name"
                        value={data.display_name}
                        onChange={e => setData('display_name', e.target.value)}
                        placeholder="e.g. System Administrator"
                        className={cn(
                          "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                          errors.display_name && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}
                      />
                      {errors.display_name && <p className="text-xs text-red-500">{errors.display_name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-sm font-medium">
                        Priority Level <span className="text-red-500">*</span>
                      </Label>
                      <div className="grid grid-cols-5 gap-2">
                        {[10, 30, 50, 70, 90].map((priority) => (
                          <Button
                            key={priority}
                            type="button"
                            variant={data.priority === priority ? "default" : "outline"}
                            size="sm"
                            onClick={() => setData('priority', priority)}
                            className={cn(
                              "border-gray-300",
                              errors.priority && "border-red-500"
                            )}
                          >
                            {priority}
                          </Button>
                        ))}
                      </div>
                      {errors.priority && <p className="text-xs text-red-500">{errors.priority}</p>}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Low (10)</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${data.priority}%` }}></div>
                        </div>
                        <span>High (90)</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-medium">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        value={data.description}
                        onChange={e => setData('description', e.target.value)}
                        rows={4}
                        placeholder="Describe the purpose and responsibilities of this role..."
                        className={cn(
                          "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
                          errors.description && "border-red-500 focus:border-red-500 focus:ring-red-500"
                        )}
                      />
                      {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-purple-600" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setData('name', 'admin');
                        setData('display_name', 'Administrator');
                        setData('description', 'Full system administrator with all permissions');
                        setData('priority', 90);
                      }}
                      className="w-full justify-start border-gray-300 hover:border-purple-300"
                    >
                      <Shield className="h-4 w-4 mr-2 text-purple-600" />
                      Set as Admin
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setData('name', 'viewer');
                        setData('display_name', 'Viewer');
                        setData('description', 'Read-only access to system data');
                        setData('priority', 10);
                      }}
                      className="w-full justify-start border-gray-300 hover:border-blue-300"
                    >
                      <Eye className="h-4 w-4 mr-2 text-blue-600" />
                      Set as Viewer
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setData('name', '');
                        setData('display_name', '');
                        setData('description', '');
                        setData('priority', 50);
                        setData('permissions', []);
                      }}
                      className="w-full justify-start border-gray-300 hover:border-red-300"
                    >
                      <Trash className="h-4 w-4 mr-2 text-red-600" />
                      Clear Form
                    </Button>
                  </CardContent>
                </Card>

                <div className="flex flex-col gap-3">
                  <Button 
                    type="submit" 
                    className="w-full gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
                    disabled={processing}
                  >
                    {processing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Create Role
                      </>
                    )}
                  </Button>
                  <Link href="/admin/roles" className="w-full">
                    <Button variant="outline" className="w-full border-gray-300 hover:border-gray-400">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Column: Permissions */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border-gray-200 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lock className="h-5 w-5 text-blue-600" />
                        Permissions Configuration
                      </CardTitle>
                      <CardDescription>
                        Select the capabilities assigned to this role. Higher priority roles override lower ones.
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {data.permissions.length} Selected
                      </Badge>
                      <Badge variant="outline" className="text-gray-600 border-gray-300">
                        {Object.values(permissions).flat().length} Total
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {errors.permissions && (
                      <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-3 text-red-700 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        {errors.permissions}
                      </div>
                    )}

                    <div className="space-y-6">
                      {Object.entries(permissions).map(([resource, resourcePermissions]) => (
                        <div key={resource} className="space-y-4 border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between border-b pb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                                {resource}
                              </h3>
                              <Badge variant="outline" className="text-xs text-gray-600 border-gray-300">
                                {resourcePermissions.length} permissions
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox 
                                id={`select-all-${resource}`}
                                checked={isResourceSelected(resource)}
                                onCheckedChange={(checked) => toggleResourcePermissions(resource, checked as boolean)}
                                className="size-4"
                              />
                              <Label 
                                htmlFor={`select-all-${resource}`} 
                                className="text-xs font-normal cursor-pointer text-gray-500 hover:text-gray-700"
                              >
                                Select All
                              </Label>
                              {isResourcePartiallySelected(resource) && (
                                <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {resourcePermissions.map(permission => (
                              <div 
                                key={permission.id} 
                                className={cn(
                                  "flex items-start gap-3 p-3 rounded-md border transition-all cursor-pointer hover:bg-gray-50 group",
                                  data.permissions.includes(permission.id) 
                                    ? "border-blue-200 bg-blue-50/50" 
                                    : "border-gray-100 hover:border-blue-100"
                                )}
                                onClick={() => togglePermission(permission.id)}
                              >
                                <Checkbox 
                                  checked={data.permissions.includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-0.5 size-4"
                                />
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center justify-between">
                                    <Label 
                                      className="text-sm font-semibold cursor-pointer capitalize group-hover:text-blue-700 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      {permission.action} {resource}
                                    </Label>
                                    {data.permissions.includes(permission.id) && (
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-500 leading-relaxed">
                                    {permission.description || `Grants access to ${permission.action} ${resource}.`}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </form>
        </div>
      </div>
    </HospitalLayout>
  );
}
