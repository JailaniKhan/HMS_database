<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSaleRequest;
use App\Models\Sale;
use App\Models\SalesItem;
use App\Models\Medicine;
use App\Models\Patient;
use App\Models\Bill;
use App\Models\BillItem;
use App\Services\SalesService;
use App\Services\InventoryService;
use App\Services\AuditLogService;
use App\Services\Billing\BillCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SalesController extends Controller
{
    protected $salesService;
    protected $inventoryService;
    protected $auditLogService;
    protected $calculationService;

    public function __construct(
        SalesService $salesService,
        InventoryService $inventoryService,
        AuditLogService $auditLogService,
        BillCalculationService $calculationService
    ) {
        $this->salesService = $salesService;
        $this->inventoryService = $inventoryService;
        $this->auditLogService = $auditLogService;
        $this->calculationService = $calculationService;
    }

    /**
     * Display a listing of the sales.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $query = Sale::with(['items.medicine', 'patient', 'soldBy']);
        
        // Apply search filter
        if ($request->filled('query')) {
            $searchTerm = $request->query;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('sale_id', 'like', '%' . $searchTerm . '%')
                  ->orWhereHas('patient', function ($pq) use ($searchTerm) {
                      $pq->where('first_name', 'like', '%' . $searchTerm . '%')
                         ->orWhere('last_name', 'like', '%' . $searchTerm . '%')
                         ->orWhere('patient_id', 'like', '%' . $searchTerm . '%');
                  });
            });
        }
        
        // Apply status filter
        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        
        // Apply payment method filter
        if ($request->filled('payment_method') && $request->payment_method !== 'all') {
            $query->where('payment_method', $request->payment_method);
        }
        
        // Apply date range filter
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        
        $sales = $query->latest()->paginate(15)->withQueryString();
        
        // Calculate statistics
        $stats = [
            'total_sales' => Sale::count(),
            'total_revenue' => Sale::where('status', 'completed')->sum('grand_total'),
            'today_sales' => Sale::whereDate('created_at', today())->count(),
            'today_revenue' => Sale::whereDate('created_at', today())->where('status', 'completed')->sum('grand_total'),
        ];
        
        return Inertia::render('Pharmacy/Sales/Index', [
            'sales' => $sales,
            'filters' => [
                'query' => $request->query('query', ''),
                'status' => $request->query('status', ''),
                'payment_method' => $request->query('payment_method', ''),
                'date_from' => $request->query('date_from', ''),
                'date_to' => $request->query('date_to', ''),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new sale.
     */
    public function create(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-sales')) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::where('stock_quantity', '>', 0)
            ->with('category')
            ->get();
        
        $patients = Patient::select('id', 'patient_id', 'first_name', 'last_name', 'phone')
            ->orderBy('first_name')
            ->get();
        
        // Get tax rate from settings (default to 0)
        $taxRate = config('pharmacy.tax_rate', 0);
        
        return Inertia::render('Pharmacy/Sales/Create', [
            'medicines' => $medicines,
            'patients' => $patients,
            'taxRate' => $taxRate,
        ]);
    }

    /**
     * Store a newly created sale in storage.
     */
    public function store(StoreSaleRequest $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-sales')) {
            abort(403, 'Unauthorized access');
        }
        
        $validated = $request->validated();
        
        try {
            DB::beginTransaction();
            
            // Process the sale using SalesService
            $sale = $this->salesService->processSale($validated, $user->id);
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Create Sale',
                'Pharmacy',
                "Created sale {$sale->sale_id} for " . ($sale->patient ? $sale->patient->full_name : 'walk-in customer'),
                'info'
            );

            // If sale is for a patient and completed, add to patient's bill
            if ($sale->patient_id && $sale->status === 'completed') {
                $this->addPharmacySaleToBill($sale);
            }
            
            DB::commit();
            
            return redirect()->route('pharmacy.sales.show', $sale->id)
                ->with('success', 'Sale completed successfully.');
                
        } catch (\Exception $e) {
            DB::rollBack();
            
            // Log the error
            $this->auditLogService->logActivity(
                'Sale Failed',
                'Pharmacy',
                "Failed to create sale: {$e->getMessage()}",
                'error'
            );
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to process sale: ' . $e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Display the specified sale.
     */
    public function show($id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $sale = Sale::with(['items.medicine', 'patient', 'soldBy'])->findOrFail($id);
        
        // Build timeline
        $timeline = [];
        
        // Add creation event
        $timeline[] = [
            'id' => 1,
            'action' => 'Sale Created',
            'description' => 'Sale was created and processed',
            'created_at' => $sale->created_at,
            'user' => $sale->soldBy,
        ];
        
        // Add void event if applicable
        if ($sale->status === 'cancelled' || $sale->status === 'refunded') {
            $timeline[] = [
                'id' => 2,
                'action' => 'Sale ' . ucfirst($sale->status),
                'description' => $sale->void_reason ?? 'Sale was ' . $sale->status,
                'created_at' => $sale->updated_at,
                'user' => null,
            ];
        }
        
        return Inertia::render('Pharmacy/Sales/Show', [
            'sale' => $sale,
            'timeline' => $timeline,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        // Sales should not be editable after creation to maintain transaction integrity
        abort(404);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // Sales should not be editable after creation to maintain transaction integrity
        abort(404);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('delete-sales')) {
            abort(403, 'Unauthorized access');
        }
        
        try {
            DB::beginTransaction();
            
            $sale = Sale::findOrFail($id);
            
            // Restore stock for voided sale
            $this->salesService->restoreStock($sale);
            
            // Mark sale as cancelled
            $sale->update([
                'status' => 'cancelled',
                'voided_by' => $user->id,
                'voided_at' => now(),
            ]);
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Void Sale',
                'Pharmacy',
                "Voided sale {$sale->sale_id}",
                'warning'
            );
            
            DB::commit();
            
            return redirect()->route('pharmacy.sales.index')
                ->with('success', 'Sale voided successfully.');
        } catch (\Exception $e) {
            DB::rollBack();
            
            return redirect()->back()
                ->withErrors(['error' => 'Failed to void sale: ' . $e->getMessage()]);
        }
    }

    /**
     * Add pharmacy sale items to patient's bill.
     *
     * @param Sale $sale
     * @return void
     */
    private function addPharmacySaleToBill(Sale $sale): void
    {
        try {
            // Load sale items with medicine relationship
            $sale->load('items.medicine');

            if ($sale->items->isEmpty()) {
                Log::warning('Sale has no items to add to bill', [
                    'sale_id' => $sale->id,
                ]);
                return;
            }

            // Find or create an open bill for the patient
            $bill = Bill::where('patient_id', $sale->patient_id)
                ->whereNull('voided_at')
                ->whereIn('payment_status', ['pending', 'partial'])
                ->latest()
                ->first();

            // If no open bill exists, create a new one
            if (!$bill) {
                $bill = Bill::create([
                    'patient_id' => $sale->patient_id,
                    'created_by' => auth()->id(),
                    'bill_date' => now(),
                    'due_date' => now()->addDays(30),
                    'payment_status' => 'pending',
                    'status' => 'active',
                ]);

                $this->auditLogService->logActivity(
                    'Bill Created',
                    'Billing',
                    "Created new bill #{$bill->bill_number} for patient from pharmacy sale",
                    'info'
                );
            }

            // Check if sale items are already added to this bill
            $existingItems = BillItem::where('bill_id', $bill->id)
                ->where('source_type', Sale::class)
                ->where('source_id', $sale->id)
                ->count();

            if ($existingItems > 0) {
                Log::info('Pharmacy sale items already added to bill', [
                    'sale_id' => $sale->id,
                    'bill_id' => $bill->id,
                ]);
                return;
            }

            // Add each sale item to the bill
            foreach ($sale->items as $item) {
                $medicineName = $item->medicine ? $item->medicine->name : 'Unknown Medicine';

                BillItem::create([
                    'bill_id' => $bill->id,
                    'item_type' => 'pharmacy',
                    'source_type' => Sale::class,
                    'source_id' => $sale->id,
                    'category' => 'pharmacy',
                    'item_description' => "Pharmacy: {$medicineName} (Qty: {$item->quantity})",
                    'quantity' => $item->quantity,
                    'unit_price' => $item->unit_price,
                    'discount_amount' => $item->discount ?? 0,
                    'discount_percentage' => 0,
                    'total_price' => $item->total_price,
                ]);
            }

            // Recalculate bill totals
            $this->calculationService->calculateTotals($bill);

            $this->auditLogService->logActivity(
                'Pharmacy Sale Added to Bill',
                'Billing',
                "Added {$sale->items->count()} pharmacy items from sale #{$sale->sale_id} to bill #{$bill->bill_number}. Total: {$sale->grand_total}",
                'info'
            );
        } catch (\Exception $e) {
            // Log the error but don't fail the sale
            Log::error('Failed to add pharmacy sale to bill', [
                'sale_id' => $sale->id,
                'error' => $e->getMessage(),
            ]);

            $this->auditLogService->logActivity(
                'Pharmacy Sale Billing Failed',
                'Billing',
                "Failed to add pharmacy sale #{$sale->sale_id} to bill: {$e->getMessage()}",
                'error'
            );
        }
    }
}
