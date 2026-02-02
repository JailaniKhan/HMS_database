<?php

namespace App\Http\Controllers\Billing;

use App\Http\Controllers\Controller;
use App\Models\Bill;
use App\Models\Payment;
use App\Models\InsuranceClaim;
use App\Models\Doctor;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Carbon\Carbon;
use Exception;

class BillingReportController extends Controller
{
    /**
     * Revenue report by period.
     */
    public function revenueReport(Request $request): JsonResponse
    {
        $this->authorize('view-billing-reports');

        try {
            $request->validate([
                'period' => 'required|in:daily,weekly,monthly,yearly,custom',
                'date_from' => 'required_if:period,custom|date',
                'date_to' => 'required_if:period,custom|date|after_or_equal:date_from',
            ]);

            $period = $request->period;
            $dateFrom = $request->date_from;
            $dateTo = $request->date_to;

            // Set default date range based on period
            if ($period !== 'custom') {
                switch ($period) {
                    case 'daily':
                        $dateFrom = now()->startOfDay();
                        $dateTo = now()->endOfDay();
                        break;
                    case 'weekly':
                        $dateFrom = now()->startOfWeek();
                        $dateTo = now()->endOfWeek();
                        break;
                    case 'monthly':
                        $dateFrom = now()->startOfMonth();
                        $dateTo = now()->endOfMonth();
                        break;
                    case 'yearly':
                        $dateFrom = now()->startOfYear();
                        $dateTo = now()->endOfYear();
                        break;
                }
            } else {
                $dateFrom = Carbon::parse($dateFrom)->startOfDay();
                $dateTo = Carbon::parse($dateTo)->endOfDay();
            }

            // Get revenue data
            $bills = Bill::whereBetween('bill_date', [$dateFrom, $dateTo])
                ->whereNull('voided_at')
                ->get();

            $payments = Payment::whereBetween('payment_date', [$dateFrom, $dateTo])
                ->where('status', 'completed')
                ->get();

            // Calculate totals
            $totalBilled = $bills->sum('total_amount');
            $totalPaid = $payments->sum('amount');
            $totalDiscount = $bills->sum('total_discount');
            $totalTax = $bills->sum('total_tax');

            // Group by date
            $dailyRevenue = $payments->groupBy(function ($payment) {
                return $payment->payment_date->format('Y-m-d');
            })->map(function ($group) {
                return [
                    'date' => $group->first()->payment_date->format('Y-m-d'),
                    'total' => $group->sum('amount'),
                    'count' => $group->count(),
                ];
            })->values();

            // Payment method breakdown
            $paymentMethods = $payments->groupBy('payment_method')->map(function ($group) use ($totalPaid) {
                $amount = $group->sum('amount');
                return [
                    'method' => $group->first()->payment_method_label,
                    'amount' => $amount,
                    'count' => $group->count(),
                    'percentage' => $totalPaid > 0 ? round(($amount / $totalPaid) * 100, 2) : 0,
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'type' => $period,
                        'from' => $dateFrom->toISOString(),
                        'to' => $dateTo->toISOString(),
                    ],
                    'summary' => [
                        'total_billed' => $totalBilled,
                        'total_paid' => $totalPaid,
                        'total_discount' => $totalDiscount,
                        'total_tax' => $totalTax,
                        'outstanding' => $totalBilled - $totalPaid,
                        'collection_rate' => $totalBilled > 0
                            ? round(($totalPaid / $totalBilled) * 100, 2)
                            : 0,
                    ],
                    'daily_revenue' => $dailyRevenue,
                    'payment_methods' => $paymentMethods,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error generating revenue report', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate revenue report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Outstanding payments report.
     */
    public function outstandingReport(Request $request): JsonResponse
    {
        $this->authorize('view-billing-reports');

        try {
            $request->validate([
                'days_overdue' => 'nullable|integer|min:0',
                'min_amount' => 'nullable|numeric|min:0',
                'max_amount' => 'nullable|numeric|min:0',
            ]);

            $query = Bill::with(['patient', 'doctor'])
                ->whereNull('voided_at')
                ->where('payment_status', '!=', 'paid');

            // Apply filters
            if ($request->has('days_overdue') && $request->days_overdue !== null) {
                $date = now()->subDays($request->days_overdue);
                $query->where('due_date', '<', $date);
            }

            if ($request->has('min_amount') && $request->min_amount !== null) {
                $query->where('balance_due', '>=', $request->min_amount);
            }

            if ($request->has('max_amount') && $request->max_amount !== null) {
                $query->where('balance_due', '<=', $request->max_amount);
            }

            $bills = $query->orderBy('due_date', 'asc')->get();

            // Group by aging buckets
            $now = now();
            $agingBuckets = [
                'current' => ['min' => 0, 'max' => 0, 'bills' => [], 'total' => 0],
                '1-30' => ['min' => 1, 'max' => 30, 'bills' => [], 'total' => 0],
                '31-60' => ['min' => 31, 'max' => 60, 'bills' => [], 'total' => 0],
                '61-90' => ['min' => 61, 'max' => 90, 'bills' => [], 'total' => 0],
                '90+' => ['min' => 91, 'max' => null, 'bills' => [], 'total' => 0],
            ];

            foreach ($bills as $bill) {
                $daysOverdue = $bill->due_date
                    ? $now->diffInDays($bill->due_date, false) * -1
                    : 0;

                if ($daysOverdue <= 0) {
                    $agingBuckets['current']['bills'][] = $bill;
                    $agingBuckets['current']['total'] += $bill->balance_due;
                } elseif ($daysOverdue <= 30) {
                    $agingBuckets['1-30']['bills'][] = $bill;
                    $agingBuckets['1-30']['total'] += $bill->balance_due;
                } elseif ($daysOverdue <= 60) {
                    $agingBuckets['31-60']['bills'][] = $bill;
                    $agingBuckets['31-60']['total'] += $bill->balance_due;
                } elseif ($daysOverdue <= 90) {
                    $agingBuckets['61-90']['bills'][] = $bill;
                    $agingBuckets['61-90']['total'] += $bill->balance_due;
                } else {
                    $agingBuckets['90+']['bills'][] = $bill;
                    $agingBuckets['90+']['total'] += $bill->balance_due;
                }
            }

            $totalOutstanding = $bills->sum('balance_due');

            return response()->json([
                'success' => true,
                'data' => [
                    'summary' => [
                        'total_outstanding' => $totalOutstanding,
                        'total_bills' => $bills->count(),
                        'average_outstanding' => $bills->count() > 0
                            ? round($totalOutstanding / $bills->count(), 2)
                            : 0,
                    ],
                    'aging_buckets' => [
                        'current' => [
                            'total' => $agingBuckets['current']['total'],
                            'count' => count($agingBuckets['current']['bills']),
                            'percentage' => $totalOutstanding > 0
                                ? round(($agingBuckets['current']['total'] / $totalOutstanding) * 100, 2)
                                : 0,
                        ],
                        '1-30_days' => [
                            'total' => $agingBuckets['1-30']['total'],
                            'count' => count($agingBuckets['1-30']['bills']),
                            'percentage' => $totalOutstanding > 0
                                ? round(($agingBuckets['1-30']['total'] / $totalOutstanding) * 100, 2)
                                : 0,
                        ],
                        '31-60_days' => [
                            'total' => $agingBuckets['31-60']['total'],
                            'count' => count($agingBuckets['31-60']['bills']),
                            'percentage' => $totalOutstanding > 0
                                ? round(($agingBuckets['31-60']['total'] / $totalOutstanding) * 100, 2)
                                : 0,
                        ],
                        '61-90_days' => [
                            'total' => $agingBuckets['61-90']['total'],
                            'count' => count($agingBuckets['61-90']['bills']),
                            'percentage' => $totalOutstanding > 0
                                ? round(($agingBuckets['61-90']['total'] / $totalOutstanding) * 100, 2)
                                : 0,
                        ],
                        'over_90_days' => [
                            'total' => $agingBuckets['90+']['total'],
                            'count' => count($agingBuckets['90+']['bills']),
                            'percentage' => $totalOutstanding > 0
                                ? round(($agingBuckets['90+']['total'] / $totalOutstanding) * 100, 2)
                                : 0,
                        ],
                    ],
                    'top_outstanding' => $bills->sortByDesc('balance_due')->take(20)->map(function ($bill) {
                        return [
                            'bill_id' => $bill->id,
                            'bill_number' => $bill->bill_number,
                            'patient' => [
                                'id' => $bill->patient->id,
                                'name' => $bill->patient->full_name,
                            ],
                            'balance_due' => $bill->balance_due,
                            'due_date' => $bill->due_date?->toISOString(),
                            'days_overdue' => $bill->due_date
                                ? now()->diffInDays($bill->due_date, false) * -1
                                : null,
                        ];
                    })->values(),
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error generating outstanding report', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate outstanding report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Payment method breakdown report.
     */
    public function paymentMethodReport(Request $request): JsonResponse
    {
        $this->authorize('view-billing-reports');

        try {
            $request->validate([
                'date_from' => 'required|date',
                'date_to' => 'required|date|after_or_equal:date_from',
            ]);

            $dateFrom = Carbon::parse($request->date_from)->startOfDay();
            $dateTo = Carbon::parse($request->date_to)->endOfDay();

            $payments = Payment::whereBetween('payment_date', [$dateFrom, $dateTo])
                ->where('status', 'completed')
                ->get();

            $totalAmount = $payments->sum('amount');

            // Group by payment method
            $methodBreakdown = $payments->groupBy('payment_method')->map(function ($group) use ($totalAmount) {
                $amount = $group->sum('amount');
                return [
                    'method' => $group->first()->payment_method_label,
                    'amount' => $amount,
                    'count' => $group->count(),
                    'percentage' => $totalAmount > 0 ? round(($amount / $totalAmount) * 100, 2) : 0,
                    'average_amount' => $group->count() > 0 ? round($amount / $group->count(), 2) : 0,
                ];
            })->sortByDesc('amount')->values();

            // Daily breakdown
            $dailyBreakdown = $payments->groupBy(function ($payment) {
                return $payment->payment_date->format('Y-m-d');
            })->map(function ($group) {
                return [
                    'date' => $group->first()->payment_date->format('Y-m-d'),
                    'total' => $group->sum('amount'),
                    'count' => $group->count(),
                    'methods' => $group->groupBy('payment_method')->map(function ($methodGroup) {
                        return [
                            'method' => $methodGroup->first()->payment_method_label,
                            'amount' => $methodGroup->sum('amount'),
                            'count' => $methodGroup->count(),
                        ];
                    })->values(),
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'from' => $dateFrom->toISOString(),
                        'to' => $dateTo->toISOString(),
                    ],
                    'summary' => [
                        'total_amount' => $totalAmount,
                        'total_transactions' => $payments->count(),
                        'average_transaction' => $payments->count() > 0
                            ? round($totalAmount / $payments->count(), 2)
                            : 0,
                    ],
                    'method_breakdown' => $methodBreakdown,
                    'daily_breakdown' => $dailyBreakdown,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error generating payment method report', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate payment method report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Insurance claims summary report.
     */
    public function insuranceClaimReport(Request $request): JsonResponse
    {
        $this->authorize('view-billing-reports');

        try {
            $request->validate([
                'date_from' => 'required|date',
                'date_to' => 'required|date|after_or_equal:date_from',
                'status' => 'nullable|string',
            ]);

            $dateFrom = Carbon::parse($request->date_from)->startOfDay();
            $dateTo = Carbon::parse($request->date_to)->endOfDay();

            $query = InsuranceClaim::with(['bill.patient', 'patientInsurance.insuranceProvider'])
                ->whereBetween('submission_date', [$dateFrom, $dateTo]);

            if ($request->has('status') && $request->status) {
                $query->where('status', $request->status);
            }

            $claims = $query->get();

            $totalClaimed = $claims->sum('claim_amount');
            $totalApproved = $claims->sum('approved_amount');

            // Status breakdown
            $statusBreakdown = $claims->groupBy('status')->map(function ($group) use ($totalClaimed) {
                $amount = $group->sum('claim_amount');
                return [
                    'status' => $group->first()->status_label,
                    'count' => $group->count(),
                    'claimed_amount' => $amount,
                    'approved_amount' => $group->sum('approved_amount'),
                    'percentage' => $totalClaimed > 0 ? round(($amount / $totalClaimed) * 100, 2) : 0,
                ];
            })->values();

            // Provider breakdown
            $providerBreakdown = $claims->groupBy(function ($claim) {
                return $claim->patientInsurance?->insuranceProvider?->name ?? 'Unknown';
            })->map(function ($group) {
                return [
                    'provider' => $group->first()->patientInsurance?->insuranceProvider?->name ?? 'Unknown',
                    'count' => $group->count(),
                    'claimed_amount' => $group->sum('claim_amount'),
                    'approved_amount' => $group->sum('approved_amount'),
                    'approval_rate' => $group->count() > 0
                        ? round(($group->where('status', 'approved')->count() / $group->count()) * 100, 2)
                        : 0,
                ];
            })->sortByDesc('claimed_amount')->values();

            // Monthly trend
            $monthlyTrend = $claims->groupBy(function ($claim) {
                return $claim->submission_date?->format('Y-m') ?? 'Unknown';
            })->map(function ($group) {
                return [
                    'month' => $group->first()->submission_date?->format('Y-m') ?? 'Unknown',
                    'count' => $group->count(),
                    'claimed' => $group->sum('claim_amount'),
                    'approved' => $group->sum('approved_amount'),
                ];
            })->values();

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'from' => $dateFrom->toISOString(),
                        'to' => $dateTo->toISOString(),
                    ],
                    'summary' => [
                        'total_claims' => $claims->count(),
                        'total_claimed' => $totalClaimed,
                        'total_approved' => $totalApproved,
                        'approval_rate' => $totalClaimed > 0
                            ? round(($totalApproved / $totalClaimed) * 100, 2)
                            : 0,
                        'average_claim_amount' => $claims->count() > 0
                            ? round($totalClaimed / $claims->count(), 2)
                            : 0,
                    ],
                    'status_breakdown' => $statusBreakdown,
                    'provider_breakdown' => $providerBreakdown,
                    'monthly_trend' => $monthlyTrend,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error generating insurance claim report', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate insurance claim report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Revenue by doctor report.
     */
    public function doctorRevenueReport(Request $request): JsonResponse
    {
        $this->authorize('view-billing-reports');

        try {
            $request->validate([
                'date_from' => 'required|date',
                'date_to' => 'required|date|after_or_equal:date_from',
            ]);

            $dateFrom = Carbon::parse($request->date_from)->startOfDay();
            $dateTo = Carbon::parse($request->date_to)->endOfDay();

            $bills = Bill::with(['doctor', 'patient'])
                ->whereBetween('bill_date', [$dateFrom, $dateTo])
                ->whereNull('voided_at')
                ->get();

            // Group by doctor
            $doctorRevenue = $bills->groupBy('doctor_id')->map(function ($group) {
                $doctor = $group->first()->doctor;
                $totalBilled = $group->sum('total_amount');
                $totalPaid = $group->sum('amount_paid');

                return [
                    'doctor_id' => $doctor?->id,
                    'doctor_name' => $doctor?->full_name ?? 'Unknown',
                    'specialization' => $doctor?->specialization ?? 'N/A',
                    'bill_count' => $group->count(),
                    'total_billed' => $totalBilled,
                    'total_paid' => $totalPaid,
                    'outstanding' => $totalBilled - $totalPaid,
                    'collection_rate' => $totalBilled > 0
                        ? round(($totalPaid / $totalBilled) * 100, 2)
                        : 0,
                    'average_bill' => $group->count() > 0
                        ? round($totalBilled / $group->count(), 2)
                        : 0,
                ];
            })->sortByDesc('total_billed')->values();

            $totalBilled = $bills->sum('total_amount');
            $totalPaid = $bills->sum('amount_paid');

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'from' => $dateFrom->toISOString(),
                        'to' => $dateTo->toISOString(),
                    ],
                    'summary' => [
                        'total_doctors' => $doctorRevenue->count(),
                        'total_billed' => $totalBilled,
                        'total_paid' => $totalPaid,
                        'total_outstanding' => $totalBilled - $totalPaid,
                        'overall_collection_rate' => $totalBilled > 0
                            ? round(($totalPaid / $totalBilled) * 100, 2)
                            : 0,
                    ],
                    'doctor_revenue' => $doctorRevenue,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error generating doctor revenue report', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate doctor revenue report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Revenue by department report.
     */
    public function departmentRevenueReport(Request $request): JsonResponse
    {
        $this->authorize('view-billing-reports');

        try {
            $request->validate([
                'date_from' => 'required|date',
                'date_to' => 'required|date|after_or_equal:date_from',
            ]);

            $dateFrom = Carbon::parse($request->date_from)->startOfDay();
            $dateTo = Carbon::parse($request->date_to)->endOfDay();

            // Get bills with items that have department info
            $bills = Bill::with(['items', 'doctor.department'])
                ->whereBetween('bill_date', [$dateFrom, $dateTo])
                ->whereNull('voided_at')
                ->get();

            $departmentRevenue = collect();

            foreach ($bills as $bill) {
                // Try to get department from doctor
                $department = $bill->doctor?->department;

                if ($department) {
                    $deptId = $department->id;
                    $deptName = $department->name;
                } else {
                    $deptId = 'unknown';
                    $deptName = 'Unknown Department';
                }

                if (!$departmentRevenue->has($deptId)) {
                    $departmentRevenue->put($deptId, [
                        'department_id' => $deptId === 'unknown' ? null : $deptId,
                        'department_name' => $deptName,
                        'bill_count' => 0,
                        'total_billed' => 0,
                        'total_paid' => 0,
                    ]);
                }

                $deptData = $departmentRevenue->get($deptId);
                $deptData['bill_count']++;
                $deptData['total_billed'] += $bill->total_amount;
                $deptData['total_paid'] += $bill->amount_paid;
                $departmentRevenue->put($deptId, $deptData);
            }

            // Calculate additional metrics and sort
            $departmentRevenue = $departmentRevenue->map(function ($dept) {
                $dept['outstanding'] = $dept['total_billed'] - $dept['total_paid'];
                $dept['collection_rate'] = $dept['total_billed'] > 0
                    ? round(($dept['total_paid'] / $dept['total_billed']) * 100, 2)
                    : 0;
                $dept['average_bill'] = $dept['bill_count'] > 0
                    ? round($dept['total_billed'] / $dept['bill_count'], 2)
                    : 0;
                return $dept;
            })->sortByDesc('total_billed')->values();

            $totalBilled = $departmentRevenue->sum('total_billed');
            $totalPaid = $departmentRevenue->sum('total_paid');

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => [
                        'from' => $dateFrom->toISOString(),
                        'to' => $dateTo->toISOString(),
                    ],
                    'summary' => [
                        'total_departments' => $departmentRevenue->count(),
                        'total_billed' => $totalBilled,
                        'total_paid' => $totalPaid,
                        'total_outstanding' => $totalBilled - $totalPaid,
                        'overall_collection_rate' => $totalBilled > 0
                            ? round(($totalPaid / $totalBilled) * 100, 2)
                            : 0,
                    ],
                    'department_revenue' => $departmentRevenue,
                ],
            ]);
        } catch (Exception $e) {
            Log::error('Error generating department revenue report', ['error' => $e->getMessage()]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate department revenue report: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get available report periods.
     */
    public function getReportPeriods(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'periods' => [
                    ['value' => 'daily', 'label' => 'Daily'],
                    ['value' => 'weekly', 'label' => 'Weekly'],
                    ['value' => 'monthly', 'label' => 'Monthly'],
                    ['value' => 'yearly', 'label' => 'Yearly'],
                    ['value' => 'custom', 'label' => 'Custom Range'],
                ],
                'payment_methods' => [
                    ['value' => 'cash', 'label' => 'Cash'],
                    ['value' => 'card', 'label' => 'Credit/Debit Card'],
                    ['value' => 'insurance', 'label' => 'Insurance'],
                    ['value' => 'bank_transfer', 'label' => 'Bank Transfer'],
                    ['value' => 'mobile_money', 'label' => 'Mobile Money'],
                    ['value' => 'check', 'label' => 'Check'],
                ],
                'claim_statuses' => [
                    ['value' => 'draft', 'label' => 'Draft'],
                    ['value' => 'pending', 'label' => 'Pending'],
                    ['value' => 'submitted', 'label' => 'Submitted'],
                    ['value' => 'under_review', 'label' => 'Under Review'],
                    ['value' => 'approved', 'label' => 'Approved'],
                    ['value' => 'partial_approved', 'label' => 'Partially Approved'],
                    ['value' => 'rejected', 'label' => 'Rejected'],
                    ['value' => 'appealed', 'label' => 'Appealed'],
                ],
            ],
        ]);
    }
}
