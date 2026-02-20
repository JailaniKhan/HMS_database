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
use App\Http\Controllers\Dashboard\DashboardController;
use App\Http\Controllers\API\v1\MedicineController as ApiMedicineController;
use App\Http\Controllers\API\v1\SalesController as ApiSalesController;
use App\Http\Controllers\API\v1\StockController as ApiStockController;
use App\Http\Controllers\API\v1\AlertController as ApiAlertController;
use App\Http\Controllers\API\v1\PurchaseController as ApiPurchaseController;
use App\Http\Controllers\API\v1\MedicineCategoryController as ApiMedicineCategoryController;
use App\Http\Controllers\API\v1\ReportController as ApiReportController;
use App\Http\Controllers\API\v1\DashboardController as ApiDashboardController;

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

        // Dashboard routes
        Route::prefix('dashboard')->group(function () {
            Route::get('/data', [DashboardController::class, 'data']);
            Route::get('/realtime', [DashboardController::class, 'realtime']);
        });

        // Pharmacy routes
        Route::prefix('pharmacy')->group(function () {
            // Medicines
            Route::apiResource('medicines', ApiMedicineController::class);
            Route::get('medicines/{medicine}/stock-history', [ApiMedicineController::class, 'stockHistory']);
            Route::post('medicines/{medicine}/adjust-stock', [ApiMedicineController::class, 'adjustStock']);

            // Medicine Categories
            Route::apiResource('categories', ApiMedicineCategoryController::class);

            // Sales
            Route::apiResource('sales', ApiSalesController::class);
            Route::post('sales/{sale}/void', [ApiSalesController::class, 'void']);
            Route::get('sales/{sale}/receipt', [ApiSalesController::class, 'receipt']);
            Route::get('sales/{sale}/items', [ApiSalesController::class, 'items']);

            // Stock Management
            Route::get('stock', [ApiStockController::class, 'index']);
            Route::get('stock/movements', [ApiStockController::class, 'movements']);
            Route::post('stock/adjust', [ApiStockController::class, 'adjust']);
            Route::get('stock/valuation', [ApiStockController::class, 'valuation']);
            Route::get('stock/alerts', [ApiStockController::class, 'alerts']);

            // Purchases
            Route::apiResource('purchases', ApiPurchaseController::class);
            Route::post('purchases/{purchase}/receive', [ApiPurchaseController::class, 'receive']);
            Route::post('purchases/{purchase}/cancel', [ApiPurchaseController::class, 'cancel']);

            // Alerts
            Route::get('alerts', [ApiAlertController::class, 'index']);
            Route::get('alerts/pending', [ApiAlertController::class, 'pending']);
            Route::post('alerts/{alert}/resolve', [ApiAlertController::class, 'resolve']);
            Route::get('alerts/expiry-risk', [ApiAlertController::class, 'expiryRisk']);

            // Reports
            Route::get('reports/dashboard', [ApiReportController::class, 'dashboard']);
            Route::get('reports/sales', [ApiReportController::class, 'sales']);
            Route::get('reports/stock', [ApiReportController::class, 'stock']);
            Route::get('reports/expiry', [ApiReportController::class, 'expiry']);

            // Dashboard
            Route::get('dashboard/stats', [ApiDashboardController::class, 'stats']);
            Route::get('dashboard/activities', [ApiDashboardController::class, 'recentActivities']);
        });
    });
});


