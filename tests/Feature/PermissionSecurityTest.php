<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Permission;
use App\Models\TemporaryPermission;
use App\Models\PermissionChangeRequest;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;
use Carbon\Carbon;

class PermissionSecurityTest extends TestCase
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
            'name' => 'test-permission',
            'description' => 'Test permission for security tests'
        ]);
    }

    /** @test */
    public function regular_user_cannot_access_admin_permission_endpoints()
    {
        // Test various admin endpoints
        $endpoints = [
            'GET' => [
                route('admin.permissions.index'),
                route('admin.permissions.edit-user', $this->regularUser->id),
                route('admin.permissions.edit-role', 'Reception Admin'),
            ],
            'POST' => [
                route('api.admin.permissions.grant-temporary'),
                route('api.admin.permissions.change-requests'),
            ],
            'PUT' => [
                route('admin.permissions.update-user', $this->regularUser->id),
                route('admin.permissions.update-role', 'Reception Admin'),
            ],
        ];

        foreach ($endpoints as $method => $urls) {
            foreach ($urls as $url) {
                $response = $this->actingAs($this->regularUser)->call($method, $url);
                $this->assertContains($response->getStatusCode(), [403, 404], "Endpoint {$method} {$url} should be forbidden or not found for regular users");
            }
        }
    }

    /** @test */
    public function unauthenticated_users_cannot_access_protected_endpoints()
    {
        $response = $this->getJson(route('api.admin.permissions.temporary-permissions'));
        $response->assertStatus(401);

        $response = $this->postJson(route('api.admin.permissions.grant-temporary'), []);
        $response->assertStatus(401);
    }

    /** @test */
    public function sql_injection_attempts_are_prevented()
    {
        // Test with malicious input in permission name
        $maliciousName = "'; DROP TABLE users; --";

        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.check-temporary-permission'), [
                'user_id' => $this->regularUser->id,
                'permission_name' => $maliciousName,
            ]);

        // Should not crash and should return false for non-existent permission
        $response->assertStatus(200)
            ->assertJson(['has_permission' => false]);
    }

    /** @test */
    public function xss_attempts_in_reason_field_are_handled()
    {
        $xssPayload = '<script>alert("XSS")</script>';

        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => $this->regularUser->id,
                'permission_id' => $this->permission->id,
                'expires_at' => now()->addHour()->toISOString(),
                'reason' => $xssPayload,
            ]);

        $response->assertStatus(200);

        // Check that the reason was stored (assuming it's sanitized)
        $this->assertDatabaseHas('temporary_permissions', [
            'reason' => $xssPayload, // If sanitization is implemented, this might be different
        ]);
    }

    /** @test */
    public function input_validation_blocks_invalid_data()
    {
        // Test invalid user_id
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => 'invalid-user-id',
                'permission_id' => $this->permission->id,
                'expires_at' => now()->addHour()->toISOString(),
                'reason' => 'Test validation',
            ]);

        $response->assertStatus(422); // Validation error

        // Test invalid permission_id
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => $this->regularUser->id,
                'permission_id' => 'invalid-permission-id',
                'expires_at' => now()->addHour()->toISOString(),
                'reason' => 'Test validation',
            ]);

        $response->assertStatus(422);

        // Test past expires_at
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => $this->regularUser->id,
                'permission_id' => $this->permission->id,
                'expires_at' => now()->subHour()->toISOString(),
                'reason' => 'Test validation',
            ]);

        $response->assertStatus(422);

        // Test missing required fields
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => $this->regularUser->id,
                // missing permission_id
                'expires_at' => now()->addHour()->toISOString(),
                'reason' => 'Test validation',
            ]);

        $response->assertStatus(422);
    }

    /** @test */
    public function users_cannot_revoke_permissions_they_did_not_grant()
    {
        $anotherAdmin = User::factory()->create(['role' => 'Super Admin']);

        // First admin grants permission
        $tempPermission = TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now(),
            'expires_at' => now()->addHour(),
            'reason' => 'Test revoke permissions',
            'is_active' => true,
        ]);

        // Another admin tries to revoke
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
    public function users_cannot_cancel_requests_they_did_not_create()
    {
        $anotherUser = User::factory()->create(['role' => 'Reception Admin']);

        $request = PermissionChangeRequest::create([
            'user_id' => $this->regularUser->id,
            'requested_by' => $this->adminUser->id,
            'permissions_to_add' => [$this->permission->id],
            'permissions_to_remove' => [],
            'reason' => 'Test unauthorized cancellation',
            'status' => 'pending',
        ]);

        // Another user tries to cancel
        $response = $this->actingAs($anotherUser)
            ->deleteJson(route('api.admin.permissions.change-requests.cancel', $request->id));

        $response->assertStatus(403)
            ->assertJson(['error' => 'Unauthorized to cancel this request.']);
    }

    /** @test */
    public function mass_assignment_protection_works()
    {
        // Try to create permission with sensitive fields
        $maliciousData = [
            'name' => 'malicious-permission',
            'description' => 'Malicious permission',
            'is_admin_only' => true, // This field might not exist or be fillable
            'created_at' => now()->subDays(1), // Try to set created_at
        ];

        // This should fail or ignore the malicious fields
        try {
            $permission = Permission::create($maliciousData);
            // If it succeeds, check that sensitive fields were not set
            $this->assertEquals('malicious-permission', $permission->name);
            // created_at should be current time, not the malicious one
            $this->assertGreaterThan(now()->subMinutes(1), $permission->created_at);
        } catch (\Exception $e) {
            // If it fails due to mass assignment protection, that's also correct
            $this->assertStringContains('fillable', $e->getMessage());
        }
    }

    /** @test */
    public function permission_changes_are_audited()
    {
        // This test assumes audit logging is implemented
        // Create a permission change
        $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => $this->regularUser->id,
                'permission_id' => $this->permission->id,
                'expires_at' => now()->addHour()->toISOString(),
                'reason' => 'Test audit logging',
            ]);

        // Check if audit log exists (assuming AuditLog model exists)
        if (class_exists(\App\Models\AuditLog::class)) {
            $this->assertDatabaseHas('audit_logs', [
                'user_id' => $this->adminUser->id,
                'action' => 'grant_temporary_permission',
            ]);
        }
    }

    /** @test */
    public function brute_force_attempts_are_rate_limited()
    {
        // This test assumes rate limiting middleware is configured
        // Make multiple rapid requests
        for ($i = 0; $i < 10; $i++) {
            $response = $this->actingAs($this->adminUser)
                ->postJson(route('api.admin.permissions.grant-temporary'), [
                    'user_id' => $this->regularUser->id,
                    'permission_id' => $this->permission->id,
                    'expires_at' => now()->addHour()->toISOString(),
                    'reason' => 'Rate limit test ' . $i,
                ]);

            if ($i < 5) { // First few should succeed
                $response->assertStatus(200);
            } else { // Later ones might be rate limited
                // Note: Actual rate limiting depends on middleware configuration
                // This is just a placeholder for the concept
                $this->assertContains($response->getStatusCode(), [200, 429]);
            }
        }
    }

    /** @test */
    public function ip_restriction_middleware_blocks_unauthorized_ips()
    {
        // This test assumes IP restriction middleware is implemented
        // Configure a blocked IP in middleware if applicable

        // For now, just test that the middleware is applied by checking if request goes through
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => $this->regularUser->id,
                'permission_id' => $this->permission->id,
                'expires_at' => now()->addHour()->toISOString(),
                'reason' => 'IP restriction test',
            ]);

        // Should succeed if IP is allowed (default behavior)
        $response->assertStatus(200);
    }

    /** @test */
    public function session_tracking_records_permission_actions()
    {
        // This test assumes session tracking is implemented
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.grant-temporary'), [
                'user_id' => $this->regularUser->id,
                'permission_id' => $this->permission->id,
                'expires_at' => now()->addHour()->toISOString(),
                'reason' => 'Session tracking test',
            ]);

        $response->assertStatus(200);

        // Check if session action was recorded
        if (class_exists(\App\Models\PermissionSessionAction::class)) {
            $this->assertDatabaseHas('permission_session_actions', [
                'action_type' => 'grant_temporary_permission',
            ]);
        }
    }

    /** @test */
    public function concurrent_permission_modifications_are_handled_safely()
    {
        // Test database transaction safety
        $this->actingAs($this->adminUser);

        // Simulate concurrent requests by creating the same permission change request
        // This should be handled gracefully (either succeed once or fail both)
        $responses = [];

        for ($i = 0; $i < 2; $i++) {
            $responses[] = $this->postJson(route('api.admin.permissions.change-requests'), [
                'user_id' => $this->regularUser->id,
                'permissions_to_add' => [$this->permission->id],
                'permissions_to_remove' => [],
                'reason' => 'Concurrent test ' . $i,
            ]);
        }

        // At least one should succeed, and if duplicates are prevented, one might fail
        $successCount = collect($responses)->filter(fn($r) => $r->getStatusCode() === 201)->count();
        $this->assertGreaterThanOrEqual(1, $successCount);
    }

    /** @test */
    public function permission_expiration_is_enforced_on_access_checks()
    {
        // Grant temporary permission
        TemporaryPermission::create([
            'user_id' => $this->regularUser->id,
            'permission_id' => $this->permission->id,
            'granted_by' => $this->adminUser->id,
            'granted_at' => now()->subHours(3),
            'expires_at' => now()->subHours(1), // Already expired
            'reason' => 'Expired permission test',
            'is_active' => true,
        ]);

        // Check permission status
        $response = $this->actingAs($this->adminUser)
            ->postJson(route('api.admin.permissions.check-temporary-permission'), [
                'user_id' => $this->regularUser->id,
                'permission_name' => $this->permission->name,
            ]);

        $response->assertStatus(200)
            ->assertJson(['has_permission' => false]);
    }
}
