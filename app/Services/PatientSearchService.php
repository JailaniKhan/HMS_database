<?php

namespace App\Services;

use App\Models\Patient;
use Illuminate\Support\Facades\Log;

class PatientSearchService
{
    protected ElasticsearchService $elasticsearchService;

    public function __construct(ElasticsearchService $elasticsearchService)
    {
        $this->elasticsearchService = $elasticsearchService;
    }

    /**
     * Index a patient document
     */
    public function indexPatient(Patient $patient): void
    {
        try {
            $document = [
                'patient_id' => $patient->patient_id,
                'name' => $patient->name,
                'email' => $patient->email,
                'phone' => $patient->phone,
                'address' => $patient->address,
                'date_of_birth' => $patient->date_of_birth,
                'gender' => $patient->gender,
                'emergency_contact_name' => $patient->emergency_contact_name,
                'emergency_contact_phone' => $patient->emergency_contact_phone,
                'created_at' => $patient->created_at->toISOString(),
                'updated_at' => $patient->updated_at->toISOString(),
            ];

            $this->elasticsearchService->indexDocument('patients', $patient->id, $document);
        } catch (\Exception $e) {
            Log::error('Failed to index patient: ' . $e->getMessage());
        }
    }

    /**
     * Search patients
     */
    public function searchPatients(string $query, int $limit = 10): array
    {
        $searchQuery = [
            'bool' => [
                'should' => [
                    ['match' => ['name' => ['query' => $query, 'boost' => 2]]],
                    ['match' => ['email' => $query]],
                    ['match' => ['phone' => $query]],
                    ['match' => ['patient_id' => $query]],
                    ['wildcard' => ['name' => "*{$query}*"]],
                    ['wildcard' => ['email' => "*{$query}*"]],
                ],
                'minimum_should_match' => 1,
            ]
        ];

        try {
            $results = $this->elasticsearchService->search('patients', $searchQuery, $limit);
            
            $patientIds = [];
            if (isset($results['hits']['hits'])) {
                foreach ($results['hits']['hits'] as $hit) {
                    $patientIds[] = $hit['_id'];
                }
            }

            // Fetch patients from database
            $patients = Patient::whereIn('id', $patientIds)->get();

            // Sort results to match Elasticsearch order
            $sortedPatients = collect();
            foreach ($patientIds as $id) {
                $patient = $patients->firstWhere('id', $id);
                if ($patient) {
                    $sortedPatients->push($patient);
                }
            }

            return $sortedPatients->toArray();
        } catch (\Exception $e) {
            Log::error('Patient search failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Update patient index
     */
    public function updatePatientIndex(Patient $patient): void
    {
        $this->indexPatient($patient);
    }

    /**
     * Delete patient from index
     */
    public function deletePatientFromIndex(Patient $patient): void
    {
        try {
            $this->elasticsearchService->deleteDocument('patients', $patient->id);
        } catch (\Exception $e) {
            Log::error('Failed to delete patient from index: ' . $e->getMessage());
        }
    }

    /**
     * Initialize the patients index with mapping
     */
    public function initializeIndex(): void
    {
        if (!$this->elasticsearchService->indexExists('patients')) {
            $mapping = [
                'mappings' => [
                    'properties' => [
                        'patient_id' => ['type' => 'keyword'],
                        'name' => ['type' => 'text', 'analyzer' => 'standard', 'boost' => 2.0],
                        'email' => ['type' => 'keyword'],
                        'phone' => ['type' => 'keyword'],
                        'address' => ['type' => 'text'],
                        'date_of_birth' => ['type' => 'date'],
                        'gender' => ['type' => 'keyword'],
                        'emergency_contact_name' => ['type' => 'text'],
                        'emergency_contact_phone' => ['type' => 'keyword'],
                        'created_at' => ['type' => 'date'],
                        'updated_at' => ['type' => 'date'],
                    ]
                ]
            ];

            $this->elasticsearchService->createIndex('patients', $mapping);
        }
    }
}