import { Head, Link, router, usePage } from '@inertiajs/react';
import HospitalLayout from '@/layouts/HospitalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Users, 
  Search, 
  Filter,
  UserCheck,
  Shield,
  Mail,
  Calendar,
  Edit
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Role {
  id: number;
  name: string;
  display_name: string;
  priority: number;
}

interface User {
  id: number;
  name: string;
  username?: string;
  email?: string;
  role?: string;
  role_id?: number;
  roleModel?: Role;
  created_at: string;
  last_login_at?: string;
}

interface PaginatedUsers {
  data: User[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Props {
  users: PaginatedUsers | User[];
  roles: Role[];
}

export default function UserAssignments({ users: usersData, roles }: Props) {
  const { props } = usePage();
  const csrfToken = (props as any).csrf?.token; // eslint-disable-line @typescript-eslint/no-explicit-any
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Handle both paginated and non-paginated data
  const users = Array.isArray(usersData) ? usersData : (usersData as PaginatedUsers).data;

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || 
      (user.roleModel && user.roleModel.name === roleFilter) ||
      user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (roleName?: string) => {
    if (!roleName) return 'bg-gray-100 text-gray-800 border-gray-200';
    if (roleName.includes('Super Admin')) return 'bg-red-100 text-red-800 border-red-200';
    if (roleName.includes('Admin')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (roleName.includes('Doctor')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (roleName.includes('Nurse')) return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleRoleChange = (userId: number, newRoleId: string) => {
    if (confirm('Are you sure you want to change this user\'s role?')) {
      router.put(`/admin/rbac/users/${userId}/role`, {
        role_id: parseInt(newRoleId),
        _token: csrfToken,
      }, {
        preserveScroll: true,
      });
    }
  };

  const getRoleDisplayName = (user: User) => {
    if (user.roleModel) {
      return user.roleModel.display_name || user.roleModel.name;
    }
    return user.role || 'No Role';
  };

  return (
    <HospitalLayout>
      <Head title="User Role Assignments" />
      
      <div className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                User Role Assignments
              </h1>
              <p className="text-gray-600 mt-2">Manage user role assignments and permissions</p>
            </div>
            <Link href="/admin/users">
              <Button className="gap-2">
                <UserCheck className="h-4 w-4" />
                Manage Users
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Total Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Shield className="h-4 w-4 text-purple-600" />
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
                  <UserCheck className="h-4 w-4 text-green-600" />
                  Assigned
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.role_id || u.role).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4 text-orange-600" />
                  Filtered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredUsers.length}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Search users by name or username..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map((role) => (
                      <SelectItem key={role.id} value={role.name}>
                        {role.display_name || role.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <div className="grid grid-cols-1 gap-4">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">No users found</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {searchQuery || roleFilter !== 'all' 
                      ? 'Try adjusting your search or filters' 
                      : 'No users available'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {user.name}
                            </h3>
                            <Badge 
                              variant="outline" 
                              className={cn(getRoleBadgeColor(user.roleModel?.name || user.role))}
                            >
                              {getRoleDisplayName(user)}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {(user.email || user.username) && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                <span>{user.email || user.username}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                            </div>
                            {user.last_login_at && (
                              <div className="flex items-center gap-1">
                                <UserCheck className="h-4 w-4" />
                                <span>Last login {new Date(user.last_login_at).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.role !== 'Super Admin' && (
                          <Select
                            value={user.role_id?.toString() || ''}
                            onValueChange={(value) => handleRoleChange(user.id, value)}
                          >
                            <SelectTrigger className="w-[200px]">
                              <SelectValue placeholder="Assign role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.filter(r => r.name !== 'Super Admin').map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                  {role.display_name || role.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        <Link href={`/admin/users/${user.id}/edit`}>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Edit className="h-4 w-4" />
                            Edit User
                          </Button>
                        </Link>
                      </div>
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
