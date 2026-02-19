# Pharmacy Module Comprehensive Review

## Executive Summary

This document provides a comprehensive review of the pharmacy section of the HMS (Hospital Management System) project. The review covers all aspects including models, controllers, services, frontend components, calculations, styling, and identifies areas for improvement.

---

## Table of Contents

1. [File Structure Overview](#file-structure-overview)
2. [Missing Calculations](#missing-calculations)
3. [Styling Inconsistencies](#styling-inconsistencies)
4. [Incomplete Implementations](#incomplete-implementations)
5. [Code Quality Issues](#code-quality-issues)
6. [Recommendations](#recommendations)
7. [Best Practices Suggestions](#best-practices-suggestions)

---

## File Structure Overview

### Backend Files
- **Models**: `Medicine.php`, `MedicineCategory.php`, `MedicineAlert.php`, `Sale.php`, `SalesItem.php`, `StockMovement.php`
- **Controllers**: `MedicineController.php`, `SalesController.php`, `StockController.php`, `DashboardController.php`, `ReportController.php`, `AlertController.php`, `MedicineCategoryController.php`
- **Services**: `InventoryService.php`, `SalesService.php`

### Frontend Files
- **Pages**: Dashboard, Medicines (Index, Show, Create, Edit, LowStock, ExpiringSoon), Sales (Index, Create, Show, Dispense, Receipt, PrintReceipt), Stock (Index, Movements, Adjustments, Valuation), Reports (Index, SalesReport, StockReport, ExpiryReport), Alerts
- **Components**: Cart, PriceDisplay, StockBadge, ExpiryBadge, MedicineCard, MedicineSearch, FilterBar
- **Types**: `pharmacy.ts`, `medicine.ts`
- **Layout**: `PharmacyLayout.tsx`

---

## Missing Calculations

### 1. Profit Margin Calculation
**Location**: `Medicine.php` model

**Issue**: The `Medicine` model has both `cost_price` and `sale_price` fields, but there's no calculated attribute for profit margin.

**Recommendation**:
```php
// Add to Medicine.php
public function getProfitMarginAttribute(): float
{
    if ($this->cost_price <= 0) {
        return 0;
    }
    return round((($this->sale_price - $this->cost_price) / $this->cost_price) * 100, 2);
}

public function getProfitPerUnitAttribute(): float
{
    return round($this->sale_price - $this->cost_price, 2);
}
```

### 2. Stock Value Calculations
**Location**: `Medicine.php` model

**Issue**: No accessor for total stock value based on cost price vs sale price.

**Recommendation**:
```php
// Add to Medicine.php
public function getStockValueAtCostAttribute(): float
{
    return round($this->stock_quantity * $this->cost_price, 2);
}

public function getStockValueAtSaleAttribute(): float
{
    return round($this->stock_quantity * $this->sale_price, 2);
}

public function getPotentialProfitAttribute(): float
{
    return round($this->stock_value_at_sale - $this->stock_value_at_cost, 2);
}
```

### 3. Expiry Risk Assessment
**Location**: `StockController.php` / `ReportController.php`

**Issue**: No calculation for financial risk of expiring medicines.

**Recommendation**:
```php
// Add method to calculate expiry risk
public function calculateExpiryRisk(): array
{
    $expired = Medicine::whereDate('expiry_date', '<', now())
        ->selectRaw('SUM(stock_quantity * cost_price) as total_cost, SUM(stock_quantity * sale_price) as total_sale')
        ->first();
    
    $expiring30Days = Medicine::whereDate('expiry_date', '>=', now())
        ->whereDate('expiry_date', '<=', now()->addDays(30))
        ->selectRaw('SUM(stock_quantity * cost_price) as total_cost, SUM(stock_quantity * sale_price) as total_sale')
        ->first();
    
    return [
        'expired_value' => $expired->total_cost ?? 0,
        'expiring_30_days_value' => $expiring30Days->total_cost ?? 0,
        'total_risk_value' => ($expired->total_cost ?? 0) + ($expiring30Days->total_cost ?? 0),
    ];
}
```

### 4. Sales Tax Calculation Issues
**Location**: `SalesService.php` and `SalesController.php`

**Issue**: Tax rate is hardcoded or fetched from config without proper validation. The tax calculation doesn't consider tax-exempt items.

**Current Code**:
```php
$tax = $subtotal * ($taxRate / 100);
```

**Recommendation**:
```php
// Add tax exemption support
public function calculateTotals(array $items, float $discount = 0, float $taxRate = 0, array $taxExemptCategories = []): array
{
    $subtotal = 0;
    $taxableAmount = 0;

    foreach ($items as $item) {
        $medicine = Medicine::find($item['medicine_id']);
        $itemTotal = $item['quantity'] * $item['unit_price'];
        
        if (isset($item['discount']) && $item['discount'] > 0) {
            $itemTotal = $itemTotal * (1 - ($item['discount'] / 100));
        }
        
        $subtotal += $itemTotal;
        
        // Check if item is taxable
        if (!in_array($medicine->category_id, $taxExemptCategories)) {
            $taxableAmount += $itemTotal;
        }
    }

    $tax = $taxableAmount * ($taxRate / 100);
    $discount = min($discount, $subtotal);
    $total = $subtotal - $discount + $tax;

    return [
        'subtotal' => round($subtotal, 2),
        'discount' => round($discount, 2),
        'tax' => round($tax, 2),
        'taxable_amount' => round($taxableAmount, 2),
        'total' => round($total, 2),
    ];
}
```

### 5. Reorder Quantity Calculation
**Location**: `InventoryService.php`

**Issue**: No automatic calculation for suggested reorder quantity based on sales velocity.

**Recommendation**:
```php
// Add to InventoryService.php
public function calculateReorderQuantity(int $medicineId, int $daysToAnalyze = 30): array
{
    $medicine = Medicine::findOrFail($medicineId);
    
    // Calculate average daily sales
    $totalSold = SalesItem::where('medicine_id', $medicineId)
        ->whereHas('sale', function ($q) use ($daysToAnalyze) {
            $q->where('created_at', '>=', now()->subDays($daysToAnalyze))
              ->where('status', 'completed');
        })
        ->sum('quantity');
    
    $avgDailySales = $totalSold / $daysToAnalyze;
    
    // Lead time (days to receive new stock)
    $leadTime = 7; // Could be configurable per supplier
    
    // Safety stock (buffer for variability)
    $safetyStock = ceil($avgDailySales * 3); // 3 days buffer
    
    // Reorder point
    $reorderPoint = ceil(($avgDailySales * $leadTime) + $safetyStock);
    
    // Suggested order quantity (EOQ - Economic Order Quantity simplified)
    $suggestedOrderQty = ceil($avgDailySales * 30); // 30 days supply
    
    return [
        'avg_daily_sales' => round($avgDailySales, 2),
        'current_stock' => $medicine->stock_quantity,
        'reorder_point' => $reorderPoint,
        'safety_stock' => $safetyStock,
        'suggested_order_quantity' => $suggestedOrderQty,
        'days_of_stock_remaining' => $avgDailySales > 0 ? floor($medicine->stock_quantity / $avgDailySales) : PHP_INT_MAX,
        'needs_reorder' => $medicine->stock_quantity <= $reorderPoint,
    ];
}
```

### 6. Discount Validation
**Location**: `SalesController.php` frontend

**Issue**: Frontend validates discount doesn't exceed subtotal, but backend doesn't have the same validation.

**Recommendation**: Add backend validation in `StoreSaleRequest.php`:
```php
public function rules(): array
{
    return [
        'discount_amount' => ['nullable', 'numeric', 'min:0', function ($attribute, $value, $fail) {
            $subtotal = collect($this->items)->sum(function ($item) {
                return $item['quantity'] * $item['unit_price'];
            });
            if ($value > $subtotal) {
                $fail('Discount cannot exceed subtotal.');
            }
        }],
        // ... other rules
    ];
}
```

---

## Styling Inconsistencies

### 1. Currency Formatting
**Issue**: Multiple places define `formatCurrency` function differently.

**Locations**:
- `resources/js/Pages/Pharmacy/Medicines/Index.tsx`
- `resources/js/Pages/Pharmacy/Sales/Create.tsx`
- `resources/js/Pages/Pharmacy/Stock/Valuation.tsx`
- `resources/js/components/pharmacy/Cart.tsx`

**Current Code** (varies across files):
```typescript
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'AFN',
    }).format(amount);
};
```

**Recommendation**: Create a shared utility function:
```typescript
// resources/js/lib/currency.ts
export const formatCurrency = (amount: number, currency: string = 'AFN'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
    }).format(amount);
};

export const formatNumber = (value: number, decimals: number = 2): string => {
    return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
};
```

### 2. Date Formatting
**Issue**: Date formatting is inconsistent across components.

**Locations**: Multiple files use different date formatting approaches.

**Recommendation**: Create a shared date utility:
```typescript
// resources/js/lib/date-utils.ts
import { format, parseISO, formatDistanceToNow } from 'date-fns';

export const formatDate = (date: string | Date, formatStr: string = 'MMM d, yyyy'): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
};

export const formatDateTime = (date: string | Date): string => {
    return formatDate(date, 'MMM d, yyyy h:mm a');
};

export const getRelativeTime = (date: string | Date): string => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
};

export const getDaysUntil = (date: string | Date): number => {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    const today = new Date();
    return Math.ceil((dateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};
```

### 3. Badge Color Classes
**Issue**: Status badge colors are defined inline in multiple places.

**Locations**:
- `resources/js/Pages/Pharmacy/Reports/SalesReport.tsx`
- `resources/js/Pages/Pharmacy/Alerts/Index.tsx`
- `resources/js/components/pharmacy/StockBadge.tsx`
- `resources/js/components/pharmacy/ExpiryBadge.tsx`

**Recommendation**: Create a shared styling configuration:
```typescript
// resources/js/lib/status-config.ts
export const statusStyles = {
    stock: {
        'in-stock': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
        'low-stock': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        'out-of-stock': 'bg-red-500/10 text-red-600 border-red-500/30',
        'critical': 'bg-red-600/10 text-red-700 border-red-600/30',
    },
    expiry: {
        'valid': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
        'expiring-soon': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        'expired': 'bg-red-500/10 text-red-600 border-red-500/30',
    },
    sale: {
        'completed': 'bg-green-100 text-green-800',
        'pending': 'bg-yellow-100 text-yellow-800',
        'cancelled': 'bg-red-100 text-red-800',
        'refunded': 'bg-gray-100 text-gray-800',
    },
    priority: {
        'low': 'bg-blue-500/10 text-blue-500 border-blue-200',
        'medium': 'bg-yellow-500/10 text-yellow-500 border-yellow-200',
        'high': 'bg-orange-500/10 text-orange-500 border-orange-200',
        'critical': 'bg-red-500/10 text-red-500 border-red-200',
    },
};
```

### 4. Card Gradient Classes
**Issue**: Gradient background classes are repeated across multiple files.

**Recommendation**: Create reusable card variants:
```typescript
// resources/js/components/ui/stats-card.tsx
import { cn } from '@/lib/utils';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
}

const variantStyles = {
    primary: 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20',
    success: 'bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20',
    warning: 'bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20',
    danger: 'bg-gradient-to-br from-red-500/5 to-red-500/10 border-red-500/20',
    info: 'bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20',
};

const iconStyles = {
    primary: 'bg-primary/20 text-primary',
    success: 'bg-green-500/20 text-green-600',
    warning: 'bg-amber-500/20 text-amber-600',
    danger: 'bg-red-500/20 text-red-600',
    info: 'bg-blue-500/20 text-blue-600',
};
```

### 5. CSS Max-Height Dynamic Value
**Issue**: In `Cart.tsx`, the max-height style is incorrectly applied.

**Location**: `resources/js/components/pharmacy/Cart.tsx`

**Current Code**:
```typescript
<div className={cn('px-6 overflow-y-auto', maxHeight && `max-h-[${maxHeight}]`)}>
```

**Issue**: Tailwind CSS doesn't support dynamic values like this. The class won't be generated.

**Recommendation**:
```typescript
// Option 1: Use inline style for dynamic values
<div className="px-6 overflow-y-auto" style={{ maxHeight }}>

// Option 2: Use predefined Tailwind classes
<div className={cn('px-6 overflow-y-auto', {
    'max-h-64': maxHeight === '256px',
    'max-h-96': maxHeight === '384px',
    'max-h-[400px]': maxHeight === '400px',
})}>
```

---

## Incomplete Implementations

### 1. Prescription Dispensing
**Location**: `SalesController.php` - `dispense()` method

**Issue**: The prescription dispensing feature is partially implemented. The controller checks for prescriptions table existence but the full workflow isn't complete.

**Current Code**:
```php
try {
    if (\Illuminate\Support\Facades\Schema::hasTable('prescriptions')) {
        $prescriptions = \App\Models\Prescription::where('status', 'pending')
            ->with(['patient', 'doctor', 'items.medicine'])
            ->get();
    }
} catch (\Exception $e) {
    $prescriptions = [];
}
```

**Recommendation**: 
- Add proper prescription status management
- Implement partial dispensing
- Add prescription verification workflow
- Create prescription-specific receipt

### 2. Quick Patient Creation
**Location**: `SalesController.php` references `/pharmacy/quick-patient` route

**Issue**: The frontend calls this endpoint but the implementation needs verification.

**Recommendation**: Ensure `PatientController::quickStore` exists and returns proper JSON response:
```php
public function quickStore(Request $request): JsonResponse
{
    $validated = $request->validate([
        'first_name' => 'required|string|max:255',
        'father_name' => 'required|string|max:255',
        'phone' => 'nullable|string|max:20',
    ]);

    $patient = Patient::create([
        ...$validated,
        'patient_id' => $this->generatePatientId(),
    ]);

    return response()->json([
        'success' => true,
        'data' => $patient,
    ]);
}
```

### 3. Export Functionality
**Location**: `StockController.php` and `SalesController.php`

**Issue**: Export only generates CSV. PDF export is referenced but not implemented.

**Recommendation**: Add PDF export using a library like `dompdf` or `laravel-snappy`:
```php
public function exportPdf(Request $request)
{
    $medicines = $this->getFilteredMedicines($request);
    
    $pdf = Pdf::loadView('exports.stock-pdf', [
        'medicines' => $medicines,
        'generatedAt' => now(),
    ]);
    
    return $pdf->download('stock-report-' . now()->format('Y-m-d') . '.pdf');
}
```

### 4. Stock Valuation Export
**Location**: `StockController.php` - `valuation()` method

**Issue**: Export buttons exist in UI but routes aren't defined.

**Current Frontend Code**:
```typescript
const handleExport = (type: 'pdf' | 'excel') => {
    window.location.href = `/pharmacy/stock/valuation/export?format=${type}`;
};
```

**Recommendation**: Add the export route and method:
```php
// In routes/hospital.php
Route::get('/stock/valuation/export', [StockController::class, 'exportValuation'])
    ->name('pharmacy.stock.valuation.export');

// In StockController.php
public function exportValuation(Request $request)
{
    $format = $request->query('format', 'excel');
    // Implementation
}
```

### 5. Alert Trigger Check
**Location**: `AlertController.php` - `triggerCheck()` method

**Issue**: Method only returns a message without actual implementation.

**Current Code**:
```php
public function triggerCheck()
{
    return redirect()->back()->withErrors(['success' => 'Expiry alert check would be triggered...']);
}
```

**Recommendation**: Implement actual alert checking:
```php
public function triggerCheck()
{
    $alertsCreated = 0;
    
    // Check for expired medicines
    $expired = Medicine::whereDate('expiry_date', '<', now())
        ->where('stock_quantity', '>', 0)
        ->get();
    
    foreach ($expired as $medicine) {
        MedicineAlert::firstOrCreate(
            [
                'medicine_id' => $medicine->id,
                'alert_type' => 'expired',
                'status' => 'pending',
            ],
            [
                'message' => "Medicine {$medicine->name} has expired",
                'priority' => 'critical',
                'triggered_at' => now(),
            ]
        );
        $alertsCreated++;
    }
    
    // Check for low stock
    // ... similar implementation
    
    return redirect()->back()->with('success', "Alert check completed. {$alertsCreated} alerts created.");
}
```

### 6. Real-time Stock Updates
**Location**: `StockController.php` - `getRealTimeStock()` method

**Issue**: Method exists but isn't used in frontend for real-time updates.

**Recommendation**: Implement WebSocket or polling for real-time stock display:
```typescript
// In frontend component
useEffect(() => {
    const interval = setInterval(async () => {
        const response = await fetch('/api/pharmacy/stock/realtime');
        const data = await response.json();
        setStockData(data);
    }, 30000); // Every 30 seconds
    
    return () => clearInterval(interval);
}, []);
```

### 7. Bulk Stock Update
**Location**: `StockController.php` - `bulkUpdate()` method

**Issue**: Backend method exists but no frontend UI for bulk updates.

**Recommendation**: Add bulk update UI in Stock Index page.

---

## Code Quality Issues

### 1. Duplicate Field Names in Medicine Model
**Location**: `Medicine.php`

**Issue**: The model has multiple fields that seem to store the same data:
- `quantity` and `stock_quantity`
- `sale_price`, `unit_price`, and `price`
- `medicine_id` and `medicine_code`

**Recommendation**: Standardize field names and add documentation:
```php
/**
 * Medicine Model
 * 
 * Field Mapping:
 * - stock_quantity: Primary inventory count (quantity is alias for backward compatibility)
 * - sale_price: Primary selling price (unit_price is alias)
 * - medicine_id: Primary identifier (medicine_code is alias)
 */
protected $fillable = [
    'medicine_id',      // Primary unique identifier
    'name',
    'description',
    'manufacturer',
    'category_id',
    'form',             // Dosage form (tablet, syrup, etc.)
    'strength',
    'cost_price',       // Purchase/cost price
    'sale_price',       // Selling price
    'stock_quantity',   // Current stock level
    'reorder_level',
    'expiry_date',
    'batch_number',
    'status',
];

// Accessors for backward compatibility
public function getQuantityAttribute(): int
{
    return $this->stock_quantity;
}

public function getUnitPriceAttribute(): float
{
    return $this->sale_price;
}
```

### 2. Missing Database Indexes
**Location**: Database migrations

**Issue**: Frequently queried columns lack indexes.

**Recommendation**: Add indexes for:
```php
// In migration
$table->index('medicine_id');
$table->index('category_id');
$table->index('expiry_date');
$table->index('stock_quantity');
$table->index(['stock_quantity', 'reorder_level']); // Composite for low stock queries
$table->index('batch_number');
```

### 3. N+1 Query Issues
**Location**: Multiple controllers

**Issue**: Some queries don't eager load relationships properly.

**Example in `MedicineController.php`**:
```php
$recentSales = \App\Models\SalesItem::where('medicine_id', $medicineId)
    ->whereHas('sale', function ($q) {
        $q->where('created_at', '>=', now()->subDays(30));
    })
    ->with('sale')
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();
```

**Recommendation**: Ensure all necessary relationships are eager loaded:
```php
$recentSales = \App\Models\SalesItem::where('medicine_id', $medicineId)
    ->whereHas('sale', function ($q) {
        $q->where('created_at', '>=', now()->subDays(30));
    })
    ->with(['sale.soldBy', 'sale.patient']) // Eager load nested relationships
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();
```

### 4. Missing Form Request Validation
**Location**: `MedicineController.php`

**Issue**: Validation logic is in controller instead of Form Request class.

**Recommendation**: Create `StoreMedicineRequest.php` and `UpdateMedicineRequest.php`:
```php
// app/Http/Requests/StoreMedicineRequest.php
class StoreMedicineRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'medicine_id' => ['required', 'string', 'max:100', 'unique:medicines,medicine_id'],
            'category_id' => ['required', 'exists:medicine_categories,id'],
            'cost_price' => ['required', 'numeric', 'min:0'],
            'sale_price' => ['required', 'numeric', 'min:0', 'gte:cost_price'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'reorder_level' => ['required', 'integer', 'min:0'],
            'expiry_date' => ['required', 'date', 'after:today'],
            'batch_number' => ['required', 'string', 'max:100'],
        ];
    }
}
```

### 5. Hardcoded Values
**Location**: Multiple files

**Issues**:
- `LOW_STOCK_THRESHOLD = 10` in `MedicineController.php`
- `EXPIRY_WARNING_DAYS = 30` in `MedicineController.php`
- Low stock threshold `10` in `AlertController.php`

**Recommendation**: Move to configuration:
```php
// config/pharmacy.php
return [
    'low_stock_threshold' => env('PHARMACY_LOW_STOCK_THRESHOLD', 10),
    'expiry_warning_days' => env('PHARMACY_EXPIRY_WARNING_DAYS', 30),
    'critical_stock_percentage' => env('PHARMACY_CRITICAL_STOCK_PERCENTAGE', 50),
    'tax_rate' => env('PHARMACY_TAX_RATE', 0),
];
```

### 6. Missing API Rate Limiting
**Location**: `routes/api.php`

**Issue**: Pharmacy API routes don't have rate limiting.

**Recommendation**:
```php
Route::middleware(['throttle:60,1'])->prefix('pharmacy')->group(function () {
    // API routes
});
```

---

## Recommendations

### High Priority

1. **Standardize Currency Handling**
   - Create a centralized currency formatting utility
   - Ensure consistent decimal precision across all calculations
   - Add currency symbol configuration

2. **Implement Missing Backend Validations**
   - Add Form Request classes for all forms
   - Validate discount limits on server side
   - Add stock availability validation before sale processing

3. **Fix CSS Dynamic Class Issue**
   - Replace dynamic Tailwind classes with inline styles or predefined classes
   - This affects the Cart component's max-height

4. **Complete Export Functionality**
   - Implement PDF export for all reports
   - Add Excel export with proper formatting
   - Include charts in exports where applicable

5. **Add Database Indexes**
   - Index frequently queried columns
   - Add composite indexes for common filter combinations

### Medium Priority

1. **Implement Real-time Features**
   - Add WebSocket support for real-time stock updates
   - Implement real-time alert notifications
   - Add live search with debouncing

2. **Enhance Error Handling**
   - Add proper try-catch blocks with specific exception handling
   - Implement user-friendly error messages
   - Add error logging for debugging

3. **Improve Code Organization**
   - Move repeated logic to service classes
   - Create helper functions for common operations
   - Use constants or config for magic numbers

4. **Add Unit Tests**
   - Test calculation methods
   - Test stock movement logic
   - Test sale processing workflow

### Low Priority

1. **Add Audit Trail**
   - Log all stock changes with user and timestamp
   - Track price changes
   - Record sale modifications

2. **Implement Soft Deletes**
   - Add soft deletes to Medicine model
   - Implement soft deletes for Sale model
   - Add restore functionality

3. **Add Batch Operations**
   - Bulk stock update UI
   - Bulk price update
   - Bulk category assignment

---

## Best Practices Suggestions

### 1. Use DTOs for Data Transfer
```php
// app/DTOs/SaleDTO.php
class SaleDTO
{
    public function __construct(
        public array $items,
        public ?int $patientId,
        public string $paymentMethod,
        public float $discount,
        public float $tax,
        public ?string $notes,
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            items: $request->validated('items'),
            patientId: $request->validated('patient_id'),
            paymentMethod: $request->validated('payment_method'),
            discount: $request->validated('discount_amount', 0),
            tax: $request->validated('tax_amount', 0),
            notes: $request->validated('notes'),
        );
    }
}
```

### 2. Use Enums for Status Values
```php
// app/Enums/SaleStatus.php
enum SaleStatus: string
{
    case PENDING = 'pending';
    case COMPLETED = 'completed';
    case CANCELLED = 'cancelled';
    case REFUNDED = 'refunded';

    public function label(): string
    {
        return match($this) {
            self::PENDING => 'Pending',
            self::COMPLETED => 'Completed',
            self::CANCELLED => 'Cancelled',
            self::REFUNDED => 'Refunded',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::PENDING => 'yellow',
            self::COMPLETED => 'green',
            self::CANCELLED => 'red',
            self::REFUNDED => 'gray',
        };
    }
}
```

### 3. Use Repository Pattern for Data Access
```php
// app/Repositories/MedicineRepository.php
class MedicineRepository
{
    public function find(int $id): ?Medicine
    {
        return Medicine::with('category')->find($id);
    }

    public function getLowStock(): Collection
    {
        return Medicine::whereColumn('stock_quantity', '<=', 'reorder_level')
            ->where('stock_quantity', '>', 0)
            ->with('category')
            ->get();
    }

    public function search(string $query, array $filters = []): LengthAwarePaginator
    {
        // Centralized search logic
    }
}
```

### 4. Implement Cache Layer
```php
// In controller or service
public function index()
{
    $categories = Cache::remember('medicine_categories', 3600, function () {
        return MedicineCategory::withCount('medicines')->get();
    });
    
    // ...
}
```

### 5. Add API Versioning
```php
// routes/api.php
Route::prefix('v1')->group(function () {
    Route::apiResource('medicines', MedicineController::class);
    Route::apiResource('sales', SalesController::class);
});
```

### 6. Use TypeScript Strict Mode
```typescript
// Ensure tsconfig.json has
{
    "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true
    }
}
```

---

## Summary

The pharmacy module is well-structured with a solid foundation, but there are several areas that need attention:

| Category | Issues Found | Priority |
|----------|-------------|----------|
| Missing Calculations | 6 | High |
| Styling Inconsistencies | 5 | Medium |
| Incomplete Implementations | 7 | High |
| Code Quality Issues | 6 | Medium |

### Immediate Actions Required:
1. Fix CSS dynamic class issue in Cart component
2. Add backend validation for discount limits
3. Implement proper export functionality
4. Add database indexes for performance
5. Standardize currency and date formatting

### Long-term Improvements:
1. Implement real-time updates
2. Add comprehensive test coverage
3. Refactor to use DTOs and Enums
4. Add caching layer
5. Implement audit trail

---

*Document generated on: <?php echo date('Y-m-d H:i:s'); ?>*