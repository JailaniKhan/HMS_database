<?php

require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Wallet;
use App\Models\Transaction;
use App\Models\Payment;
use App\Models\Sale;
use Carbon\Carbon;

echo "WALLET DIAGNOSTICS\n";
$w = Wallet::first();
if (!$w) {
    echo "NO_WALLET\n";
} else {
    echo "WALLET_ID:" . $w->id . " BALANCE:" . $w->balance . "\n";
    echo "TOTAL_TRANSACTIONS:" . $w->transactions()->count() . "\n";
    echo "CREDITS:" . $w->transactions()->where('type', 'credit')->sum('amount') . "\n";
    echo "DEBITS:" . $w->transactions()->where('type', 'debit')->sum('amount') . "\n";
    echo "LAST_10_TRANSACTIONS:\n";
    $last = $w->transactions()->orderBy('transaction_date', 'desc')->limit(10)->get()->toArray();
    print_r($last);
}

echo "\nPAYMENT/SALE AGGREGATES (today):\n";
$start = Carbon::today();
$end = Carbon::tomorrow();
echo "PAYMENTS_COMPLETED_COUNT:" . Payment::where('status', 'completed')->whereBetween('payment_date', [$start, $end])->count() . "\n";
echo "PAYMENTS_COMPLETED_SUM:" . Payment::where('status', 'completed')->whereBetween('payment_date', [$start, $end])->sum('amount') . "\n";
echo "SALES_PAID_COUNT:" . Sale::where('payment_status', 'paid')->whereBetween('created_at', [$start, $end])->count() . "\n";
echo "SALES_PAID_SUM:" . Sale::where('payment_status', 'paid')->whereBetween('created_at', [$start, $end])->sum('grand_total') . "\n";

// Also show completed-sales aggregates (some sales have status=completed but payment_status pending)
echo "SALES_COMPLETED_COUNT:" . Sale::where('status','completed')->whereBetween('created_at', [$start, $end])->count() . "\n";
echo "SALES_COMPLETED_SUM:" . Sale::where('status','completed')->whereBetween('created_at', [$start, $end])->sum('grand_total') . "\n";

echo "\nREVENUE AGGREGATES (period samples):\n";
$weekStart = Carbon::now()->startOfWeek();
$weekEnd = Carbon::now()->endOfWeek();
echo "PAYMENTS_THIS_WEEK:" . Payment::where('status', 'completed')->whereBetween('payment_date', [$weekStart, $weekEnd])->sum('amount') . "\n";
echo "SALES_THIS_WEEK:" . Sale::where('payment_status', 'paid')->whereBetween('created_at', [$weekStart, $weekEnd])->sum('grand_total') . "\n";

echo "\nTOTAL COUNTS AND SAMPLES:\n";
echo "TOTAL_PAYMENTS:" . Payment::count() . "\n";
echo "TOTAL_SALES:" . Sale::count() . "\n";
echo "LAST_5_PAYMENTS:\n";
print_r(Payment::orderBy('payment_date','desc')->limit(5)->get()->toArray());
echo "LAST_5_SALES:\n";
print_r(Sale::orderBy('created_at','desc')->limit(5)->get()->toArray());

?>