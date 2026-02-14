<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Patient;

class FixEncryptedPatientData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'patients:fix-encrypted-data {--patient_id= : Specific patient ID to fix} {--all : Fix all patients with encrypted data issues}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Clear encrypted fields for patients with APP_KEY mismatch issues';

    /**
     * The encrypted fields in the Patient model.
     */
    protected array $encryptedFields = [
        'phone',
        'allergies',
        'medical_history',
        'emergency_contact_phone',
    ];

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $patientId = $this->option('patient_id');
        $fixAll = $this->option('all');

        if ($patientId) {
            $this->fixSpecificPatient($patientId);
        } elseif ($fixAll) {
            $this->fixAllPatients();
        } else {
            $this->info('Please specify --patient_id=P00001 or --all');
            return 1;
        }

        return 0;
    }

    /**
     * Fix a specific patient by patient_id.
     */
    private function fixSpecificPatient(string $patientId): void
    {
        $patient = DB::table('patients')->where('patient_id', $patientId)->first();

        if (!$patient) {
            $this->error("Patient with ID '{$patientId}' not found.");
            return;
        }

        $this->info("Fixing patient: {$patientId}");
        $this->clearEncryptedFields($patient);
    }

    /**
     * Fix all patients with encrypted data.
     */
    private function fixAllPatients(): void
    {
        $patients = DB::table('patients')->get();

        if ($patients->isEmpty()) {
            $this->info('No patients found in database.');
            return;
        }

        $this->info("Found {$patients->count()} patients. Processing...");

        foreach ($patients as $patient) {
            $this->clearEncryptedFields($patient);
        }

        $this->info('All patients processed.');
    }

    /**
     * Clear encrypted fields for a patient.
     */
    private function clearEncryptedFields(object $patient): void
    {
        $fieldsToClear = [];
        $hadIssues = false;

        foreach ($this->encryptedFields as $field) {
            $value = $patient->$field ?? null;

            if ($value === null) {
                continue;
            }

            // Check if it looks like encrypted data
            $decoded = json_decode(base64_decode($value), true);

            if (is_array($decoded) && isset($decoded['iv']) && isset($decoded['value']) && isset($decoded['mac'])) {
                // This is encrypted data that may have APP_KEY mismatch
                $fieldsToClear[$field] = null;
                $hadIssues = true;
                $this->warn("  - Field '{$field}' contains encrypted data (will be cleared)");
            }
        }

        if ($hadIssues) {
            DB::table('patients')
                ->where('id', $patient->id)
                ->update($fieldsToClear);

            $this->info("  Patient {$patient->patient_id} - encrypted fields cleared.");
        } else {
            $this->line("  Patient {$patient->patient_id} - no issues found.");
        }
    }
}