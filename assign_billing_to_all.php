<?php

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Permission;
use App\Models\UserPermission;

// Get the view-billing permission
$permission = Permission::where('name', 'view-billing')->first();

if ($permission) {
    // Assign to all users
    $users = User::all();
    
    foreach ($users as $user) {
        UserPermission::firstOrCreate([
            'user_id' => $user->id,
            'permission_id' => $permission->id,
        ]);
    }
    
    echo "Successfully assigned 'view-billing' permission to all " . $users->count() . " users\n";
} else {
    echo "Permission 'view-billing' not found in database\n";
}