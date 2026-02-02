<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;

class InsuranceProvider extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'description',
        'phone',
        'email',
        'website',
        'address',
        'coverage_types',
        'max_coverage_amount',
        'api_endpoint',
        'api_key',
        'is_active',
    ];

    protected $casts = [
        'address' => 'array',
        'coverage_types' => 'array',
        'max_coverage_amount' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    /**
     * Relationships
     */
    public function patientInsurances()
    {
        return $this->hasMany(PatientInsurance::class);
    }

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    public function scopeByCode($query, string $code)
    {
        return $query->where('code', $code);
    }

    public function scopeSearchByName($query, string $name)
    {
        return $query->where('name', 'like', "%{$name}%");
    }

    public function scopeHasCoverageType($query, string $type)
    {
        return $query->whereJsonContains('coverage_types', $type);
    }

    /**
     * Accessors
     */
    public function getIsActiveAttribute($value): bool
    {
        return (bool) $value;
    }

    public function getCoverageTypesLabelAttribute(): array
    {
        $labels = [
            'inpatient' => 'Inpatient',
            'outpatient' => 'Outpatient',
            'pharmacy' => 'Pharmacy',
            'lab' => 'Laboratory',
            'emergency' => 'Emergency',
            'dental' => 'Dental',
            'vision' => 'Vision',
        ];

        $types = $this->coverage_types ?? [];
        return array_map(function ($type) use ($labels) {
            return $labels[$type] ?? ucfirst($type);
        }, $types);
    }

    public function getHasApiIntegrationAttribute(): bool
    {
        return !empty($this->api_endpoint);
    }

    /**
     * Check if provider covers specific type
     */
    public function covers(string $type): bool
    {
        $types = $this->coverage_types ?? [];
        return in_array($type, $types);
    }

    /**
     * Get active patient insurance count
     */
    public function getActivePoliciesCountAttribute(): int
    {
        return $this->patientInsurances()
                    ->where('is_active', true)
                    ->where(function ($query) {
                        $query->whereNull('coverage_end_date')
                              ->orWhere('coverage_end_date', '>=', now());
                    })
                    ->count();
    }

    /**
     * Boot method
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($provider) {
            if (empty($provider->code)) {
                $provider->code = self::generateCode($provider->name);
            }
        });
    }

    /**
     * Generate unique code from name
     */
    public static function generateCode(string $name): string
    {
        $baseCode = strtoupper(substr(preg_replace('/[^a-zA-Z0-9]/', '', $name), 0, 6));
        $code = $baseCode;
        $counter = 1;

        while (self::where('code', $code)->exists()) {
            $code = $baseCode . $counter;
            $counter++;
        }

        return $code;
    }
}
