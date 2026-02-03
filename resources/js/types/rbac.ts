export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string;
  priority: number;
  is_system: boolean;
  parent_role_id?: number;
  reporting_structure?: string;
  module_access?: string[];
  data_visibility_scope?: string[];
  user_management_capabilities?: string[];
  system_configuration_access?: string[];
  reporting_permissions?: string[];
  role_specific_limitations?: string[];
  created_at?: string;
  updated_at?: string;
  users_count?: number;
  permissions_count?: number;
  parent_role?: Role;
  child_roles?: Role[];
}

export interface Permission {
  id: number;
  name: string;
  description: string;
  module: string;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  requires_approval: boolean;
  is_critical: boolean;
  created_at?: string;
  updated_at?: string;
  roles?: Role[];
}

export interface User {
  id: number;
  name: string;
  email: string;
  role_id: number;
  role?: Role;
  permissions?: Permission[];
  created_at?: string;
  updated_at?: string;
}

export interface RBACStats {
  total_roles: number;
  active_permissions: number;
  assigned_users: number;
  pending_requests: number;
  security_violations: number;
  role_distribution: {
    role_id: number;
    role_name: string;
    user_count: number;
    percentage: number;
  }[];
}

export interface ActivityLog {
  id: number;
  user_id: number;
  user_name: string;
  action: string;
  target_type: string;
  target_id: number;
  target_name: string;
  details: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface PermissionMatrixRow {
  permission_id: number;
  permission_name: string;
  permission_description: string;
  roles: {
    role_id: number;
    role_name: string;
    has_permission: boolean;
  }[];
}