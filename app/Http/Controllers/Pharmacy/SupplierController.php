<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    /**
     * Display a listing of the suppliers.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access. Required role: Hospital Admin or Pharmacy Admin');
        }
        
        $suppliers = Supplier::all();
        
        return Inertia::render('Pharmacy/Suppliers/Index', [
            'suppliers' => $suppliers
        ]);
    }

    /**
     * Show the form for creating a new supplier.
     */
    public function create(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access. Required role: Hospital Admin or Pharmacy Admin');
        }
        
        return Inertia::render('Pharmacy/Suppliers/Create');
    }

    /**
     * Store a newly created supplier in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access. Required role: Hospital Admin or Pharmacy Admin');
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);
        
        Supplier::create($validated);
        
        return redirect()->route('pharmacy.suppliers.index')->with('success', 'Supplier created successfully.');
    }

    /**
     * Display the specified supplier.
     */
    public function show(string $id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access. Required role: Hospital Admin or Pharmacy Admin');
        }
        
        $supplier = Supplier::with('purchaseOrders')->findOrFail($id);
        
        return Inertia::render('Pharmacy/Suppliers/Show', [
            'supplier' => $supplier
        ]);
    }

    /**
     * Show the form for editing the specified supplier.
     */
    public function edit(string $id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access. Required role: Hospital Admin or Pharmacy Admin');
        }
        
        $supplier = Supplier::findOrFail($id);
        
        return Inertia::render('Pharmacy/Suppliers/Edit', [
            'supplier' => $supplier
        ]);
    }

    /**
     * Update the specified supplier in storage.
     */
    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access. Required role: Hospital Admin or Pharmacy Admin');
        }
        
        $supplier = Supplier::findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'notes' => 'nullable|string',
        ]);
        
        $supplier->update($validated);
        
        return redirect()->route('pharmacy.suppliers.index')->with('success', 'Supplier updated successfully.');
    }

    /**
     * Remove the specified supplier from storage.
     */
    public function destroy(string $id)
    {
        $user = Auth::user();
        
        // Check if user has appropriate role (Super Admin bypasses role check)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access. Required role: Hospital Admin or Pharmacy Admin');
        }
        
        $supplier = Supplier::findOrFail($id);
        
        // Check if supplier has any purchase orders
        if ($supplier->purchaseOrders()->exists()) {
            return redirect()->back()->with('error', 'Cannot delete supplier with existing purchase orders.');
        }
        
        $supplier->delete();
        
        return redirect()->route('pharmacy.suppliers.index')->with('success', 'Supplier deleted successfully.');
    }
}
