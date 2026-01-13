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
                'role' => 'Hospital Admin',
            ]);
        }
        
        if (!User::where('username', 'testuser')->exists()) {
            User::create([
                'name' => 'Test User',
                'username' => 'testuser',
                'password' => Hash::make('password'),
                'role' => 'Reception',
            ]);
        }
        
        // Create some audit log entries
        $users = User::all();
        
        foreach ($users as $user) {
            AuditLog::create([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_role' => $user->role,
                'action' => 'User Login',
                'description' => 'User logged into the system',
                'module' => 'Authentication',
                'severity' => 'info',
            ]);
            
            AuditLog::create([
                'user_id' => $user->id,
                'user_name' => $user->name,
                'user_role' => $user->role,
                'action' => 'View Dashboard',
                'description' => 'User viewed the dashboard',
                'module' => 'Dashboard',
                'severity' => 'info',
            ]);
            
            if ($user->role === 'Hospital Admin') {
                AuditLog::create([
                    'user_id' => $user->id,
                    'user_name' => $user->name,
                    'user_role' => $user->role,
                    'action' => 'User Management',
                    'description' => 'User accessed user management',
                    'module' => 'User Management',
                    'severity' => 'info',
                ]);
            }
        }
    }
}
