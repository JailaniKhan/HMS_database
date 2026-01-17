<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class AuditLogSeeder extends Seeder
{
    /**
     * Generate a description for the given action.
     */
    private function generateDescription(string $action): string
    {
        $descriptions = [
            'User Login' => 'User successfully logged into the system',
            'View Dashboard' => 'User accessed the main dashboard',
            'Create Appointment' => 'New appointment scheduled for patient',
            'Update Patient Record' => 'Patient medical record was updated',
            'Process Billing' => 'Billing transaction processed',
            'Order Lab Test' => 'Laboratory test ordered for patient',
            'Dispense Medication' => 'Medication dispensed to patient',
            'Generate Report' => 'System report generated and exported',
            'Failed Login Attempt' => 'Login attempt failed due to invalid credentials',
            'System Error' => 'Unexpected system error occurred',
        ];

        return $descriptions[$action] ?? 'Action performed: ' . $action;
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create some test users if they don't exist
        if (!User::where('username', 'testadmin')->exists()) {
            User::create([
                'name' => 'Test Admin',
                'username' => 'testadmin',
                'password' => Hash::make('password'),
                'role' => 'Super Admin',
            ]);
        }
        
        // Removed testuser with Reception role
        
        // Create diverse audit log entries with performance metrics
        $users = User::all();
        $actions = [
            ['action' => 'User Login', 'module' => 'Authentication', 'severity' => 'info'],
            ['action' => 'View Dashboard', 'module' => 'Dashboard', 'severity' => 'info'],
            ['action' => 'Create Appointment', 'module' => 'Appointments', 'severity' => 'info'],
            ['action' => 'Update Patient Record', 'module' => 'Patients', 'severity' => 'info'],
            ['action' => 'Process Billing', 'module' => 'Billing', 'severity' => 'medium'],
            ['action' => 'Order Lab Test', 'module' => 'Laboratory', 'severity' => 'info'],
            ['action' => 'Dispense Medication', 'module' => 'Pharmacy', 'severity' => 'info'],
            ['action' => 'Generate Report', 'module' => 'Reports', 'severity' => 'low'],
            ['action' => 'Failed Login Attempt', 'module' => 'Authentication', 'severity' => 'high'],
            ['action' => 'System Error', 'module' => 'System', 'severity' => 'critical'],
        ];

        foreach ($users as $user) {
            // Generate multiple entries per user with varied timing
            $entryCount = rand(3, 8);
            for ($i = 0; $i < $entryCount; $i++) {
                $actionData = $actions[array_rand($actions)];
                $responseTime = rand(100, 5000) / 1000; // 0.1 to 5 seconds
                $memoryUsage = rand(8000000, 50000000); // 8MB to 50MB
                $errorDetails = null;
                if ($actionData['severity'] === 'high' || $actionData['severity'] === 'critical') {
                    $errorDetails = ['code' => rand(400, 500), 'message' => 'Sample error'];
                }

                AuditLog::create([
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_role' => $user->role,
                    'action' => $actionData['action'],
                    'description' => $this->generateDescription($actionData['action']),
                    'module' => $actionData['module'],
                    'severity' => $actionData['severity'],
                    'response_time' => $responseTime,
                    'memory_usage' => $memoryUsage,
                    'error_details' => $errorDetails,
                    'request_method' => collect(['GET', 'POST', 'PUT', 'DELETE'])->random(),
                    'request_url' => '/api/v1/' . strtolower($actionData['module']) . '/' . rand(1, 100),
                    'ip_address' => '192.168.1.' . rand(1, 255),
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'logged_at' => now()->subMinutes(rand(1, 1440)), // Random time in last 24 hours
                ]);
            }

            // Admin-specific actions
            if ($user->role === 'Super Admin') {
                AuditLog::create([
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_role' => $user->role,
                    'action' => 'User Management',
                    'description' => 'User accessed user management module',
                    'module' => 'User Management',
                    'severity' => 'info',
                    'response_time' => rand(200, 1500) / 1000,
                    'memory_usage' => rand(10000000, 30000000),
                    'request_method' => 'GET',
                    'request_url' => '/admin/users',
                    'ip_address' => '192.168.1.' . rand(1, 255),
                    'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'logged_at' => now()->subHours(rand(1, 24)),
                ]);
            }
        }
    }
}
