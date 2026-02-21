<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class LinkLabTestRequestsToDepartmentsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder links existing lab test requests to departments via their doctors.
     * It updates lab_test_requests.department_id based on the doctor assigned to each request.
     */
    public function run(): void
    {
        // Count records before update
        $recordsToUpdate = DB::table('lab_test_requests')
            ->whereNull('department_id')
            ->whereNotNull('doctor_id')
            ->count();

        $this->command->info("Found {$recordsToUpdate} lab test requests to link to departments.");

        if ($recordsToUpdate === 0) {
            $this->command->info('No records need to be updated.');
            return;
        }

        // Update lab_test_requests set department_id = doctors.department_id
        // where lab_test_requests.department_id is NULL 
        // and lab_test_requests.doctor_id matches doctors.id
        // and doctors.department_id is NOT NULL
        $updated = DB::table('lab_test_requests')
            ->whereNull('department_id')
            ->whereNotNull('doctor_id')
            ->update([
                'department_id' => DB::raw('
                    (SELECT department_id 
                     FROM doctors 
                     WHERE doctors.id = lab_test_requests.doctor_id 
                     AND doctors.department_id IS NOT NULL 
                     LIMIT 1)
                ')
            ]);

        $this->command->info("Successfully linked {$updated} lab test requests to departments.");

        // Report on any remaining records that couldn't be linked
        $remaining = DB::table('lab_test_requests')
            ->whereNull('department_id')
            ->whereNotNull('doctor_id')
            ->count();

        if ($remaining > 0) {
            $this->command->warn("{$remaining} lab test requests could not be linked because their doctors have no department assigned.");
        }

        // Show summary
        $totalRequests = DB::table('lab_test_requests')->count();
        $linkedRequests = DB::table('lab_test_requests')
            ->whereNotNull('department_id')
            ->count();

        $this->command->info("Summary: {$linkedRequests}/{$totalRequests} lab test requests now have a department assigned.");
    }
}
