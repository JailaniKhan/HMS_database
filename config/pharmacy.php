<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Pharmacy Module Configuration
    |--------------------------------------------------------------------------
    |
    | This file contains configuration options for the pharmacy module.
    | These values can be overridden via environment variables.
    |
    */

    /*
    |--------------------------------------------------------------------------
    | Low Stock Threshold
    |--------------------------------------------------------------------------
    |
    | The default threshold below which a medicine is considered low stock.
    | This can be overridden per medicine via the reorder_level field.
    |
    */
    'low_stock_threshold' => env('PHARMACY_LOW_STOCK_THRESHOLD', 10),

    /*
    |--------------------------------------------------------------------------
    | Critical Stock Percentage
    |--------------------------------------------------------------------------
    |
    | The percentage of reorder level below which stock is considered critical.
    | For example, if reorder_level is 10 and critical_percentage is 50,
    | stock below 5 would be considered critical.
    |
    */
    'critical_stock_percentage' => env('PHARMACY_CRITICAL_STOCK_PERCENTAGE', 50),

    /*
    |--------------------------------------------------------------------------
    | Expiry Warning Days
    |--------------------------------------------------------------------------
    |
    | Number of days before expiry to start showing warnings.
    | Medicines expiring within this period will be flagged.
    |
    */
    'expiry_warning_days' => env('PHARMACY_EXPIRY_WARNING_DAYS', 30),

    /*
    |--------------------------------------------------------------------------
    | Expiry Critical Days
    |--------------------------------------------------------------------------
    |
    | Number of days before expiry to show critical alerts.
    | Medicines expiring within this period will be marked as critical.
    |
    */
    'expiry_critical_days' => env('PHARMACY_EXPIRY_CRITICAL_DAYS', 7),

    /*
    |--------------------------------------------------------------------------
    | Tax Rate
    |--------------------------------------------------------------------------
    |
    | Default tax rate for pharmacy sales (percentage).
    | Set to 0 if no tax applies.
    |
    */
    'tax_rate' => env('PHARMACY_TAX_RATE', 0),

    /*
    |--------------------------------------------------------------------------
    | Invoice Prefix
    |--------------------------------------------------------------------------
    |
    | Prefix for pharmacy sale invoice numbers.
    |
    */
    'invoice_prefix' => env('PHARMACY_INVOICE_PREFIX', 'INV'),

    /*
    |--------------------------------------------------------------------------
    | Pharmacy Information
    |--------------------------------------------------------------------------
    |
    | Basic pharmacy information used for receipts and reports.
    |
    */
    'name' => env('PHARMACY_NAME', 'Hospital Pharmacy'),
    'address' => env('PHARMACY_ADDRESS', '123 Medical Center Drive'),
    'phone' => env('PHARMACY_PHONE', '+1 (555) 123-4567'),
    'email' => env('PHARMACY_EMAIL', 'pharmacy@hospital.com'),
    'license' => env('PHARMACY_LICENSE', ''),

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    |
    | Number of items per page for pharmacy listings.
    |
    */
    'pagination_per_page' => env('PHARMACY_PAGINATION_PER_PAGE', 15),

    /*
    |--------------------------------------------------------------------------
    | Alert Settings
    |--------------------------------------------------------------------------
    |
    | Settings for automatic alert generation.
    |
    */
    'alerts' => [
        'enabled' => env('PHARMACY_ALERTS_ENABLED', true),
        'low_stock_check' => env('PHARMACY_ALERTS_LOW_STOCK', true),
        'expiry_check' => env('PHARMACY_ALERTS_EXPIRY', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Currency Settings
    |--------------------------------------------------------------------------
    |
    | Default currency for pharmacy transactions.
    |
    */
    'currency' => env('PHARMACY_CURRENCY', 'AFN'),
    'currency_locale' => env('PHARMACY_CURRENCY_LOCALE', 'en-US'),

    /*
    |--------------------------------------------------------------------------
    | Receipt Settings
    |--------------------------------------------------------------------------
    |
    | Settings for receipt generation and printing.
    |
    */
    'receipt' => [
        'show_logo' => env('PHARMACY_RECEIPT_SHOW_LOGO', true),
        'show_tax_breakdown' => env('PHARMACY_RECEIPT_SHOW_TAX', true),
        'footer_message' => env('PHARMACY_RECEIPT_FOOTER', 'Thank you for your purchase!'),
        'paper_size' => env('PHARMACY_RECEIPT_PAPER_SIZE', 'A4'),
    ],

    /*
    |--------------------------------------------------------------------------
    | Stock Settings
    |--------------------------------------------------------------------------
    |
    | Settings for stock management.
    |
    */
    'stock' => [
        'allow_negative' => env('PHARMACY_ALLOW_NEGATIVE_STOCK', false),
        'auto_reorder_alert' => env('PHARMACY_AUTO_REORDER_ALERT', true),
        'track_movements' => env('PHARMACY_TRACK_MOVEMENTS', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Sales Settings
    |--------------------------------------------------------------------------
    |
    | Settings for sales processing.
    |
    */
    'sales' => [
        'max_discount_percentage' => env('PHARMACY_MAX_DISCOUNT_PERCENTAGE', 100),
        'require_patient_for_prescription' => env('PHARMACY_REQUIRE_PATIENT_PRESCRIPTION', true),
        'allow_walk_in_sales' => env('PHARMACY_ALLOW_WALK_IN', true),
    ],
];