<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class BillStatusHistory extends Model
{
    use HasFactory;

    protected $table = 'bill_status_history';

    public $timestamps = false;

    protected $fillable = [
        'bill_id',
        'status_from',
        'status_to',
        'field_name',
        'changed_by',
        'reason',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function bill()
    {
        return $this->belongsTo(Bill::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(User::class, 'changed_by');
    }

    /**
     * Scopes
     */
    public function scopeByBill($query, int $billId)
    {
        return $query->where('bill_id', $billId);
    }

    public function scopeByField($query, string $fieldName)
    {
        return $query->where('field_name', $fieldName);
    }

    public function scopeByStatusChange($query, string $from, string $to)
    {
        return $query->where('status_from', $from)
                     ->where('status_to', $to);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('changed_by', $userId);
    }

    public function scopeLatestFirst($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    public function scopePaymentStatusChanges($query)
    {
        return $query->where('field_name', 'payment_status');
    }

    public function scopeStatusChanges($query)
    {
        return $query->where('field_name', 'status');
    }

    /**
     * Accessors
     */
    public function getChangeDescriptionAttribute(): string
    {
        $from = $this->status_from ?? 'null';
        $to = $this->status_to;
        $field = str_replace('_', ' ', $this->field_name);
        
        return "{$field} changed from '{$from}' to '{$to}'";
    }

    public function getHasReasonAttribute(): bool
    {
        return !empty($this->reason);
    }

    public function getHasMetadataAttribute(): bool
    {
        return !empty($this->metadata);
    }

    public function getChangedByNameAttribute(): string
    {
        return $this->changedBy?->name ?? 'System';
    }

    public function getTimeAgoAttribute(): string
    {
        return $this->created_at?->diffForHumans() ?? 'Unknown';
    }

    /**
     * Get the previous status history entry for the same bill
     */
    public function getPreviousEntryAttribute()
    {
        return static::where('bill_id', $this->bill_id)
                     ->where('created_at', '<', $this->created_at)
                     ->orderBy('created_at', 'desc')
                     ->first();
    }

    /**
     * Get the next status history entry for the same bill
     */
    public function getNextEntryAttribute()
    {
        return static::where('bill_id', $this->bill_id)
                     ->where('created_at', '>', $this->created_at)
                     ->orderBy('created_at', 'asc')
                     ->first();
    }

    /**
     * Check if this was a significant status change
     */
    public function getIsSignificantChangeAttribute(): bool
    {
        $significantChanges = [
            'payment_status' => [
                ['from' => 'pending', 'to' => 'paid'],
                ['from' => 'pending', 'to' => 'partial'],
                ['from' => 'partial', 'to' => 'paid'],
                ['from' => 'paid', 'to' => 'refunded'],
            ],
            'status' => [
                ['from' => 'active', 'to' => 'voided'],
                ['from' => 'draft', 'to' => 'finalized'],
            ],
        ];

        if (!isset($significantChanges[$this->field_name])) {
            return false;
        }

        foreach ($significantChanges[$this->field_name] as $change) {
            if ($this->status_from === $change['from'] && $this->status_to === $change['to']) {
                return true;
            }
        }

        return false;
    }

    /**
     * Create a new history entry
     */
    public static function log(
        int $billId,
        string $fieldName,
        $statusFrom,
        $statusTo,
        ?int $changedBy = null,
        ?string $reason = null,
        ?array $metadata = null
    ): self {
        return static::create([
            'bill_id' => $billId,
            'field_name' => $fieldName,
            'status_from' => $statusFrom,
            'status_to' => $statusTo,
            'changed_by' => $changedBy ?? auth()->id(),
            'reason' => $reason,
            'metadata' => $metadata,
            'created_at' => now(),
        ]);
    }
}
