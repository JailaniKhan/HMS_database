<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\MedicineCategory;
use App\Models\PurchaseOrderItem;
use App\Models\SalesItem;
use App\Models\MedicineAlert;

class Medicine extends Model
{
    protected $fillable = [
        'medicine_id',
        'medicine_code',
        'name',
        'description',
        'manufacturer',
        'chemical_name',
        'category',
        'form',
        'strength',
        'cost_price',
        'sale_price',
        'unit_price',
        'quantity',
        'stock_quantity',
        'reorder_level',
        'expiry_date',
        'batch_number',
        'status',
        'side_effects',
        'instructions',
        'category_id',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'expiry_date' => 'date',
    ];

    public function category()
    {
        return $this->belongsTo(MedicineCategory::class);
    }

    public function purchaseOrderItems()
    {
        return $this->hasMany(PurchaseOrderItem::class);
    }

    public function salesItems()
    {
        return $this->hasMany(SalesItem::class);
    }

    public function alerts()
    {
        return $this->hasMany(MedicineAlert::class);
    }
}
