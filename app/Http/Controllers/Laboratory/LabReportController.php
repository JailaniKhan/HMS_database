<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\LabTestResult;
use App\Models\LabTestRequest;
use App\Models\LabTest;
use Carbon\Carbon;
use Inertia\Inertia;

class LabReportController extends Controller
{
    public function index()
    {
        $today = Carbon::today();
        $thisMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        // Key metrics
        $stats = [
            'total_tests_today' => LabTestResult::whereDate('created_at', $today)->count(),
            'total_tests_this_month' => LabTestResult::whereDate('created_at', '>=', $thisMonth)->count(),
            'pending_requests' => LabTestRequest::where('status', 'pending')->count(),
            'in_progress_requests' => LabTestRequest::where('status', 'in_progress')->count(),
            'completed_results' => LabTestResult::where('status', 'completed')
                ->whereDate('created_at', '>=', $thisMonth)
                ->count(),
            'critical_results' => LabTestResult::where('status', 'critical')
                ->whereDate('created_at', '>=', $thisMonth)
                ->count(),
            'abnormal_results' => LabTestResult::where('status', 'abnormal')
                ->whereDate('created_at', '>=', $thisMonth)
                ->count(),
        ];

        // Test category breakdown (placeholder - categories not in schema)
        $categoryStats = [
            'hematology' => 0,
            'biochemistry' => 0,
            'microbiology' => 0,
            'urinalysis' => 0,
            'immunology' => 0,
            'other' => LabTestResult::whereDate('created_at', '>=', $thisMonth)->count(),
        ];

        // Monthly trend data
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthStart = $month->copy()->startOfMonth();
            $monthEnd = $month->copy()->endOfMonth();

            $monthlyTrends[] = [
                'month' => $month->format('M Y'),
                'total_tests' => LabTestResult::whereBetween('created_at', [$monthStart, $monthEnd])->count(),
                'completed' => LabTestResult::where('status', 'completed')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count(),
                'critical' => LabTestResult::where('status', 'critical')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count(),
                'abnormal' => LabTestResult::where('status', 'abnormal')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->count(),
            ];
        }

        // Recent test results
        $recentResults = LabTestResult::with(['patient', 'test'])
            ->latest()
            ->take(10)
            ->get()
            ->map(function ($result) {
                return [
                    'id' => $result->id,
                    'result_id' => $result->result_id,
                    'patient_name' => $result->patient?->name ?? 'Unknown',
                    'test_name' => $result->test?->name ?? 'Unknown',
                    'status' => $result->status,
                    'performed_at' => $result->performed_at?->format('Y-m-d H:i') ?? null,
                    'verified_at' => $result->verified_at?->format('Y-m-d H:i') ?? null,
                ];
            });

        // Top performed tests
        $topTests = LabTestResult::selectRaw('test_id, COUNT(*) as count')
            ->whereDate('created_at', '>=', $thisMonth)
            ->groupBy('test_id')
            ->orderByDesc('count')
            ->take(5)
            ->with('test')
            ->get()
            ->map(function ($item) {
                return [
                    'name' => $item->test?->name ?? 'Unknown',
                    'count' => $item->count,
                ];
            });

        return Inertia::render('Laboratory/Reports/Index', [
            'stats' => $stats,
            'categoryStats' => $categoryStats,
            'monthlyTrends' => $monthlyTrends,
            'recentResults' => $recentResults,
            'topTests' => $topTests,
        ]);
    }
}
