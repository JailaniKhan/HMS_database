<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\LabTestResult;
use App\Models\Sale;
use App\Models\AuditLog;
use App\Models\Department;
use App\Services\StatsService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class ReportController extends Controller
{
    protected StatsService $statsService;

    /**
     * Maximum records for PDF exports to prevent memory issues.
     */
    protected int $maxExportRecords = 1000;

    public function __construct(StatsService $statsService)
    {
        $this->statsService = $statsService;
    }

    /**
     * Authorize report access using permission system.
     */
    protected function authorizeReport(string $permission): void
    {
        $user = Auth::user();
        
        if (!$user->hasPermission($permission)) {
            AuditLog::log(
                'unauthorized_report_access',
                "User attempted to access report without '{$permission}' permission",
                'reports',
                'warning'
            );
            abort(403, 'Unauthorized: You do not have permission to access this report.');
        }
    }

    /**
     * Get date range from request with validation.
     */
    protected function getDateRange(Request $request): array
    {
        $startDate = $request->input('start_date') 
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : Carbon::now()->subMonth()->startOfDay();
            
        $endDate = $request->input('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : Carbon::now()->endOfDay();

        // Validate date range doesn't exceed 1 year
        if ($startDate->diffInDays($endDate) > 365) {
            $startDate = $endDate->copy()->subYear();
        }

        return [$startDate, $endDate];
    }

    /**
     * Generate patient report with pagination support.
     */
    public function patientReport(Request $request)
    {
        $this->authorizeReport('view-reports');
        
        [$startDate, $endDate] = $this->getDateRange($request);
        
        $query = Patient::with(['appointments' => function ($q) use ($startDate, $endDate) {
            $q->whereBetween('appointment_date', [$startDate, $endDate])
              ->select('id', 'patient_id', 'appointment_date', 'status');
        }])
        ->select('id', 'patient_id', 'first_name', 'father_name', 'gender', 'created_at')
        ->whereBetween('created_at', [$startDate, $endDate]);

        // Limit records for export
        $patients = $query->limit($this->maxExportRecords)->get();
        
        AuditLog::log('generate_patient_report', "Generated patient report for {$patients->count()} records", 'reports');
        
        $pdf = Pdf::loadView('reports.patient-report', compact('patients', 'startDate', 'endDate'));
        return $pdf->download('patient-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate doctor report with pagination support.
     */
    public function doctorReport(Request $request)
    {
        $this->authorizeReport('view-reports');
        
        [$startDate, $endDate] = $this->getDateRange($request);
        
        $doctors = Doctor::with(['appointments' => function ($q) use ($startDate, $endDate) {
            $q->whereBetween('appointment_date', [$startDate, $endDate])
              ->select('id', 'doctor_id', 'appointment_date', 'status', 'fee');
        }, 'department:id,name'])
        ->select('id', 'doctor_id', 'first_name', 'last_name', 'specialization', 'department_id', 'status')
        ->limit($this->maxExportRecords)
        ->get();
        
        AuditLog::log('generate_doctor_report', "Generated doctor report for {$doctors->count()} records", 'reports');
        
        $pdf = Pdf::loadView('reports.doctor-report', compact('doctors', 'startDate', 'endDate'));
        return $pdf->download('doctor-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate appointment report with pagination support.
     */
    public function appointmentReport(Request $request)
    {
        $this->authorizeReport('view-reports');

        [$startDate, $endDate] = $this->getDateRange($request);

        $appointments = Appointment::with([
            'patient:id,patient_id,first_name,father_name',
            'doctor:id,doctor_id,full_name',
            'department:id,name'
        ])
        ->select('id', 'appointment_id', 'patient_id', 'doctor_id', 'department_id', 'appointment_date', 'status', 'fee')
        ->whereBetween('appointment_date', [$startDate, $endDate])
        ->orderBy('appointment_date', 'desc')
        ->limit($this->maxExportRecords)
        ->get();
        
        AuditLog::log('generate_appointment_report', "Generated appointment report for {$appointments->count()} records", 'reports');
        
        $pdf = Pdf::loadView('reports.appointment-report', compact('appointments', 'startDate', 'endDate'));
        return $pdf->download('appointment-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate billing report with pagination support.
     */
    public function billingReport(Request $request)
    {
        $this->authorizeReport('view-billing');

        [$startDate, $endDate] = $this->getDateRange($request);

        $bills = Bill::with([
            'patient:id,patient_id,first_name,father_name',
            'items:id,bill_id,description,quantity,unit_price,total'
        ])
        ->select('id', 'bill_number', 'patient_id', 'bill_date', 'total_amount', 'amount_paid', 'amount_due', 'payment_status', 'status')
        ->whereBetween('bill_date', [$startDate, $endDate])
        ->orderBy('bill_date', 'desc')
        ->limit($this->maxExportRecords)
        ->get();
        
        AuditLog::log('generate_billing_report', "Generated billing report for {$bills->count()} records", 'reports');
        
        $pdf = Pdf::loadView('reports.billing-report', compact('bills', 'startDate', 'endDate'));
        return $pdf->download('billing-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate pharmacy sales report with pagination support.
     */
    public function pharmacySalesReport(Request $request)
    {
        $this->authorizeReport('view-pharmacy');
        
        [$startDate, $endDate] = $this->getDateRange($request);
        
        $sales = Sale::with([
            'items.medicine:id,name,generic_name',
            'user:id,name'
        ])
        ->select('id', 'sale_number', 'patient_id', 'user_id', 'total_amount', 'created_at')
        ->whereBetween('created_at', [$startDate, $endDate])
        ->orderBy('created_at', 'desc')
        ->limit($this->maxExportRecords)
        ->get();
        
        AuditLog::log('generate_pharmacy_report', "Generated pharmacy sales report for {$sales->count()} records", 'reports');
        
        $pdf = Pdf::loadView('reports.pharmacy-sales-report', compact('sales', 'startDate', 'endDate'));
        return $pdf->download('pharmacy-sales-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate lab test report with pagination support.
     */
    public function labTestReport(Request $request)
    {
        $this->authorizeReport('view-laboratory');
        
        [$startDate, $endDate] = $this->getDateRange($request);
        
        $labTestResults = LabTestResult::with([
            'labTest:id,name,category',
            'patient:id,patient_id,first_name,father_name'
        ])
        ->select('id', 'test_id', 'patient_id', 'result', 'status', 'created_at')
        ->whereBetween('created_at', [$startDate, $endDate])
        ->orderBy('created_at', 'desc')
        ->limit($this->maxExportRecords)
        ->get();
        
        AuditLog::log('generate_lab_report', "Generated lab test report for {$labTestResults->count()} records", 'reports');
        
        $pdf = Pdf::loadView('reports.lab-test-report', compact('labTestResults', 'startDate', 'endDate'));
        return $pdf->download('lab-test-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Show report dashboard.
     */
    public function index(): Response
    {
        $this->authorizeReport('view-reports');

        return Inertia::render('Reports/Index');
    }

    /**
     * Get dashboard statistics with real data.
     */
    public function dashboardStats()
    {
        try {
            $user = Auth::user();
    
            if (!$user->hasPermission('view-dashboard')) {
                abort(403, 'Unauthorized access');
            }
    
            $today = now()->toDateString();
            
            // Calculate stats with optimized queries
            $total_patients = Patient::count();
            $total_doctors = Doctor::where('status', 'active')->count();
            $appointments_today = Appointment::whereDate('appointment_date', $today)->count();
            $revenue_today = Appointment::whereDate('appointment_date', $today)->sum('fee');
            
            // Get real recent activities from audit logs
            $recent_activities = $this->getRecentActivities();
            
            // Get real monthly appointment data
            $monthly_data = $this->getMonthlyAppointmentData();
            
            // Get real department distribution data
            $department_data = $this->getDepartmentDistribution();
            
            return Inertia::render('Dashboard', [
                'total_patients' => $total_patients,
                'total_doctors' => $total_doctors,
                'appointments_today' => $appointments_today,
                'revenue_today' => floatval($revenue_today),
                'recent_activities' => $recent_activities,
                'monthly_data' => $monthly_data,
                'department_data' => $department_data,
            ]);
        } catch (\Exception $e) {
            Log::error('Error in dashboardStats: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            
            return Inertia::render('Dashboard', [
                'total_patients' => 0,
                'total_doctors' => 0,
                'appointments_today' => 0,
                'revenue_today' => 0,
                'recent_activities' => [],
                'monthly_data' => [],
                'department_data' => [],
                'error' => 'Unable to load dashboard data',
            ]);
        }
    }

    /**
     * Get recent activities from audit logs.
     */
    protected function getRecentActivities(): array
    {
        return AuditLog::select('id', 'action', 'description', 'module', 'logged_at')
            ->whereIn('module', ['patients', 'appointments', 'billing', 'doctors'])
            ->whereIn('severity', ['info'])
            ->orderBy('logged_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'title' => $this->formatActivityTitle($log->action),
                    'description' => $log->description ?? $log->action,
                    'time' => $log->logged_at->diffForHumans(),
                    'type' => $log->module ?? 'system',
                ];
            })
            ->toArray();
    }

    /**
     * Format activity title from action.
     */
    protected function formatActivityTitle(string $action): string
    {
        return ucwords(str_replace(['_', '-'], ' ', $action));
    }

    /**
     * Get monthly appointment data for charts.
     */
    protected function getMonthlyAppointmentData(): array
    {
        $sixMonthsAgo = now()->subMonths(5)->startOfMonth();
        
        return Appointment::select(
            DB::raw('YEAR(appointment_date) as year'),
            DB::raw('MONTH(appointment_date) as month'),
            DB::raw('COUNT(*) as visits')
        )
        ->where('appointment_date', '>=', $sixMonthsAgo)
        ->groupBy('year', 'month')
        ->orderBy('year')
        ->orderBy('month')
        ->get()
        ->map(function ($item) {
            return [
                'month' => Carbon::createFromDate($item->year, $item->month, 1)->format('M'),
                'visits' => $item->visits,
            ];
        })
        ->toArray();
    }

    /**
     * Get department distribution for charts.
     */
    protected function getDepartmentDistribution(): array
    {
        return Department::withCount(['appointments' => function ($q) {
            $q->where('appointment_date', '>=', now()->subMonth());
        }])
        ->having('appointments_count', '>', 0)
        ->orderBy('appointments_count', 'desc')
        ->limit(10)
        ->get()
        ->map(function ($dept) {
            return [
                'name' => $dept->name,
                'value' => $dept->appointments_count,
            ];
        })
        ->toArray();
    }

    /**
     * Get daily patient statistics.
     */
    public function dailyStats()
    {
        $this->authorizeReport('view-reports');

        $stats = $this->statsService->getDailyPatientStats();
        
        return Inertia::render('Reports/DailyStats', [
            'stats' => $stats
        ]);
    }

    /**
     * Get doctor workload statistics.
     */
    public function doctorWorkload()
    {
        $this->authorizeReport('view-reports');

        $workload = $this->statsService->getDoctorWorkloadStats();
        
        return Inertia::render('Reports/DoctorWorkload', [
            'workload' => $workload
        ]);
    }

    /**
     * Get weekly patient trend.
     */
    public function weeklyTrend()
    {
        $this->authorizeReport('view-reports');

        $trend = $this->statsService->getWeeklyPatientTrend();
        
        return Inertia::render('Reports/WeeklyTrend', [
            'trend' => $trend
        ]);
    }
}
