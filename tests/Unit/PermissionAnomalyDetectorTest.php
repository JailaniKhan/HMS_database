<?php

namespace Tests\Unit;

use App\Models\User;
use App\Models\Permission;
use App\Models\TemporaryPermission;
use App\Models\PermissionSession;
use App\Models\PermissionSessionAction;
use App\Models\PermissionChangeRequest;
use App\Services\PermissionAnomalyDetector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Carbon\Carbon;
use Tests\TestCase;

class PermissionAnomalyDetectorTest extends TestCase
{
    use RefreshDatabase;

    protected PermissionAnomalyDetector $detector;

    protected function setUp(): void
    {
        parent::setUp();
        $this->detector = new PermissionAnomalyDetector();
    }

    /** @test */
    public function it_detects_bulk_permission_grants_anomaly()
    {
        // Create users and permissions
        $user = User::factory()->create();
        $permissions = collect();
        for ($i = 0; $i < 6; $i++) {
            $permissions->push(Permission::create(['name' => "permission-{$i}"]));
        }

        // Create 6 temporary permissions within an hour
        $baseTime = now()->subMinutes(30);
        foreach ($permissions as $index => $permission) {
            TemporaryPermission::create([
                'user_id' => $user->id,
                'permission_id' => $permission->id,
                'granted_by' => $user->id,
                'granted_at' => $baseTime->addMinutes($index),
                'expires_at' => now()->addHour(),
                'reason' => 'Test grant',
                'is_active' => true,
                'created_at' => $baseTime->addMinutes($index),
            ]);
        }

        $anomalies = $this->detector->detectAnomalies();

        $bulkGrantAnomaly = $anomalies->firstWhere('type', 'bulk_permission_grants');
        $this->assertNotNull($bulkGrantAnomaly);
        $this->assertEquals('medium', $bulkGrantAnomaly['severity']);
        $this->assertEquals($user->id, $bulkGrantAnomaly['user_id']);
        $this->assertEquals(6, $bulkGrantAnomaly['data']['grant_count']);
    }

    /** @test */
    public function it_detects_high_risk_permission_grants_anomaly()
    {
        $user = User::factory()->create();

        // Create high-risk permissions
        $deleteUsers = Permission::create(['name' => 'delete-users']);
        $manageRoles = Permission::create(['name' => 'manage-roles']);
        $systemAdmin = Permission::create(['name' => 'system-admin']);
        $normalPerm = Permission::create(['name' => 'view-users']);

        $baseTime = now()->subMinutes(30);

        // Grant 3 high-risk permissions
        TemporaryPermission::create([
            'user_id' => $user->id,
            'permission_id' => $deleteUsers->id,
            'granted_by' => $user->id,
            'granted_at' => $baseTime,
            'expires_at' => now()->addHour(),
            'reason' => 'Test',
            'is_active' => true,
            'created_at' => $baseTime,
        ]);

        TemporaryPermission::create([
            'user_id' => $user->id,
            'permission_id' => $manageRoles->id,
            'granted_by' => $user->id,
            'granted_at' => $baseTime->addMinutes(5),
            'expires_at' => now()->addHour(),
            'reason' => 'Test',
            'is_active' => true,
            'created_at' => $baseTime->addMinutes(5),
        ]);

        TemporaryPermission::create([
            'user_id' => $user->id,
            'permission_id' => $systemAdmin->id,
            'granted_by' => $user->id,
            'granted_at' => $baseTime->addMinutes(10),
            'expires_at' => now()->addHour(),
            'reason' => 'Test',
            'is_active' => true,
            'created_at' => $baseTime->addMinutes(10),
        ]);

        $anomalies = $this->detector->detectAnomalies();

        $highRiskAnomaly = $anomalies->firstWhere('type', 'high_risk_permission_grants');
        $this->assertNotNull($highRiskAnomaly);
        $this->assertEquals('high', $highRiskAnomaly['severity']);
        $this->assertEquals($user->id, $highRiskAnomaly['user_id']);
        $this->assertEquals(3, $highRiskAnomaly['data']['high_risk_permissions']);
    }

    /** @test */
    public function it_detects_rapid_permission_changes_anomaly()
    {
        $user = User::factory()->create();
        $session = \App\Models\PermissionSession::create([
            'user_id' => $user->id,
            'session_token' => 'test-token',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test',
            'started_at' => now(),
        ]);

        $baseTime = now()->subMinutes(25);

        // Create 11 permission change actions within 30 minutes
        for ($i = 0; $i < 11; $i++) {
            PermissionSessionAction::create([
                'session_id' => $session->id,
                'action_type' => 'update_user_permissions',
                'performed_at' => $baseTime->addMinutes($i),
                'details' => ['test' => 'data'],
                'created_at' => $baseTime->addMinutes($i),
            ]);
        }

        $anomalies = $this->detector->detectAnomalies();

        $rapidChangesAnomaly = $anomalies->firstWhere('type', 'rapid_permission_changes');
        $this->assertNotNull($rapidChangesAnomaly);
        $this->assertEquals('high', $rapidChangesAnomaly['severity']);
        $this->assertEquals($user->id, $rapidChangesAnomaly['user_id']);
        $this->assertEquals(11, $rapidChangesAnomaly['data']['change_count']);
    }

    /** @test */
    public function it_detects_unusual_time_pattern_anomaly()
    {
        $user = User::factory()->create();
        $session = \App\Models\PermissionSession::create([
            'user_id' => $user->id,
            'session_token' => 'test-token',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'test',
            'started_at' => now(),
        ]);

        // Create actions during unusual hours (3 AM)
        $unusualTime = Carbon::createFromTime(3, 0, 0);

        PermissionSessionAction::create([
            'session_id' => $session->id,
            'action_type' => 'grant_temporary_permission',
            'performed_at' => $unusualTime,
            'details' => ['test' => 'data'],
            'created_at' => $unusualTime,
        ]);

        // Mock now() to be within the last day
        Carbon::setTestNow($unusualTime->addMinutes(1));

        $anomalies = $this->detector->detectAnomalies();

        $timePatternAnomaly = $anomalies->firstWhere('type', 'unusual_hours_activity');
        $this->assertNotNull($timePatternAnomaly);
        $this->assertEquals('medium', $timePatternAnomaly['severity']);
        $this->assertEquals($user->id, $timePatternAnomaly['user_id']);
        $this->assertEquals([2, 5], $timePatternAnomaly['data']['hours']);

        Carbon::setTestNow(); // Reset
    }

    /** @test */
    public function it_detects_permission_escalation_anomaly()
    {
        $user = User::factory()->create();
        $adminPermission = Permission::create(['name' => 'system-admin']);

        // Create a pending permission change request for high-privilege permission
        PermissionChangeRequest::create([
            'user_id' => $user->id,
            'requested_by' => $user->id,
            'permissions_to_add' => [$adminPermission->id],
            'permissions_to_remove' => [],
            'reason' => 'Need admin access',
            'status' => 'pending',
            'expires_at' => now()->addDay(),
        ]);

        $anomalies = $this->detector->detectAnomalies();

        $escalationAnomaly = $anomalies->firstWhere('type', 'permission_escalation_attempt');
        $this->assertNotNull($escalationAnomaly);
        $this->assertEquals('high', $escalationAnomaly['severity']);
        $this->assertEquals($user->id, $escalationAnomaly['user_id']);
        $this->assertEquals('system-admin', $escalationAnomaly['data']['requested_permission']);
    }

    /** @test */
    public function it_returns_empty_collection_when_no_anomalies()
    {
        $anomalies = $this->detector->detectAnomalies();
        $this->assertEmpty($anomalies);
    }

    /** @test */
    public function it_gets_anomaly_stats()
    {
        // Create some test data
        $user = User::factory()->create();
        $deleteUsers = Permission::create(['name' => 'delete-users']);
        $manageRoles = Permission::create(['name' => 'manage-roles']);

        // Create high-risk permission grants
        TemporaryPermission::create([
            'user_id' => $user->id,
            'permission_id' => $deleteUsers->id,
            'granted_by' => $user->id,
            'granted_at' => now()->subHours(12),
            'expires_at' => now()->addHour(),
            'reason' => 'Test',
            'is_active' => true,
        ]);

        TemporaryPermission::create([
            'user_id' => $user->id,
            'permission_id' => $manageRoles->id,
            'granted_by' => $user->id,
            'granted_at' => now()->subHours(6),
            'expires_at' => now()->addHour(),
            'reason' => 'Test',
            'is_active' => true,
        ]);

        $stats = $this->detector->getAnomalyStats();

        $this->assertIsArray($stats);
        $this->assertArrayHasKey('total_anomalies_today', $stats);
        $this->assertArrayHasKey('high_severity_count', $stats);
        $this->assertArrayHasKey('recent_high_risk_grants', $stats);
        $this->assertArrayHasKey('failed_login_attempts', $stats);
        $this->assertArrayHasKey('unusual_hour_activities', $stats);

        $this->assertEquals(2, $stats['recent_high_risk_grants']);
    }

    /** @test */
    public function it_handles_empty_anomaly_detection()
    {
        $anomalies = $this->detector->detectAnomalies();
        $this->assertEmpty($anomalies);
    }

    /** @test */
    public function it_detects_no_bulk_grants_when_under_threshold()
    {
        $user = User::factory()->create();
        $permissions = collect();
        for ($i = 0; $i < 4; $i++) { // Under threshold of 5
            $permissions->push(Permission::create(['name' => "permission-{$i}"]));
        }

        $baseTime = now()->subMinutes(30);
        foreach ($permissions as $index => $permission) {
            TemporaryPermission::create([
                'user_id' => $user->id,
                'permission_id' => $permission->id,
                'granted_by' => $user->id,
                'granted_at' => $baseTime->addMinutes($index),
                'expires_at' => now()->addHour(),
                'reason' => 'Test grant',
                'is_active' => true,
                'created_at' => $baseTime->addMinutes($index),
            ]);
        }

        $anomalies = $this->detector->detectAnomalies();

        $bulkGrantAnomaly = $anomalies->firstWhere('type', 'bulk_permission_grants');
        $this->assertNull($bulkGrantAnomaly);
    }

    /** @test */
    public function it_detects_no_high_risk_grants_when_under_threshold()
    {
        $user = User::factory()->create();

        $deleteUsers = Permission::create(['name' => 'delete-users']);
        $normalPerm = Permission::create(['name' => 'view-users']);

        $baseTime = now()->subMinutes(30);

        // Grant 1 high-risk permission (under threshold of 2)
        TemporaryPermission::create([
            'user_id' => $user->id,
            'permission_id' => $deleteUsers->id,
            'granted_by' => $user->id,
            'granted_at' => $baseTime,
            'expires_at' => now()->addHour(),
            'reason' => 'Test',
            'is_active' => true,
            'created_at' => $baseTime,
        ]);

        $anomalies = $this->detector->detectAnomalies();

        $highRiskAnomaly = $anomalies->firstWhere('type', 'high_risk_permission_grants');
        $this->assertNull($highRiskAnomaly);
    }

    /** @test */
    public function it_ignores_inactive_temporary_permissions_in_anomaly_detection()
    {
        $user = User::factory()->create();
        $permissions = collect();
        for ($i = 0; $i < 6; $i++) {
            $permissions->push(Permission::create(['name' => "permission-{$i}"]));
        }

        $baseTime = now()->subMinutes(30);
        foreach ($permissions as $index => $permission) {
            TemporaryPermission::create([
                'user_id' => $user->id,
                'permission_id' => $permission->id,
                'granted_by' => $user->id,
                'granted_at' => $baseTime->addMinutes($index),
                'expires_at' => now()->addHour(),
                'reason' => 'Test grant',
                'is_active' => false, // Inactive
                'created_at' => $baseTime->addMinutes($index),
            ]);
        }

        $anomalies = $this->detector->detectAnomalies();

        $bulkGrantAnomaly = $anomalies->firstWhere('type', 'bulk_permission_grants');
        $this->assertNull($bulkGrantAnomaly);
    }

    /** @test */
    public function it_handles_permission_escalation_with_case_insensitive_matching()
    {
        $user = User::factory()->create();
        $adminPermission = Permission::create(['name' => 'SYSTEM-ADMIN']); // Different case

        // Create a pending permission change request
        PermissionChangeRequest::create([
            'user_id' => $user->id,
            'requested_by' => $user->id,
            'permissions_to_add' => [$adminPermission->id],
            'permissions_to_remove' => [],
            'reason' => 'Need admin access',
            'status' => 'pending',
            'expires_at' => now()->addDay(),
        ]);

        $anomalies = $this->detector->detectAnomalies();

        $escalationAnomaly = $anomalies->firstWhere('type', 'permission_escalation_attempt');
        $this->assertNotNull($escalationAnomaly);
        $this->assertEquals('high', $escalationAnomaly['severity']);
    }

    /** @test */
    public function it_logs_anomalies_without_errors()
    {
        // Create a test anomaly
        $anomalies = collect([
            [
                'type' => 'test_anomaly',
                'severity' => 'low',
                'user_id' => 1,
                'description' => 'Test anomaly for logging',
                'detected_at' => now(),
            ]
        ]);

        // Should not throw exceptions
        $this->detector->logAnomalies($anomalies);
        $this->assertTrue(true); // If we reach here, logging worked
    }

    /** @test */
    public function it_handles_missing_permission_relationships_gracefully()
    {
        $user = User::factory()->create();

        // Create temporary permission with invalid permission_id
        TemporaryPermission::create([
            'user_id' => $user->id,
            'permission_id' => 99999, // Non-existent permission
            'granted_by' => $user->id,
            'granted_at' => now()->subMinutes(30),
            'expires_at' => now()->addHour(),
            'reason' => 'Test with missing permission',
            'is_active' => true,
        ]);

        // Should not crash
        $anomalies = $this->detector->detectAnomalies();
        $this->assertInstanceOf(\Illuminate\Support\Collection::class, $anomalies);
    }
}
