<?php

namespace App\Jobs;

use App\Services\SmartCacheService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GenerateMonthlyReport implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;
    public int $timeout = 300; // 5 minutes timeout

    protected $month;
    protected $year;
    protected $reportType;
    protected $userId;
    protected $email;

    /**
     * Create a new job instance.
     */
    public function __construct(int $month, int $year, string $reportType = 'comprehensive', ?int $userId = null, ?string $email = null)
    {
        $this->month = $month;
        $this->year = $year;
        $this->reportType = $reportType;
        $this->userId = $userId;
        $this->email = $email;

        $this->queue = 'reports'; // Use dedicated reports queue
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Log::info("Starting monthly report generation", [
            'month' => $this->month,
            'year' => $this->year,
            'type' => $this->reportType,
            'user_id' => $this->userId
        ]);

        $startTime = microtime(true);

        try {
            $reportData = $this->generateReportData();

            $filePath = $this->saveReportToFile($reportData);

            $this->updateCacheWithReport($reportData);

            // Send notification if email provided
            if ($this->email) {
                $this->sendReportNotification($filePath, $reportData['summary']);
            }

            $endTime = microtime(true);
            $duration = round($endTime - $startTime, 2);

            Log::info("Monthly report generated successfully", [
                'duration' => $duration,
                'file_path' => $filePath,
                'records_processed' => $reportData['summary']['total_records']
            ]);

        } catch (\Exception $e) {
            Log::error("Monthly report generation failed", [
                'error' => $e->getMessage(),
                'month' => $this->month,
                'year' => $this->year
            ]);

            throw $e;
        }
    }

    /**
     * Generate comprehensive report data
     */
    protected function generateReportData(): array
    {
        $startDate = "{$this->year}-{$this->month}-01";
        $endDate = date('Y-m-t', strtotime($startDate));

        $data = [
            'period' => [
                'month' => $this->month,
                'year' => $this->year,
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ];

        // Patient statistics
        $data['patients'] = $this->getPatientStatistics($startDate, $endDate);

        // Appointment statistics
        $data['appointments'] = $this->getAppointmentStatistics($startDate, $endDate);

        // Billing statistics
        $data['billing'] = $this->getBillingStatistics($startDate, $endDate);

        // Medicine/Pharmacy statistics
        $data['pharmacy'] = $this->getPharmacyStatistics($startDate, $endDate);

        // Laboratory statistics
        $data['laboratory'] = $this->getLaboratoryStatistics($startDate, $endDate);

        // Department performance
        $data['departments'] = $this->getDepartmentPerformance($startDate, $endDate);

        // Financial summary
        $data['financial'] = $this->getFinancialSummary($startDate, $endDate);

        // Generate summary
        $data['summary'] = $this->generateSummary($data);

        return $data;
    }

    protected function getPatientStatistics(string $startDate, string $endDate): array
    {
        return [
            'new_registrations' => DB::table('patients')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count(),

            'active_patients' => DB::table('patients')
                ->whereExists(function ($query) use ($startDate, $endDate) {
                    $query->select(DB::raw(1))
                          ->from('appointments')
                          ->whereRaw('appointments.patient_id = patients.id')
                          ->whereBetween('appointments.appointment_date', [$startDate, $endDate]);
                })
                ->count(),

            'by_gender' => DB::table('patients')
                ->selectRaw('gender, COUNT(*) as count')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->groupBy('gender')
                ->pluck('count', 'gender')
                ->toArray(),
        ];
    }

    protected function getAppointmentStatistics(string $startDate, string $endDate): array
    {
        return [
            'total' => DB::table('appointments')
                ->whereBetween('appointment_date', [$startDate, $endDate])
                ->count(),

            'by_status' => DB::table('appointments')
                ->selectRaw('status, COUNT(*) as count')
                ->whereBetween('appointment_date', [$startDate, $endDate])
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray(),

            'by_department' => DB::table('appointments')
                ->join('departments', 'appointments.department_id', '=', 'departments.id')
                ->selectRaw('departments.name, COUNT(*) as count')
                ->whereBetween('appointments.appointment_date', [$startDate, $endDate])
                ->groupBy('departments.id', 'departments.name')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get()
                ->toArray(),

            'revenue' => DB::table('appointments')
                ->whereBetween('appointment_date', [$startDate, $endDate])
                ->where('status', 'completed')
                ->sum('fee'),
        ];
    }

    protected function getBillingStatistics(string $startDate, string $endDate): array
    {
        return [
            'total_bills' => DB::table('bills')
                ->whereBetween('bill_date', [$startDate, $endDate])
                ->count(),

            'total_revenue' => DB::table('bills')
                ->whereBetween('bill_date', [$startDate, $endDate])
                ->sum('total_amount'),

            'paid_amount' => DB::table('bills')
                ->whereBetween('bill_date', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->sum('total_amount'),

            'pending_amount' => DB::table('bills')
                ->whereBetween('bill_date', [$startDate, $endDate])
                ->where('payment_status', 'pending')
                ->sum('total_amount'),

            'by_payment_status' => DB::table('bills')
                ->selectRaw('payment_status, COUNT(*) as count, SUM(total_amount) as amount')
                ->whereBetween('bill_date', [$startDate, $endDate])
                ->groupBy('payment_status')
                ->get()
                ->toArray(),
        ];
    }

    protected function getPharmacyStatistics(string $startDate, string $endDate): array
    {
        return [
            'sales_total' => DB::table('sales')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('total_amount'),

            'medicines_sold' => DB::table('sales_items')
                ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
                ->whereBetween('sales.created_at', [$startDate, $endDate])
                ->sum('quantity'),

            'top_medicines' => DB::table('sales_items')
                ->join('sales', 'sales_items.sale_id', '=', 'sales.id')
                ->join('medicines', 'sales_items.medicine_id', '=', 'medicines.id')
                ->selectRaw('medicines.name, SUM(sales_items.quantity) as total_sold')
                ->whereBetween('sales.created_at', [$startDate, $endDate])
                ->groupBy('medicines.id', 'medicines.name')
                ->orderBy('total_sold', 'desc')
                ->limit(10)
                ->get()
                ->toArray(),

            'low_stock_alerts' => DB::table('medicines')
                ->where('status', 'active')
                ->whereRaw('stock_quantity <= reorder_level')
                ->count(),
        ];
    }

    protected function getLaboratoryStatistics(string $startDate, string $endDate): array
    {
        return [
            'tests_performed' => DB::table('lab_test_results')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count(),

            'tests_by_type' => DB::table('lab_test_results')
                ->join('lab_tests', 'lab_test_results.test_id', '=', 'lab_tests.id')
                ->selectRaw('lab_tests.name, COUNT(*) as count')
                ->whereBetween('lab_test_results.created_at', [$startDate, $endDate])
                ->groupBy('lab_tests.id', 'lab_tests.name')
                ->orderBy('count', 'desc')
                ->limit(10)
                ->get()
                ->toArray(),

            'pending_results' => DB::table('lab_test_results')
                ->where('status', 'pending')
                ->count(),
        ];
    }

    protected function getDepartmentPerformance(string $startDate, string $endDate): array
    {
        return DB::table('departments')
            ->leftJoin('doctors', 'departments.id', '=', 'doctors.department_id')
            ->leftJoin('appointments', function ($join) use ($startDate, $endDate) {
                $join->on('doctors.id', '=', 'appointments.doctor_id')
                     ->whereBetween('appointments.appointment_date', [$startDate, $endDate]);
            })
            ->selectRaw('
                departments.name,
                COUNT(DISTINCT doctors.id) as doctors_count,
                COUNT(appointments.id) as appointments_count,
                AVG(appointments.fee) as avg_fee,
                SUM(appointments.fee) as total_revenue
            ')
            ->groupBy('departments.id', 'departments.name')
            ->orderBy('appointments_count', 'desc')
            ->get()
            ->toArray();
    }

    protected function getFinancialSummary(string $startDate, string $endDate): array
    {
        return [
            'total_revenue' => DB::table('bills')
                ->whereBetween('bill_date', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->sum('total_amount'),

            'appointment_revenue' => DB::table('appointments')
                ->whereBetween('appointment_date', [$startDate, $endDate])
                ->where('status', 'completed')
                ->sum('fee'),

            'pharmacy_revenue' => DB::table('sales')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->sum('total_amount'),

            'outstanding_payments' => DB::table('bills')
                ->where('payment_status', 'pending')
                ->sum('total_amount'),
        ];
    }

    protected function generateSummary(array $data): array
    {
        return [
            'period' => $data['period'],
            'total_patients' => $data['patients']['new_registrations'],
            'total_appointments' => $data['appointments']['total'],
            'total_revenue' => $data['financial']['total_revenue'],
            'total_records' => array_sum([
                $data['patients']['new_registrations'],
                $data['appointments']['total'],
                $data['billing']['total_bills'],
                $data['pharmacy']['medicines_sold'],
                $data['laboratory']['tests_performed'],
            ]),
        ];
    }

    protected function saveReportToFile(array $reportData): string
    {
        $filename = "monthly-report-{$this->year}-{$this->month}-" . now()->format('Y-m-d-H-i-s') . '.json';
        $path = "reports/monthly/{$filename}";

        Storage::put($path, json_encode($reportData, JSON_PRETTY_PRINT));

        return $path;
    }

    protected function updateCacheWithReport(array $reportData): void
    {
        $cacheService = app(SmartCacheService::class);

        // Update relevant caches with fresh data
        $cacheService->clearDashboardCache(); // Force refresh of dashboard stats

        // Cache this report for quick access
        $cacheKey = "monthly_report_{$this->year}_{$this->month}";
        Cache::put($cacheKey, $reportData['summary'], now()->addDays(30));
    }

    protected function sendReportNotification(string $filePath, array $summary): void
    {
        // Implementation would send email with report attachment
        // This is a placeholder for email notification
        Log::info("Report notification would be sent", [
            'email' => $this->email,
            'file_path' => $filePath,
            'summary' => $summary
        ]);
    }

    /**
     * Handle job failure
     */
    public function failed(\Throwable $exception): void
    {
        Log::error("Monthly report job failed", [
            'month' => $this->month,
            'year' => $this->year,
            'error' => $exception->getMessage(),
            'user_id' => $this->userId
        ]);

        // Could send failure notification here
    }
}
