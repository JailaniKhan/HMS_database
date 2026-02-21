<?php

namespace App\Http\Controllers;

use App\Events\WalletUpdated;
use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Payment;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Carbon\Carbon;

class WalletController extends Controller
{
    /**
     * Display the wallet dashboard with revenue tracking.
     */
    public function index()
    {
        $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);

        $revenueData = $this->getRevenueData();

        $transactions = Transaction::with(['creator'])
            ->orderBy('transaction_date', 'desc')
            ->limit(50)
            ->get();

        // Compute a display balance fallback using payments + completed sales
        $computedRevenue = Payment::where('status', 'completed')->sum('amount')
            + Sale::where('status', 'completed')->sum('grand_total');

        $displayBalance = $wallet->balance > 0 ? $wallet->balance : $computedRevenue;

        return Inertia::render('Wallet/Index', [
            'wallet' => $wallet,
            'displayBalance' => $displayBalance,
            'revenueData' => $revenueData,
            'transactions' => $transactions,
        ]);
    }

    /**
     * Get revenue data for different time periods and sources.
     */
    private function getRevenueData()
    {
        $periods = [
            'today' => [Carbon::today(), Carbon::tomorrow()],
            'this_week' => [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()],
            'this_month' => [Carbon::now()->startOfMonth(), Carbon::now()->endOfMonth()],
            'this_year' => [Carbon::now()->startOfYear(), Carbon::now()->endOfYear()],
        ];

        $data = [];

        foreach ($periods as $period => $dates) {
            $data[$period] = [
                'appointments' => $this->getAppointmentRevenue($dates[0], $dates[1]),
                'departments' => $this->getDepartmentRevenue($dates[0], $dates[1]),
                'pharmacy' => $this->getPharmacyRevenue($dates[0], $dates[1]),
                'laboratory' => $this->getLaboratoryRevenue($dates[0], $dates[1]),
                'total' => 0,
            ];

            $data[$period]['total'] = $data[$period]['appointments'] +
                                     $data[$period]['departments'] +
                                     $data[$period]['pharmacy'] +
                                     $data[$period]['laboratory'];
        }

        return $data;
    }

    /**
     * Get appointment revenue for a date range.
     */
    private function getAppointmentRevenue(Carbon $start, Carbon $end)
    {
        // Since bills are removed, using Payment model directly
        // This assumes payments are categorized by source or we track all payments
        return Payment::where('status', 'completed')
            ->whereBetween('payment_date', [$start, $end])
            ->sum('amount');
    }

    /**
     * Get department service revenue for a date range.
     */
    private function getDepartmentRevenue(Carbon $start, Carbon $end)
    {
        // Since bills are removed, using Payment model directly
        return Payment::where('status', 'completed')
            ->whereBetween('payment_date', [$start, $end])
            ->sum('amount');
    }

    /**
     * Get pharmacy revenue for a date range.
     */
    private function getPharmacyRevenue(Carbon $start, Carbon $end)
    {
        // Some sales are marked completed but payment_status may remain 'pending'.
        // Count completed sales as revenue.
        return Sale::where('status', 'completed')
            ->whereBetween('created_at', [$start, $end])
            ->sum('grand_total');
    }

    /**
     * Get laboratory revenue for a date range.
     */
    private function getLaboratoryRevenue(Carbon $start, Carbon $end)
    {
        // Laboratory revenue - assuming it's tracked through payments or lab test results
        // For now, returning 0 until proper tracking is implemented
        return 0;
    }

    /**
     * Get real-time wallet data for API consumption.
     */
    public function realtime()
    {
        $wallet = Wallet::firstOrCreate(['name' => 'Hospital Wallet']);
        $revenueData = $this->getRevenueData();
        $transactions = Transaction::with(['creator'])
            ->orderBy('transaction_date', 'desc')
            ->limit(50)
            ->get();

        $computedRevenue = Payment::where('status', 'completed')->sum('amount')
            + Sale::where('status', 'completed')->sum('grand_total');

        $displayBalance = $wallet->balance > 0 ? $wallet->balance : $computedRevenue;

        return response()->json([
            'wallet' => $wallet,
            'displayBalance' => $displayBalance,
            'revenueData' => $revenueData,
            'transactions' => $transactions,
            'timestamp' => now()->toISOString(),
        ]);
    }
}
