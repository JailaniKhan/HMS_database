<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class BillingPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            [
                'name' => 'void-billing',
                'description' => 'Void billing records',
                'resource' => 'billing',
                'action' => 'void',
                'category' => 'billing'
            ],
            [
                'name' => 'manage-billing',
                'description' => 'Manage billing records (send reminders, etc.)',
                'resource' => 'billing',
                'action' => 'manage',
                'category' => 'billing'
            ],
        ];

        foreach ($permissions as $perm) {
            Permission::firstOrCreate(
                ['name' => $perm['name']],
                $perm
            );
        }
    }
}
