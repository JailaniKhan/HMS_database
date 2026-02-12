<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\LabTestResult;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class QualityControlController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        // Calculate QC metrics based on lab test results
        $stats = [
            'total_tests_today' => LabTestResult::whereDate('created_at', $today)->count(),
            'total_tests_this_month' => LabTestResult::whereDate('created_at', '>=', $thisMonth)->count(),
            'critical_results' => LabTestResult::where('status', 'critical')
                ->whereDate('created_at', '>=', $thisMonth)
                ->count(),
            'abnormal_results' => LabTestResult::where('status', 'abnormal')
                ->whereDate('created_at', '>=', $thisMonth)
                ->count(),
            'verified_results' => LabTestResult::whereNotNull('verified_at')
                ->whereDate('created_at', '>=', $thisMonth)
                ->count(),
            'pending_verification' => LabTestResult::whereNull('verified_at')
                ->whereDate('created_at', '>=', $thisMonth)
                ->count(),
        ];

        // Calculate quality metrics
        $qualityMetrics = [
            'verification_rate' => $this->calculateVerificationRate($thisMonth),
            'critical_value_notification_rate' => 98.5, // Placeholder - would be calculated from actual notification logs
            'turnaround_time_average' => $this->calculateAverageTurnaroundTime($thisMonth),
            'error_rate' => 0.2, // Placeholder - would be calculated from error logs
        ];

        // Monthly trend data for charts
        $monthlyTrends = $this->getMonthlyTrends();

        // Control chart data (Levey-Jennings style)
        $controlChartData = $this->getControlChartData();

        // QC samples status
        $qcSamples = [
            [
                'id' => 'QC001',
                'name' => 'Glucose Control - Level 1',
                'lot_number' => 'LOT2024021',
                'expiry_date' => '2026-06-15',
                'status' => 'in_range',
                'last_run' => '2026-02-12',
                'mean' => 95.2,
                'sd' => 2.1,
                'current_value' => 96.1,
            ],
            [
                'id' => 'QC002',
                'name' => 'Glucose Control - Level 2',
                'lot_number' => 'LOT2024022',
                'expiry_date' => '2026-06-15',
                'status' => 'in_range',
                'last_run' => '2026-02-12',
                'mean' => 145.8,
                'sd' => 3.2,
                'current_value' => 144.2,
            ],
            [
                'id' => 'QC003',
                'name' => 'Chemistry Control - Normal',
                'lot_number' => 'CHEM2401N',
                'expiry_date' => '2026-05-20',
                'status' => 'warning',
                'last_run' => '2026-02-12',
                'mean' => 100.0,
                'sd' => 5.0,
                'current_value' => 112.5,
            ],
            [
                'id' => 'QC004',
                'name' => 'Chemistry Control - Abnormal',
                'lot_number' => 'CHEM2401A',
                'expiry_date' => '2026-05-20',
                'status' => 'in_range',
                'last_run' => '2026-02-11',
                'mean' => 200.0,
                'sd' => 8.0,
                'current_value' => 198.3,
            ],
        ];

        // QC rules violations (Westgard rules)
        $ruleViolations = [
            [
                'rule' => '1:2s',
                'description' => 'One control exceeds ±2 SD',
                'count_this_month' => 3,
                'severity' => 'warning',
                'action_required' => 'Monitor',
            ],
            [
                'rule' => '1:3s',
                'description' => 'One control exceeds ±3 SD',
                'count_this_month' => 0,
                'severity' => 'none',
                'action_required' => 'None',
            ],
            [
                'rule' => '2:2s',
                'description' => 'Two consecutive controls exceed ±2 SD on same side',
                'count_this_month' => 1,
                'severity' => 'attention',
                'action_required' => 'Investigate',
            ],
            [
                'rule' => 'R:4s',
                'description' => 'Range exceeds 4 SD between controls',
                'count_this_month' => 0,
                'severity' => 'none',
                'action_required' => 'None',
            ],
        ];

        return Inertia::render('Laboratory/QualityControl/Index', [
            'stats' => $stats,
            'qualityMetrics' => $qualityMetrics,
            'monthlyTrends' => $monthlyTrends,
            'controlChartData' => $controlChartData,
            'qcSamples' => $qcSamples,
            'ruleViolations' => $ruleViolations,
        ]);
    }

    private function calculateVerificationRate($startDate)
    {
        $total = LabTestResult::whereDate('created_at', '>=', $startDate)->count();
        if ($total === 0) return 100;

        $verified = LabTestResult::whereNotNull('verified_at')
            ->whereDate('created_at', '>=', $startDate)
            ->count();

        return round(($verified / $total) * 100, 1);
    }

    private function calculateAverageTurnaroundTime($startDate)
    {
        // Calculate average time from test performed to result verification
        $results = LabTestResult::whereNotNull('verified_at')
            ->whereNotNull('performed_at')
            ->whereDate('created_at', '>=', $startDate)
            ->get();

        if ($results->isEmpty()) return 0;

        $totalMinutes = 0;
        $count = 0;

        foreach ($results as $result) {
            if ($result->performed_at && $result->verified_at) {
                $start = $result->performed_at;
                $end = $result->verified_at;
                $totalMinutes += $start->diffInMinutes($end);
                $count++;
            }
        }

        return $count > 0 ? round($totalMinutes / $count / 60, 1) : 0; // Return in hours
    }

    private function getMonthlyTrends()
    {
        $trends = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthStart = $month->copy()->startOfMonth();
            $monthEnd = $month->copy()->endOfMonth();

            $trends[] = [
                'month' => $month->format('M Y'),
                'total_tests' => LabTestResult::whereBetween('created_at', [$monthStart, $monthEnd])->count(),
                'critical_results' => LabTestResult::where('status', 'critical')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count(),
                'abnormal_results' => LabTestResult::where('status', 'abnormal')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count(),
                'verification_rate' => $this->calculateVerificationRateForPeriod($monthStart, $monthEnd),
            ];
        }
        return $trends;
    }

    private function calculateVerificationRateForPeriod($start, $end)
    {
        $total = LabTestResult::whereBetween('created_at', [$start, $end])->count();
        if ($total === 0) return 100;

        $verified = LabTestResult::whereNotNull('verified_at')
            ->whereBetween('created_at', [$start, $end])
            ->count();

        return round(($verified / $total) * 100, 1);
    }

    private function getControlChartData()
    {
        // Generate 20 days of control data
        $data = [];
        $baseDate = Carbon::now()->subDays(20);

        for ($i = 0; $i < 20; $i++) {
            $date = $baseDate->copy()->addDays($i);
            $data[] = [
                'date' => $date->format('Y-m-d'),
                'value_1' => 95 + (rand(-20, 20) / 10), // Random variation around mean 95
                'value_2' => 145 + (rand(-30, 30) / 10), // Random variation around mean 145
                'mean_1' => 95,
                'mean_2' => 145,
                'plus_2sd_1' => 99,
                'minus_2sd_1' => 91,
                'plus_3sd_1' => 101,
                'minus_3sd_1' => 89,
            ];
        }

        return $data;
    }
}
