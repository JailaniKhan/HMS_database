<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\MedicineCategory;
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
        'price',
        'quantity',
        'stock_quantity',
        'reorder_level',
        'expiry_date',
        'batch_number',
        'status',
        'side_effects',
        'instructions',
        'category_id',
        'unit',
    ];

    protected $casts = [
        'cost_price' => 'decimal:2',
        'sale_price' => 'decimal:2',
        'unit_price' => 'decimal:2',
        'price' => 'decimal:2',
        'quantity' => 'integer',
        'stock_quantity' => 'integer',
        'reorder_level' => 'integer',
        'expiry_date' => 'date',
    ];

    protected $appends = ['dosage_form'];

    public function category()
    {
        return $this->belongsTo(MedicineCategory::class, 'category_id');
    }

    public function salesItems()
    {
        return $this->hasMany(SalesItem::class);
    }

    public function alerts()
    {
        return $this->hasMany(MedicineAlert::class);
    }

    /**
     * Get the dosage form attribute.
     * Maps the 'form' database column to 'dosage_form' for API/frontend compatibility.
     */
    public function getDosageFormAttribute(): ?string
    {
        return $this->attributes['form'] ?? null;
    }

    /**
     * Set the dosage form attribute.
     * Maps 'dosage_form' to the 'form' database column.
     */
    public function setDosageFormAttribute(?string $value): void
    {
        $this->attributes['form'] = $value;
    }
}
