<?php

namespace App\Services;

use App\Models\Patient;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\Payment;
use App\Models\Department;
use App\Models\Doctor;
use App\Models\Medicine;
use App\Models\Sale;
use App\Models\LabTestRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class HospitalDashboardService extends BaseService
{
    protected StatsService $statsService;

    public function __construct(StatsService $statsService)
    {
        $this->statsService = $statsService;
    }

    /**
     * Get summary KPIs for header section
     */
    public function getSummary(array $dateRange = []): array
    {
        $today = Carbon::today();
        $startOfDay = $today->startOfDay();
        $endOfDay = $today->endOfDay();

        // Today's appointments
        $todayAppointments = Appointment::whereBetween('appointment_date', [$startOfDay, $endOfDay])->count();
        $completedAppointments = Appointment::whereBetween('appointment_date', [$startOfDay, $endOfDay])
            ->where('status', 'completed')->count();

        // Revenue calculations
        $todayRevenue = Payment::whereDate('created_at', $today)
            ->where('status', 'completed')
            ->sum('amount');

        $monthlyRevenue = Payment::whereMonth('created_at', Carbon::now()->month)
            ->whereYear('created_at', Carbon::now()->year)
            ->where('status', 'completed')
            ->sum('amount');

        // Outstanding bills with aging
        $outstandingBills = Bill::where('status', 'pending')->sum('total_amount');
        $outstanding30Days = Bill::where('status', 'pending')
            ->where('created_at', '>=', Carbon::now()->subDays(30))
            ->sum('total_amount');
        $outstanding60Days = Bill::where('status', 'pending')
            ->whereBetween('created_at', [Carbon::now()->subDays(60), Carbon::now()->subDays(30)])
            ->sum('total_amount');
        $outstanding90PlusDays = Bill::where('status', 'pending')
            ->where('created_at', '<', Carbon::now()->subDays(90))
            ->sum('total_amount');

        return [
            'totalActivePatients' => Patient::count(),
            'todayAppointments' => $todayAppointments,
            'completedAppointments' => $completedAppointments,
            'todayRevenue' => $todayRevenue,
            'monthlyRevenue' => $monthlyRevenue,
            'outstandingBills' => $outstandingBills,
            'outstanding30Days' => $outstanding30Days,
            'outstanding60Days' => $outstanding60Days,
            'outstanding90PlusDays' => $outstanding90PlusDays,
            'lastUpdated' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Get financial metrics
     */
    public function getFinancialMetrics(string $period = 'month'): array
    {
        $revenueTrend = $this->getRevenueTrend($period);
        $paymentMethods = $this->getPaymentMethodDistribution();
        $agingAnalysis = $this->getAgingAnalysis();
        $departmentRevenue = $this->getDepartmentRevenue();

        return [
            'revenueTrend' => $revenueTrend,
            'paymentMethods' => $paymentMethods,
            'agingAnalysis' => $agingAnalysis,
            'departmentRevenue' => $departmentRevenue,
            'dailyStats' => $this->statsService->getDailyPatientStats(),
            'lastUpdated' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Get operational metrics
     */
    public function getOperationalMetrics(): array
    {
        return [
            'departmentWorkload' => $this->getDepartmentWorkload(),
            'doctorUtilization' => $this->getDoctorUtilization(),
            'appointmentStats' => $this->getAppointmentStats(),
            'averageWaitTimes' => $this->getAverageWaitTimes(),
            'lastUpdated' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Get patient flow metrics
     */
    public function getPatientFlowMetrics(): array
    {
        return [
            'todayRegistrations' => Patient::whereDate('created_at', Carbon::today())->count(),
            'weeklyRegistrations' => Patient::whereBetween('created_at', [
                Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()
            ])->count(),
            'monthlyRegistrations' => Patient::whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)->count(),
            'demographics' => $this->getPatientDemographics(),
            'departmentDistribution' => $this->getDepartmentPatientDistribution(),
            'lastUpdated' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Get pharmacy metrics
     */
    public function getPharmacyMetrics(): array
    {
        $today = Carbon::today();

        return [
            'totalMedicines' => Medicine::count(),
            'todaySales' => Sale::whereDate('created_at', $today)->count(),
            'todayRevenue' => Sale::whereDate('created_at', $today)
                ->where('status', '!=', 'voided')
                ->sum('total_amount'),
            'lowStockCount' => Medicine::where('quantity', '>', 0)
                ->where('quantity', '<=', 10)->count(),
            'outOfStockCount' => Medicine::where('quantity', '<=', 0)->count(),
            'expiringSoonCount' => Medicine::whereDate('expiry_date', '>=', now())
                ->whereDate('expiry_date', '<=', now()->addDays(30))->count(),
            'topSellingMedicines' => $this->getTopSellingMedicines(),
            'lastUpdated' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Get laboratory metrics
     */
    public function getLaboratoryMetrics(): array
    {
        $today = Carbon::today();
        $startOfDay = $today->startOfDay();
        $endOfDay = $today->endOfDay();

        return [
            'todayTestRequests' => LabTestRequest::whereBetween('created_at', [$startOfDay, $endOfDay])->count(),
            'completedTests' => LabTestRequest::whereBetween('created_at', [$startOfDay, $endOfDay])
                ->where('status', 'completed')->count(),
            'pendingTests' => LabTestRequest::where('status', 'pending')->count(),
            'inProgressTests' => LabTestRequest::where('status', 'in_progress')->count(),
            'mostRequestedTests' => $this->getMostRequestedTests(),
            'averageTurnaroundTime' => $this->getAverageTurnaroundTime(),
            'lastUpdated' => Carbon::now()->toIso8601String(),
        ];
    }

    /**
     * Get revenue trend for the specified period
     */
    private function getRevenueTrend(string $period): array
    {
        $data = [];
        $days = match ($period) {
            'week' => 7,
            'month' => 30,
            'quarter' => 90,
            'year' => 365,
            default => 30,
        };

        for ($i = $days - 1; $i >= 0; $i--) {
            $day = Carbon::now()->subDays($i);
            $dayStart = $day->startOfDay();
            $dayEnd = $day->endOfDay();

            $revenue = Payment::whereBetween('created_at', [$dayStart, $dayEnd])
                ->where('status', 'completed')
                ->sum('amount');

            $data[] = [
                'date' => $day->toDateString(),
                'dayName' => $day->shortDayName,
                'revenue' => $revenue,
            ];
        }

        return $data;
    }

    /**
     * Get payment method distribution
     */
    private function getPaymentMethodDistribution(): array
    {
        $payments = Payment::where('status', 'completed')
            ->whereMonth('created_at', Carbon::now()->month)
            ->selectRaw('payment_method, SUM(amount) as total')
            ->groupBy('payment_method')
            ->get();

        $total = $payments->sum('total');

        return $payments->map(function ($item) use ($total) {
            return [
                'method' => ucfirst(str_replace('_', ' ', $item->payment_method ?? 'Cash')),
                'amount' => (float) $item->total,
                'percentage' => $total > 0 ? round(($item->total / $total) * 100, 2) : 0,
            ];
        })->toArray();
    }

    /**
     * Get billing aging analysis
     */
    private function getAgingAnalysis(): array
    {
        $totalOutstanding = Bill::where('status', 'pending')->sum('total_amount');

        $ranges = [
            ['label' => 'Current', 'from' => 0, 'to' => 0],
            ['label' => '1-30 Days', 'from' => 1, 'to' => 30],
            ['label' => '31-60 Days', 'from' => 31, 'to' => 60],
            ['label' => '61-90 Days', 'from' => 61, 'to' => 90],
            ['label' => '90+ Days', 'from' => 91, 'to' => null],
        ];

        return collect($ranges)->map(function ($range) use ($totalOutstanding) {
            $query = Bill::where('status', 'pending');

            if ($range['to'] === null) {
                $query->where('created_at', '<', Carbon::now()->subDays($range['from']));
            } else {
                $query->whereBetween('created_at', [
                    Carbon::now()->subDays($range['to']),
                    Carbon::now()->subDays($range['from'] - 1)
                ]);
            }

            $amount = $query->sum('total_amount');
            $count = $query->count();

            return [
                'range' => $range['label'],
                'amount' => (float) $amount,
                'count' => $count,
                'percentage' => $totalOutstanding > 0 ? round(($amount / $totalOutstanding) * 100, 2) : 0,
            ];
        })->toArray();
    }

    /**
     * Get department-wise revenue breakdown
     */
    private function getDepartmentRevenue(): array
    {
        $revenue = DB::table('bills')
            ->join('appointments', 'bills.appointment_id', '=', 'appointments.id')
            ->join('departments', 'appointments.department_id', '=', 'departments.id')
            ->where('bills.status', 'pending')
            ->whereMonth('bills.created_at', Carbon::now()->month)
            ->selectRaw('departments.name as department, SUM(bills.total_amount) as revenue')
            ->groupBy('departments.name')
            ->orderByDesc('revenue')
            ->get();

        $total = $revenue->sum('revenue');

        return $revenue->map(function ($item) use ($total) {
            return [
                'department' => $item->department,
                'revenue' => (float) $item->revenue,
                'percentage' => $total > 0 ? round(($item->revenue / $total) * 100, 2) : 0,
            ];
        })->toArray();
    }

    /**
     * Get department workload statistics
     */
    private function getDepartmentWorkload(): array
    {
        $today = Carbon::today();
        $startOfDay = $today->startOfDay();
        $endOfDay = $today->endOfDay();

        $workload = DB::table('appointments')
            ->join('departments', 'appointments.department_id', '=', 'departments.id')
            ->whereBetween('appointments.appointment_date', [$startOfDay, $endOfDay])
            ->selectRaw('departments.name as department, COUNT(*) as appointments')
            ->groupBy('departments.name')
            ->orderByDesc('appointments')
            ->get();

        return $workload->map(function ($item) {
            return [
                'department' => $item->department,
                'patients' => $item->appointments,
                'appointments' => $item->appointments,
                'utilization' => min(100, round(($item->appointments / 20) * 100)), // Assuming 20 is max capacity
            ];
        })->toArray();
    }

    /**
     * Get doctor utilization statistics
     */
    private function getDoctorUtilization(): array
    {
        $today = Carbon::today();
        $startOfDay = $today->startOfDay();
        $endOfDay = $today->endOfDay();

        $utilization = Appointment::whereBetween('appointment_date', [$startOfDay, $endOfDay])
            ->join('doctors', 'appointments.doctor_id', '=', 'doctors.id')
            ->selectRaw('doctors.name, doctors.specialization, COUNT(*) as appointment_count')
            ->groupBy('doctors.id', 'doctors.name', 'doctors.specialization')
            ->orderByDesc('appointment_count')
            ->limit(10)
            ->get();

        return $utilization->map(function ($item) {
            return [
                'name' => $item->name,
                'specialization' => $item->specialization,
                'appointments' => $item->appointment_count,
                'utilization' => min(100, round(($item->appointment_count / 10) * 100)), // Assuming 10 is max daily
            ];
        })->toArray();
    }

    /**
     * Get appointment statistics
     */
    private function getAppointmentStats(): array
    {
        $today = Carbon::today();
        $startOfDay = $today->startOfDay();
        $endOfDay = $today->endOfDay();

        $stats = Appointment::whereBetween('appointment_date', [$startOfDay, $endOfDay])
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return [
            'scheduled' => $stats['scheduled'] ?? 0,
            'completed' => $stats['completed'] ?? 0,
            'cancelled' => $stats['cancelled'] ?? 0,
            'no_show' => $stats['no_show'] ?? 0,
            'in_progress' => $stats['in_progress'] ?? 0,
        ];
    }

    /**
     * Get average wait times (placeholder - would need actual wait time tracking)
     */
    private function getAverageWaitTimes(): array
    {
        return [
            ['department' => 'General', 'minutes' => 15],
            ['department' => 'Cardiology', 'minutes' => 25],
            ['department' => 'Pediatrics', 'minutes' => 12],
            ['department' => 'Orthopedics', 'minutes' => 30],
        ];
    }

    /**
     * Get patient demographics by age group
     */
    private function getPatientDemographics(): array
    {
        $demographics = Patient::selectRaw('
            CASE
                WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18 THEN "Under 18"
                WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 18 AND 30 THEN "18-30"
                WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 31 AND 50 THEN "31-50"
                WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 51 AND 65 THEN "51-65"
                ELSE "65+"
            END as age_group,
            COUNT(*) as count
        ')
        ->groupBy('age_group')
        ->get();

        $total = $demographics->sum('count');

        return $demographics->map(function ($item) use ($total) {
            return [
                'ageGroup' => $item->age_group,
                'count' => $item->count,
                'percentage' => $total > 0 ? round(($item->count / $total) * 100, 2) : 0,
            ];
        })->toArray();
    }

    /**
     * Get department patient distribution
     */
    private function getDepartmentPatientDistribution(): array
    {
        $today = Carbon::today();
        $startOfDay = $today->startOfDay();
        $endOfDay = $today->endOfDay();

        $distribution = Appointment::whereBetween('appointment_date', [$startOfDay, $endOfDay])
            ->join('departments', 'appointments.department_id', '=', 'departments.id')
            ->selectRaw('departments.name as department, COUNT(*) as count')
            ->groupBy('departments.name')
            ->orderByDesc('count')
            ->get();

        $total = $distribution->sum('count');

        return $distribution->map(function ($item) use ($total) {
            return [
                'department' => $item->department,
                'patients' => $item->count,
                'percentage' => $total > 0 ? round(($item->count / $total) * 100, 2) : 0,
            ];
        })->toArray();
    }

    /**
     * Get top selling medicines
     */
    private function getTopSellingMedicines(): array
    {
        return Sale::whereMonth('created_at', Carbon::now()->month)
            ->join('sales_items', 'sales.id', '=', 'sales_items.sale_id')
            ->join('medicines', 'sales_items.medicine_id', '=', 'medicines.id')
            ->selectRaw('medicines.name, SUM(sales_items.quantity) as total_quantity, SUM(sales_items.subtotal) as total_revenue')
            ->groupBy('medicines.id', 'medicines.name')
            ->orderByDesc('total_revenue')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'quantity' => $item->total_quantity,
                    'revenue' => (float) $item->total_revenue,
                ];
            })
            ->toArray();
    }

    /**
     * Get most requested lab tests
     */
    private function getMostRequestedTests(): array
    {
        return LabTestRequest::whereMonth('created_at', Carbon::now()->month)
            ->join('lab_tests', 'lab_test_requests.lab_test_id', '=', 'lab_tests.id')
            ->selectRaw('lab_tests.name, COUNT(*) as request_count')
            ->groupBy('lab_tests.id', 'lab_tests.name')
            ->orderByDesc('request_count')
            ->limit(5)
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->name,
                    'count' => $item->request_count,
                ];
            })
            ->toArray();
    }

    /**
     * Get average turnaround time for lab tests
     */
    private function getAverageTurnaroundTime(): array
    {
        $completed = LabTestRequest::where('status', 'completed')
            ->whereNotNull('completed_at')
            ->whereMonth('completed_at', Carbon::now()->month)
            ->selectRaw('AVG(TIMESTAMPDIFF(HOUR, created_at, completed_at)) as avg_hours')
            ->first();

        return [
            'hours' => (float) ($completed->avg_hours ?? 0),
            'formatted' => $completed->avg_hours ? round($completed->avg_hours, 1) . ' hours' : 'N/A',
        ];
    }
}
