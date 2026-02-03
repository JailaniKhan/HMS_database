import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Filter,
  Download,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Save,
  RotateCcw,
} from 'lucide-react';
import type { PermissionMatrixRow, Role } from '@/types/rbac';

interface PermissionMatrixProps extends React.HTMLAttributes<HTMLDivElement> {
  data: PermissionMatrixRow[];
  roles: Role[];
  onPermissionToggle?: (roleId: number, permissionId: number, checked: boolean) => void;
  onSaveChanges?: () => void;
  onResetChanges?: () => void;
  isLoading?: boolean;
}

const PermissionMatrix = React.forwardRef<HTMLDivElement, PermissionMatrixProps>(
  (
    {
      className,
      data,
      roles,
      onPermissionToggle,
      onSaveChanges,
      onResetChanges,
      isLoading = false,
      ...props
    },
    ref
  ) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterModule, setFilterModule] = React.useState('all');
    const [editing, setEditing] = React.useState(false);
    const [localData, setLocalData] = React.useState<PermissionMatrixRow[]>(data);

    // Reset local data when props change
    React.useEffect(() => {
      setLocalData(data);
    }, [data]);

    const handlePermissionToggle = (roleId: number, permissionId: number, checked: boolean) => {
      if (!editing) return;
      
      setLocalData(prev => prev.map(row => 
        row.permission_id === permissionId 
          ? {
              ...row,
              roles: row.roles.map(role => 
                role.role_id === roleId 
                  ? { ...role, has_permission: checked }
                  : role
              )
            }
          : row
      ));
      
      onPermissionToggle?.(roleId, permissionId, checked);
    };

    const filteredData = localData.filter(row => {
      const matchesSearch = row.permission_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           row.permission_description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesModule = filterModule === 'all' || row.permission_name.startsWith(filterModule);
      return matchesSearch && matchesModule;
    });

    const getModules = () => {
      const modules = new Set(localData.map(row => 
        row.permission_name.split('.')[0]
      ));
      return Array.from(modules).sort();
    };

    const getRiskLevelColor = (permissionName: string) => {
      if (permissionName.includes('delete') || permissionName.includes('destroy')) {
        return 'text-red-600 bg-red-500/10 border-red-500/30';
      }
      if (permissionName.includes('create') || permissionName.includes('store')) {
        return 'text-orange-600 bg-orange-500/10 border-orange-500/30';
      }
      if (permissionName.includes('update') || permissionName.includes('edit')) {
        return 'text-yellow-600 bg-yellow-500/10 border-yellow-500/30';
      }
      return 'text-blue-600 bg-blue-500/10 border-blue-500/30';
    };

    const calculateRoleStats = (roleId: number) => {
      const total = localData.length;
      const assigned = localData.filter(row => 
        row.roles.find(r => r.role_id === roleId)?.has_permission
      ).length;
      return { total, assigned, percentage: total > 0 ? Math.round((assigned / total) * 100) : 0 };
    };

    return (
      <Card ref={ref} className={cn('overflow-hidden', className)} {...props}>
        <CardHeader className="border-b">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-600" />
                Permission Matrix
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage role-based permissions across the system
              </p>
            </div>
            <div className="flex gap-2">
              {editing && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onResetChanges}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={onSaveChanges}
                    disabled={isLoading}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Changes
                  </Button>
                </>
              )}
              {!editing && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setEditing(true)}
                  className="gap-2"
                >
                  <Edit className="h-4 w-4" />
                  Edit Permissions
                </Button>
              )}
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filterModule} onValueChange={setFilterModule}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {getModules().map(module => (
                    <SelectItem key={module} value={module}>
                      {module.charAt(0).toUpperCase() + module.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px] bg-muted/50 sticky left-0 z-10">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Permission
                    </div>
                  </TableHead>
                  {roles.map(role => (
                    <TableHead 
                      key={role.id} 
                      className="text-center min-w-[120px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-medium">{role.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {calculateRoleStats(role.id).assigned}/{calculateRoleStats(role.id).total}
                        </Badge>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full" 
                            style={{ width: `${calculateRoleStats(role.id).percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row) => (
                    <TableRow key={row.permission_id} className="hover:bg-muted/50">
                      <TableCell className="font-medium bg-background sticky left-0 z-10 border-r">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'p-1 rounded',
                              getRiskLevelColor(row.permission_name)
                            )}>
                              {row.permission_name.includes('view') && <Eye className="h-3 w-3" />}
                              {row.permission_name.includes('create') && <CheckCircle className="h-3 w-3" />}
                              {row.permission_name.includes('update') && <Edit className="h-3 w-3" />}
                              {row.permission_name.includes('delete') && <XCircle className="h-3 w-3" />}
                            </div>
                            <span className="font-medium">{row.permission_name}</span>
                          </div>
                          <p className="text-sm text-muted-foreground ml-6">
                            {row.permission_description}
                          </p>
                        </div>
                      </TableCell>
                      {row.roles.map((rolePermission) => (
                        <TableCell key={rolePermission.role_id} className="text-center">
                          <Checkbox
                            checked={rolePermission.has_permission}
                            onCheckedChange={(checked) => 
                              handlePermissionToggle(
                                rolePermission.role_id, 
                                row.permission_id, 
                                checked as boolean
                              )
                            }
                            disabled={!editing}
                            className={cn(
                              "data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600",
                              !editing && "opacity-70 cursor-not-allowed"
                            )}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={roles.length + 1} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Search className="h-8 w-8 opacity-50" />
                        <p>No permissions found matching your criteria</p>
                        <p className="text-sm">Try adjusting your search or filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Summary Footer */}
          <div className="border-t bg-muted/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
              <div className="flex items-center gap-4">
                <span className="font-medium">
                  Showing {filteredData.length} of {localData.length} permissions
                </span>
                {editing && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Editing Mode Active
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Last updated: Today</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);

PermissionMatrix.displayName = 'PermissionMatrix';

export { PermissionMatrix };