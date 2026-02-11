<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Models\MedicineCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class MedicineCategoryController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
        
        $categories = MedicineCategory::withCount('medicines')
            ->orderBy('name')
            ->paginate(10);
        
        return Inertia::render('Pharmacy/Categories/Index', [
            'categories' => $categories
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-medicines')) {
            abort(403, 'Unauthorized access');
        }
        
        return Inertia::render('Pharmacy/Categories/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('create-medicines')) {
            abort(403, 'Unauthorized access');
        }
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:medicine_categories,name',
            'description' => 'nullable|string|max:1000',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        MedicineCategory::create($validator->validated());
        
        // Clear the medicine categories cache so new category appears immediately
        Cache::forget('medicine_categories');
        
        return redirect()->route('pharmacy.categories.index')
            ->with('success', 'Category created successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }
        
        $category = MedicineCategory::withCount('medicines')->findOrFail($id);
        
        return Inertia::render('Pharmacy/Categories/Edit', [
            'category' => $category
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }
        
        $category = MedicineCategory::findOrFail($id);
        
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:medicine_categories,name,' . $id,
            'description' => 'nullable|string|max:1000',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $category->update($validator->validated());
        
        // Clear the medicine categories cache so updated category appears immediately
        Cache::forget('medicine_categories');
        
        return redirect()->route('pharmacy.categories.index')
            ->with('success', 'Category updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->hasPermission('delete-medicines')) {
            abort(403, 'Unauthorized access');
        }
        
        $category = MedicineCategory::withCount('medicines')->findOrFail($id);
        
        // Check if category has medicines
        if ($category->medicines_count > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete category with associated medicines. Please reassign or delete the medicines first.');
        }
        
        $category->delete();
        
        // Clear the medicine categories cache so deleted category is removed immediately
        Cache::forget('medicine_categories');
        
        return redirect()->route('pharmacy.categories.index')
            ->with('success', 'Category deleted successfully.');
    }
}
