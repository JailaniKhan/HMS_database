# Database Schema: Permission Management System

## Overview

This document describes the complete database schema for the enhanced permission management system, including table structures, relationships, indexes, and constraints.

## Core Permission Tables

### permissions

**Purpose**: Stores all available permissions in the system.

**Structure**:
```sql
CREATE TABLE permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE COMMENT 'Unique permission identifier',
    description TEXT COMMENT 'Human-readable description',
    resource VARCHAR(255) COMMENT 'Target resource (users, patients, etc.)',
    action VARCHAR(255) COMMENT 'Action type (view, create, edit, delete)',
    category VARCHAR(255) COMMENT 'Permission category for grouping',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Indexes**:
- PRIMARY KEY on `id`
- UNIQUE KEY on `name`
- INDEX on `category` (for filtering by category)
- INDEX on `resource` (for resource-based queries)

**Relationships**:
- One-to-many with `role_permissions`
- One-to-many with `user_permissions`
- One-to-many with `temporary_permissions`
- Self-referencing through `permission_dependencies`

### role_permissions

**Purpose**: Maps roles to their assigned permissions (RBAC implementation).

**Structure**:
```sql
CREATE TABLE role_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(255) NOT NULL COMMENT 'Role name (e.g., Super Admin, Reception Admin)',
    permission_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY role_permission_unique (role, permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY on `permission_id`
- UNIQUE KEY on `(role, permission_id)` (prevents duplicate assignments)
- INDEX on `role` (for role-based queries)

**Relationships**:
- Many-to-one with `permissions`

### user_permissions

**Purpose**: Stores user-specific permission overrides.

**Structure**:
```sql
CREATE TABLE user_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    allowed BOOLEAN DEFAULT TRUE COMMENT 'Whether permission is granted or denied',
    granted_by BIGINT UNSIGNED NULL COMMENT 'Admin who granted the permission',
    granted_at TIMESTAMP NULL,
    reason TEXT COMMENT 'Reason for the override',
    expires_at TIMESTAMP NULL COMMENT 'Optional expiration date',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY on `user_id`
- FOREIGN KEY on `permission_id`
- FOREIGN KEY on `granted_by`
- INDEX on `user_id, permission_id` (for permission checks)
- INDEX on `expires_at` (for cleanup queries)
- INDEX on `allowed` (for filtering active permissions)

**Relationships**:
- Many-to-one with `users` (target user)
- Many-to-one with `permissions`
- Many-to-one with `users` (granting admin)

## Temporary Permissions System

### temporary_permissions

**Purpose**: Manages time-limited permission grants.

**Structure**:
```sql
CREATE TABLE temporary_permissions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    permission_id BIGINT UNSIGNED NOT NULL,
    granted_by BIGINT UNSIGNED NOT NULL,
    granted_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NULL,
    reason TEXT NOT NULL COMMENT 'Business justification required',
    is_active BOOLEAN DEFAULT TRUE,
    revoked_by BIGINT UNSIGNED NULL,
    revoked_at TIMESTAMP NULL,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (revoked_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY constraints on all user/permission references
- INDEX on `(user_id, permission_id)` (for duplicate checking)
- INDEX on `expires_at` (for expiration queries)
- INDEX on `is_active` (for active permission queries)
- INDEX on `(user_id, is_active)` (for user's active permissions)

**Relationships**:
- Many-to-one with `users` (recipient)
- Many-to-one with `permissions`
- Many-to-one with `users` (granter)
- Many-to-one with `users` (revoker)

## Approval Workflow System

### permission_change_requests

**Purpose**: Manages the approval workflow for permission changes.

**Structure**:
```sql
CREATE TABLE permission_change_requests (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL COMMENT 'Target user for permission changes',
    requested_by BIGINT UNSIGNED NOT NULL COMMENT 'User who made the request',
    permissions_to_add JSON COMMENT 'Array of permission IDs to add',
    permissions_to_remove JSON COMMENT 'Array of permission IDs to remove',
    reason TEXT NOT NULL COMMENT 'Business justification',
    expires_at TIMESTAMP NULL COMMENT 'Request expiration',
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by BIGINT UNSIGNED NULL,
    approved_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL COMMENT 'When review was completed',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY constraints
- INDEX on `status` (for filtering by status)
- INDEX on `user_id` (for user's requests)
- INDEX on `requested_by` (for requester's requests)
- INDEX on `created_at` (for chronological sorting)
- INDEX on `expires_at` (for expiration queries)

**Relationships**:
- Many-to-one with `users` (target user)
- Many-to-one with `users` (requester)
- Many-to-one with `users` (approver)

## Permission Dependencies

### permission_dependencies

**Purpose**: Defines prerequisite relationships between permissions.

**Structure**:
```sql
CREATE TABLE permission_dependencies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    permission_id BIGINT UNSIGNED NOT NULL COMMENT 'Permission that has dependencies',
    depends_on_permission_id BIGINT UNSIGNED NOT NULL COMMENT 'Required permission',
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    FOREIGN KEY (depends_on_permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    UNIQUE KEY perm_dep_perm_id_dep_on_perm_id_unique (
        permission_id,
        depends_on_permission_id
    )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Indexes**:
- PRIMARY KEY on `id`
- FOREIGN KEY constraints
- UNIQUE KEY on `(permission_id, depends_on_permission_id)` (prevents duplicates)
- INDEX on `permission_id` (for dependency queries)

**Relationships**:
- Many-to-one self-references on `permissions` table

## Security and Audit Tables

### permission_sessions

**Purpose**: Tracks user sessions for permission operations.

**Structure**:
```sql
CREATE TABLE permission_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45) COMMENT 'IPv4 or IPv6 address',
    user_agent TEXT,
    started_at TIMESTAMP NOT NULL,
    ended_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_session (user_id, session_token),
    INDEX idx_active_sessions (is_active, started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### permission_session_actions

**Purpose**: Logs all actions performed within permission sessions.

**Structure**:
```sql
CREATE TABLE permission_session_actions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    action_type VARCHAR(255) NOT NULL COMMENT 'Type of action performed',
    performed_at TIMESTAMP NOT NULL,
    details JSON COMMENT 'Additional action details',
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (session_id) REFERENCES permission_sessions(id) ON DELETE CASCADE,
    INDEX idx_session_actions (session_id, performed_at),
    INDEX idx_action_type (action_type),
    INDEX idx_performed_at (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### permission_ip_restrictions

**Purpose**: Manages IP-based access restrictions.

**Structure**:
```sql
CREATE TABLE permission_ip_restrictions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL COMMENT 'IPv4 or IPv6 address or CIDR range',
    is_allowed BOOLEAN DEFAULT TRUE COMMENT 'Whether IP is allowed or blocked',
    reason TEXT COMMENT 'Reason for restriction',
    created_by BIGINT UNSIGNED NULL,
    expires_at TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NULL,
    updated_at TIMESTAMP NULL,

    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_ip_restrictions (ip_address, is_allowed),
    INDEX idx_active_restrictions (is_active, expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Sample Data

### Default Permissions
```sql
INSERT INTO permissions (name, description, resource, action, category, created_at, updated_at) VALUES
('view-users', 'Can view user accounts', 'users', 'view', 'User Management', NOW(), NOW()),
('create-users', 'Can create new user accounts', 'users', 'create', 'User Management', NOW(), NOW()),
('edit-users', 'Can modify user accounts', 'users', 'edit', 'User Management', NOW(), NOW()),
('delete-users', 'Can delete user accounts', 'users', 'delete', 'User Management', NOW(), NOW()),
('manage-roles', 'Can manage user roles and permissions', 'roles', 'manage', 'Administration', NOW(), NOW()),
('system-admin', 'Full system administrative access', 'system', 'admin', 'Administration', NOW(), NOW());
```

### Default Role Permissions
```sql
INSERT INTO role_permissions (role, permission_id, created_at, updated_at)
SELECT 'Super Admin', id, NOW(), NOW() FROM permissions
UNION ALL
SELECT 'Reception Admin', id, NOW(), NOW() FROM permissions WHERE name IN ('view-users', 'create-users')
UNION ALL
SELECT 'Pharmacy Admin', id, NOW(), NOW() FROM permissions WHERE name IN ('view-users', 'edit-users');
```

### Permission Dependencies
```sql
INSERT INTO permission_dependencies (permission_id, depends_on_permission_id, created_at, updated_at)
SELECT p1.id, p2.id, NOW(), NOW()
FROM permissions p1
JOIN permissions p2 ON p2.name = 'view-users'
WHERE p1.name IN ('edit-users', 'delete-users');
```

## Performance Considerations

### Index Strategy
- **Primary Keys**: Auto-incrementing BIGINT for all tables
- **Foreign Keys**: Indexed automatically by InnoDB
- **Composite Indexes**: For multi-column WHERE clauses
- **Partial Indexes**: For frequently filtered columns
- **Covering Indexes**: Include all columns needed for queries

### Partitioning Strategy (Future Consideration)
```sql
-- Example partitioning for audit tables
ALTER TABLE permission_session_actions
PARTITION BY RANGE (YEAR(performed_at)) (
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### Query Optimization Tips

1. **Permission Checks**: Use indexed lookups with LIMIT 1
2. **Bulk Operations**: Batch INSERT/UPDATE operations
3. **Expiration Cleanup**: Regular cleanup of expired records
4. **Archive Strategy**: Move old audit data to separate tables

## Migration Strategy

### Incremental Migrations
1. **Phase 1**: Core permission tables
2. **Phase 2**: Temporary permissions
3. **Phase 3**: Approval workflow
4. **Phase 4**: Security and audit features

### Backward Compatibility
- Existing permission checks continue to work
- Graceful degradation for missing features
- Data migration scripts for existing permissions

### Rollback Procedures
- Foreign key constraints ensure data integrity
- Soft deletes for reversible operations
- Backup requirements before migrations

## Monitoring and Maintenance

### Table Maintenance
```sql
-- Regular cleanup of expired temporary permissions
DELETE FROM temporary_permissions
WHERE expires_at < NOW() AND is_active = TRUE;

-- Archive old audit data
INSERT INTO permission_session_actions_archive
SELECT * FROM permission_session_actions
WHERE performed_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);
```

### Performance Monitoring
- Monitor slow query logs
- Track index usage statistics
- Analyze table growth patterns
- Set up alerts for unusual activity

This schema provides a comprehensive foundation for role-based access control with advanced features like temporary permissions, approval workflows, and comprehensive audit trails.
