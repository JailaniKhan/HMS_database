<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\v1\PatientController;
use App\Http\Controllers\API\v1\DoctorController;
use App\Http\Controllers\API\v1\AppointmentController;
use App\Http\Controllers\API\v1\DepartmentController;
use App\Http\Controllers\API\v1\AdminController;

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

    // Protected routes with sanctum middleware
    Route::middleware('auth:sanctum')->group(function () {
        // Patient routes
        Route::apiResource('patients', PatientController::class);
        
        // Doctor routes
        Route::apiResource('doctors', DoctorController::class);
        
        // Appointment routes
        Route::apiResource('appointments', AppointmentController::class);
        
        // Department routes
        Route::apiResource('departments', DepartmentController::class);

        // Additional appointment routes
        Route::put('/appointments/{id}/cancel', [AppointmentController::class, 'cancel']);
        Route::put('/appointments/{id}/complete', [AppointmentController::class, 'complete']);
        
        // Admin routes
        Route::get('/admin/recent-activity', [AdminController::class, 'getRecentActivity']);
        Route::get('/admin/stats', [AdminController::class, 'getStats']);
        Route::get('/admin/audit-logs', [AdminController::class, 'getAuditLogs']);
        Route::get('/admin/audit-analytics', [AdminController::class, 'getAuditAnalytics']);
    });
    
});