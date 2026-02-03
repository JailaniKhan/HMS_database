import { Head, Link, router } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Users, 
  Key,
  Calendar,
  Info,
  CheckCircle,
  AlertTriangle,
  Lock,
  Clock,
  UserCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Permission {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

interface User {
  id: number;
  name: string;
  username?: string;
}

interface Role {
  id: number;
  name: string;
  display_name?: string;
  slug: string;
  description?: string;
  priority: number;
  is_system: boolean;
  users_count: number;
  permissions: Permission[];
  users?: User[];
  created_at: string;
  updated_at: string;
}

interface Props {
  role: Role;
}

export default function RoleShow({ role }: Props) {
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete the role "${role.name}"? This action cannot be undone.`)) {
      router.delete(`/admin/roles/${role.id}`);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 70) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (priority >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (priority >= 30) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const groupedPermissions = (role.permissions || []).reduce((acc, permission) => {
    const resource = permission.resource || 'Other';
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission);
    return acc;
  }, {} as Record<string, Permission[]>);

  const isSuperAdmin = role.name === 'Super Admin';

  return (
    <HospitalLayout>
      <Head title={`Role Details - ${role.name}`} />
      
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/admin/roles">
                <Button variant="outline" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Shield className="h-8 w-8 text-blue-600" />
                  {role.display_name || role.name}
                </h1>
                <p className="text-gray-600 mt-1">Detailed configuration and access rights</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {!isSuperAdmin && (
                <>
                  <Link href={`/admin/roles/${role.id}/edit`}>
                    <Button className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Role
                    </Button>
                  </Link>
                  <Button 
                    variant="destructive" 
                    className="gap-2"
                    onClick={handleDelete}
                    disabled={role.users_count > 0}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>

          {isSuperAdmin && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-blue-900">System Protected Role</h3>
                <p className="text-sm text-blue-700">This is a core system role and cannot be modified or deleted. It possesses absolute system authority.</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Role Info */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    Role Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Slug Name</label>
                    <div className="flex items-center gap-2 font-mono text-sm bg-gray-100 p-2 rounded">
                      <Lock className="h-3 w-3 text-gray-400" />
                      {role.slug}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">Priority Level</label>
                    <div>
                      <Badge className={cn(getPriorityColor(role.priority))}>
                        {role.priority} / 100
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-500 uppercase">System Status</label>
                    <div className="flex items-center gap-2">
                      {role.is_system ? (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-200">System Role</Badge>
                      ) : (
                        <Badge variant="outline">Custom Role</Badge>
                      )}
                    </div>
                  </div>

                  {role.description && (
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-gray-500 uppercase">Description</label>
                      <p className="text-sm text-gray-700 leading-relaxed">{role.description}</p>
                    </div>
                  )}

                  <div className="pt-4 border-t space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Created
                      </div>
                      <span>{new Date(role.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Updated
                      </div>
                      <span>{new Date(role.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Assigned Users ({role.users_count})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {role.users && role.users.length > 0 ? (
                    <div className="space-y-3">
                      {role.users.map(user => (
                        <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded transition-colors border border-transparent hover:border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs uppercase">
                              {user.name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{user.name}</span>
                              <span className="text-[10px] text-gray-500 font-mono">{user.username}</span>
                            </div>
                          </div>
                          <Link href={`/admin/users/${user.id}/edit`}>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                      {role.users_count > 10 && (
                        <div className="text-center pt-2">
                          <Link href="/admin/rbac/user-assignments" className="text-xs text-blue-600 hover:underline">
                            View all {role.users_count} users
                          </Link>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 bg-gray-50/50 rounded-lg border border-dashed">
                      <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      <p className="text-xs">No users assigned to this role</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Permissions */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="border-b bg-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Key className="h-6 w-6 text-blue-600" />
                      Assigned Permissions
                    </CardTitle>
                    <Badge variant="outline" className="bg-blue-50">
                      {(role.permissions || []).length} Active Rules
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {(role.permissions || []).length > 0 ? (
                    <div className="space-y-8">
                      {Object.entries(groupedPermissions).map(([resource, permissions]) => (
                        <div key={resource} className="space-y-3">
                          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                            {resource}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {permissions.map(permission => (
                              <div key={permission.id} className="flex items-start gap-3 p-3 bg-white border rounded-lg hover:shadow-sm transition-all group">
                                <div className="p-1.5 rounded bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                                  <CheckCircle className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-medium text-gray-900 leading-none mb-1 capitalize">
                                    {permission.action} {resource}
                                  </span>
                                  {permission.description ? (
                                    <span className="text-xs text-gray-500 line-clamp-1">{permission.description}</span>
                                  ) : (
                                    <span className="text-xs text-gray-400 font-mono">{permission.name}</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 rounded-xl border border-dashed">
                      <div className="p-4 rounded-full bg-amber-50 text-amber-600 mb-4">
                        <AlertTriangle className="h-10 w-10" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900">No Permissions Granted</h3>
                      <p className="text-gray-500 max-w-sm mx-auto mt-2">
                        This role currently has no specific permissions assigned. Users with this role may have extremely limited system access.
                      </p>
                      {!isSuperAdmin && (
                        <Link href={`/admin/roles/${role.id}/edit`} className="mt-6">
                          <Button className="gap-2">
                            <Edit className="h-4 w-4" />
                            Configure Permissions
                          </Button>
                        </Link>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </HospitalLayout>
  );
}
