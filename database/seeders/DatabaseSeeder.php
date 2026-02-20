<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        $this->call([
            DepartmentSeeder::class,
            PermissionSeeder::class,
            AdminRoleSeeder::class,
            RolePermissionSeeder::class,
            DefaultUsersSeeder::class,
            AuditLogSeeder::class,
            BillingSettingsSeeder::class,
            MedicineCategorySeeder::class,
        ]);
    }
}
