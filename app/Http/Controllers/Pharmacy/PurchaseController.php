<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\Medicine;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Supplier;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Validator;

class PurchaseController extends Controller
{
    /**
     * Display a listing of purchases.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $query = Purchase::with(['supplier', 'creator', 'items.medicine'])
            ->orderBy('created_at', 'desc');
        
        // Apply filters
        if ($request->filled('query')) {
            $search = $request->input('query');
            $query->where(function($q) use ($search) {
                $q->where('purchase_number', 'like', "%{$search}%")
                  ->orWhere('invoice_number', 'like', "%{$search}%")
                  ->orWhere('company', 'like', "%{$search}%")
                  ->orWhereHas('supplier', function($sq) use ($search) {
                      $sq->where('name', 'like', "%{$search}%");
                  });
            });
        }
        
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        
        if ($request->filled('supplier_id')) {
            $query->where('supplier_id', $request->input('supplier_id'));
        }
        
        if ($request->filled('date_from')) {
            $query->whereDate('purchase_date', '>=', $request->input('date_from'));
        }
        
        if ($request->filled('date_to')) {
            $query->whereDate('purchase_date', '<=', $request->input('date_to'));
        }
        
        $purchases = $query->paginate(15)->withQueryString();
        $suppliers = Supplier::active()->get();
        
        // Calculate statistics
        $stats = [
            'total_purchases' => Purchase::where('status', '!=', 'cancelled')->count(),
            'total_amount' => Purchase::where('status', '!=', 'cancelled')->sum('total_amount'),
            'pending' => Purchase::where('status', 'pending')->count(),
            'received' => Purchase::where('status', 'received')->count(),
        ];
        
        return Inertia::render('Pharmacy/Purchases/Index', [
            'purchases' => $purchases,
            'suppliers' => $suppliers,
            'stats' => $stats,
            'filters' => $request->only(['query', 'status', 'supplier_id', 'date_from', 'date_to']),
        ]);
    }

    /**
     * Show the form for creating a new purchase.
     */
    public function create(): Response
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $medicines = Medicine::with('category')
            ->orderBy('name')
            ->get(['id', 'name', 'medicine_id', 'stock_quantity', 'unit_price', 'cost_price', 'form', 'strength']);
        
        $suppliers = Supplier::active()->get();
        
        return Inertia::render('Pharmacy/Purchases/Create', [
            'medicines' => $medicines,
            'suppliers' => $suppliers,
            'purchaseNumber' => Purchase::generatePurchaseNumber(),
        ]);
    }

    /**
     * Store a newly created purchase.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'nullable|exists:suppliers,id',
            'company' => 'nullable|string|max:255',
            'invoice_number' => 'nullable|string|max:100',
            'purchase_date' => 'required|date',
            'tax' => 'nullable|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
            'items' => 'required|array|min:1',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.cost_price' => 'required|numeric|min:0',
            'items.*.sale_price' => 'nullable|numeric|min:0',
            'items.*.batch_number' => 'nullable|string|max:100',
            'items.*.expiry_date' => 'nullable|date',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        DB::beginTransaction();
        
        try {
            // Create purchase
            $purchase = Purchase::create([
                'purchase_number' => Purchase::generatePurchaseNumber(),
                'invoice_number' => $request->invoice_number,
                'company' => $request->company,
                'supplier_id' => $request->supplier_id,
                'purchase_date' => $request->purchase_date,
                'subtotal' => 0,
                'tax' => $request->tax ?? 0,
                'discount' => $request->discount ?? 0,
                'total_amount' => 0,
                'status' => 'pending',
                'payment_status' => 'unpaid',
                'notes' => $request->notes,
                'created_by' => $user->id,
            ]);
            
            $subtotal = 0;
            
            // Create purchase items
            foreach ($request->items as $item) {
                $totalPrice = $item['quantity'] * $item['cost_price'];
                $subtotal += $totalPrice;
                
                PurchaseItem::create([
                    'purchase_id' => $purchase->id,
                    'medicine_id' => $item['medicine_id'],
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price'],
                    'sale_price' => $item['sale_price'] ?? null,
                    'total_price' => $totalPrice,
                    'batch_number' => $item['batch_number'] ?? null,
                    'expiry_date' => $item['expiry_date'] ?? null,
                    'notes' => $item['notes'] ?? null,
                ]);
            }
            
            // Update totals
            $purchase->subtotal = $subtotal;
            $purchase->total_amount = $subtotal + $purchase->tax - $purchase->discount;
            $purchase->save();
            
            DB::commit();
            
            return redirect()->route('pharmacy.purchases.show', $purchase->id)
                ->with('success', 'Purchase created successfully.');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to create purchase: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Display the specified purchase.
     */
    public function show(Purchase $purchase): Response
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $purchase->load(['supplier', 'creator', 'receiver', 'items.medicine.category']);
        
        return Inertia::render('Pharmacy/Purchases/Show', [
            'purchase' => $purchase,
        ]);
    }

    /**
     * Receive the purchase (update stock).
     */
    public function receive(Purchase $purchase): RedirectResponse
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        if (!$purchase->canBeReceived()) {
            return redirect()->back()->with('error', 'This purchase cannot be received.');
        }
        
        DB::beginTransaction();
        
        try {
            foreach ($purchase->items as $item) {
                $medicine = $item->medicine;
                $previousStock = $medicine->stock_quantity;
                $newStock = $previousStock + $item->quantity;
                
                // Update medicine stock
                $medicine->update([
                    'stock_quantity' => $newStock,
                    'cost_price' => $item->cost_price,
                    'batch_number' => $item->batch_number ?? $medicine->batch_number,
                    'expiry_date' => $item->expiry_date ?? $medicine->expiry_date,
                ]);
                
                // Create stock movement
                StockMovement::create([
                    'medicine_id' => $medicine->id,
                    'type' => 'in',
                    'quantity' => $item->quantity,
                    'previous_stock' => $previousStock,
                    'new_stock' => $newStock,
                    'reference_type' => 'purchase',
                    'reference_id' => $purchase->id,
                    'notes' => "Purchase #{$purchase->purchase_number}",
                    'user_id' => $user->id,
                ]);
            }
            
            // Update purchase status
            $purchase->update([
                'status' => 'received',
                'received_at' => now(),
                'received_by' => $user->id,
            ]);
            
            DB::commit();
            
            return redirect()->route('pharmacy.purchases.show', $purchase->id)
                ->with('success', 'Purchase received and stock updated successfully.');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to receive purchase: ' . $e->getMessage());
        }
    }

    /**
     * Cancel the purchase.
     */
    public function cancel(Purchase $purchase): RedirectResponse
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        if (!$purchase->canBeCancelled()) {
            return redirect()->back()->with('error', 'This purchase cannot be cancelled.');
        }
        
        DB::beginTransaction();
        
        try {
            // If purchase was received, reverse the stock
            if ($purchase->status === 'received') {
                foreach ($purchase->items as $item) {
                    $medicine = $item->medicine;
                    $previousStock = $medicine->stock_quantity;
                    $newStock = max(0, $previousStock - $item->quantity);
                    
                    // Update medicine stock
                    $medicine->update(['stock_quantity' => $newStock]);
                    
                    // Create stock movement
                    StockMovement::create([
                        'medicine_id' => $medicine->id,
                        'type' => 'out',
                        'quantity' => $item->quantity,
                        'previous_stock' => $previousStock,
                        'new_stock' => $newStock,
                        'reference_type' => 'purchase_cancellation',
                        'reference_id' => $purchase->id,
                        'notes' => "Cancelled Purchase #{$purchase->purchase_number}",
                        'user_id' => $user->id,
                    ]);
                }
            }
            
            // Update purchase status
            $purchase->update(['status' => 'cancelled']);
            
            DB::commit();
            
            return redirect()->route('pharmacy.purchases.index')
                ->with('success', 'Purchase cancelled successfully.');
                
        } catch (\Exception $e) {
            DB::rollBack();
            return redirect()->back()->with('error', 'Failed to cancel purchase: ' . $e->getMessage());
        }
    }

    /**
     * Quick store supplier (for modal creation).
     */
    public function quickStoreSupplier(Request $request)
    {
        $user = Auth::user();
        
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin', 'Super Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
        ]);
        
        if ($validator->fails()) {
            return back()->withErrors($validator)->withInput();
        }
        
        $supplier = Supplier::create([
            'name' => $request->name,
            'company_name' => $request->company_name,
            'contact_person' => $request->contact_person,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'is_active' => true,
        ]);
        
        return back()
            ->with('success', 'Supplier created successfully.')
            ->with('supplier', $supplier);
    }
}

