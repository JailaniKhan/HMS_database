<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SecurityController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        Log::info('Security route accessed', [
            'user_id' => $user->id,
            'role' => $user->role,
            'has_manage_users' => $user->hasPermission('manage-users'),
            'is_super_admin' => $user->isSuperAdmin()
        ]);

        // Check if user has permission to access security center
        if (!$user->hasPermission('manage-users') && !$user->isSuperAdmin()) {
            abort(403, 'Unauthorized access');
        }

        return Inertia::render('Admin/Security/Index');
    }
}
