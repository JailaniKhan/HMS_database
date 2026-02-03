import { Head, Link, router } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Key,
  Search,
  MoreVertical,
  Eye
} from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Permission {
  id: number;
  name: string;
  description?: string;
  resource: string;
  action: string;
}

interface Role {
  id: number;
  name: string;
  display_name: string;
  description?: string;
  priority: number;
  users_count: number;
  permissions: Permission[];
  created_at: string;
  updated_at: string;
}

interface Props {
  roles: Role[];
}

export default function RolesIndex({ roles }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    role.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = (roleId: number) => {
    if (confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      router.delete(`/admin/roles/${roleId}`, {
        preserveScroll: true,
      });
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 90) return 'bg-red-100 text-red-800 border-red-200';
    if (priority >= 70) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (priority >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (priority >= 30) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <HospitalLayout>
      <Head title="Role Management" />
      
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-600" />
                Role Management
              </h1>
              <p className="text-gray-600 mt-2">Manage roles and their permissions</p>
            </div>
            <Link href="/admin/roles/create">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create New Role
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-600" />
                  Total Roles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{roles.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {roles.reduce((sum, role) => sum + role.users_count, 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Key className="h-4 w-4 text-purple-600" />
                  Avg Permissions/Role
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {roles.length > 0 
                    ? Math.round(roles.reduce((sum, role) => sum + role.permissions.length, 0) / roles.length)
                    : 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Roles List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredRoles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No roles found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchQuery ? 'Try adjusting your search query' : 'Create your first role to get started'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRoles.map((role) => (
                <Card key={role.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {role.display_name}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={cn(getPriorityColor(role.priority))}
                          >
                            Priority: {role.priority}
                          </Badge>
                          {role.name === 'Super Admin' && (
                            <Badge className="bg-red-100 text-red-800 border-red-200">
                              Protected
                            </Badge>
                          )}
                        </div>
                        
                        {role.description && (
                          <p className="text-gray-600 mb-4">{role.description}</p>
                        )}

                        <div className="flex items-center gap-6 text-sm text-gray-500">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>{role.users_count} user{role.users_count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4" />
                            <span>{role.permissions.length} permission{role.permissions.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {role.permissions.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {role.permissions.slice(0, 5).map((permission) => (
                              <Badge key={permission.id} variant="secondary" className="text-xs">
                                {permission.description || permission.name}
                              </Badge>
                            ))}
                            {role.permissions.length > 5 && (
                              <Badge variant="secondary" className="text-xs">
                                +{role.permissions.length - 5} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/roles/${role.id}`} className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          {role.name !== 'Super Admin' && (
                            <>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/roles/${role.id}/edit`} className="flex items-center gap-2">
                                  <Edit className="h-4 w-4" />
                                  Edit Role
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(role.id)}
                                className="text-red-600 flex items-center gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete Role
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </HospitalLayout>
  );
}
