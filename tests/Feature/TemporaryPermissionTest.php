<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Permission;
use App\Models\TemporaryPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Carbon\Carbon;

class TemporaryPermissionTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $regularUser;
    protected $permission;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create(['role' => 'Super Admin']);
        $this->regularUser = User::factory()->create(['role' => 'Reception Admin']);
        $this->permission = Permission::create([
            'name' => 'temporary-test-permission',
            'description' => 'Permission for testing temporary grants'
        ]);
    }

    /** @test */
    public function admin_can_grant_temporary_permission()
    {
        $expiresAt = now()->addHours(2);

        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => $this->regularUser->id,
                'permission_id' => $this->permission->id,
                'expires_at' => $expiresAt->toISOString(),
                'reason' => 'Testing temporary permissions',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => 'Temporary permission granted successfully.',
                'permission' => $this->permission->name,
                'user' => $this->regularUser->name,
            ]);

        $this->assertDatabaseHas('temporary_permissions', [
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'reason' => 'Testing temporary permissions',
            'is_active' => true,
        ]);
    }

    /** @test */
    public function user_with_temporary_permission_has_access()
    {
        // Grant temporary permission
        TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now(),
            'expires_at' => now()->addHours(1),
            'reason' => 'Test access',
            'is_active' => true,
        ]);

        // User should have the permission
        $this->assertTrue($this->regularUser->fresh()->hasPermission($this->permission->name));
    }

    /** @test */
    public function expired_temporary_permission_denies_access()
    {
        // Grant temporary permission that expires immediately
        TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now()->subHours(2),
            'expires_at' => now()->subHours(1), // Already expired
            'reason' => 'Test expired',
            'is_active' => true,
        ]);

        // User should not have the permission
        $this->assertFalse($this->regularUser->fresh()->hasPermission($this->permission->name));
    }

    /** @test */
    public function revoked_temporary_permission_denies_access()
    {
        $tempPermission = TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now(),
            'expires_at' => now()->addHours(1),
            'reason' => 'Test revoke',
            'is_active' => true,
        ]);

        // User should have permission initially
        $this->assertTrue($this->regularUser->fresh()->hasPermission($this->permission->name));

        // Revoke the permission
        $response = $this->actingAs($this->adminUser)
            ->deleteJson(route('api.admin.permissions.revoke-temporary', $tempPermission->id));

        $response->assertStatus(200)
            ->assertJson(['success' => 'Temporary permission revoked successfully.']);

        // Check permission is revoked in database
        $this->assertDatabaseHas('temporary_permissions', [
            'id' => $tempPermission->id,
            'is_active' => false,
        ]);

        // User should not have permission anymore
        $this->assertFalse($this->regularUser->fresh()->hasPermission($this->permission->name));
    }

    /** @test */
    public function cannot_grant_duplicate_active_temporary_permission()
    {
        // Grant first temporary permission
        TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now(),
            'expires_at' => now()->addHours(1),
            'reason' => 'First grant',
            'is_active' => true,
        ]);

        // Try to grant the same permission again
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => $this->regularUser->id,
                'permission_id' => $this->permission->id,
                'expires_at' => now()->addHours(2)->toISOString(),
                'reason' => 'Duplicate grant attempt',
            ]);

        $response->assertStatus(400)
            ->assertJson(['error' => 'User already has an active temporary permission for this action.']);
    }

    /** @test */
    public function can_grant_same_permission_after_expiration()
    {
        // Grant temporary permission that expires immediately
        TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now()->subHours(2),
            'expires_at' => now()->subHours(1),
            'reason' => 'Expired grant',
            'is_active' => true,
        ]);

        // Should be able to grant again since it's expired
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => $this->regularUser->id,
                'permission_id' => $this->permission->id,
                'expires_at' => now()->addHours(1)->toISOString(),
                'reason' => 'New grant after expiration',
            ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function can_grant_same_permission_after_revocation()
    {
        $tempPermission = TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now(),
            'expires_at' => now()->addHours(1),
            'reason' => 'Grant to revoke',
            'is_active' => true,
        ]);

        // Revoke it
        $this->actingAs($this->adminUser)
            ->deleteJson(route('api.admin.permissions.revoke-temporary', $tempPermission->id));

        // Should be able to grant again
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => $this->regularUser->id,
                'permission_id' => $this->permission->id,
                'expires_at' => now()->addHours(1)->toISOString(),
                'reason' => 'New grant after revocation',
            ]);

        $response->assertStatus(200);
    }

    /** @test */
    public function admin_can_list_temporary_permissions()
    {
        // Create some temporary permissions
        TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now(),
            'expires_at' => now()->addHours(1),
            'reason' => 'Test list',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson(route('api.admin.permissions.temporary-permissions'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'temporary_permissions' => [
                    '*' => [
                        'id',
                        'user',
                        'permission',
                        'granted_by_user',
                        'granted_at',
                        'expires_at',
                        'reason',
                        'is_active',
                    ]
                ]
            ]);
    }

    /** @test */
    public function admin_can_filter_temporary_permissions_by_user()
    {
        $anotherUser = User::factory()->create();

        // Create permissions for both users
        TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now(),
            'expires_at' => now()->addHours(1),
            'reason' => 'For regular user',
            'is_active' => true,
        ]);

        TemporaryPermission::create([
            'user_id' => $anotherUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now(),
            'expires_at' => now()->addHours(1),
            'reason' => 'For another user',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson(route('api.admin.permissions.temporary-permissions', [
                'user_id' => $this->regularUser->id
            ]));

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(1, $data['temporary_permissions']);
        $this->assertEquals($this->regularUser->id, $data['temporary_permissions'][0]['user_id']);
    }

    /** @test */
    public function admin_can_check_temporary_permission_status()
    {
        // Grant temporary permission
        TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now(),
            'expires_at' => now()->addHours(1),
            'reason' => 'Test check',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.check-temporary-permission'), [
                'user_id' => $this->regularUser->id,
                'permission_name' => $this->permission->name,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'has_permission' => true,
                'temporary_permission' => [
                    'user_id' => $this->regularUser->id,
                    'permission' => ['name' => $this->permission->name],
                    'is_active' => true,
                ]
            ]);
    }

    /** @test */
    public function only_granter_or_super_admin_can_revoke_temporary_permission()
    {
        $anotherAdmin = User::factory()->create(['role' => 'Super Admin']);

        $tempPermission = TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id, // Granted by adminUser
            'granted_at' => now(),
            'expires_at' => now()->addHours(1),
            'reason' => 'Test revoke permissions',
            'is_active' => true,
        ]);

        // Another admin tries to revoke - should fail
        $response = $this->actingAs($anotherAdmin)
            ->deleteJson(route('api.admin.permissions.revoke-temporary', $tempPermission->id));

        $response->assertStatus(403)
            ->assertJson(['error' => 'Unauthorized to revoke this permission.']);

        // Original granter can revoke
        $response = $this->actingAs($this->adminUser)
            ->deleteJson(route('api.admin.permissions.revoke-temporary', $tempPermission->id));

        $response->assertStatus(200);
    }

    /** @test */
    public function temporary_permission_expiration_is_checked_correctly()
    {
        // Create expired permission
        TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now()->subDays(1),
            'expires_at' => now()->subHours(1),
            'reason' => 'Expired permission',
            'is_active' => true,
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.check-temporary-permission'), [
                'user_id' => $this->regularUser->id,
                'permission_name' => $this->permission->name,
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'has_permission' => false,
                'temporary_permission' => null,
            ]);
    }
}
