<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\v1\PatientController;
use App\Http\Controllers\API\v1\DoctorController;
use App\Http\Controllers\API\v1\AppointmentController;
use App\Http\Controllers\API\v1\DepartmentController;
use App\Http\Controllers\API\v1\AdminController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Admin\PermissionsController;
use App\Http\Controllers\Billing\BillController;
use App\Http\Controllers\Billing\PaymentController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// API Version 1
Route::prefix('v1')->group(function () {
    // Public routes (if needed)
    // Route::get('/health', function () { return ['status' => 'ok']; });

    // Protected routes with Sanctum authentication (for API compatibility)
    Route::middleware(['auth:sanctum'])->group(function () {
        // Patient routes
        Route::apiResource('patients', PatientController::class)->names('api.patients');

        // Doctor routes
        Route::apiResource('doctors', DoctorController::class)->names('api.doctors');

        // Appointment routes
        Route::apiResource('appointments', AppointmentController::class)->names('api.appointments');

        // Department routes
        Route::apiResource('departments', DepartmentController::class)->names('api.departments');

        // Additional appointment routes
        Route::put('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
        Route::put('/appointments/{id}/complete', [AppointmentController::class, 'complete']);

        // Admin routes
        Route::get('/admin/recent-activity', [AdminController::class, 'getRecentActivity']);
        Route::get('/admin/stats', [AdminController::class, 'getStats']);
        Route::get('/admin/audit-logs', [AdminController::class, 'getAuditLogs']);
        Route::get('/admin/audit-analytics', [AdminController::class, 'getAuditAnalytics']);

        // Notification routes
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::get('/notifications/recent', [NotificationController::class, 'recent']);
        Route::put('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
        Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
        Route::delete('/notifications/{notification}', [NotificationController::class, 'destroy']);

        // Permission Management routes with additional security middleware
        Route::middleware(['permission.ip.restriction', 'permission.rate.limit', 'permission.session'])->prefix('admin/permissions')->group(function () {
            // Temporary Permissions
            Route::post('/grant-temporary', [PermissionsController::class, 'grantTemporaryPermission']);
            Route::delete('/revoke-temporary/{tempPermissionId}', [PermissionsController::class, 'revokeTemporaryPermission']);
            Route::get('/temporary-permissions', [PermissionsController::class, 'listTemporaryPermissions']);
            Route::post('/check-temporary-permission', [PermissionsController::class, 'checkTemporaryPermission']);

            // Permission Change Requests
            Route::post('/change-requests', [PermissionsController::class, 'createPermissionChangeRequest']);
            Route::get('/change-requests', [PermissionsController::class, 'listPermissionChangeRequests']);
            Route::get('/change-requests/{requestId}', [PermissionsController::class, 'showPermissionChangeRequest']);
            Route::post('/change-requests/{requestId}/approve', [PermissionsController::class, 'approvePermissionChangeRequest']);
            Route::post('/change-requests/{requestId}/reject', [PermissionsController::class, 'rejectPermissionChangeRequest']);
            Route::delete('/change-requests/{requestId}/cancel', [PermissionsController::class, 'cancelPermissionChangeRequest']);
        });

        // Billing routes
        Route::prefix('billing')->group(function () {
            // All items endpoint for frontend
            Route::get('/all/items', [BillController::class, 'getAllItems']);
        });

        // Payments routes
        Route::prefix('payments')->group(function () {
            Route::get('/', [PaymentController::class, 'listAll']);
            Route::get('/{payment}', [PaymentController::class, 'show']);
            Route::post('/{payment}/refund', [PaymentController::class, 'refund']);
        });
    });
});

// Non-versioned API routes (for legacy frontend compatibility)
Route::middleware(['auth:sanctum'])->group(function () {
    // Debug endpoint to check authentication state
    Route::get('/debug/auth', function () {
        $user = auth()->user();
        return response()->json([
            'authenticated' => auth()->check(),
            'user_id' => $user?->id,
            'username' => $user?->username,
            'role' => $user?->role,
            'is_super_admin' => $user?->isSuperAdmin(),
            'session_id' => session()->getId(),
            'cookies' => request()->cookies->all(),
            'headers' => [
                'authorization' => request()->header('Authorization'),
                'x_laravel_session' => request()->header('X-Laravel-Session'),
                'cookie' => request()->header('Cookie'),
            ],
        ]);
    });
    
    Route::prefix('billing')->group(function () {
        Route::get('/all/items', [BillController::class, 'getAllItems']);
    });
});
