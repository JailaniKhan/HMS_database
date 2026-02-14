<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class DiagnoseEncryptionIssue extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'diagnose:encryption';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Diagnose encryption issues with patient data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Encryption Diagnostic Report ===');
        $this->newLine();

        // Check APP_KEY
        $appKey = config('app.key');
        $this->info('1. APP_KEY Check:');
        $this->line('   APP_KEY is set: ' . (!empty($appKey) ? 'YES' : 'NO'));
        $this->line('   APP_KEY format: ' . (str_starts_with($appKey, 'base64:') ? 'VALID (base64 encoded)' : 'INVALID FORMAT'));
        $this->newLine();

        // Check patients table structure
        $this->info('2. Database Table Structure:');
        $columns = DB::select("SHOW COLUMNS FROM patients");
        $encryptedColumns = ['phone', 'allergies', 'medical_history', 'emergency_contact_phone'];
        
        foreach ($columns as $column) {
            if (in_array($column->Field, $encryptedColumns)) {
                $this->line("   - {$column->Field}: {$column->Type} (Model has 'encrypted' cast)");
            }
        }
        $this->newLine();

        // Check actual data in patients table
        $this->info('3. Patient Data Analysis:');
        $patients = DB::table('patients')->limit(5)->get();
        
        if ($patients->isEmpty()) {
            $this->warn('   No patients found in database.');
            return;
        }

        $this->info('   Analyzing first ' . $patients->count() . ' patients:');
        $this->newLine();

        foreach ($patients as $patient) {
            $this->line("   Patient ID: {$patient->patient_id}");
            
            // Check phone field
            $this->analyzeField('phone', $patient->phone ?? null);
            
            // Check allergies field
            $this->analyzeField('allergies', $patient->allergies ?? null);
            
            // Check medical_history field
            $this->analyzeField('medical_history', $patient->medical_history ?? null);
            
            // Check emergency_contact_phone field
            $this->analyzeField('emergency_contact_phone', $patient->emergency_contact_phone ?? null);
            
            $this->newLine();
        }

        // Summary
        $this->info('4. Diagnosis Summary:');
        $this->line('   If any field shows as "PLAIN TEXT" but has encrypted cast,');
        $this->line('   this is the cause of the "MAC is invalid" error.');
        $this->newLine();
        
        $this->info('5. Possible Solutions:');
        $this->line('   a) If APP_KEY was changed: Restore old APP_KEY or re-encrypt all data');
        $this->line('   b) If data is plain text: Remove encrypted cast from model OR encrypt existing data');
        $this->line('   c) If columns are NULL: Ensure encrypted cast handles NULL properly');
        
        return 0;
    }

    /**
     * Analyze a field to determine if it's encrypted or plain text.
     */
    private function analyzeField(string $fieldName, ?string $value): void
    {
        $this->line("   - {$fieldName}:");
        
        if ($value === null) {
            $this->line('     Status: NULL (no data)');
            return;
        }

        // Check if it looks like encrypted data (JSON with 'iv', 'value', 'mac', 'tag')
        $decoded = json_decode(base64_decode($value), true);
        
        if (is_array($decoded) && isset($decoded['iv']) && isset($decoded['value']) && isset($decoded['mac'])) {
            $this->line('     Status: ENCRYPTED (valid Laravel encryption format)');
            
            // Try to decrypt
            try {
                $decrypted = Crypt::decryptString($value);
                $this->line("     Decrypted value: {$decrypted}");
            } catch (\Exception $e) {
                $this->error("     Decryption FAILED: " . $e->getMessage());
            }
        } else {
            $this->warn('     Status: PLAIN TEXT (not encrypted!)');
            $this->line("     Raw value: {$value}");
            $this->warn('     >>> THIS IS THE PROBLEM: Model expects encrypted data but found plain text!');
        }
    }
}