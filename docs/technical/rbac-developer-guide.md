# RBAC Developer Guide

## Overview

This guide provides comprehensive documentation for implementing and working with the Role-Based Access Control (RBAC) system in the Hospital Management System (HMS). The RBAC system implements a hierarchical role structure with five administrative roles designed for healthcare environments with proper segregation of duties and HIPAA compliance.

## Role Hierarchy

The RBAC system implements the following hierarchical role structure:

```
Level 100: SUPER ADMIN
    └── Level 90: SUB SUPER ADMIN
        └── Level 80: HOSPITAL ADMIN
            ├── Level 60: PHARMACY ADMIN
            ├── Level 60: LABORATORY ADMIN
            └── Level 60: RECEPTION ADMIN
                └── Level 50: DOCTOR
                    └── Level 10: PATIENT
```

## Core Components

### 1. Database Schema

#### Roles Table
```php
Schema::create('roles', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique();
    $table->string('slug')->unique();
    $table->string('description')->nullable();
    $table->boolean('is_system')->default(false);
    $table->integer('priority')->default(0);
    $table->unsignedBigInteger('parent_role_id')->nullable();
    $table->text('reporting_structure')->nullable();
    $table->json('module_access')->nullable();
    $table->json('data_visibility_scope')->nullable();
    $table->json('user_management_capabilities')->nullable();
    $table->json('system_configuration_access')->nullable();
    $table->json('reporting_permissions')->nullable();
    $table->json('role_specific_limitations')->nullable();
    $table->timestamps();
});
```

#### Permissions Table
```php
Schema::create('permissions', function (Blueprint $table) {
    $table->id();
    $table->string('name')->unique();
    $table->string('description')->nullable();
    $table->string('resource');
    $table->string('action');
    $table->string('category');
    $table->string('module')->nullable();
    $table->string('segregation_group')->nullable();
    $table->boolean('requires_approval')->default(false);
    $table->integer('risk_level')->default(1); // 1=low, 2=medium, 3=high
    $table->json('dependencies')->nullable();
    $table->text('hipaa_impact')->nullable();
    $table->boolean('is_critical')->default(false);
    $table->timestamps();
});
```

#### Role-Permission Mapping
```php
Schema::create('role_permission_mappings', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('role_id');
    $table->unsignedBigInteger('permission_id');
    $table->timestamps();
    
    $table->foreign('role_id')->references('id')->on('roles')->onDelete('cascade');
    $table->foreign('permission_id')->references('id')->on('permissions')->onDelete('cascade');
    $table->unique(['role_id', 'permission_id']);
});
```

### 2. Models

#### Role Model
The `Role` model includes relationships and methods for:
- Parent-child role relationships
- Permission management
- Hierarchy traversal
- Capability checking

Key methods:
```php
// Check if role has specific permission
$role->hasPermission('view-users');

// Get all permissions including inherited
$role->getAllPermissions();

// Check management capabilities
$role->canManageUsers();

// Get hierarchy level
$role->getHierarchyLevel();

// Get all subordinate roles recursively
$role->getAllSubordinates();
```

#### Permission Model
The `Permission` model includes:
- Dependency management
- Risk level assessment
- Module categorization
- HIPAA impact tracking

Key methods:
```php
// Check if permission requires approval
$permission->requiresApproval();

// Get risk level description
$permission->getRiskLevelDescription();

// Scopes for querying
Permission::critical()->get();
Permission::byModule('pharmacy')->get();
```

#### User Model Extensions
The `User` model includes RBAC extensions:
```php
// Check if user can manage another user
$user->canManageUser($otherUser);

// Get subordinate roles
$user->getSubordinateRoles();

// Get role reporting relationships
$user->getRoleReportingRelationships();
```

### 3. Services

#### RBACService
Central service for RBAC logic:
```php
$rbacService = new RBACService();

// Validate permission dependencies
$errors = $rbacService->validatePermissionDependencies($permissionIds);

// Check role assignment eligibility
$canAssign = $rbacService->canAssignRole($currentUser, $targetUser, $newRoleId);

// Check segregation violations
$violations = $rbacService->checkSegregationViolations($userId);

// Generate audit reports
$report = $rbacService->generatePermissionAuditReport();
```

### 4. Middleware

#### EnsureRoleBasedAccess
Enforces role-based access control:
```php
// In routes
Route::get('/admin/users', [UserController::class, 'index'])
    ->middleware('ensure.role.based.access:view-users,manage-users');

// In controllers
public function index(Request $request)
{
    // Middleware automatically validates permissions
    return User::all();
}
```

#### EnsureSegregationOfDuties
Prevents segregation of duties violations:
```php
// Applied globally or to specific routes
Route::middleware('ensure.segregation.of.duties')
    ->group(function () {
        // Critical operations that require SoD checking
    });
```

## Implementation Patterns

### 1. Adding New Permissions

1. **Define the permission in seeder**:
```php
[
    'name' => 'new-feature-access',
    'description' => 'Access to new feature',
    'resource' => 'new-feature',
    'action' => 'access',
    'category' => 'New Feature',
    'module' => 'new-feature',
    'segregation_group' => 'feature_management',
    'risk_level' => 2,
    'requires_approval' => false
]
```

2. **Assign to appropriate roles**:
```php
protected function assignRolePermissions(): void
{
    $rolePermissions = [
        'super-admin' => [
            'new-feature-access',
            // other permissions...
        ],
        // other roles...
    ];
}
```

3. **Use in controllers**:
```php
public function newFeature(Request $request)
{
    $request->user()->authorize('new-feature-access');
    // Implementation...
}
```

### 2. Creating Role-Specific Functionality

```php
// In controller methods
public function pharmacyDashboard(Request $request)
{
    $user = $request->user();
    
    // Check role-specific access
    if ($user->roleModel->slug !== 'pharmacy-admin') {
        abort(403, 'Pharmacy admin access required');
    }
    
    // Check specific permission
    $user->authorize('view-pharmacy');
    
    // Implementation...
}
```

### 3. Implementing Hierarchical Checks

```php
public function updateUserRole(Request $request, User $user)
{
    $currentUser = $request->user();
    
    // Check role hierarchy
    if (!$currentUser->canManageUser($user)) {
        abort(403, 'Cannot manage user with equal or higher role');
    }
    
    // Proceed with role update...
}
```

## Security Best Practices

### 1. Principle of Least Privilege
```php
// Always grant minimum required permissions
// Instead of:
$user->authorize('manage-users'); // Too broad

// Use specific permissions:
$user->authorize('view-users');
$user->authorize('edit-users');
```

### 2. Segregation of Duties
```php
// Separate critical operations
// Financial approval should be separate from transaction processing
$user->authorize('approve-financial-transactions'); // Different user
$user->authorize('process-financial-transactions');  // Different user
```

### 3. Defense in Depth
```php
// Multiple layers of security
public function criticalOperation(Request $request)
{
    // 1. Middleware check
    // 2. Explicit authorization
    $request->user()->authorize('perform-critical-operation');
    
    // 3. Additional business logic checks
    if (!$this->passesBusinessRules($request)) {
        abort(403, 'Business rules violation');
    }
    
    // 4. Audit logging
    AuditLog::create([
        'user_id' => $request->user()->id,
        'action' => 'critical_operation',
        'details' => $request->all()
    ]);
}
```

## Testing RBAC

### 1. Unit Tests
```php
class RBACServiceTest extends TestCase
{
    public function test_permission_dependencies()
    {
        $service = new RBACService();
        $permissions = [1, 2, 3]; // permission IDs
        
        $errors = $service->validatePermissionDependencies($permissions);
        $this->assertEmpty($errors);
    }
    
    public function test_role_hierarchy()
    {
        $admin = User::factory()->create(['role' => 'Super Admin']);
        $user = User::factory()->create(['role' => 'Reception']);
        
        $this->assertTrue($admin->canManageUser($user));
        $this->assertFalse($user->canManageUser($admin));
    }
}
```

### 2. Feature Tests
```php
class RBACFeatureTest extends TestCase
{
    public function test_unauthorized_access_is_blocked()
    {
        $user = User::factory()->create(['role' => 'Reception']);
        
        $response = $this->actingAs($user)
            ->get('/admin/users');
            
        $response->assertStatus(403);
    }
    
    public function test_authorized_access_is_allowed()
    {
        $admin = User::factory()->create(['role' => 'Super Admin']);
        
        $response = $this->actingAs($admin)
            ->get('/admin/users');
            
        $response->assertStatus(200);
    }
}
```

## Common Patterns and Anti-Patterns

### ✅ Good Patterns

1. **Use descriptive permission names**:
```php
// Good
'create-patient-records'
'view-laboratory-results'

// Avoid
'crud'
'access'
```

2. **Group related permissions**:
```php
// Group by resource and action
[
    'view-patients',
    'create-patients',
    'edit-patients',
    'delete-patients'
]
```

3. **Use middleware for route protection**:
```php
Route::middleware('check.permission:view-users')
    ->get('/users', [UserController::class, 'index']);
```

### ❌ Anti-Patterns

1. **Avoid role-based checks in business logic**:
```php
// Bad - tightly coupled to roles
if ($user->role === 'Super Admin') {
    // do something
}

// Good - use permissions
if ($user->hasPermission('special-action')) {
    // do something
}
```

2. **Don't hardcode permission names**:
```php
// Bad
$user->hasPermission('view-users');

// Good
const PERMISSION_VIEW_USERS = 'view-users';
$user->hasPermission(PERMISSION_VIEW_USERS);
```

3. **Avoid overly broad permissions**:
```php
// Bad - too broad
'user-management'

// Good - specific
'view-users'
'create-users'
'edit-users'
'delete-users'
```

## Troubleshooting

### Common Issues

1. **Permission not working**:
   - Check if permission exists in database
   - Verify role-permission mapping
   - Clear cache: `php artisan cache:clear`

2. **Role hierarchy issues**:
   - Verify parent_role_id relationships
   - Check role priorities
   - Test with `canManageUser()` method

3. **Segregation violations**:
   - Review permission dependencies
   - Check segregation groups
   - Examine audit logs

### Debugging Commands

```bash
# Check user permissions
php artisan tinker
>>> $user = User::find(1);
>>> $user->getEffectivePermissions();

# Check role hierarchy
>>> $role = Role::where('slug', 'sub-super-admin')->first();
>>> $role->getAllSubordinates();

# Validate permission dependencies
>>> $service = new RBACService();
>>> $service->validatePermissionDependencies([1,2,3]);
```

## Performance Considerations

### Caching
The RBAC system implements caching for better performance:

```php
// Permissions are cached automatically
$user->hasPermission('view-users'); // Cached check

// Clear cache when permissions change
$user->clearPermissionCache();
$rbacService->clearRolePermissionCache($roleId);
```

### Database Indexes
Key indexes for performance:
```php
// Roles table
$table->index('slug');
$table->index('is_system');
$table->index('parent_role_id');

// Permissions table
$table->index('module');
$table->index('segregation_group');

// Role-permission mappings
$table->unique(['role_id', 'permission_id']);
$table->index('role_id');
$table->index('permission_id');
```

## Future Enhancements

Planned improvements:
1. **Dynamic permission creation** through admin UI
2. **Permission templates** for role configuration
3. **Advanced audit trails** with detailed change tracking
4. **Real-time permission monitoring** and alerts
5. **Integration with external identity providers**
6. **Automated role lifecycle management**

This RBAC system provides a solid foundation for secure, scalable access control in healthcare environments while maintaining flexibility for future enhancements.