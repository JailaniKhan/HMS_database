<?php

use Illuminate\Support\Facades\Auth;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\Patient\PatientController;
use App\Http\Controllers\Doctor\DoctorController;
use App\Http\Controllers\Appointment\AppointmentController;
use App\Http\Controllers\Billing\BillController;
use App\Http\Controllers\Billing\PaymentController;
use App\Http\Controllers\Billing\BillingReportController;
use App\Http\Controllers\Pharmacy\MedicineController;
use App\Http\Controllers\Pharmacy\MedicineCategoryController;
use App\Http\Controllers\Pharmacy\StockController;
use App\Http\Controllers\Pharmacy\SalesController;
use App\Http\Controllers\Pharmacy\PurchaseOrderController;
use App\Http\Controllers\Pharmacy\SupplierController;
use App\Http\Controllers\Pharmacy\AlertController;
use App\Http\Controllers\Pharmacy\DashboardController as PharmacyDashboardController;
use App\Http\Controllers\Laboratory\LabTestController;
use App\Http\Controllers\Laboratory\LabTestResultController;
use App\Http\Controllers\Department\DepartmentController;
use App\Http\Controllers\Department\DepartmentServiceController;
use App\Http\Controllers\Medical\MedicalRecordController;
use App\Http\Controllers\Medical\ClinicalAssessmentController;
use App\Http\Controllers\Admin\RBACController;
use App\Http\Controllers\Admin\PermissionController;
use Illuminate\Support\Facades\Route;

Route::middleware(['web', 'auth'])->group(function () {
    // Dashboard
    Route::get('/dashboard', function () {
        return inertia('Dashboard');
    })->name('dashboard')->middleware('check.permission:view-dashboard');

    // Patient Routes
    Route::middleware('check.permission:view-patients')->prefix('patients')->group(function () {
        Route::get('/', [PatientController::class, 'index'])->name('patients.index');
        Route::get('/create', [PatientController::class, 'create'])->name('patients.create');
        Route::post('/', [PatientController::class, 'store'])->name('patients.store')
            ->middleware('check.permission:create-patients');
        
        // More specific routes MUST come before parameterized routes
        Route::get('/{patient}/edit', [PatientController::class, 'edit'])->name('patients.edit');
        Route::post('/{patient}', [PatientController::class, 'update'])->name('patients.update.post')
            ->middleware('check.permission:edit-patients');
        Route::put('/{patient}', [PatientController::class, 'update'])->name('patients.update')
            ->middleware('check.permission:edit-patients');
        Route::delete('/{patient}', [PatientController::class, 'destroy'])->name('patients.destroy')
            ->middleware('check.permission:delete-patients');
        
        // General parameterized route MUST come last
        Route::get('/{patient}', [PatientController::class, 'show'])->name('patients.show');
    });

    // Doctor Routes
    Route::middleware('check.permission:view-doctors')->prefix('doctors')->group(function () {
        Route::get('/', [DoctorController::class, 'index'])->name('doctors.index');
        Route::get('/create', [DoctorController::class, 'create'])->name('doctors.create');
        Route::post('/', [DoctorController::class, 'store'])->name('doctors.store');
        
        // More specific routes MUST come before parameterized routes
        Route::get('/{doctor}/edit', [DoctorController::class, 'edit'])->name('doctors.edit');
        Route::post('/{doctor}', [DoctorController::class, 'update'])->name('doctors.update.post');
        Route::put('/{doctor}', [DoctorController::class, 'update'])->name('doctors.update');
        Route::post('/{doctor}/delete', [DoctorController::class, 'destroy'])->name('doctors.destroy.post');
        Route::delete('/{doctor}', [DoctorController::class, 'destroy'])->name('doctors.destroy');
        
        // General parameterized route MUST come last
        Route::get('/{doctor}', [DoctorController::class, 'show'])->name('doctors.show');
    });

    // Appointment Routes
    Route::middleware('check.permission:view-appointments')->prefix('appointments')->group(function () {
        Route::get('/', [AppointmentController::class, 'index'])->name('appointments.index');
        Route::get('/create', [AppointmentController::class, 'create'])->name('appointments.create');
        Route::post('/', [AppointmentController::class, 'store'])->name('appointments.store');
        Route::get('/{appointment}', [AppointmentController::class, 'show'])->name('appointments.show');
        Route::get('/{appointment}/edit', [AppointmentController::class, 'edit'])->name('appointments.edit');
        Route::post('/{appointment}', [AppointmentController::class, 'update'])->name('appointments.update.post');
        Route::put('/{appointment}', [AppointmentController::class, 'update'])->name('appointments.update');
        Route::delete('/{appointment}', [AppointmentController::class, 'destroy'])->name('appointments.destroy');
    });

    // Billing Routes
    Route::middleware('check.permission:view-billing')->prefix('billing')->group(function () {
        Route::get('/', [BillController::class, 'index'])->name('billing.index');
        Route::get('/create', [BillController::class, 'create'])->name('billing.create');
        Route::post('/', [BillController::class, 'store'])->name('billing.store');

        // Bill Parts standalone page - MUST be before /{bill} route
        Route::get('/parts', [BillController::class, 'partsIndex'])
            ->name('billing.parts.index')
            ->middleware('check.permission:view-billing');
        Route::get('/parts/dashboard', [BillController::class, 'partsDashboard'])
            ->name('billing.parts.dashboard')
            ->middleware('check.permission:view-billing');

        // Bill-specific routes - MUST be after /parts routes
        Route::get('/{bill}', [BillController::class, 'show'])->name('billing.show');
        Route::get('/{bill}/edit', [BillController::class, 'edit'])->name('billing.edit');
        Route::put('/{bill}', [BillController::class, 'update'])->name('billing.update');
        Route::delete('/{bill}', [BillController::class, 'destroy'])->name('billing.destroy');

        // Bill Actions
        Route::post('/{bill}/void', [BillController::class, 'void'])
            ->name('billing.void')
            ->middleware('check.permission:void-billing');
        Route::get('/{bill}/invoice', [BillController::class, 'generateInvoice'])
            ->name('billing.invoice')
            ->middleware('check.permission:view-billing');
        Route::get('/{bill}/items', [BillController::class, 'getBillItems'])
            ->name('billing.items')
            ->middleware('check.permission:view-billing');

        Route::post('/{bill}/reminder', [BillController::class, 'sendReminder'])
            ->name('billing.reminder')
            ->middleware('check.permission:manage-billing');

        // Payments
        Route::get('/{bill}/payments', [PaymentController::class, 'index'])
            ->name('billing.payments.index')
            ->middleware('check.permission:view-payments');
        Route::post('/{bill}/payments', [PaymentController::class, 'store'])
            ->name('billing.payments.store')
            ->middleware('check.permission:record-payments');
    });

    // Payments (Global)
    Route::middleware('check.permission:view-payments')->prefix('payments')->group(function () {
        Route::get('/', [PaymentController::class, 'listAll'])
            ->name('payments.index');
        Route::get('/{payment}', [PaymentController::class, 'show'])
            ->name('payments.show');
        Route::post('/{payment}/refund', [PaymentController::class, 'refund'])
            ->name('payments.refund')
            ->middleware('check.permission:process-refunds');
    });

    // Billing Reports
    Route::middleware('check.permission:view-billing-reports')->prefix('reports/billing')->group(function () {
        Route::get('/', [BillingReportController::class, 'index'])
            ->name('reports.billing.index');
        Route::get('/revenue', [BillingReportController::class, 'revenueReport'])
            ->name('reports.billing.revenue');
        Route::get('/outstanding', [BillingReportController::class, 'outstandingReport'])
            ->name('reports.billing.outstanding');
        Route::get('/payment-methods', [BillingReportController::class, 'paymentMethodReport'])
            ->name('reports.billing.payment-methods');
        Route::get('/transactions', [BillingReportController::class, 'transactionsReport'])
            ->name('reports.billing.transactions');
        Route::get('/department-revenue', [BillingReportController::class, 'departmentRevenueReport'])
            ->name('reports.billing.department-revenue');
        Route::get('/payment-trends', [BillingReportController::class, 'paymentTrendsReport'])
            ->name('reports.billing.payment-trends');
        Route::get('/collections', [BillingReportController::class, 'collectionsReport'])
            ->name('reports.billing.collections');
        Route::get('/overdue', [BillingReportController::class, 'overdueReport'])
            ->name('reports.billing.overdue');
        Route::get('/refunds', [BillingReportController::class, 'refundsReport'])
            ->name('reports.billing.refunds');
        Route::get('/provider-performance', [BillingReportController::class, 'providerPerformanceReport'])
            ->name('reports.billing.provider-performance');
    });

    // Pharmacy Routes
    Route::middleware('check.permission:view-pharmacy')->prefix('pharmacy')->group(function () {
        // Pharmacy Dashboard
        Route::get('/', [PharmacyDashboardController::class, 'index'])->name('pharmacy.dashboard');
        Route::get('/dashboard', [PharmacyDashboardController::class, 'index'])->name('pharmacy.dashboard.index');

        // Medicine Categories
        Route::get('/categories', [MedicineCategoryController::class, 'index'])->name('pharmacy.categories.index');
        Route::get('/categories/create', [MedicineCategoryController::class, 'create'])->name('pharmacy.categories.create');
        Route::post('/categories', [MedicineCategoryController::class, 'store'])->name('pharmacy.categories.store');
        Route::get('/categories/{category}/edit', [MedicineCategoryController::class, 'edit'])->name('pharmacy.categories.edit');
        Route::put('/categories/{category}', [MedicineCategoryController::class, 'update'])->name('pharmacy.categories.update');
        Route::delete('/categories/{category}', [MedicineCategoryController::class, 'destroy'])->name('pharmacy.categories.destroy');

        // Medicines
        Route::get('/medicines', [MedicineController::class, 'index'])->name('pharmacy.medicines.index');
        Route::get('/medicines/create', [MedicineController::class, 'create'])->name('pharmacy.medicines.create');
        Route::post('/medicines', [MedicineController::class, 'store'])->name('pharmacy.medicines.store');

        // Static medicine pages must be declared before the parameterized {medicine} routes
        // so that route-model binding does not capture 'low-stock', 'expired', etc.
        Route::get('/medicines/low-stock', [MedicineController::class, 'lowStock'])->name('pharmacy.medicines.low-stock');
        Route::get('/medicines/expired', [MedicineController::class, 'expired'])->name('pharmacy.medicines.expired');
        Route::get('/medicines/expiring-soon', [MedicineController::class, 'expiringSoon'])->name('pharmacy.medicines.expiring-soon');

        Route::get('/medicines/{medicine}', [MedicineController::class, 'show'])->name('pharmacy.medicines.show');
        Route::get('/medicines/{medicine}/edit', [MedicineController::class, 'edit'])->name('pharmacy.medicines.edit');
        Route::put('/medicines/{medicine}', [MedicineController::class, 'update'])->name('pharmacy.medicines.update');
        Route::delete('/medicines/{medicine}', [MedicineController::class, 'destroy'])->name('pharmacy.medicines.destroy');

        // Stock Management Routes
        Route::get('/stock', [StockController::class, 'index'])->name('pharmacy.stock.index');
        Route::get('/stock/export', [StockController::class, 'export'])->name('pharmacy.stock.export');
        Route::get('/stock/movements', [StockController::class, 'movements'])->name('pharmacy.stock.movements');
        Route::get('/stock/movements/export', [StockController::class, 'exportMovements'])->name('pharmacy.stock.movements.export');
        Route::get('/stock/adjustments', [StockController::class, 'adjustments'])->name('pharmacy.stock.adjustments');
        Route::post('/stock/adjust', [StockController::class, 'adjust'])->name('pharmacy.stock.adjust');
        Route::get('/stock/valuation', [StockController::class, 'valuation'])->name('pharmacy.stock.valuation');
        Route::get('/stock/report', [StockController::class, 'report'])->name('pharmacy.stock.report');
        Route::get('/stock/alerts', [StockController::class, 'alerts'])->name('pharmacy.stock.alerts');

        // Sales Routes
        Route::get('/sales', [SalesController::class, 'index'])->name('pharmacy.sales.index');
        Route::get('/sales/create', [SalesController::class, 'create'])->name('pharmacy.sales.create');
        Route::get('/sales/dispense', [SalesController::class, 'dispense'])->name('pharmacy.sales.dispense');
        Route::post('/sales', [SalesController::class, 'store'])->name('pharmacy.sales.store');
        Route::get('/sales/{sale}', [SalesController::class, 'show'])->name('pharmacy.sales.show');
        Route::post('/sales/{sale}/void', [SalesController::class, 'void'])->name('pharmacy.sales.void');
        Route::get('/sales/{sale}/receipt', [SalesController::class, 'receipt'])->name('pharmacy.sales.receipt');
        Route::get('/sales/{sale}/print', [SalesController::class, 'printReceipt'])->name('pharmacy.sales.print');
        Route::get('/sales/export', [SalesController::class, 'export'])->name('pharmacy.sales.export');

        Route::get('/purchase-orders', [PurchaseOrderController::class, 'index'])->name('pharmacy.purchase-orders.index');
        Route::get('/purchase-orders/create', [PurchaseOrderController::class, 'create'])->name('pharmacy.purchase-orders.create');
        Route::post('/purchase-orders', [PurchaseOrderController::class, 'store'])->name('pharmacy.purchase-orders.store');
        Route::get('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'show'])->name('pharmacy.purchase-orders.show');
        Route::get('/purchase-orders/{purchaseOrder}/edit', [PurchaseOrderController::class, 'edit'])->name('pharmacy.purchase-orders.edit');
        Route::put('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'update'])->name('pharmacy.purchase-orders.update');
        Route::delete('/purchase-orders/{purchaseOrder}', [PurchaseOrderController::class, 'destroy'])->name('pharmacy.purchase-orders.destroy');
        Route::put('/purchase-orders/{purchaseOrder}/status', [PurchaseOrderController::class, 'updateStatus'])->name('pharmacy.purchase-orders.update-status');
        Route::get('/purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receivePage'])->name('pharmacy.purchase-orders.receive');
        Route::post('/purchase-orders/{purchaseOrder}/receive', [PurchaseOrderController::class, 'receive'])->name('pharmacy.purchase-orders.receive.store');

        // Supplier Routes
        Route::get('/suppliers', [SupplierController::class, 'index'])->name('pharmacy.suppliers.index');
        Route::get('/suppliers/create', [SupplierController::class, 'create'])->name('pharmacy.suppliers.create');
        Route::post('/suppliers', [SupplierController::class, 'store'])->name('pharmacy.suppliers.store');
        Route::get('/suppliers/{supplier}', [SupplierController::class, 'show'])->name('pharmacy.suppliers.show');
        Route::get('/suppliers/{supplier}/edit', [SupplierController::class, 'edit'])->name('pharmacy.suppliers.edit');
        Route::put('/suppliers/{supplier}', [SupplierController::class, 'update'])->name('pharmacy.suppliers.update');
        Route::delete('/suppliers/{supplier}', [SupplierController::class, 'destroy'])->name('pharmacy.suppliers.destroy');

        Route::get('/alerts', [AlertController::class, 'index'])->name('pharmacy.alerts.index');
        Route::get('/alerts/pending', [AlertController::class, 'pending'])->name('pharmacy.alerts.pending');
        Route::get('/alerts/resolved', [AlertController::class, 'resolved'])->name('pharmacy.alerts.resolved');
        Route::get('/alerts/trigger-check', [AlertController::class, 'triggerCheck'])->name('pharmacy.alerts.trigger-check');
        Route::put('/alerts/{alert}/status', [AlertController::class, 'updateStatus'])->name('pharmacy.alerts.update-status');

        // Reports Routes
        Route::get('/reports', [\App\Http\Controllers\Pharmacy\ReportController::class, 'index'])->name('pharmacy.reports.index');
        Route::get('/reports/sales', [\App\Http\Controllers\Pharmacy\ReportController::class, 'sales'])->name('pharmacy.reports.sales');
        Route::get('/reports/stock', [\App\Http\Controllers\Pharmacy\ReportController::class, 'stock'])->name('pharmacy.reports.stock');
        Route::get('/reports/expiry', [\App\Http\Controllers\Pharmacy\ReportController::class, 'expiry'])->name('pharmacy.reports.expiry');
    });

    // Laboratory Routes
    Route::middleware('check.permission:view-laboratory')->prefix('laboratory')->group(function () {
        // Laboratory Dashboard
        Route::get('/', [LabTestController::class, 'dashboard'])->name('laboratory.index');
        
        Route::get('/lab-tests', [LabTestController::class, 'index'])->name('laboratory.lab-tests.index');
        Route::get('/lab-tests/create', [LabTestController::class, 'create'])->name('laboratory.lab-tests.create');
        Route::post('/lab-tests', [LabTestController::class, 'store'])->name('laboratory.lab-tests.store');
        Route::get('/lab-tests/{labTest}', [LabTestController::class, 'show'])->name('laboratory.lab-tests.show');
        Route::get('/lab-tests/{labTest}/edit', [LabTestController::class, 'edit'])->name('laboratory.lab-tests.edit');
        Route::put('/lab-tests/{labTest}', [LabTestController::class, 'update'])->name('laboratory.lab-tests.update');
        Route::delete('/lab-tests/{labTest}', [LabTestController::class, 'destroy'])->name('laboratory.lab-tests.destroy');
        Route::patch('/lab-tests/{labTest}/status', [LabTestController::class, 'updateStatus'])->name('laboratory.lab-tests.update-status');
        Route::post('/lab-tests/{labTest}/duplicate', [LabTestController::class, 'duplicate'])->name('laboratory.lab-tests.duplicate');

        Route::get('/lab-test-results', [LabTestResultController::class, 'index'])->name('laboratory.lab-test-results.index');
        Route::get('/lab-test-results/create', [LabTestResultController::class, 'create'])->name('laboratory.lab-test-results.create');
        Route::post('/lab-test-results', [LabTestResultController::class, 'store'])->name('laboratory.lab-test-results.store');
        Route::get('/lab-test-results/{labTestResult}', [LabTestResultController::class, 'show'])->name('laboratory.lab-test-results.show');
        Route::get('/lab-test-results/{labTestResult}/edit', [LabTestResultController::class, 'edit'])->name('laboratory.lab-test-results.edit');
        Route::put('/lab-test-results/{labTestResult}', [LabTestResultController::class, 'update'])->name('laboratory.lab-test-results.update');
        Route::delete('/lab-test-results/{labTestResult}', [LabTestResultController::class, 'destroy'])->name('laboratory.lab-test-results.destroy');

        // Lab Test Request Routes
        Route::middleware('check.permission:view-lab-test-requests')->group(function () {
            Route::get('/lab-test-requests', [\App\Http\Controllers\Laboratory\LabTestRequestController::class, 'index'])->name('laboratory.lab-test-requests.index');
            Route::get('/lab-test-requests/search', [\App\Http\Controllers\Laboratory\LabTestRequestController::class, 'search'])->name('laboratory.lab-test-requests.search');
            Route::get('/lab-test-requests/create', [\App\Http\Controllers\Laboratory\LabTestRequestController::class, 'create'])->name('laboratory.lab-test-requests.create');
            Route::post('/lab-test-requests', [\App\Http\Controllers\Laboratory\LabTestRequestController::class, 'store'])->name('laboratory.lab-test-requests.store');
            Route::get('/lab-test-requests/{labTestRequest}', [\App\Http\Controllers\Laboratory\LabTestRequestController::class, 'show'])->name('laboratory.lab-test-requests.show');
        });

        Route::middleware('check.permission:edit-lab-test-requests')->group(function () {
            Route::get('/lab-test-requests/{labTestRequest}/edit', [\App\Http\Controllers\Laboratory\LabTestRequestController::class, 'edit'])->name('laboratory.lab-test-requests.edit');
            Route::put('/lab-test-requests/{labTestRequest}', [\App\Http\Controllers\Laboratory\LabTestRequestController::class, 'update'])->name('laboratory.lab-test-requests.update');
            Route::post('/lab-test-requests/{labTestRequest}/restore', [\App\Http\Controllers\Laboratory\LabTestRequestController::class, 'restore'])->name('laboratory.lab-test-requests.restore');
        });

        Route::middleware('check.permission:delete-lab-test-requests')->group(function () {
            Route::delete('/lab-test-requests/{labTestRequest}', [\App\Http\Controllers\Laboratory\LabTestRequestController::class, 'destroy'])->name('laboratory.lab-test-requests.destroy');
        });

        Route::middleware('check.permission:process-lab-test-requests')->group(function () {
            Route::put('/lab-test-requests/{labTestRequest}/status', [\App\Http\Controllers\Laboratory\LabTestRequestController::class, 'updateStatus'])->name('laboratory.lab-test-requests.update-status');
            Route::patch('/lab-test-requests/{labTestRequest}/status', [\App\Http\Controllers\Laboratory\LabTestRequestController::class, 'updateStatus'])->name('laboratory.lab-test-requests.update-status-patch');
        });
    });

    // Department Routes
    Route::middleware('check.permission:view-departments')->prefix('departments')->group(function () {
        Route::get('/', [DepartmentController::class, 'index'])->name('departments.index');
        Route::get('/create', [DepartmentController::class, 'create'])->name('departments.create');
        Route::post('/', [DepartmentController::class, 'store'])->name('departments.store');
        Route::get('/{department}', [DepartmentController::class, 'show'])->name('departments.show');
        Route::get('/{department}/edit', [DepartmentController::class, 'edit'])->name('departments.edit');
        Route::put('/{department}', [DepartmentController::class, 'update'])->name('departments.update');
        Route::delete('/{department}', [DepartmentController::class, 'destroy'])->name('departments.destroy');

        // Department Service Routes
        Route::post('/{department}/services', [DepartmentServiceController::class, 'store'])->name('departments.services.store');
        Route::put('/services/{service}', [DepartmentServiceController::class, 'update'])->name('departments.services.update');
        Route::delete('/services/{service}', [DepartmentServiceController::class, 'destroy'])->name('departments.services.destroy');
    });

    // Medical Records Routes
    Route::middleware('check.permission:view-medical-records')->prefix('medical-records')->group(function () {
        Route::get('/', [MedicalRecordController::class, 'index'])->name('medical-records.index');
        Route::get('/create', [MedicalRecordController::class, 'create'])->name('medical-records.create');
        Route::get('/create', [MedicalRecordController::class, 'create'])->name('medical-records.create');
        Route::post('/', [MedicalRecordController::class, 'store'])->name('medical-records.store');
        Route::get('/{medicalRecord}', [MedicalRecordController::class, 'show'])->name('medical-records.show');
        Route::get('/{medicalRecord}/edit', [MedicalRecordController::class, 'edit'])->name('medical-records.edit');
        Route::put('/{medicalRecord}', [MedicalRecordController::class, 'update'])->name('medical-records.update');
        Route::post('/{medicalRecord}/finalize', [MedicalRecordController::class, 'finalize'])->name('medical-records.finalize');
        Route::get('/patient/{patientId}/history', [MedicalRecordController::class, 'getPatientHistory'])->name('medical-records.patient-history');
        Route::get('/patient/{patientId}/diagnostic', [MedicalRecordController::class, 'runDiagnostic'])->name('medical-records.diagnostic');
    });

    // Clinical Assessments Routes
    Route::middleware('check.permission:view-clinical-assessments')->prefix('clinical-assessments')->group(function () {
        Route::get('/', [ClinicalAssessmentController::class, 'index'])->name('clinical-assessments.index');
        Route::get('/create', [ClinicalAssessmentController::class, 'create'])->name('clinical-assessments.create');
        Route::post('/', [ClinicalAssessmentController::class, 'store'])->name('clinical-assessments.store');
        Route::get('/{clinicalAssessment}', [ClinicalAssessmentController::class, 'show'])->name('clinical-assessments.show');
        Route::get('/{clinicalAssessment}/edit', [ClinicalAssessmentController::class, 'edit'])->name('clinical-assessments.edit');
        Route::put('/{clinicalAssessment}', [ClinicalAssessmentController::class, 'update'])->name('clinical-assessments.update');
        Route::post('/{clinicalAssessment}/finalize', [ClinicalAssessmentController::class, 'finalize'])->name('clinical-assessments.finalize');
    });

    // Report Routes
    Route::middleware('check.permission:view-reports')->prefix('reports')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/patients', [ReportController::class, 'patientReport'])->name('reports.patient');
        Route::get('/doctors', [ReportController::class, 'doctorReport'])->name('reports.doctor');
        Route::get('/appointments', [ReportController::class, 'appointmentReport'])->name('reports.appointment');
        Route::get('/billing', [ReportController::class, 'billingReport'])->name('reports.billing');
        Route::get('/billing/download', [ReportController::class, 'billingReportDownload'])->name('reports.billing.download');
        Route::get('/pharmacy-sales', [ReportController::class, 'pharmacySalesReport'])->name('reports.pharmacy-sales');
        Route::get('/lab-test', [ReportController::class, 'labTestReport'])->name('reports.lab-test');

        // Additional statistics reports
        Route::get('/daily-stats', [ReportController::class, 'dailyStats'])->name('reports.daily-stats');
        Route::get('/doctor-workload', [ReportController::class, 'doctorWorkload'])->name('reports.doctor-workload');
        Route::get('/weekly-trend', [ReportController::class, 'weeklyTrend'])->name('reports.weekly-trend');
    });

    // Admin Dashboard
    Route::get('/admin', function () {
        $user = Auth::user();

        // Check if user has permission to access admin dashboard
        if (!$user->hasPermission('view-users') && !$user->isSuperAdmin()) {
            abort(403, 'Unauthorized access');
        }

        return inertia('Admin/Dashboard');
    })->name('admin.dashboard')->middleware('auth');

    // Admin User Management Routes
    Route::middleware(['check.permission:view-users', 'permission.monitoring'])->prefix('admin')->group(function () {
        Route::prefix('users')->group(function () {
            Route::get('/', [App\Http\Controllers\Admin\UserController::class, 'index'])->name('admin.users.index')->middleware('auth');
            Route::get('/create', [App\Http\Controllers\Admin\UserController::class, 'create'])->name('admin.users.create')->middleware('auth');
            Route::get('/check-username', [App\Http\Controllers\Admin\UserController::class, 'checkUsername'])->name('admin.users.check-username')->middleware('auth');
            Route::post('/', [App\Http\Controllers\Admin\UserController::class, 'store'])->name('admin.users.store')->middleware('auth');
            Route::get('/{user}', [App\Http\Controllers\Admin\UserController::class, 'show'])->name('admin.users.show')->middleware('auth');
            Route::get('/{user}/edit', [App\Http\Controllers\Admin\UserController::class, 'edit'])->name('admin.users.edit')->middleware('auth');
            Route::put('/{user}', [App\Http\Controllers\Admin\UserController::class, 'update'])->name('admin.users.update')->middleware('auth');

            // User Permissions Management
            Route::get('/{user}/permissions', [App\Http\Controllers\Admin\UserController::class, 'editPermissions'])->name('admin.users.permissions.edit')->middleware('auth');
            Route::put('/{user}/permissions', [App\Http\Controllers\Admin\UserController::class, 'updatePermissions'])->name('admin.users.permissions.update')->middleware('auth');
            Route::delete('/{user}/permissions/{permission}', [App\Http\Controllers\Admin\UserController::class, 'revokePermission'])->name('admin.users.permissions.revoke')->middleware('auth');

            // Bulk operations and templates
            Route::post('/bulk-permissions', [App\Http\Controllers\Admin\UserController::class, 'bulkUpdatePermissions'])->name('admin.users.bulk-permissions')->middleware('auth');
            Route::get('/permission-templates', [App\Http\Controllers\Admin\UserController::class, 'getPermissionTemplates'])->name('admin.users.permission-templates')->middleware('auth');
            Route::post('/analyze-permission-impact', [App\Http\Controllers\Admin\UserController::class, 'analyzePermissionImpact'])->name('admin.users.analyze-permission-impact')->middleware('auth');

            Route::delete('/{user}', [App\Http\Controllers\Admin\UserController::class, 'destroy'])->name('admin.users.destroy')->middleware('auth');
        });

        // Permissions Management Routes
        Route::middleware('permission.monitoring')->prefix('permissions')->group(function () {
            Route::get('/', [App\Http\Controllers\Admin\PermissionsController::class, 'index'])->name('admin.permissions.index')->middleware('auth');
            Route::get('/roles/{role}', [App\Http\Controllers\Admin\PermissionsController::class, 'editRolePermissions'])->name('admin.permissions.roles.edit')->middleware('auth');
            Route::put('/roles/{role}', [App\Http\Controllers\Admin\PermissionsController::class, 'updateRolePermissions'])->name('admin.permissions.roles.update')->middleware('auth');
            Route::post('/roles/{role}/reset', [App\Http\Controllers\Admin\PermissionsController::class, 'resetRolePermissions'])->name('admin.permissions.roles.reset')->middleware('auth');
            Route::get('/users/{user}/edit', [App\Http\Controllers\Admin\PermissionsController::class, 'editUserPermissions'])->name('admin.permissions.users.edit')->middleware('auth');
            Route::put('/users/{user}', [App\Http\Controllers\Admin\PermissionsController::class, 'updateUserPermissions'])->name('admin.permissions.users.update')->middleware('auth');
        });

        // Security Center Route
        Route::get('/security', [App\Http\Controllers\Admin\SecurityController::class, 'index'])->name('admin.security')->middleware('auth');

        // Activity Logs Route for Super Admins
        Route::get('/activity-logs', function () {
            $user = Auth::user();

            // Only allow Super Admins to access activity logs
            if (!$user->isSuperAdmin()) {
                abort(403, 'Unauthorized access');
            }

            return inertia('Admin/ActivityLogs');
        })->name('admin.activity-logs')->middleware('auth');
    });
});

// Admin API routes for dashboard
Route::middleware(['auth'])->group(function () {
    Route::get('/api/v1/admin/recent-activity', [App\Http\Controllers\API\v1\AdminController::class, 'getRecentActivity']);
    Route::get('/api/v1/admin/audit-logs', [App\Http\Controllers\API\v1\AdminController::class, 'getAuditLogs']);
    Route::get('/api/v1/admin/stats', [App\Http\Controllers\API\v1\AdminController::class, 'getStats']);

    // Security Center API routes
    Route::put('/api/v1/admin/change-password', [App\Http\Controllers\API\v1\SecurityController::class, 'updateOwnPassword']);
    Route::put('/api/v1/admin/update-profile', [App\Http\Controllers\API\v1\SecurityController::class, 'updateOwnProfile']);
    Route::get('/api/v1/admin/users', [App\Http\Controllers\API\v1\SecurityController::class, 'getUsers']);
    Route::post('/api/v1/admin/users', [App\Http\Controllers\API\v1\SecurityController::class, 'createUser']);
    Route::put('/api/v1/admin/users/{user}/update-profile', [App\Http\Controllers\API\v1\SecurityController::class, 'updateUserProfile']);
    Route::put('/api/v1/admin/users/{user}/reset-password', [App\Http\Controllers\API\v1\SecurityController::class, 'resetUserPassword']);
    Route::delete('/api/v1/admin/users/{user}', [App\Http\Controllers\API\v1\SecurityController::class, 'deleteUser']);
    Route::put('/api/v1/admin/users/{user}/change-password', [App\Http\Controllers\API\v1\SecurityController::class, 'updateUserPassword']);
    Route::put('/api/v1/admin/users/{user}/update-username', [App\Http\Controllers\API\v1\SecurityController::class, 'updateUsername']);
    
    // Admin RBAC Routes
    Route::middleware(['check.permission:view-rbac-dashboard'])->prefix('admin')->group(function () {
        // RBAC Dashboard
        Route::get('/rbac', [RBACController::class, 'index'])->name('admin.rbac.index');
        Route::get('/rbac/hierarchy', [RBACController::class, 'hierarchy'])->name('admin.rbac.hierarchy');
        Route::get('/rbac/permission-matrix', [RBACController::class, 'permissionMatrix'])->name('admin.rbac.permission-matrix');
        Route::post('/rbac/role-permissions', [RBACController::class, 'updateRolePermissions'])
            ->name('admin.rbac.update-role-permissions')
            ->middleware('check.permission:manage-role-permissions');
        
        // User Assignments
        Route::get('/rbac/user-assignments', [RBACController::class, 'userAssignments'])->name('admin.rbac.user-assignments');
        Route::put('/rbac/users/{user}/role', [RBACController::class, 'updateUserRole'])
            ->name('admin.rbac.update-user-role')
            ->middleware('check.permission:manage-user-roles');
        
        // Audit Logs
        Route::get('/rbac/audit-logs', [RBACController::class, 'auditLogs'])->name('admin.rbac.audit-logs');
        
        // Configuration Export/Import
        Route::get('/rbac/export', [RBACController::class, 'exportConfiguration'])
            ->name('admin.rbac.export')
            ->middleware('check.permission:export-rbac-configuration');
        Route::post('/rbac/import', [RBACController::class, 'importConfiguration'])
            ->name('admin.rbac.import')
            ->middleware('check.permission:import-rbac-configuration');
    });
});
