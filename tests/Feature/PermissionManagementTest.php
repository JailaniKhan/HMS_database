<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Permission;
use App\Models\RolePermission;
use App\Models\UserPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $regularUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create permissions
        Permission::create(['name' => 'view-users', 'description' => 'Can view users']);
        Permission::create(['name' => 'create-users', 'description' => 'Can create users']);
        Permission::create(['name' => 'edit-users', 'description' => 'Can edit users']);
        Permission::create(['name' => 'delete-users', 'description' => 'Can delete users']);

        // Create admin user
        $this->adminUser = User::factory()->create(['role' => 'Super Admin']);

        // Create regular user
        $this->regularUser = User::factory()->create(['role' => 'Reception Admin']);
    }

    /** @test */
    public function admin_can_view_permissions_index()
    {
        $response = $this->actingAs($this->adminUser)
            ->get(route('admin.permissions.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('permissions')
            ->has('roles')
            ->has('rolePermissions')
        );
    }

    /** @test */
    public function admin_can_view_edit_role_permissions_form()
    {
        $role = 'Reception Admin';

        $response = $this->actingAs($this->adminUser)
            ->get(route('admin.permissions.edit-role', $role));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('role')
            ->has('permissions')
            ->has('assignedPermissionIds')
            ->where('role', $role)
        );
    }

    /** @test */
    public function admin_can_update_role_permissions()
    {
        $role = 'Reception Admin';
        $permission = Permission::where('name', 'view-users')->first();

        $response = $this->actingAs($this->adminUser)
            ->put(route('admin.permissions.update-role', $role), [
                'permissions' => [$permission->id]
            ]);

        $response->assertRedirect(route('admin.permissions.index'));
        $this->assertDatabaseHas('role_permissions', [
            'role' => $role,
            'permission_id' => $permission->id,
        ]);
    }

    /** @test */
    public function admin_can_reset_role_permissions_to_default()
    {
        $role = 'Reception Admin';

        $response = $this->actingAs($this->adminUser)
            ->post(route('admin.permissions.reset-role', $role));

        $response->assertJson(['success' => true]);
    }

    /** @test */
    public function admin_can_view_edit_user_permissions_form()
    {
        $response = $this->actingAs($this->adminUser)
            ->get(route('admin.permissions.edit-user', $this->regularUser->id));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->has('user')
            ->has('allPermissions')
            ->has('userPermissionIds')
            ->where('user.id', $this->regularUser->id)
        );
    }

    /** @test */
    public function admin_can_update_user_permissions()
    {
        $permission = Permission::where('name', 'edit-users')->first();

        $response = $this->actingAs($this->adminUser)
            ->put(route('admin.permissions.update-user', $this->regularUser->id), [
                'permissions' => [$permission->id]
            ]);

        $response->assertRedirect(route('admin.users.index'));
        $this->assertDatabaseHas('user_permissions', [
            'user_id' => $this->regularUser->id,
            'permission_id' => $permission->id,
            'allowed' => true,
        ]);
    }

    /** @test */
    public function user_permissions_override_role_permissions()
    {
        $permission = Permission::where('name', 'delete-users')->first();

        // First assign to role
        RolePermission::create([
            'role' => $this->regularUser->role,
            'permission_id' => $permission->id,
        ]);

        // User has permission through role
        $this->assertTrue($this->regularUser->fresh()->hasPermission('delete-users'));

        // Now override with user permission set to false
        UserPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $permission->id,
            'allowed' => false,
        ]);

        // User should not have permission due to override
        $this->assertFalse($this->regularUser->fresh()->hasPermission('delete-users'));
    }

    /** @test */
    public function super_admin_has_all_permissions()
    {
        $superAdmin = User::factory()->create(['role' => 'Super Admin']);

        $this->assertTrue($superAdmin->hasPermission('delete-users'));
        $this->assertTrue($superAdmin->hasPermission('non-existent-permission'));
        $this->assertTrue($superAdmin->hasPermission('system-admin'));
    }

    /** @test */
    public function user_has_any_permission_works_correctly()
    {
        $permissions = ['view-users', 'edit-users', 'delete-users'];

        // User has view-users through role
        $this->assertTrue($this->regularUser->hasAnyPermission($permissions));

        // User doesn't have any of these permissions
        $this->assertFalse($this->regularUser->hasAnyPermission(['system-admin', 'manage-roles']));
    }

    /** @test */
    public function user_has_all_permissions_works_correctly()
    {
        // Assign some permissions to role
        $viewPerm = Permission::where('name', 'view-users')->first();
        $editPerm = Permission::where('name', 'edit-users')->first();

        RolePermission::create(['role' => $this->regularUser->role, 'permission_id' => $viewPerm->id]);

        // User has view but not edit
        $this->assertFalse($this->regularUser->fresh()->hasAllPermissions(['view-users', 'edit-users']));

        // Assign edit permission
        RolePermission::create(['role' => $this->regularUser->role, 'permission_id' => $editPerm->id]);

        // Now user has both
        $this->assertTrue($this->regularUser->fresh()->hasAllPermissions(['view-users', 'edit-users']));
    }

    /** @test */
    public function permission_caching_works()
    {
        $permission = Permission::where('name', 'view-users')->first();

        // Initially user doesn't have permission
        $this->assertFalse($this->regularUser->hasPermission('view-users'));

        // Assign permission
        RolePermission::create([
            'role' => $this->regularUser->role,
            'permission_id' => $permission->id,
        ]);

        // Still cached as false (need to clear cache or wait)
        $this->assertFalse($this->regularUser->fresh()->hasPermission('view-users'));

        // Clear cache and check again
        \Illuminate\Support\Facades\Cache::flush();
        $this->assertTrue($this->regularUser->fresh()->hasPermission('view-users'));
    }

    /** @test */
    public function cache_key_includes_user_id_and_permission()
    {
        $user1 = User::factory()->create(['role' => 'Reception Admin']);
        $user2 = User::factory()->create(['role' => 'Reception Admin']);
        $permission = Permission::where('name', 'view-users')->first();

        // Give user1 the permission
        RolePermission::create([
            'role' => $user1->role,
            'permission_id' => $permission->id,
        ]);

        \Illuminate\Support\Facades\Cache::flush();

        // User1 should have permission
        $this->assertTrue($user1->fresh()->hasPermission('view-users'));

        // User2 should not have permission (different cache key)
        $this->assertFalse($user2->fresh()->hasPermission('view-users'));
    }

    /** @test */
    public function cache_expires_after_configured_time()
    {
        $permission = Permission::where('name', 'view-users')->first();

        // Assign permission
        RolePermission::create([
            'role' => $this->regularUser->role,
            'permission_id' => $permission->id,
        ]);

        \Illuminate\Support\Facades\Cache::flush();

        // Check permission (creates cache)
        $this->assertTrue($this->regularUser->fresh()->hasPermission('view-users'));

        // Simulate cache expiration by manually removing the cache key
        $cacheKey = "user_permission:{$this->regularUser->id}:view-users";
        \Illuminate\Support\Facades\Cache::forget($cacheKey);

        // Remove the permission from database
        RolePermission::where('role', $this->regularUser->role)
            ->where('permission_id', $permission->id)
            ->delete();

        // Now permission check should return false (cache miss, fresh data)
        $this->assertFalse($this->regularUser->fresh()->hasPermission('view-users'));
    }

    /** @test */
    public function temporary_permissions_bypass_cache_for_immediate_effect()
    {
        $permission = Permission::create(['name' => 'temp-test-permission']);

        // User doesn't have permission initially
        $this->assertFalse($this->regularUser->fresh()->hasPermission('temp-test-permission'));

        // Grant temporary permission
        TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now(),
            'expires_at' => now()->addHours(1),
            'reason' => 'Cache bypass test',
            'is_active' => true,
        ]);

        // Should have permission immediately (temporary permissions are checked fresh)
        $this->assertTrue($this->regularUser->fresh()->hasPermission('temp-test-permission'));
    }

    /** @test */
    public function user_permission_overrides_bypass_cache()
    {
        $permission = Permission::where('name', 'view-users')->first();

        // Give role permission
        RolePermission::create([
            'role' => $this->regularUser->role,
            'permission_id' => $permission->id,
        ]);

        \Illuminate\Support\Facades\Cache::flush();

        // User has permission through role
        $this->assertTrue($this->regularUser->fresh()->hasPermission('view-users'));

        // Override with user-specific denial
        UserPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $permission->id,
            'allowed' => false,
        ]);

        // Should not have permission (user override checked fresh)
        $this->assertFalse($this->regularUser->fresh()->hasPermission('view-users'));
    }
}
