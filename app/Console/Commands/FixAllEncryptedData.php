<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FixAllEncryptedData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'encryption:fix-all {--dry-run : Show what would be fixed without making changes}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Fix all encrypted data with APP_KEY mismatch issues across all models';

    /**
     * Model configurations: table => [encrypted fields]
     */
    protected array $modelConfigs = [
        'patients' => [
            'phone',
            'allergies',
            'medical_history',
            'emergency_contact_phone',
        ],
        'doctors' => [
            'phone_number',
        ],
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $this->info('=== Fixing All Encrypted Data ===');
        $this->newLine();

        if ($dryRun) {
            $this->warn('DRY RUN MODE - No changes will be made');
            $this->newLine();
        }

        $totalFixed = 0;

        foreach ($this->modelConfigs as $table => $encryptedFields) {
            $this->info("Processing table: {$table}");
            
            if (!Schema::hasTable($table)) {
                $this->warn("  Table '{$table}' does not exist. Skipping.");
                $this->newLine();
                continue;
            }

            $fixed = $this->fixTable($table, $encryptedFields, $dryRun);
            $totalFixed += $fixed;
            $this->newLine();
        }

        if ($dryRun) {
            $this->info("DRY RUN COMPLETE: {$totalFixed} records would be fixed.");
        } else {
            $this->info("COMPLETE: {$totalFixed} records fixed.");
        }

        return 0;
    }

    /**
     * Fix encrypted fields for a table.
     */
    private function fixTable(string $table, array $encryptedFields, bool $dryRun): int
    {
        // Get only the columns that exist in the table
        $existingColumns = collect($encryptedFields)
            ->filter(fn($field) => Schema::hasColumn($table, $field))
            ->values()
            ->toArray();

        if (empty($existingColumns)) {
            $this->line('  No encrypted columns found in table.');
            return 0;
        }

        $this->line('  Encrypted columns: ' . implode(', ', $existingColumns));

        // Get all records
        $records = DB::table($table)->get();
        $fixedCount = 0;

        if ($records->isEmpty()) {
            $this->line('  No records found.');
            return 0;
        }

        $this->info("  Checking {$records->count()} records...");

        foreach ($records as $record) {
            $fieldsToClear = [];
            $hasIssue = false;

            foreach ($existingColumns as $field) {
                $value = $record->$field ?? null;

                if ($value === null) {
                    continue;
                }

                // Check if it looks like encrypted data
                if ($this->isEncryptedData($value)) {
                    $fieldsToClear[$field] = null;
                    $hasIssue = true;
                    $this->warn("    Record ID {$record->id}: Field '{$field}' has encrypted data (APP_KEY mismatch)");
                }
            }

            if ($hasIssue && !$dryRun) {
                DB::table($table)
                    ->where('id', $record->id)
                    ->update($fieldsToClear);
                $fixedCount++;
            } elseif ($hasIssue && $dryRun) {
                $fixedCount++;
            }
        }

        if ($fixedCount > 0) {
            $action = $dryRun ? 'would be fixed' : 'fixed';
            $this->info("  {$fixedCount} records {$action}.");
        } else {
            $this->line('  No issues found.');
        }

        return $fixedCount;
    }

    /**
     * Check if a value looks like Laravel encrypted data.
     */
    private function isEncryptedData(?string $value): bool
    {
        if ($value === null) {
            return false;
        }

        $decoded = json_decode(base64_decode($value), true);

        return is_array($decoded) 
            && isset($decoded['iv']) 
            && isset($decoded['value']) 
            && isset($decoded['mac']);
    }
}