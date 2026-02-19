<?php

namespace App\Services;

use App\Models\Medicine;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class InventoryService
{
    protected $auditLogService;

    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Check if a medicine has sufficient stock available.
     *
     * @param int $medicineId
     * @param int $quantity
     * @return bool
     */
    public function checkAvailability(int $medicineId, int $quantity): bool
    {
        $medicine = Medicine::find($medicineId);
        
        if (!$medicine) {
            return false;
        }
        
        return $medicine->stock_quantity >= $quantity;
    }

    /**
     * Get the current stock level for a medicine.
     *
     * @param int $medicineId
     * @return int
     */
    public function getStockLevel(int $medicineId): int
    {
        $medicine = Medicine::find($medicineId);
        
        return $medicine ? $medicine->stock_quantity : 0;
    }

    /**
     * Deduct stock for a medicine.
     *
     * @param int $medicineId
     * @param int $quantity
     * @param string $reason
     * @param int|null $referenceId
     * @return bool
     * @throws \Exception
     */
    public function deductStock(int $medicineId, int $quantity, string $reason, ?int $referenceId = null): bool
    {
        return DB::transaction(function () use ($medicineId, $quantity, $reason, $referenceId) {
            $medicine = Medicine::lockForUpdate()->find($medicineId);
            
            if (!$medicine) {
                throw new \Exception("Medicine not found with ID: {$medicineId}");
            }
            
            if ($medicine->stock_quantity < $quantity) {
                throw new \Exception(
                    "Insufficient stock for {$medicine->name}. Available: {$medicine->stock_quantity}, Requested: {$quantity}"
                );
            }
            
            $previousStock = $medicine->stock_quantity;
            $newStock = $previousStock - $quantity;
            
            // Update medicine stock
            $medicine->update([
                'stock_quantity' => $newStock,
            ]);
            
            // Record stock movement
            $this->recordStockMovement(
                $medicineId,
                'out',
                $quantity,
                $previousStock,
                $newStock,
                'sale',
                $referenceId,
                $reason
            );
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Stock Deduction',
                'Inventory',
                "Deducted {$quantity} units of {$medicine->name}. Reason: {$reason}",
                'info'
            );
            
            return true;
        });
    }

    /**
     * Restore stock for a medicine (e.g., when voiding a sale).
     *
     * @param int $medicineId
     * @param int $quantity
     * @param string $reason
     * @param int|null $referenceId
     * @return bool
     * @throws \Exception
     */
    public function restoreStock(int $medicineId, int $quantity, string $reason, ?int $referenceId = null): bool
    {
        return DB::transaction(function () use ($medicineId, $quantity, $reason, $referenceId) {
            $medicine = Medicine::lockForUpdate()->find($medicineId);
            
            if (!$medicine) {
                throw new \Exception("Medicine not found with ID: {$medicineId}");
            }
            
            $previousStock = $medicine->stock_quantity;
            $newStock = $previousStock + $quantity;
            
            // Update medicine stock
            $medicine->update([
                'stock_quantity' => $newStock,
            ]);
            
            // Record stock movement
            $this->recordStockMovement(
                $medicineId,
                'in',
                $quantity,
                $previousStock,
                $newStock,
                'return',
                $referenceId,
                $reason
            );
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Stock Restoration',
                'Inventory',
                "Restored {$quantity} units of {$medicine->name}. Reason: {$reason}",
                'info'
            );
            
            return true;
        });
    }

    /**
     * Adjust stock for a medicine (for corrections, damages, etc.).
     *
     * @param int $medicineId
     * @param int $newQuantity
     * @param string $reason
     * @param int|null $referenceId
     * @return bool
     * @throws \Exception
     */
    public function adjustStock(int $medicineId, int $newQuantity, string $reason, ?int $referenceId = null): bool
    {
        return DB::transaction(function () use ($medicineId, $newQuantity, $reason, $referenceId) {
            $medicine = Medicine::lockForUpdate()->find($medicineId);
            
            if (!$medicine) {
                throw new \Exception("Medicine not found with ID: {$medicineId}");
            }
            
            $previousStock = $medicine->stock_quantity;
            $quantity = abs($newQuantity - $previousStock);
            $type = $newQuantity > $previousStock ? 'in' : 'out';
            
            // Update medicine stock
            $medicine->update([
                'stock_quantity' => $newQuantity,
            ]);
            
            // Record stock movement
            $this->recordStockMovement(
                $medicineId,
                $type,
                $quantity,
                $previousStock,
                $newQuantity,
                'adjustment',
                $referenceId,
                $reason
            );
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Stock Adjustment',
                'Inventory',
                "Adjusted stock of {$medicine->name} from {$previousStock} to {$newQuantity}. Reason: {$reason}",
                'warning'
            );
            
            return true;
        });
    }

    /**
     * Add stock for a medicine (e.g., receiving a purchase order).
     *
     * @param int $medicineId
     * @param int $quantity
     * @param string $reason
     * @param int|null $referenceId
     * @return bool
     * @throws \Exception
     */
    public function addStock(int $medicineId, int $quantity, string $reason, ?int $referenceId = null): bool
    {
        return DB::transaction(function () use ($medicineId, $quantity, $reason, $referenceId) {
            $medicine = Medicine::lockForUpdate()->find($medicineId);
            
            if (!$medicine) {
                throw new \Exception("Medicine not found with ID: {$medicineId}");
            }
            
            $previousStock = $medicine->stock_quantity;
            $newStock = $previousStock + $quantity;
            
            // Update medicine stock
            $medicine->update([
                'stock_quantity' => $newStock,
            ]);
            
            // Record stock movement
            $this->recordStockMovement(
                $medicineId,
                'in',
                $quantity,
                $previousStock,
                $newStock,
                'purchase',
                $referenceId,
                $reason
            );
            
            // Log the activity
            $this->auditLogService->logActivity(
                'Stock Addition',
                'Inventory',
                "Added {$quantity} units of {$medicine->name}. Reason: {$reason}",
                'info'
            );
            
            return true;
        });
    }

    /**
     * Record a stock movement.
     *
     * @param int $medicineId
     * @param string $type
     * @param int $quantity
     * @param int $previousStock
     * @param int $newStock
     * @param string $referenceType
     * @param int|null $referenceId
     * @param string|null $notes
     * @return StockMovement
     */
    protected function recordStockMovement(
        int $medicineId,
        string $type,
        int $quantity,
        int $previousStock,
        int $newStock,
        string $referenceType,
        ?int $referenceId = null,
        ?string $notes = null
    ): StockMovement {
        return StockMovement::create([
            'medicine_id' => $medicineId,
            'type' => $type,
            'quantity' => $quantity,
            'previous_stock' => $previousStock,
            'new_stock' => $newStock,
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'notes' => $notes,
            'user_id' => auth()->id(),
        ]);
    }

    /**
     * Get stock movement history for a medicine.
     *
     * @param int $medicineId
     * @param int $limit
     * @return array
     */
    public function getStockHistory(int $medicineId, int $limit = 50): array
    {
        return StockMovement::where('medicine_id', $medicineId)
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get()
            ->toArray();
    }

    /**
     * Get low stock medicines.
     *
     * @return array
     */
    public function getLowStockMedicines(): array
    {
        return Medicine::whereColumn('stock_quantity', '<=', 'reorder_level')
            ->where('stock_quantity', '>', 0)
            ->with('category')
            ->get()
            ->toArray();
    }

    /**
     * Get out of stock medicines.
     *
     * @return array
     */
    public function getOutOfStockMedicines(): array
    {
        return Medicine::where('stock_quantity', '<=', 0)
            ->with('category')
            ->get()
            ->toArray();
    }

    /**
     * Check if stock is low for a medicine.
     *
     * @param int $medicineId
     * @return bool
     */
    public function isStockLow(int $medicineId): bool
    {
        $medicine = Medicine::find($medicineId);
        
        if (!$medicine) {
            return false;
        }
        
        return $medicine->stock_quantity <= $medicine->reorder_level;
    }

    /**
     * Calculate suggested reorder quantity based on sales velocity.
     *
     * @param int $medicineId
     * @param int $daysToAnalyze Number of days to analyze for sales velocity
     * @return array
     */
    public function calculateReorderQuantity(int $medicineId, int $daysToAnalyze = 30): array
    {
        $medicine = Medicine::findOrFail($medicineId);
        
        // Calculate average daily sales
        $totalSold = \App\Models\SalesItem::where('medicine_id', $medicineId)
            ->whereHas('sale', function ($q) use ($daysToAnalyze) {
                $q->where('created_at', '>=', now()->subDays($daysToAnalyze))
                  ->where('status', 'completed');
            })
            ->sum('quantity');
        
        $avgDailySales = $totalSold / max($daysToAnalyze, 1);
        
        // Lead time (days to receive new stock) - configurable
        $leadTime = config('pharmacy.lead_time_days', 7);
        
        // Safety stock (buffer for variability) - 3 days of average sales
        $safetyStock = ceil($avgDailySales * 3);
        
        // Reorder point = (avg daily sales * lead time) + safety stock
        $reorderPoint = ceil(($avgDailySales * $leadTime) + $safetyStock);
        
        // Suggested order quantity (EOQ - Economic Order Quantity simplified)
        // Order enough for 30 days of supply
        $suggestedOrderQty = ceil($avgDailySales * 30);
        
        // Days of stock remaining
        $daysOfStockRemaining = $avgDailySales > 0 
            ? floor($medicine->stock_quantity / $avgDailySales) 
            : PHP_INT_MAX;
        
        // Calculate sales trend (comparing recent vs previous period)
        $recentSales = \App\Models\SalesItem::where('medicine_id', $medicineId)
            ->whereHas('sale', function ($q) {
                $q->where('created_at', '>=', now()->subDays(15))
                  ->where('status', 'completed');
            })
            ->sum('quantity');
        
        $previousSales = \App\Models\SalesItem::where('medicine_id', $medicineId)
            ->whereHas('sale', function ($q) {
                $q->where('created_at', '>=', now()->subDays(30))
                  ->where('created_at', '<', now()->subDays(15))
                  ->where('status', 'completed');
            })
            ->sum('quantity');
        
        $salesTrend = 'stable';
        if ($recentSales > $previousSales * 1.2) {
            $salesTrend = 'increasing';
        } elseif ($recentSales < $previousSales * 0.8) {
            $salesTrend = 'decreasing';
        }
        
        return [
            'medicine_id' => $medicineId,
            'medicine_name' => $medicine->name,
            'current_stock' => $medicine->stock_quantity,
            'reorder_level' => $medicine->reorder_level,
            'avg_daily_sales' => round($avgDailySales, 2),
            'total_sold_period' => $totalSold,
            'days_analyzed' => $daysToAnalyze,
            'lead_time_days' => $leadTime,
            'safety_stock' => $safetyStock,
            'reorder_point' => $reorderPoint,
            'suggested_order_quantity' => max($suggestedOrderQty, $medicine->reorder_level),
            'days_of_stock_remaining' => $daysOfStockRemaining,
            'needs_reorder' => $medicine->stock_quantity <= $reorderPoint,
            'urgency' => $this->calculateReorderUrgency($medicine->stock_quantity, $daysOfStockRemaining),
            'sales_trend' => $salesTrend,
            'potential_stockout_date' => $avgDailySales > 0 
                ? now()->addDays($daysOfStockRemaining)->format('Y-m-d')
                : null,
        ];
    }

    /**
     * Calculate reorder urgency level.
     *
     * @param int $currentStock
     * @param int $daysRemaining
     * @return string
     */
    protected function calculateReorderUrgency(int $currentStock, int $daysRemaining): string
    {
        if ($currentStock <= 0) {
            return 'critical';
        }
        if ($daysRemaining <= 3) {
            return 'critical';
        }
        if ($daysRemaining <= 7) {
            return 'high';
        }
        if ($daysRemaining <= 14) {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Get reorder suggestions for all medicines that need reordering.
     *
     * @return array
     */
    public function getReorderSuggestions(): array
    {
        $suggestions = [];
        
        // Get all medicines that are low stock or out of stock
        $medicines = Medicine::where('stock_quantity', '<=', DB::raw('reorder_level'))
            ->orWhere('stock_quantity', '<=', 0)
            ->pluck('id');
        
        foreach ($medicines as $medicineId) {
            $suggestions[] = $this->calculateReorderQuantity($medicineId);
        }
        
        // Sort by urgency
        usort($suggestions, function ($a, $b) {
            $urgencyOrder = ['critical' => 0, 'high' => 1, 'medium' => 2, 'low' => 3];
            return ($urgencyOrder[$a['urgency']] ?? 4) <=> ($urgencyOrder[$b['urgency']] ?? 4);
        });
        
        return $suggestions;
    }

    /**
     * Get inventory valuation summary.
     *
     * @return array
     */
    public function getInventoryValuation(): array
    {
        $medicines = Medicine::with('category')->get();
        
        $totalCostValue = 0;
        $totalSaleValue = 0;
        $totalItems = $medicines->count();
        $totalUnits = 0;
        $categoryBreakdown = [];
        
        foreach ($medicines as $medicine) {
            $costValue = $medicine->stock_quantity * ($medicine->cost_price ?? 0);
            $saleValue = $medicine->stock_quantity * ($medicine->sale_price ?? 0);
            
            $totalCostValue += $costValue;
            $totalSaleValue += $saleValue;
            $totalUnits += $medicine->stock_quantity;
            
            // Category breakdown
            $categoryName = $medicine->category->name ?? 'Uncategorized';
            if (!isset($categoryBreakdown[$categoryName])) {
                $categoryBreakdown[$categoryName] = [
                    'category' => $categoryName,
                    'item_count' => 0,
                    'total_units' => 0,
                    'cost_value' => 0,
                    'sale_value' => 0,
                ];
            }
            $categoryBreakdown[$categoryName]['item_count']++;
            $categoryBreakdown[$categoryName]['total_units'] += $medicine->stock_quantity;
            $categoryBreakdown[$categoryName]['cost_value'] += $costValue;
            $categoryBreakdown[$categoryName]['sale_value'] += $saleValue;
        }
        
        return [
            'total_items' => $totalItems,
            'total_units' => $totalUnits,
            'total_cost_value' => round($totalCostValue, 2),
            'total_sale_value' => round($totalSaleValue, 2),
            'potential_profit' => round($totalSaleValue - $totalCostValue, 2),
            'average_unit_cost' => $totalUnits > 0 ? round($totalCostValue / $totalUnits, 2) : 0,
            'category_breakdown' => array_values($categoryBreakdown),
        ];
    }
}
