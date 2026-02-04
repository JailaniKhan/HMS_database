<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Supplier;
use App\Models\Medicine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PurchaseOrderController extends Controller
{
    /**
     * Display a listing of the purchase orders.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access. Required role: Hospital Admin or Pharmacy Admin');
        }
        
        $purchaseOrders = PurchaseOrder::with('items.medicine', 'supplier', 'user')->latest()->paginate(10);
        $suppliers = Supplier::all();
        
        // Calculate stats
        $stats = [
            'pending' => PurchaseOrder::where('status', 'pending')->count(),
            'ordered' => PurchaseOrder::whereIn('status', ['confirmed', 'sent'])->count(),
            'partial' => PurchaseOrder::where('status', 'partial')->count(),
            'received' => PurchaseOrder::where('status', 'received')->count(),
            'cancelled' => PurchaseOrder::where('status', 'cancelled')->count(),
            'total_value' => PurchaseOrder::sum('total_amount'),
        ];
        
        return Inertia::render('Pharmacy/PurchaseOrders/Index', [
            'purchaseOrders' => $purchaseOrders,
            'suppliers' => $suppliers,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new purchase order.
     */
    public function create(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission (Super Admin bypasses permission check)
        if (!$user->isSuperAdmin() && !$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $suppliers = Supplier::all();
        $medicines = Medicine::all();
        
        return Inertia::render('Pharmacy/PurchaseOrders/Create', [
            'suppliers' => $suppliers,
            'medicines' => $medicines
        ]);
    }

    /**
     * Store a newly created purchase order in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'required|date|after_or_equal:order_date',
            'items' => 'required|array',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.expiry_date' => 'required|date',
            'items.*.batch_number' => 'required|string|max:100',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $items = $request->items;
        
        // Create the purchase order
        $purchaseOrder = PurchaseOrder::create([
            'user_id' => $user->id,
            'supplier_id' => $request->supplier_id,
            'order_date' => $request->order_date,
            'expected_delivery_date' => $request->expected_delivery_date,
            'status' => 'pending', // Default status
            'total_amount' => collect($items)->sum(function($item) {
                return $item['quantity'] * $item['unit_price'];
            }),
        ]);
        
        // Process each item in the purchase order
        foreach ($items as $item) {
            PurchaseOrderItem::create([
                'purchase_order_id' => $purchaseOrder->id,
                'medicine_id' => $item['medicine_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total' => $item['quantity'] * $item['unit_price'],
                'expiry_date' => $item['expiry_date'],
                'batch_number' => $item['batch_number'],
            ]);
        }
        
        return redirect()->route('pharmacy.purchase-orders.index')->with('success', 'Purchase order created successfully.');
    }

    /**
     * Display the specified purchase order.
     */
    public function show($id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $purchaseOrder = PurchaseOrder::with('items.medicine', 'supplier', 'user')->findOrFail($id);
        
        return Inertia::render('Pharmacy/PurchaseOrders/Show', [
            'purchaseOrder' => $purchaseOrder
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        // Purchase orders should not be editable after creation to maintain transaction integrity
        // Only allow editing if the status is still 'pending'
        $purchaseOrder = PurchaseOrder::with('items.medicine', 'supplier', 'user')->findOrFail($id);
        
        if ($purchaseOrder->status !== 'pending') {
            abort(403, 'Cannot edit purchase order that is not in pending status');
        }
        
        $suppliers = Supplier::all();
        $medicines = Medicine::all();
        
        return Inertia::render('Pharmacy/PurchaseOrders/Edit', [
            'purchaseOrder' => $purchaseOrder,
            'suppliers' => $suppliers,
            'medicines' => $medicines
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        // Only allow updating if the status is still 'pending'
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        
        if ($purchaseOrder->status !== 'pending') {
            abort(403, 'Cannot update purchase order that is not in pending status');
        }
        
        $validator = Validator::make($request->all(), [
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_delivery_date' => 'required|date|after_or_equal:order_date',
            'items' => 'required|array',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.expiry_date' => 'required|date',
            'items.*.batch_number' => 'required|string|max:100',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $items = $request->items;
        
        // Update the purchase order
        $purchaseOrder->update([
            'supplier_id' => $request->supplier_id,
            'order_date' => $request->order_date,
            'expected_delivery_date' => $request->expected_delivery_date,
            'total_amount' => collect($items)->sum(function($item) {
                return $item['quantity'] * $item['unit_price'];
            }),
        ]);
        
        // Delete existing items
        $purchaseOrder->items()->delete();
        
        // Create new items
        foreach ($items as $item) {
            PurchaseOrderItem::create([
                'purchase_order_id' => $purchaseOrder->id,
                'medicine_id' => $item['medicine_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total' => $item['quantity'] * $item['unit_price'],
                'expiry_date' => $item['expiry_date'],
                'batch_number' => $item['batch_number'],
            ]);
        }
        
        return redirect()->route('pharmacy.purchase-orders.index')->with('success', 'Purchase order updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        // Only allow deleting if the status is still 'pending'
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        
        if ($purchaseOrder->status !== 'pending') {
            abort(403, 'Cannot delete purchase order that is not in pending status');
        }
        
        $purchaseOrder->delete();
        
        return redirect()->route('pharmacy.purchase-orders.index')->with('success', 'Purchase order deleted successfully.');
    }

    /**
     * Update the status of a purchase order.
     */
    public function updateStatus(Request $request, string $id): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,received,cancelled',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $purchaseOrder = PurchaseOrder::findOrFail($id);
        
        // Update status
        $purchaseOrder->update(['status' => $request->status]);
        
        // If status is 'received', update medicine stock
        if ($request->status === 'received') {
            foreach ($purchaseOrder->items as $item) {
                $medicine = Medicine::find($item->medicine_id);
                if ($medicine) {
                    // Add quantity to existing stock
                    $medicine->increment('quantity', $item->quantity);
                    
                    // Update expiry date and batch number with the latest values from the purchase order
                    $medicine->update([
                        'expiry_date' => $item->expiry_date,
                        'batch_number' => $item->batch_number,
                    ]);
                }
            }
        }
        
        return redirect()->route('pharmacy.purchase-orders.index')->with('success', 'Purchase order status updated successfully.');
    }

    /**
     * Display the receive page for a purchase order.
     */
    public function receivePage(string $id): Response
    {
        $user = Auth::user();

        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $purchaseOrder = PurchaseOrder::with(['items.medicine', 'supplier', 'orderedBy'])
            ->findOrFail($id);

        // Only allow receiving if status is 'sent' or 'partial'
        if (!in_array($purchaseOrder->status, ['sent', 'partial', 'confirmed'])) {
            abort(403, 'Cannot receive items for this purchase order');
        }

        return Inertia::render('Pharmacy/PurchaseOrders/Receive', [
            'purchaseOrder' => $purchaseOrder
        ]);
    }

    /**
     * Process the receipt of items for a purchase order.
     */
    public function receive(Request $request, string $id): RedirectResponse
    {
        $user = Auth::user();

        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $purchaseOrder = PurchaseOrder::with('items')->findOrFail($id);

        // Only allow receiving if status is 'sent', 'partial', or 'confirmed'
        if (!in_array($purchaseOrder->status, ['sent', 'partial', 'confirmed'])) {
            abort(403, 'Cannot receive items for this purchase order');
        }

        $validator = Validator::make($request->all(), [
            'items' => 'required|array',
            'items.*.po_item_id' => 'required|exists:purchase_order_items,id',
            'items.*.medicine_id' => 'required|exists:medicines,id',
            'items.*.received_quantity' => 'required|integer|min:1',
            'items.*.batch_number' => 'required|string|max:100',
            'items.*.expiry_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $receivedItems = $request->items;
        $totalReceived = 0;
        $totalOrdered = 0;

        // Process each received item
        foreach ($receivedItems as $item) {
            $poItem = PurchaseOrderItem::find($item['po_item_id']);

            if (!$poItem || $poItem->purchase_order_id != $purchaseOrder->id) {
                continue;
            }

            // Calculate how many have already been received for this item
            $previouslyReceived = $poItem->received_quantity ?? 0;
            $remainingToReceive = $poItem->quantity - $previouslyReceived;

            // Validate received quantity doesn't exceed remaining
            $receivedQuantity = min($item['received_quantity'], $remainingToReceive);

            if ($receivedQuantity <= 0) {
                continue;
            }

            // Update the purchase order item
            $poItem->update([
                'received_quantity' => $previouslyReceived + $receivedQuantity,
                'batch_number' => $item['batch_number'],
                'expiry_date' => $item['expiry_date'],
            ]);

            // Update medicine stock
            $medicine = Medicine::find($item['medicine_id']);
            if ($medicine) {
                $medicine->increment('quantity', $receivedQuantity);

                // Update batch and expiry with the latest received values
                $medicine->update([
                    'batch_number' => $item['batch_number'],
                    'expiry_date' => $item['expiry_date'],
                ]);
            }

            $totalReceived += $receivedQuantity;
            $totalOrdered += $poItem->quantity;
        }

        // Determine new status
        $allItemsReceived = true;
        $partiallyReceived = false;

        foreach ($purchaseOrder->items as $item) {
            $received = $item->received_quantity ?? 0;
            if ($received < $item->quantity) {
                $allItemsReceived = false;
            }
            if ($received > 0) {
                $partiallyReceived = true;
            }
        }

        if ($allItemsReceived) {
            $newStatus = 'received';
        } elseif ($partiallyReceived) {
            $newStatus = 'partial';
        } else {
            $newStatus = $purchaseOrder->status;
        }

        // Update purchase order status and notes
        $purchaseOrder->update([
            'status' => $newStatus,
            'notes' => $request->notes ? ($purchaseOrder->notes . "\n\nReceipt Notes: " . $request->notes) : $purchaseOrder->notes,
        ]);

        return redirect()->route('pharmacy.purchase-orders.show', $purchaseOrder->id)
            ->with('success', 'Items received successfully. Status: ' . ucfirst($newStatus));
    }

    /**
     * Search purchase orders by supplier or date.
     */
    public function search(Request $request): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $query = $request->input('query');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $status = $request->input('status');
        
        $purchaseOrdersQuery = PurchaseOrder::with('items.medicine', 'supplier', 'user');
        
        if ($query) {
            $purchaseOrdersQuery->whereHas('supplier', function($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                  ->orWhere('contact_person', 'like', '%' . $query . '%')
                  ->orWhere('phone', 'like', '%' . $query . '%');
            });
        }
        
        if ($startDate) {
            $purchaseOrdersQuery->whereDate('order_date', '>=', $startDate);
        }
        
        if ($endDate) {
            $purchaseOrdersQuery->whereDate('order_date', '<=', $endDate);
        }
        
        if ($status) {
            $purchaseOrdersQuery->where('status', $status);
        }
        
        $purchaseOrders = $purchaseOrdersQuery->latest()->paginate(10);
        
        $statuses = ['pending', 'confirmed', 'received', 'cancelled'];
        
        return Inertia::render('Pharmacy/PurchaseOrders/Index', [
            'purchaseOrders' => $purchaseOrders,
            'query' => $query,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'status' => $status,
            'statuses' => $statuses
        ]);
    }
}