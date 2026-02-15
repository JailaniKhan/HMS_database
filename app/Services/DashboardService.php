<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Bill;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\Payment;
use App\Models\Department;
use App\Models\Sale;
use App\Models\Medicine;
use App\Models\LabTestRequest;
use App\Models\AuditLog;
use App\Models\Prescription;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DashboardService
{
    /**
     * Get comprehensive dashboard statistics
     */
    public function getDashboardStats(string $period = 'today'): array
    {
        try {
            $dateRange = $this->getDateRange($period);
            
            Log::info('DashboardStats: Starting to fetch data for period: ' . $period);
            
            $summary = $this->getSummaryStats($dateRange);
            Log::info('DashboardStats: Summary fetched successfully');
            
            $patients = $this->getPatientStats($dateRange);
            Log::info('DashboardStats: Patients fetched successfully');
            
            $appointments = $this->getAppointmentStats($dateRange);
            Log::info('DashboardStats: Appointments fetched successfully');
            
            $financial = $this->getFinancialStats($dateRange);
            Log::info('DashboardStats: Financial fetched successfully');
            
            $pharmacy = $this->getPharmacyStats($dateRange);
            Log::info('DashboardStats: Pharmacy fetched successfully');
            
            $laboratory = $this->getLaboratoryStats($dateRange);
            Log::info('DashboardStats: Laboratory fetched successfully');
            
            $departments = $this->getDepartmentStats($dateRange);
            Log::info('DashboardStats: Departments fetched successfully');
            
            return [
                'summary' => $summary,
                'patients' => $patients,
                'appointments' => $appointments,
                'financial' => $financial,
                'pharmacy' => $pharmacy,
                'laboratory' => $laboratory,
                'departments' => $departments,
                'recent_activities' => $this->getRecentActivities(),
                'trends' => $this->getTrendsData(),
                'period' => $period,
                'last_updated' => now()->toIso8601String(),
            ];
        } catch (\Exception $e) {
            Log::error('Dashboard stats error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return $this->getDefaultStats();
        }
    }

    /**
     * Get date range based on period
     */
    protected function getDateRange(string $period): array
    {
        $now = Carbon::now();
        
        switch ($period) {
            case 'today':
                return [$now->copy()->startOfDay(), $now->copy()->endOfDay()];
            case 'week':
                return [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()];
            case 'month':
                return [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()];
            case 'year':
                return [$now->copy()->startOfYear(), $now->copy()->endOfYear()];
            default:
                return [$now->copy()->startOfDay(), $now->copy()->endOfDay()];
        }
    }

    /**
     * Get summary statistics
     */
    protected function getSummaryStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Debug: Log the queries
        Log::info('Dashboard Summary Stats - Date Range:', [$start->toDateTimeString(), $end->toDateTimeString()]);
        
        // Get total counts (all time)
        $totalPatients = Patient::count();
        $totalDoctors = Doctor::count(); // Show all doctors, not just active
        $totalDepartments = Department::count();
        
        Log::info('Dashboard Summary Stats - Totals:', [
            'total_patients' => $totalPatients,
            'total_doctors' => $totalDoctors,
            'total_departments' => $totalDepartments,
        ]);
        
        // Today's revenue from appointments + pharmacy sales
        $appointmentRevenue = Appointment::whereBetween('appointment_date', $dateRange)
            ->where('status', 'completed')
            ->sum('fee');
            
        $pharmacyRevenue = Sale::whereBetween('created_at', $dateRange)
            ->where('status', 'completed')
            ->sum('total_amount');
        
        $totalRevenue = $appointmentRevenue + $pharmacyRevenue;
        
        return [
            'total_patients' => $totalPatients,
            'new_patients' => Patient::whereBetween('created_at', $dateRange)->count(),
            'total_doctors' => $totalDoctors,
            'total_departments' => $totalDepartments,
            'total_appointments' => Appointment::whereBetween('appointment_date', $dateRange)->count(),
            'completed_appointments' => Appointment::whereBetween('appointment_date', $dateRange)
                ->where('status', 'completed')->count(),
            'total_revenue' => $totalRevenue,
            'appointment_revenue' => $appointmentRevenue,
            'pharmacy_revenue' => $pharmacyRevenue,
            'pending_bills' => Bill::where('payment_status', 'pending')->count(),
            'outstanding_amount' => Bill::where('payment_status', 'pending')->sum('amount_due'),
        ];
    }

    /**
     * Get patient statistics
     */
    protected function getPatientStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Gender distribution
        $genderStats = Patient::select('gender', DB::raw('COUNT(*) as count'))
            ->groupBy('gender')
            ->pluck('count', 'gender')
            ->toArray();
            
        // Age groups
        $ageGroups = Patient::select(
            DB::raw('CASE 
                WHEN age < 18 THEN "0-17"
                WHEN age BETWEEN 18 AND 30 THEN "18-30"
                WHEN age BETWEEN 31 AND 45 THEN "31-45"
                WHEN age BETWEEN 46 AND 60 THEN "46-60"
                ELSE "60+" 
            END as age_group'),
            DB::raw('COUNT(*) as count')
        )
        ->groupBy('age_group')
        ->pluck('count', 'age_group')
        ->toArray();
        
        // Blood group distribution
        $bloodGroups = Patient::select('blood_group', DB::raw('COUNT(*) as count'))
            ->whereNotNull('blood_group')
            ->groupBy('blood_group')
            ->pluck('count', 'blood_group')
            ->toArray();
        
        return [
            'total' => Patient::count(),
            'new_today' => Patient::whereDate('created_at', today())->count(),
            'new_this_period' => Patient::whereBetween('created_at', $dateRange)->count(),
            'gender_distribution' => $genderStats,
            'age_distribution' => $ageGroups,
            'blood_group_distribution' => $bloodGroups,
        ];
    }

    /**
     * Get appointment statistics
     */
    protected function getAppointmentStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Status breakdown
        $statusBreakdown = Appointment::whereBetween('appointment_date', $dateRange)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
            
        // Department-wise appointments
        $deptAppointments = Appointment::whereBetween('appointment_date', $dateRange)
            ->join('departments', 'appointments.department_id', '=', 'departments.id')
            ->select('departments.name', DB::raw('COUNT(*) as count'))
            ->groupBy('departments.id', 'departments.name')
            ->orderByDesc('count')
            ->limit(5)
            ->pluck('count', 'name')
            ->toArray();
            
        // Today's schedule
        $todayAppointments = Appointment::with(['patient', 'doctor', 'department'])
            ->whereDate('appointment_date', today())
            ->orderBy('appointment_date')
            ->limit(10)
            ->get()
            ->map(function ($apt) {
                return [
                    'id' => $apt->id,
                    'patient_name' => $apt->patient?->full_name ?? 'N/A',
                    'doctor_name' => $apt->doctor?->full_name ?? 'N/A',
                    'department' => $apt->department?->name ?? 'N/A',
                    'time' => Carbon::parse($apt->appointment_date)->format('H:i'),
                    'status' => $apt->status,
                ];
            });
        
        return [
            'total' => array_sum($statusBreakdown),
            'by_status' => $statusBreakdown,
            'by_department' => $deptAppointments,
            'today_schedule' => $todayAppointments,
            'upcoming_count' => Appointment::where('appointment_date', '>', now())
                ->where('status', 'scheduled')
                ->count(),
        ];
    }

    /**
     * Get financial statistics
     */
    protected function getFinancialStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Revenue breakdown
        $appointmentRevenue = Appointment::whereBetween('appointment_date', $dateRange)
            ->where('status', 'completed')
            ->sum('fee');
            
        $pharmacyRevenue = Sale::whereBetween('created_at', $dateRange)
            ->where('status', 'completed')
            ->sum('total_amount');
            
        $billRevenue = Payment::whereBetween('created_at', $dateRange)
            ->where('status', 'completed')
            ->sum('amount');
        
        // Payment methods
        $paymentMethods = Payment::whereBetween('created_at', $dateRange)
            ->where('status', 'completed')
            ->select('payment_method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('payment_method')
            ->get()
            ->mapWithKeys(function ($item) {
                return [$item->payment_method => [
                    'amount' => $item->total,
                    'count' => $item->count,
                ]];
            })
            ->toArray();
        
        // Bills aging
        $now = Carbon::now();
        $aging = [
            'current' => Bill::where('payment_status', 'pending')
                ->where('created_at', '>=', $now->copy()->subDays(30))
                ->sum('amount_due'),
            '30_60' => Bill::where('payment_status', 'pending')
                ->whereBetween('created_at', [$now->copy()->subDays(60), $now->copy()->subDays(30)])
                ->sum('amount_due'),
            '60_90' => Bill::where('payment_status', 'pending')
                ->whereBetween('created_at', [$now->copy()->subDays(90), $now->copy()->subDays(60)])
                ->sum('amount_due'),
            '90_plus' => Bill::where('payment_status', 'pending')
                ->where('created_at', '<', $now->copy()->subDays(90))
                ->sum('amount_due'),
        ];
        
        return [
            'total_revenue' => $appointmentRevenue + $pharmacyRevenue,
            'appointment_revenue' => $appointmentRevenue,
            'pharmacy_revenue' => $pharmacyRevenue,
            'bill_revenue' => $billRevenue,
            'payment_methods' => $paymentMethods,
            'outstanding_bills' => Bill::where('payment_status', 'pending')->count(),
            'outstanding_amount' => Bill::where('payment_status', 'pending')->sum('amount_due'),
            'aging' => $aging,
            'avg_bill_amount' => Bill::avg('total_amount') ?? 0,
        ];
    }

    /**
     * Get pharmacy statistics
     */
    protected function getPharmacyStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Low stock alerts
        $lowStockCount = Medicine::whereColumn('stock_quantity', '<=', 'reorder_level')->count();
        
        // Expiring medicines (next 30 days)
        $expiringCount = Medicine::whereBetween('expiry_date', [today(), today()->addDays(30)])->count();
        
        // Expired medicines
        $expiredCount = Medicine::where('expiry_date', '<', today())->count();
        
        // Top selling medicines
        $topMedicines = DB::table('sales_items')
            ->join('medicines', 'sales_items.medicine_id', '=', 'medicines.id')
            ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
            ->whereBetween('sales.created_at', $dateRange)
            ->where('sales.status', 'completed')
            ->select('medicines.name', DB::raw('SUM(sales_items.quantity) as total_sold'))
            ->groupBy('medicines.id', 'medicines.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->pluck('total_sold', 'name')
            ->toArray();
        
        return [
            'today_sales' => Sale::whereDate('created_at', today())->where('status', 'completed')->count(),
            'today_revenue' => Sale::whereDate('created_at', today())->where('status', 'completed')->sum('total_amount'),
            'period_revenue' => Sale::whereBetween('created_at', $dateRange)->where('status', 'completed')->sum('total_amount'),
            'low_stock_count' => $lowStockCount,
            'expiring_count' => $expiringCount,
            'expired_count' => $expiredCount,
            'total_medicines' => Medicine::count(),
            'top_medicines' => $topMedicines,
            'pending_prescriptions' => Prescription::where('status', 'pending')->count(),
        ];
    }

    /**
     * Get laboratory statistics
     */
    protected function getLaboratoryStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        // Test status breakdown
        $testStatuses = LabTestRequest::whereBetween('created_at', $dateRange)
            ->select('status', DB::raw('COUNT(*) as count'))
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();
        
        // Today's tests
        $todayTests = LabTestRequest::whereDate('created_at', today())->count();
        $completedToday = LabTestRequest::whereDate('updated_at', today())
            ->where('status', 'completed')
            ->count();
        
        // Pending critical tests
        $pendingTests = LabTestRequest::where('status', 'pending')
            ->with(['patient', 'doctor'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($test) {
                return [
                    'id' => $test->id,
                    'test_type' => $test->test_type,
                    'patient_name' => $test->patient?->full_name ?? 'N/A',
                    'doctor_name' => $test->doctor?->full_name ?? 'N/A',
                    'requested_at' => $test->created_at->diffForHumans(),
                ];
            });
        
        return [
            'total_today' => $todayTests,
            'completed_today' => $completedToday,
            'pending_count' => LabTestRequest::where('status', 'pending')->count(),
            'by_status' => $testStatuses,
            'pending_tests' => $pendingTests,
        ];
    }

    /**
     * Get department statistics
     */
    protected function getDepartmentStats(array $dateRange): array
    {
        [$start, $end] = $dateRange;
        
        $departments = Department::withCount(['doctors', 'appointments'])
            ->get()
            ->map(function ($dept) use ($dateRange) {
                $revenue = Appointment::where('department_id', $dept->id)
                    ->whereBetween('appointment_date', $dateRange)
                    ->where('status', 'completed')
                    ->sum('fee');
                    
                return [
                    'id' => $dept->id,
                    'name' => $dept->name,
                    'doctors_count' => $dept->doctors_count,
                    'appointments_count' => $dept->appointments_count,
                    'revenue' => $revenue,
                ];
            })
            ->sortByDesc('appointments_count')
            ->values()
            ->toArray();
        
        return [
            'total' => count($departments),
            'departments' => $departments,
        ];
    }

    /**
     * Get recent activities
     */
    protected function getRecentActivities(int $limit = 20): array
    {
        return AuditLog::select('id', 'user_id', 'user_name', 'user_role', 'action', 'description', 'module', 'logged_at')
            ->whereIn('module', ['patients', 'appointments', 'billing', 'doctors', 'pharmacy', 'laboratory'])
            ->orderBy('logged_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_name' => $log->user_name ?? 'System',
                    'user_role' => $log->user_role ?? 'System',
                    'title' => $this->formatActivityTitle($log->action),
                    'description' => $log->description ?? $log->action,
                    'time' => $log->logged_at->diffForHumans(),
                    'type' => $log->module ?? 'system',
                ];
            })
            ->toArray();
    }

    /**
     * Get admin activities for dashboard
     */
    public function getAdminActivities(int $limit = 20): array
    {
        return AuditLog::with('user')
            ->select('id', 'user_id', 'user_name', 'user_role', 'action', 'description', 'module', 'severity', 'logged_at', 'ip_address')
            ->orderBy('logged_at', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'user_name' => $log->user_name ?? 'System',
                    'user_role' => $log->user_role ?? 'System',
                    'action' => $log->action,
                    'description' => $log->description ?? $log->action,
                    'module' => $log->module ?? 'system',
                    'severity' => $log->severity ?? 'low',
                    'time' => $log->logged_at->diffForHumans(),
                    'timestamp' => $log->logged_at->toIso8601String(),
                    'ip_address' => $log->ip_address,
                ];
            })
            ->toArray();
    }

    /**
     * Get admin user statistics
     */
    public function getAdminStats(): array
    {
        $adminRoles = ['Super Admin', 'Sub Super Admin', 'Hospital Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin'];
        
        // Get admin users with their activity counts
        $adminUsers = \App\Models\User::whereIn('role', $adminRoles)
            ->orWhereHas('roleModel', function ($query) use ($adminRoles) {
                $query->whereIn('name', $adminRoles);
            })
            ->withCount(['auditLogs' => function ($query) {
                $query->where('logged_at', '>=', now()->subDays(7));
            }])
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'role' => $user->roleModel?->name ?? $user->role,
                    'last_login' => $user->last_login_at?->diffForHumans() ?? 'Never',
                    'activity_count' => $user->audit_logs_count,
                    'is_online' => $user->last_login_at && $user->last_login_at->gt(now()->subMinutes(30)),
                ];
            });

        // Get activity by module for last 7 days
        $activityByModule = AuditLog::where('logged_at', '>=', now()->subDays(7))
            ->select('module', DB::raw('COUNT(*) as count'))
            ->groupBy('module')
            ->pluck('count', 'module')
            ->toArray();

        return [
            'total_admins' => $adminUsers->count(),
            'online_admins' => $adminUsers->where('is_online', true)->count(),
            'admin_users' => $adminUsers->toArray(),
            'activity_by_module' => $activityByModule,
            'total_activities_24h' => AuditLog::where('logged_at', '>=', now()->subDay())->count(),
            'total_activities_7d' => AuditLog::where('logged_at', '>=', now()->subDays(7))->count(),
        ];
    }

    /**
     * Get trends data for charts
     */
    protected function getTrendsData(): array
    {
        // Daily trend for last 7 days
        $dailyTrends = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);
            $dailyTrends[] = [
                'date' => $date->format('M d'),
                'appointments' => Appointment::whereDate('appointment_date', $date)->count(),
                'patients' => Patient::whereDate('created_at', $date)->count(),
                'revenue' => Appointment::whereDate('appointment_date', $date)
                    ->where('status', 'completed')
                    ->sum('fee'),
            ];
        }
        
        // Monthly trend for last 6 months
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthlyTrends[] = [
                'month' => $month->format('M Y'),
                'appointments' => Appointment::whereYear('appointment_date', $month->year)
                    ->whereMonth('appointment_date', $month->month)
                    ->count(),
                'patients' => Patient::whereYear('created_at', $month->year)
                    ->whereMonth('created_at', $month->month)
                    ->count(),
                'revenue' => Appointment::whereYear('appointment_date', $month->year)
                    ->whereMonth('appointment_date', $month->month)
                    ->where('status', 'completed')
                    ->sum('fee'),
            ];
        }
        
        return [
            'daily' => $dailyTrends,
            'monthly' => $monthlyTrends,
        ];
    }

    /**
     * Format activity title
     */
    protected function formatActivityTitle(string $action): string
    {
        return ucwords(str_replace(['_', '-'], ' ', $action));
    }

    /**
     * Get default stats when error occurs
     */
    protected function getDefaultStats(): array
    {
        return [
            'summary' => [
                'total_patients' => 0,
                'new_patients' => 0,
                'total_doctors' => 0,
                'total_departments' => 0,
                'total_appointments' => 0,
                'completed_appointments' => 0,
                'total_revenue' => 0,
                'appointment_revenue' => 0,
                'pharmacy_revenue' => 0,
                'pending_bills' => 0,
                'outstanding_amount' => 0,
            ],
            'patients' => [
                'total' => 0,
                'new_today' => 0,
                'new_this_period' => 0,
                'gender_distribution' => [],
                'age_distribution' => [],
                'blood_group_distribution' => [],
            ],
            'appointments' => [
                'total' => 0,
                'by_status' => [],
                'by_department' => [],
                'today_schedule' => [],
                'upcoming_count' => 0,
            ],
            'financial' => [
                'total_revenue' => 0,
                'appointment_revenue' => 0,
                'pharmacy_revenue' => 0,
                'bill_revenue' => 0,
                'payment_methods' => [],
                'outstanding_bills' => 0,
                'outstanding_amount' => 0,
                'aging' => [
                    'current' => 0,
                    '30_60' => 0,
                    '60_90' => 0,
                    '90_plus' => 0,
                ],
                'avg_bill_amount' => 0,
            ],
            'pharmacy' => [
                'today_sales' => 0,
                'today_revenue' => 0,
                'period_revenue' => 0,
                'low_stock_count' => 0,
                'expiring_count' => 0,
                'expired_count' => 0,
                'total_medicines' => 0,
                'top_medicines' => [],
                'pending_prescriptions' => 0,
            ],
            'laboratory' => [
                'total_today' => 0,
                'completed_today' => 0,
                'pending_count' => 0,
                'by_status' => [],
                'pending_tests' => [],
            ],
            'departments' => [
                'total' => 0,
                'departments' => [],
            ],
            'recent_activities' => [],
            'trends' => [
                'daily' => [],
                'monthly' => [],
            ],
            'period' => 'today',
            'last_updated' => now()->toIso8601String(),
        ];
    }
}