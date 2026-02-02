<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Facades\Cache;

class BillingSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'setting_key',
        'setting_value',
        'data_type',
        'group',
        'label',
        'description',
        'input_type',
        'options',
    ];

    protected $casts = [
        'options' => 'array',
    ];

    /**
     * Cache key for settings
     */
    private const CACHE_KEY = 'billing_settings';
    private const CACHE_TTL = 3600; // 1 hour

    /**
     * Boot method to clear cache on changes
     */
    protected static function boot(): void
    {
        parent::boot();

        static::saved(function () {
            Cache::forget(self::CACHE_KEY);
        });

        static::deleted(function () {
            Cache::forget(self::CACHE_KEY);
        });
    }

    /**
     * Scopes
     */
    public function scopeByGroup($query, string $group)
    {
        return $query->where('group', $group);
    }

    public function scopeByKey($query, string $key)
    {
        return $query->where('setting_key', $key);
    }

    public function scopeGeneral($query)
    {
        return $query->where('group', 'general');
    }

    public function scopePayment($query)
    {
        return $query->where('group', 'payment');
    }

    public function scopeInvoice($query)
    {
        return $query->where('group', 'invoice');
    }

    public function scopeInsurance($query)
    {
        return $query->where('group', 'insurance');
    }

    public function scopeNotifications($query)
    {
        return $query->where('group', 'notifications');
    }

    /**
     * Get all settings as a key-value array
     */
    public static function getAllSettings(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
            $settings = [];
            
            self::all()->each(function ($setting) use (&$settings) {
                $settings[$setting->setting_key] = $setting->getCastedValue();
            });
            
            return $settings;
        });
    }

    /**
     * Get a specific setting value
     */
    public static function get(string $key, $default = null)
    {
        $settings = self::getAllSettings();
        
        return $settings[$key] ?? $default;
    }

    /**
     * Set a specific setting value
     */
    public static function set(string $key, $value, ?string $group = null): self
    {
        $setting = self::firstOrNew(['setting_key' => $key]);
        
        $setting->setting_value = is_array($value) ? json_encode($value) : (string) $value;
        
        if ($group && !$setting->exists) {
            $setting->group = $group;
        }
        
        $setting->save();
        
        return $setting;
    }

    /**
     * Get casted value based on data_type
     */
    public function getCastedValue()
    {
        $value = $this->setting_value;
        
        switch ($this->data_type) {
            case 'integer':
                return (int) $value;
            case 'float':
            case 'decimal':
                return (float) $value;
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'json':
                return json_decode($value, true);
            case 'array':
                return explode(',', $value);
            default:
                return $value;
        }
    }

    /**
     * Set the value with proper type casting
     */
    public function setTypedValue($value): void
    {
        switch ($this->data_type) {
            case 'json':
                $this->setting_value = json_encode($value);
                break;
            case 'array':
                $this->setting_value = is_array($value) ? implode(',', $value) : $value;
                break;
            case 'boolean':
                $this->setting_value = $value ? '1' : '0';
                break;
            default:
                $this->setting_value = (string) $value;
        }
    }

    /**
     * Accessors
     */
    public function getValueAttribute()
    {
        return $this->getCastedValue();
    }

    public function getIsBooleanAttribute(): bool
    {
        return $this->data_type === 'boolean';
    }

    public function getIsNumericAttribute(): bool
    {
        return in_array($this->data_type, ['integer', 'float', 'decimal']);
    }

    public function getIsJsonAttribute(): bool
    {
        return $this->data_type === 'json';
    }

    public function getHasOptionsAttribute(): bool
    {
        return !empty($this->options) && $this->input_type === 'select';
    }

    /**
     * Get default settings for initial setup
     */
    public static function getDefaultSettings(): array
    {
        return [
            // General Settings
            ['key' => 'currency', 'value' => 'USD', 'type' => 'string', 'group' => 'general', 'label' => 'Currency', 'input' => 'text'],
            ['key' => 'currency_symbol', 'value' => '$', 'type' => 'string', 'group' => 'general', 'label' => 'Currency Symbol', 'input' => 'text'],
            ['key' => 'tax_rate', 'value' => '0', 'type' => 'float', 'group' => 'general', 'label' => 'Default Tax Rate (%)', 'input' => 'number'],
            ['key' => 'enable_discounts', 'value' => '1', 'type' => 'boolean', 'group' => 'general', 'label' => 'Enable Discounts', 'input' => 'checkbox'],
            
            // Payment Settings
            ['key' => 'payment_due_days', 'value' => '30', 'type' => 'integer', 'group' => 'payment', 'label' => 'Payment Due Days', 'input' => 'number'],
            ['key' => 'enable_partial_payments', 'value' => '1', 'type' => 'boolean', 'group' => 'payment', 'label' => 'Enable Partial Payments', 'input' => 'checkbox'],
            ['key' => 'minimum_payment_amount', 'value' => '10', 'type' => 'float', 'group' => 'payment', 'label' => 'Minimum Payment Amount', 'input' => 'number'],
            ['key' => 'accepted_payment_methods', 'value' => '["cash","card","bank_transfer"]', 'type' => 'json', 'group' => 'payment', 'label' => 'Accepted Payment Methods', 'input' => 'multiselect'],
            
            // Invoice Settings
            ['key' => 'invoice_prefix', 'value' => 'INV', 'type' => 'string', 'group' => 'invoice', 'label' => 'Invoice Number Prefix', 'input' => 'text'],
            ['key' => 'invoice_footer_text', 'value' => 'Thank you for your business!', 'type' => 'string', 'group' => 'invoice', 'label' => 'Invoice Footer Text', 'input' => 'textarea'],
            ['key' => 'show_logo_on_invoice', 'value' => '1', 'type' => 'boolean', 'group' => 'invoice', 'label' => 'Show Logo on Invoice', 'input' => 'checkbox'],
            
            // Insurance Settings
            ['key' => 'enable_insurance', 'value' => '1', 'type' => 'boolean', 'group' => 'insurance', 'label' => 'Enable Insurance Billing', 'input' => 'checkbox'],
            ['key' => 'auto_submit_claims', 'value' => '0', 'type' => 'boolean', 'group' => 'insurance', 'label' => 'Auto-submit Claims', 'input' => 'checkbox'],
            ['key' => 'default_claim_submission_delay', 'value' => '7', 'type' => 'integer', 'group' => 'insurance', 'label' => 'Default Claim Submission Delay (days)', 'input' => 'number'],
            
            // Notification Settings
            ['key' => 'send_payment_reminders', 'value' => '1', 'type' => 'boolean', 'group' => 'notifications', 'label' => 'Send Payment Reminders', 'input' => 'checkbox'],
            ['key' => 'reminder_days_before_due', 'value' => '3', 'type' => 'integer', 'group' => 'notifications', 'label' => 'Reminder Days Before Due', 'input' => 'number'],
            ['key' => 'send_overdue_notifications', 'value' => '1', 'type' => 'boolean', 'group' => 'notifications', 'label' => 'Send Overdue Notifications', 'input' => 'checkbox'],
        ];
    }

    /**
     * Initialize default settings
     */
    public static function initializeDefaults(): void
    {
        $defaults = self::getDefaultSettings();
        
        foreach ($defaults as $setting) {
            self::firstOrCreate(
                ['setting_key' => $setting['key']],
                [
                    'setting_value' => $setting['value'],
                    'data_type' => $setting['type'],
                    'group' => $setting['group'],
                    'label' => $setting['label'],
                    'input_type' => $setting['input'],
                ]
            );
        }
    }

    /**
     * Clear the settings cache
     */
    public static function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
