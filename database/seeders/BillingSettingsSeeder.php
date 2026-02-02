<?php

namespace Database\Seeders;

use App\Models\BillingSetting;
use Illuminate\Database\Seeder;

class BillingSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            // General Settings
            [
                'setting_key' => 'currency',
                'setting_value' => 'USD',
                'data_type' => 'string',
                'group' => 'general',
                'label' => 'Currency',
                'description' => 'Default currency for billing',
                'input_type' => 'select',
                'options' => json_encode(['USD', 'EUR', 'GBP', 'AFN', 'PKR', 'INR']),
            ],
            [
                'setting_key' => 'currency_symbol',
                'setting_value' => '$',
                'data_type' => 'string',
                'group' => 'general',
                'label' => 'Currency Symbol',
                'description' => 'Symbol to display for currency',
                'input_type' => 'text',
                'options' => null,
            ],
            [
                'setting_key' => 'tax_rate',
                'setting_value' => '0',
                'data_type' => 'float',
                'group' => 'general',
                'label' => 'Default Tax Rate (%)',
                'description' => 'Default tax rate applied to bills',
                'input_type' => 'number',
                'options' => null,
            ],
            [
                'setting_key' => 'enable_discounts',
                'setting_value' => '1',
                'data_type' => 'boolean',
                'group' => 'general',
                'label' => 'Enable Discounts',
                'description' => 'Allow discounts on bills',
                'input_type' => 'checkbox',
                'options' => null,
            ],
            
            // Payment Settings
            [
                'setting_key' => 'payment_due_days',
                'setting_value' => '30',
                'data_type' => 'integer',
                'group' => 'payment',
                'label' => 'Payment Due Days',
                'description' => 'Number of days until payment is due',
                'input_type' => 'number',
                'options' => null,
            ],
            [
                'setting_key' => 'enable_partial_payments',
                'setting_value' => '1',
                'data_type' => 'boolean',
                'group' => 'payment',
                'label' => 'Enable Partial Payments',
                'description' => 'Allow patients to make partial payments',
                'input_type' => 'checkbox',
                'options' => null,
            ],
            [
                'setting_key' => 'minimum_payment_amount',
                'setting_value' => '10',
                'data_type' => 'float',
                'group' => 'payment',
                'label' => 'Minimum Payment Amount',
                'description' => 'Minimum amount required for a payment',
                'input_type' => 'number',
                'options' => null,
            ],
            [
                'setting_key' => 'accepted_payment_methods',
                'setting_value' => json_encode(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'insurance']),
                'data_type' => 'json',
                'group' => 'payment',
                'label' => 'Accepted Payment Methods',
                'description' => 'Payment methods accepted by the system',
                'input_type' => 'multiselect',
                'options' => json_encode(['cash', 'credit_card', 'debit_card', 'check', 'bank_transfer', 'insurance', 'online']),
            ],
            
            // Invoice Settings
            [
                'setting_key' => 'invoice_prefix',
                'setting_value' => 'INV',
                'data_type' => 'string',
                'group' => 'invoice',
                'label' => 'Invoice Number Prefix',
                'description' => 'Prefix for invoice numbers',
                'input_type' => 'text',
                'options' => null,
            ],
            [
                'setting_key' => 'invoice_footer_text',
                'setting_value' => 'Thank you for choosing our healthcare services. For any questions regarding this invoice, please contact our billing department.',
                'data_type' => 'string',
                'group' => 'invoice',
                'label' => 'Invoice Footer Text',
                'description' => 'Text displayed at the bottom of invoices',
                'input_type' => 'textarea',
                'options' => null,
            ],
            [
                'setting_key' => 'show_logo_on_invoice',
                'setting_value' => '1',
                'data_type' => 'boolean',
                'group' => 'invoice',
                'label' => 'Show Logo on Invoice',
                'description' => 'Display hospital logo on invoices',
                'input_type' => 'checkbox',
                'options' => null,
            ],
            [
                'setting_key' => 'auto_generate_invoice',
                'setting_value' => '1',
                'data_type' => 'boolean',
                'group' => 'invoice',
                'label' => 'Auto-generate Invoice',
                'description' => 'Automatically generate invoices when bills are created',
                'input_type' => 'checkbox',
                'options' => null,
            ],
            
            // Hospital Information (for invoices)
            [
                'setting_key' => 'hospital_name',
                'setting_value' => 'Hospital Management System',
                'data_type' => 'string',
                'group' => 'general',
                'label' => 'Hospital Name',
                'description' => 'Name displayed on invoices and bills',
                'input_type' => 'text',
                'options' => null,
            ],
            [
                'setting_key' => 'hospital_address',
                'setting_value' => '123 Medical Center Drive, Healthcare City, HC 12345',
                'data_type' => 'string',
                'group' => 'general',
                'label' => 'Hospital Address',
                'description' => 'Address displayed on invoices',
                'input_type' => 'textarea',
                'options' => null,
            ],
            [
                'setting_key' => 'hospital_phone',
                'setting_value' => '+1 (555) 123-4567',
                'data_type' => 'string',
                'group' => 'general',
                'label' => 'Hospital Phone',
                'description' => 'Contact phone number displayed on invoices',
                'input_type' => 'text',
                'options' => null,
            ],
            [
                'setting_key' => 'hospital_email',
                'setting_value' => 'billing@hospital.com',
                'data_type' => 'string',
                'group' => 'general',
                'label' => 'Hospital Email',
                'description' => 'Contact email displayed on invoices',
                'input_type' => 'email',
                'options' => null,
            ],
            [
                'setting_key' => 'hospital_tax_id',
                'setting_value' => 'TAX-123456789',
                'data_type' => 'string',
                'group' => 'general',
                'label' => 'Hospital Tax ID',
                'description' => 'Tax identification number for invoices',
                'input_type' => 'text',
                'options' => null,
            ],
            
            // Insurance Settings
            [
                'setting_key' => 'enable_insurance',
                'setting_value' => '1',
                'data_type' => 'boolean',
                'group' => 'insurance',
                'label' => 'Enable Insurance Billing',
                'description' => 'Allow insurance billing functionality',
                'input_type' => 'checkbox',
                'options' => null,
            ],
            [
                'setting_key' => 'auto_submit_claims',
                'setting_value' => '0',
                'data_type' => 'boolean',
                'group' => 'insurance',
                'label' => 'Auto-submit Claims',
                'description' => 'Automatically submit insurance claims',
                'input_type' => 'checkbox',
                'options' => null,
            ],
            [
                'setting_key' => 'default_claim_submission_delay',
                'setting_value' => '7',
                'data_type' => 'integer',
                'group' => 'insurance',
                'label' => 'Default Claim Submission Delay (days)',
                'description' => 'Days to wait before submitting insurance claims',
                'input_type' => 'number',
                'options' => null,
            ],
            [
                'setting_key' => 'insurance_billing_code_format',
                'setting_value' => 'ICD-10',
                'data_type' => 'string',
                'group' => 'insurance',
                'label' => 'Insurance Billing Code Format',
                'description' => 'Format for insurance billing codes',
                'input_type' => 'select',
                'options' => json_encode(['ICD-10', 'ICD-9', 'CPT']),
            ],
            
            // Notification Settings
            [
                'setting_key' => 'send_payment_reminders',
                'setting_value' => '1',
                'data_type' => 'boolean',
                'group' => 'notifications',
                'label' => 'Send Payment Reminders',
                'description' => 'Send automatic payment reminders',
                'input_type' => 'checkbox',
                'options' => null,
            ],
            [
                'setting_key' => 'reminder_days_before_due',
                'setting_value' => '3',
                'data_type' => 'integer',
                'group' => 'notifications',
                'label' => 'Reminder Days Before Due',
                'description' => 'Days before due date to send reminders',
                'input_type' => 'number',
                'options' => null,
            ],
            [
                'setting_key' => 'send_overdue_notifications',
                'setting_value' => '1',
                'data_type' => 'boolean',
                'group' => 'notifications',
                'label' => 'Send Overdue Notifications',
                'description' => 'Send notifications for overdue bills',
                'input_type' => 'checkbox',
                'options' => null,
            ],
            [
                'setting_key' => 'overdue_reminder_frequency',
                'setting_value' => 'weekly',
                'data_type' => 'string',
                'group' => 'notifications',
                'label' => 'Overdue Reminder Frequency',
                'description' => 'How often to send overdue reminders',
                'input_type' => 'select',
                'options' => json_encode(['daily', 'weekly', 'biweekly', 'monthly']),
            ],
            
            // Late Fee Settings
            [
                'setting_key' => 'enable_late_fees',
                'setting_value' => '0',
                'data_type' => 'boolean',
                'group' => 'payment',
                'label' => 'Enable Late Fees',
                'description' => 'Charge late fees on overdue bills',
                'input_type' => 'checkbox',
                'options' => null,
            ],
            [
                'setting_key' => 'late_fee_percentage',
                'setting_value' => '1.5',
                'data_type' => 'float',
                'group' => 'payment',
                'label' => 'Late Fee Percentage (%)',
                'description' => 'Percentage charged as late fee',
                'input_type' => 'number',
                'options' => null,
            ],
            [
                'setting_key' => 'late_fee_grace_period',
                'setting_value' => '7',
                'data_type' => 'integer',
                'group' => 'payment',
                'label' => 'Late Fee Grace Period (days)',
                'description' => 'Days after due date before late fees apply',
                'input_type' => 'number',
                'options' => null,
            ],
        ];

        foreach ($settings as $setting) {
            BillingSetting::firstOrCreate(
                ['setting_key' => $setting['setting_key']],
                $setting
            );
        }

        $this->command->info('Billing settings seeded successfully.');
    }
}
