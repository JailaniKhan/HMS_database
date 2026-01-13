<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/dashboard', [ReportController::class, 'dashboardStats'])->middleware(['auth', 'verified'])->name('dashboard');

Route::get('/dashboard-redirect', function () {
    $user = Auth::user();
    
    if (!$user) {
        return redirect()->route('login');
    }
    
    // Redirect based on user permissions and role
    if ($user->isSuperAdmin()) {
        // Super admin (Hospital Admin) goes to main dashboard
        return redirect()->intended(route('dashboard', absolute: false));
    } elseif ($user->role === 'Reception') {
        // Reception role goes to patients section
        return redirect()->intended('/patients');
    } elseif ($user->hasPermission('view-pharmacy')) {
        // Sub-admin with pharmacy permissions
        return redirect()->intended('/pharmacy/medicines');
    } elseif ($user->hasPermission('view-laboratory')) {
        // Sub-admin with laboratory permissions
        return redirect()->intended('/laboratory/lab-tests');
    } elseif ($user->hasPermission('view-appointments')) {
        // Sub-admin with appointments permissions
        return redirect()->intended('/appointments');
    } elseif ($user->hasPermission('view-billing')) {
        // Sub-admin with billing permissions
        return redirect()->intended('/billing');
    } elseif ($user->hasPermission('view-dashboard')) {
        // Any user with dashboard permission
        return redirect()->intended(route('dashboard', absolute: false));
    } else {
        // Default fallback for users without specific permissions
        return redirect()->intended(route('dashboard', absolute: false));
    }
})->middleware(['auth', 'verified'])->name('dashboard.redirect');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
require __DIR__.'/hospital.php';


