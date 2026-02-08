<?php

namespace App\Http\Controllers\Pharmacy;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\HasPerformanceOptimization;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class MedicineController extends Controller
{
    use HasPerformanceOptimization;

    const LOW_STOCK_THRESHOLD = 10;
    const EXPIRY_WARNING_DAYS = 30;

    /**
     * Check if the current user can access pharmacy
     */
    private function authorizePharmacyAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if the current user can modify medicines
     */
    private function authorizeMedicineModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Sanitize search term to prevent SQL injection
     */
    private function sanitizeSearchTerm(string $term): string
    {
        // Remove any characters that could be used for SQL injection
        return preg_replace('/[^a-zA-Z0-9\s\-_.]/', '', $term);
    }

    /**
     * Sanitize input data to prevent XSS
     */
    private function sanitizeInput(array $data): array
    {
        return [
            'name' => htmlspecialchars(strip_tags($data['name'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'description' => htmlspecialchars(strip_tags($data['description'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'manufacturer' => htmlspecialchars(strip_tags($data['manufacturer'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'batch_number' => htmlspecialchars(strip_tags($data['batch_number'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'unit' => htmlspecialchars(strip_tags($data['unit'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'category_id' => filter_var($data['category_id'] ?? null, FILTER_VALIDATE_INT),
            'price' => filter_var($data['price'] ?? 0, FILTER_VALIDATE_FLOAT),
            'quantity' => filter_var($data['quantity'] ?? 0, FILTER_VALIDATE_INT),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $this->authorizePharmacyAccess();
        
        $query = Medicine::with('category');
        
        // Apply category filter
        if ($request->filled('category_id')) {
            $categoryId = filter_var($request->category_id, FILTER_VALIDATE_INT);
            if ($categoryId) {
                $query->where('category_id', $categoryId);
            }
        }
        
        // Apply stock status filter
        if ($request->filled('stock_status')) {
            $stockStatus = htmlspecialchars(strip_tags($request->stock_status), ENT_QUOTES, 'UTF-8');
            switch ($stockStatus) {
                case 'in_stock':
                    $query->where('quantity', '>', self::LOW_STOCK_THRESHOLD);
                    break;
                case 'low_stock':
                    $query->where('quantity', '<=', self::LOW_STOCK_THRESHOLD)
                          ->where('quantity', '>', 0);
                    break;
                case 'out_of_stock':
                    $query->where('quantity', '<=', 0);
                    break;
            }
        }
        
        // Apply expiry status filter
        if ($request->filled('expiry_status')) {
            $expiryStatus = htmlspecialchars(strip_tags($request->expiry_status), ENT_QUOTES, 'UTF-8');
            $today = now();
            switch ($expiryStatus) {
                case 'valid':
                    $query->whereDate('expiry_date', '>', $today->copy()->addDays(self::EXPIRY_WARNING_DAYS));
                    break;
                case 'expiring_soon':
                    $query->whereDate('expiry_date', '>=', $today)
                          ->whereDate('expiry_date', '<=', $today->copy()->addDays(self::EXPIRY_WARNING_DAYS));
                    break;
                case 'expired':
                    $query->whereDate('expiry_date', '<', $today);
                    break;
            }
        }
        
        // Apply search query with SQL injection protection
        if ($request->filled('query')) {
            $searchTerm = $this->sanitizeSearchTerm($request->query);
            if (!empty($searchTerm)) {
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'like', '%' . $searchTerm . '%')
                      ->orWhere('medicine_id', 'like', '%' . $searchTerm . '%')
                      ->orWhere('manufacturer', 'like', '%' . $searchTerm . '%')
                      ->orWhere('batch_number', 'like', '%' . $searchTerm . '%');
                });
            }
        }
        
        $medicines = $query->orderBy('name')->paginate(10)->withQueryString();
        $categories = MedicineCategory::orderBy('name')->get();
        
        return Inertia::render('Pharmacy/Medicines/Index', [
            'medicines' => $medicines,
            'categories' => $categories,
            'query' => $request->query('query', ''),
            'category_id' => $request->query('category_id', ''),
            'stock_status' => $request->query('stock_status', ''),
            'expiry_status' => $request->query('expiry_status', ''),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $this->authorizeMedicineModify();
        
        // Use cached categories instead of loading all
        $categories = $this->getMedicineCategories();
        
        return Inertia::render('Pharmacy/Medicines/Create', [
            'categories' => $categories
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorizeMedicineModify();
        
        $validated = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:medicine_categories,id',
            'description' => 'nullable|string|max:5000',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'manufacturer' => 'nullable|string|max:255',
            'expiry_date' => 'required|date',
            'batch_number' => 'required|string|max:100',
        ]);
        
        if ($validated->fails()) {
            return redirect()->back()->withErrors($validated)->withInput();
        }
        
        // Sanitize input data
        $sanitized = $this->sanitizeInput($validated->validated());
        
        DB::transaction(function () use ($sanitized, $validated) {
            Medicine::create([
                'name' => $sanitized['name'],
                'category_id' => $sanitized['category_id'],
                'description' => $sanitized['description'],
                'price' => $sanitized['price'],
                'quantity' => $sanitized['quantity'],
                'unit' => $sanitized['unit'],
                'manufacturer' => $sanitized['manufacturer'],
                'expiry_date' => $validated->validated()['expiry_date'],
                'batch_number' => $sanitized['batch_number'],
            ]);
        });
        
        return redirect()->route('pharmacy.medicines.index')->with('success', 'Medicine created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): Response
    {
        $this->authorizePharmacyAccess();
        
        // Validate ID is numeric
        $medicineId = filter_var($id, FILTER_VALIDATE_INT);
        if (!$medicineId) {
            abort(404, 'Invalid medicine ID');
        }
        
        $medicine = Medicine::with('category')->findOrFail($medicineId);
        
        // Get recent sales (last 30 days)
        $recentSales = \App\Models\SalesItem::where('medicine_id', $medicineId)
            ->whereHas('sale', function ($q) {
                $q->where('created_at', '>=', now()->subDays(30));
            })
            ->with('sale')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();
        
        // Get stock history
        $stockHistory = [];
        
        return Inertia::render('Pharmacy/Medicines/Show', [
            'medicine' => $medicine,
            'recentSales' => $recentSales,
            'stockHistory' => $stockHistory,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $this->authorizeMedicineModify();
        
        // Validate ID is numeric
        $medicineId = filter_var($id, FILTER_VALIDATE_INT);
        if (!$medicineId) {
            abort(404, 'Invalid medicine ID');
        }
        
        $medicine = Medicine::findOrFail($medicineId);
        // Use cached categories
        $categories = $this->getMedicineCategories();
        
        return Inertia::render('Pharmacy/Medicines/Edit', [
            'medicine' => $medicine,
            'categories' => $categories
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $this->authorizeMedicineModify();
        
        // Validate ID is numeric
        $medicineId = filter_var($id, FILTER_VALIDATE_INT);
        if (!$medicineId) {
            abort(404, 'Invalid medicine ID');
        }
        
        $medicine = Medicine::findOrFail($medicineId);
        
        $validated = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:medicine_categories,id',
            'description' => 'nullable|string|max:5000',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'unit' => 'required|string|max:50',
            'manufacturer' => 'nullable|string|max:255',
            'expiry_date' => 'required|date',
            'batch_number' => 'required|string|max:100',
        ]);
        
        if ($validated->fails()) {
            return redirect()->back()->withErrors($validated)->withInput();
        }
        
        // Sanitize input data
        $sanitized = $this->sanitizeInput($validated->validated());
        
        DB::transaction(function () use ($medicine, $sanitized, $validated) {
            $medicine->update([
                'name' => $sanitized['name'],
                'category_id' => $sanitized['category_id'],
                'description' => $sanitized['description'],
                'price' => $sanitized['price'],
                'quantity' => $sanitized['quantity'],
                'unit' => $sanitized['unit'],
                'manufacturer' => $sanitized['manufacturer'],
                'expiry_date' => $validated->validated()['expiry_date'],
                'batch_number' => $sanitized['batch_number'],
            ]);
        });
        
        return redirect()->route('pharmacy.medicines.index')->with('success', 'Medicine updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $this->authorizeMedicineModify();
        
        // Require specific delete permission
        if (!auth()->user()?->hasPermission('delete-medicines')) {
            abort(403, 'Unauthorized access');
        }
        
        // Validate ID is numeric
        $medicineId = filter_var($id, FILTER_VALIDATE_INT);
        if (!$medicineId) {
            abort(404, 'Invalid medicine ID');
        }
        
        $medicine = Medicine::findOrFail($medicineId);
        
        DB::transaction(function () use ($medicine) {
            $medicine->delete();
        });
        
        return redirect()->route('pharmacy.medicines.index')->with('success', 'Medicine deleted successfully.');
    }

    /**
     * Search medicines by name or other criteria
     */
    public function search(Request $request): Response
    {
        $this->authorizePharmacyAccess();
        
        $query = $request->input('query');
        
        // Sanitize search term
        $searchTerm = $this->sanitizeSearchTerm($query);
        
        $medicines = Medicine::where('name', 'like', '%' . $searchTerm . '%')
                    ->orWhere('description', 'like', '%' . $searchTerm . '%')
                    ->orWhere('batch_number', 'like', '%' . $searchTerm . '%')
                    ->with('category')
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Medicines/Index', [
            'medicines' => $medicines,
            'query' => $query
        ]);
    }

    /**
     * Update stock quantity for a medicine
     */
    public function updateStock(Request $request, string $id)
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        // Validate ID is numeric
        $medicineId = filter_var($id, FILTER_VALIDATE_INT);
        if (!$medicineId) {
            abort(404, 'Invalid medicine ID');
        }
        
        $medicine = Medicine::findOrFail($medicineId);
        
        $validator = Validator::make($request->all(), [
            'quantity' => 'required|integer|min:0',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        $quantity = filter_var($request->quantity, FILTER_VALIDATE_INT);
        
        $medicine->update([
            'quantity' => $quantity,
            'updated_at' => now(),
        ]);
        
        return redirect()->route('pharmacy.medicines.index')->with('success', 'Stock updated successfully.');
    }

    /**
     * Get low stock medicines
     */
    public function lowStock(): Response
    {
        $this->authorizePharmacyAccess();
        
        // Consider medicines with stock less than LOW_STOCK_THRESHOLD as low stock
        $medicines = Medicine::where('quantity', '<=', self::LOW_STOCK_THRESHOLD)
                    ->where('quantity', '>=', 1)
                    ->with('category')
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Medicines/LowStock', [
            'medicines' => $medicines
        ]);
    }

    /**
     * Get expired medicines
     */
    public function expired(): Response
    {
        $this->authorizePharmacyAccess();
        
        $medicines = Medicine::whereDate('expiry_date', '<', now())
                    ->with('category')
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Medicines/Expired', [
            'medicines' => $medicines
        ]);
    }

    /**
     * Get medicines about to expire
     */
    public function expiringSoon(): Response
    {
        $this->authorizePharmacyAccess();
        
        // Get medicines that expire within the next EXPIRY_WARNING_DAYS days
        $medicines = Medicine::whereDate('expiry_date', '>=', now())
                    ->whereDate('expiry_date', '<=', now()->addDays(self::EXPIRY_WARNING_DAYS))
                    ->with('category')
                    ->paginate(10);
        
        return Inertia::render('Pharmacy/Medicines/ExpiringSoon', [
            'medicines' => $medicines
        ]);
    }
}