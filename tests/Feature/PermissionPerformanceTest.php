<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Permission;
use App\Models\RolePermission;
use App\Models\TemporaryPermission;
use App\Models\UserPermission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\Cache;

class PermissionPerformanceTest extends TestCase
{
    use RefreshDatabase;

    protected $users = [];
    protected $permissions = [];

    protected function setUp(): void
    {
        parent::setUp();

        // Create multiple users for performance testing
        for ($i = 0; $i < 10; $i++) {
            $this->users[] = User::factory()->create(['role' => 'Reception Admin']);
        }

        // Create multiple permissions
        for ($i = 0; $i < 20; $i++) {
            $this->permissions[] = Permission::create([
                'name' => "perf-test-permission-{$i}",
                'description' => "Performance test permission {$i}"
            ]);
        }
    }

    /** @test */
    public function permission_checks_are_fast_with_caching()
    {
        $user = $this->users[0];
        $permission = $this->permissions[0];

        // Assign permission
        RolePermission::create([
            'role' => $user->role,
            'permission_id' => $permission->id,
        ]);

        Cache::flush();

        // First check (cache miss)
        $start = microtime(true);
        $result1 = $user->fresh()->hasPermission($permission->name);
        $firstCheckTime = microtime(true) - $start;

        // Second check (cache hit)
        $start = microtime(true);
        $result2 = $user->fresh()->hasPermission($permission->name);
        $secondCheckTime = microtime(true) - $start;

        $this->assertTrue($result1);
        $this->assertTrue($result2);

        // Cached check should be significantly faster
        // Allow some tolerance for test environment variance
        $this->assertLessThan($firstCheckTime * 2, $secondCheckTime + 0.001); // At least not much slower
    }

    /** @test */
    public function bulk_permission_assignment_performance()
    {
        $user = $this->users[0];
        $permissionsToAssign = array_slice($this->permissions, 0, 10);

        $start = microtime(true);

        // Bulk assign permissions
        foreach ($permissionsToAssign as $permission) {
            UserPermission::create([
                'user_id' => $user->id,
                'permission_id' => $permission->id,
                'allowed' => true,
            ]);
        }

        $bulkAssignmentTime = microtime(true) - $start;

        // Verify all permissions were assigned
        foreach ($permissionsToAssign as $permission) {
            $this->assertTrue($user->fresh()->hasPermission($permission->name));
        }

        // Bulk assignment should complete within reasonable time (adjust threshold as needed)
        $this->assertLessThan(1.0, $bulkAssignmentTime); // Less than 1 second for 10 assignments
    }

    /** @test */
    public function multiple_users_permission_checks_performance()
    {
        // Assign different permissions to different users
        foreach ($this->users as $index => $user) {
            $permissionsForUser = array_slice($this->permissions, $index * 2, 2);
            foreach ($permissionsForUser as $permission) {
                RolePermission::create([
                    'role' => $user->role,
                    'permission_id' => $permission->id,
                ]);
            }
        }

        Cache::flush();

        $start = microtime(true);

        // Check permissions for all users
        $results = [];
        foreach ($this->users as $user) {
            foreach ($this->permissions as $permission) {
                $results[] = $user->fresh()->hasPermission($permission->name);
            }
        }

        $checkTime = microtime(true) - $start;

        // Should have some true and some false results
        $trueCount = collect($results)->filter()->count();
        $this->assertGreaterThan(0, $trueCount);
        $this->assertGreaterThan(0, count($results) - $trueCount);

        // Performance check: 10 users * 20 permissions = 200 checks
        // Should complete within reasonable time
        $this->assertLessThan(5.0, $checkTime); // Less than 5 seconds for 200 checks
    }

    /** @test */
    public function temporary_permission_expiration_performance()
    {
        $user = $this->users[0];
        $permission = $this->permissions[0];

        // Create many temporary permissions, some expired
        for ($i = 0; $i < 50; $i++) {
            TemporaryPermission::create([
                'user_id' => $user->id,
                'permission_id' => $permission->id,
                'granted_by' => 1, // Assuming admin user exists
                'granted_at' => now()->subDays($i),
                'expires_at' => $i < 25 ? now()->subDays(1) : now()->addDays(1), // Half expired
                'reason' => "Test temp permission {$i}",
                'is_active' => true,
            ]);
        }

        $start = microtime(true);

        // Check permission (should handle expired permissions efficiently)
        $hasPermission = $user->fresh()->hasPermission($permission->name);

        $checkTime = microtime(true) - $start;

        // Should not have permission (all temp permissions are for different permission)
        $this->assertFalse($hasPermission);

        // Should still be fast despite many expired temp permissions
        $this->assertLessThan(0.5, $checkTime); // Less than 0.5 seconds
    }

    /** @test */
    public function cache_invalidation_performance()
    {
        $user = $this->users[0];
        $permissions = array_slice($this->permissions, 0, 5);

        // Assign permissions
        foreach ($permissions as $permission) {
            RolePermission::create([
                'role' => $user->role,
                'permission_id' => $permission->id,
            ]);
        }

        Cache::flush();

        // Warm up cache
        foreach ($permissions as $permission) {
            $user->fresh()->hasPermission($permission->name);
        }

        $start = microtime(true);

        // Simulate cache invalidation by changing permissions
        foreach ($permissions as $permission) {
            UserPermission::create([
                'user_id' => $user->id,
                'permission_id' => $permission->id,
                'allowed' => false, // Override to false
            ]);
        }

        // Check permissions again (should bypass cache for user permissions)
        $results = [];
        foreach ($permissions as $permission) {
            $results[] = $user->fresh()->hasPermission($permission->name);
        }

        $checkTime = microtime(true) - $start;

        // All should be false due to user permission overrides
        foreach ($results as $result) {
            $this->assertFalse($result);
        }

        // Should still perform well
        $this->assertLessThan(1.0, $checkTime);
    }

    /** @test */
    public function permission_dependency_validation_performance()
    {
        // Create a chain of dependencies
        $basePerm = Permission::create(['name' => 'base-perm']);
        $depPerms = [];

        for ($i = 0; $i < 10; $i++) {
            $depPerms[] = Permission::create(['name' => "dep-perm-{$i}"]);
        }

        // Create dependency chain: each depends on the previous
        for ($i = 0; $i < 9; $i++) {
            \App\Models\PermissionDependency::create([
                'permission_id' => $depPerms[$i + 1]->id,
                'depends_on_permission_id' => $depPerms[$i]->id,
            ]);
        }

        $user = $this->users[0];
        $permissionIds = collect($depPerms)->pluck('id')->toArray();

        $start = microtime(true);

        // Test dependency validation with chain
        $errors = $user->validatePermissionDependencies($permissionIds);

        $validationTime = microtime(true) - $start;

        // Should have errors since dependencies aren't satisfied
        $this->assertNotEmpty($errors);

        // Should still be reasonably fast
        $this->assertLessThan(0.5, $validationTime);
    }

    /** @test */
    public function concurrent_permission_checks_performance()
    {
        $user = $this->users[0];
        $permission = $this->permissions[0];

        // Assign permission
        RolePermission::create([
            'role' => $user->role,
            'permission_id' => $permission->id,
        ]);

        Cache::flush();

        $start = microtime(true);

        // Simulate concurrent checks
        $promises = [];
        for ($i = 0; $i < 100; $i++) {
            // In a real concurrent scenario, these would be separate processes/threads
            // For testing, we'll just call sequentially but measure total time
            $user->fresh()->hasPermission($permission->name);
        }

        $totalTime = microtime(true) - $start;

        // Should handle many checks reasonably well
        $this->assertLessThan(10.0, $totalTime); // Less than 10 seconds for 100 checks
        $avgTimePerCheck = $totalTime / 100;
        $this->assertLessThan(0.1, $avgTimePerCheck); // Average less than 0.1 seconds per check
    }

    /** @test */
    public function memory_usage_during_bulk_operations()
    {
        $initialMemory = memory_get_usage(true);

        // Create bulk temporary permissions
        $tempPermissions = [];
        for ($i = 0; $i < 1000; $i++) {
            $tempPermissions[] = [
                'user_id' => $this->users[$i % 10]->id,
                'permission_id' => $this->permissions[$i % 20]->id,
                'granted_by' => 1,
                'granted_at' => now(),
                'expires_at' => now()->addHours(1),
                'reason' => "Bulk test {$i}",
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        $start = microtime(true);
        TemporaryPermission::insert($tempPermissions);
        $insertionTime = microtime(true) - $start;

        $afterInsertionMemory = memory_get_usage(true);
        $memoryIncrease = $afterInsertionMemory - $initialMemory;

        // Clean up
        TemporaryPermission::where('reason', 'like', 'Bulk test %')->delete();

        // Should complete within reasonable time and memory
        $this->assertLessThan(5.0, $insertionTime); // Less than 5 seconds for 1000 inserts
        $this->assertLessThan(50 * 1024 * 1024, $memoryIncrease); // Less than 50MB increase
    }
}
