<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Permission;
use App\Models\PermissionChangeRequest;
use App\Models\UserPermission;
use App\Models\PermissionDependency;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionApprovalWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected $adminUser;
    protected $regularUser;
    protected $permissions;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::factory()->create(['role' => 'Super Admin']);
        $this->regularUser = User::factory()->create(['role' => 'Reception Admin']);

        // Create test permissions
        $this->permissions = collect([
            Permission::create(['name' => 'view-users', 'description' => 'Can view users']),
            Permission::create(['name' => 'create-users', 'description' => 'Can create users']),
            Permission::create(['name' => 'edit-users', 'description' => 'Can edit users']),
            Permission::create(['name' => 'delete-users', 'description' => 'Can delete users']),
            Permission::create(['name' => 'manage-roles', 'description' => 'Can manage roles']),
        ]);

        // Create dependency: edit-users requires view-users
        PermissionDependency::create([
            'permission_id' => $this->permissions->where('name', 'edit-users')->first()->id,
            'depends_on_permission_id' => $this->permissions->where('name', 'view-users')->first()->id,
        ]);
    }

    /** @test */
    public function user_can_create_permission_change_request()
    {
        $permissionsToAdd = [$this->permissions->where('name', 'edit-users')->first()->id];
        $permissionsToRemove = [];

        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.change-requests'), [
                'user_id' => $this->regularUser->id,
                'permissions_to_add' => $permissionsToAdd,
                'permissions_to_remove' => $permissionsToRemove,
                'reason' => 'Need to edit user profiles for patient management',
                'expires_at' => now()->addDays(30)->toISOString(),
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'request' => [
                    'id',
                    'user',
                    'requested_by',
                    'permissions_to_add',
                    'permissions_to_remove',
                    'reason',
                    'status',
                    'expires_at',
                ]
            ]);

        $this->assertDatabaseHas('permission_change_requests', [
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'status' => 'pending',
            'reason' => 'Need to edit user profiles for patient management',
        ]);
    }

    /** @test */
    public function permission_change_request_validates_dependencies()
    {
        // Try to add edit-users without view-users
        $editPermissionId = $this->permissions->where('name', 'edit-users')->first()->id;

        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.change-requests'), [
                'user_id' => $this->regularUser->id,
                'permissions_to_add' => [$editPermissionId],
                'permissions_to_remove' => [],
                'reason' => 'Test dependency validation',
            ]);

        $response->assertStatus(400)
            ->assertJson(['error' => 'Permission dependencies not satisfied: edit-users requires view-users']);
    }

    /** @test */
    public function permission_change_request_fails_without_permissions()
    {
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.change-requests'), [
                'user_id' => $this->regularUser->id,
                'permissions_to_add' => [],
                'permissions_to_remove' => [],
                'reason' => 'No permissions specified',
            ]);

        $response->assertStatus(400)
            ->assertJson(['error' => 'At least one permission must be added or removed.']);
    }

    /** @test */
    public function admin_can_list_permission_change_requests()
    {
        // Create a request
        PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permissions->first()->id],
            'permissions_to_remove' => [],
            'reason' => 'Test listing',
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson(route('api.admin.permissions.change-requests'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'permission_change_requests' => [
                    '*' => [
                        'id',
                        'user',
                        'requested_by',
                        'status',
                        'created_at',
                    ]
                ]
            ]);
    }

    /** @test */
    public function admin_can_filter_requests_by_status()
    {
        // Create requests with different statuses
        PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permissions->first()->id],
            'permissions_to_remove' => [],
            'reason' => 'Pending request',
            'status' => 'pending',
        ]);

        PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permissions->skip(1)->first()->id],
            'permissions_to_remove' => [],
            'reason' => 'Approved request',
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson(route('api.admin.permissions.change-requests', ['status' => 'pending']));

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertCount(1, $data['permission_change_requests']);
        $this->assertEquals('pending', $data['permission_change_requests'][0]['status']);
    }

    /** @test */
    public function admin_can_view_specific_permission_change_request()
    {
        $request = PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permissions->first()->id],
            'permissions_to_remove' => [],
            'reason' => 'Test view details',
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($this->adminUser)
            ->getJson(route('api.admin.permissions.change-requests.show', $request->id));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'permission_change_request' => [
                    'id',
                    'user',
                    'requested_by',
                    'approved_by',
                    'permissions_to_add',
                    'permissions_to_remove',
                    'reason',
                    'status',
                    'expires_at',
                    'created_at',
                ]
            ]);
    }

    /** @test */
    public function admin_can_approve_permission_change_request()
    {
        $request = PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permissions->where('name', 'view-users')->first()->id],
            'permissions_to_remove' => [],
            'reason' => 'Need to view users',
            'status' => 'pending',
            'expires_at' => now()->addDays(7),
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.change-requests.approve', $request->id));

        $response->assertStatus(200)
            ->assertJson(['success' => 'Permission change request approved successfully.']);

        // Check request status
        $this->assertDatabaseHas('permission_change_requests', [
            'id' => $request->id,
            'status' => 'approved',
            'approved_by' => $this->adminUser->id,
        ]);

        // Check user permissions were added
        $this->assertDatabaseHas('user_permissions', [
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permissions->where('name', 'view-users')->first()->id,
            'allowed' => true,
        ]);
    }

    /** @test */
    public function admin_can_reject_permission_change_request()
    {
        $request = PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permissions->first()->id],
            'permissions_to_remove' => [],
            'reason' => 'Test rejection',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.change-requests.reject', $request->id));

        $response->assertStatus(200)
            ->assertJson(['success' => 'Permission change request rejected successfully.']);

        $this->assertDatabaseHas('permission_change_requests', [
            'id' => $request->id,
            'status' => 'rejected',
            'approved_by' => $this->adminUser->id,
        ]);
    }

    /** @test */
    public function cannot_approve_expired_request()
    {
        $request = PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permissions->first()->id],
            'permissions_to_remove' => [],
            'reason' => 'Expired request',
            'status' => 'pending',
            'expires_at' => now()->subDay(), // Already expired
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.change-requests.approve', $request->id));

        $response->assertStatus(400)
            ->assertJson(['error' => 'Request is no longer valid.']);
    }

    /** @test */
    public function cannot_approve_already_processed_request()
    {
        $request = PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permissions->first()->id],
            'permissions_to_remove' => [],
            'reason' => 'Already approved',
            'status' => 'approved', // Already approved
            'approved_by' => $this->adminUser->id,
            'approved_at' => now(),
        ]);

        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.change-requests.approve', $request->id));

        $response->assertStatus(400)
            ->assertJson(['error' => 'Request is no longer valid.']);
    }

    /** @test */
    public function approval_workflow_handles_permission_removal()
    {
        // First give user a permission
        UserPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permissions->where('name', 'view-users')->first()->id,
            'allowed' => true,
        ]);

        // Create request to remove it
        $request = PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [],
            'permissions_to_remove' => [$this->permissions->where('name', 'view-users')->first()->id],
            'reason' => 'Remove view permission',
            'status' => 'pending',
        ]);

        // Approve the request
        $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.change-requests.approve', $request->id));

        // Check permission was removed
        $this->assertDatabaseMissing('user_permissions', [
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permissions->where('name', 'view-users')->first()->id,
        ]);
    }

    /** @test */
    public function approval_workflow_handles_both_add_and_remove()
    {
        // Give user view-users permission
        $viewPermissionId = $this->permissions->where('name', 'view-users')->first()->id;
        $editPermissionId = $this->permissions->where('name', 'edit-users')->first()->id;
        $deletePermissionId = $this->permissions->where('name', 'delete-users')->first()->id;

        UserPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $viewPermissionId,
            'allowed' => true,
        ]);

        // Create request to add edit-users and remove view-users
        $request = PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$editPermissionId], // Need view-users as dependency
            'permissions_to_remove' => [$deletePermissionId], // Remove delete (which they don't have)
            'reason' => 'Add edit, remove delete',
            'status' => 'pending',
        ]);

        // Approve the request
        $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.change-requests.approve', $request->id));

        // Check edit-users was added
        $this->assertDatabaseHas('user_permissions', [
            'user_id' => $this->regularUser->id,
            'permission_id' => $editPermissionId,
            'allowed' => true,
        ]);

        // Check view-users still exists (dependency)
        $this->assertDatabaseHas('user_permissions', [
            'user_id' => $this->regularUser->id,
            'permission_id' => $viewPermissionId,
            'allowed' => true,
        ]);

        // Check request status
        $this->assertDatabaseHas('permission_change_requests', [
            'id' => $request->id,
            'status' => 'approved',
        ]);
    }

    /** @test */
    public function requester_can_cancel_pending_request()
    {
        $request = PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permissions->first()->id],
            'permissions_to_remove' => [],
            'reason' => 'Test cancellation',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson(route('api.admin.permissions.change-requests.cancel', $request->id));

        $response->assertStatus(200)
            ->assertJson(['success' => 'Permission change request cancelled successfully.']);

        $this->assertDatabaseHas('permission_change_requests', [
            'id' => $request->id,
            'status' => 'rejected', // Cancelled requests become rejected
        ]);
    }

    /** @test */
    public function cannot_cancel_non_pending_request()
    {
        $request = PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permissions->first()->id],
            'permissions_to_remove' => [],
            'reason' => 'Test cancellation of approved',
            'status' => 'approved',
        ]);

        $response = $this->actingAs($this->adminUser)
            ->deleteJson(route('api.admin.permissions.change-requests.cancel', $request->id));

        $response->assertStatus(400)
            ->assertJson(['error' => 'Only pending requests can be cancelled.']);
    }

    /** @test */
    public function only_requester_or_super_admin_can_cancel()
    {
        $anotherUser = User::factory()->create(['role' => 'Reception Admin']);

        $request = PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permissions->first()->id],
            'permissions_to_remove' => [],
            'reason' => 'Test unauthorized cancellation',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($anotherUser)
            ->deleteJson(route('api.admin.permissions.change-requests.cancel', $request->id));

        $response->assertStatus(403)
            ->assertJson(['error' => 'Unauthorized to cancel this request.']);
    }
}
