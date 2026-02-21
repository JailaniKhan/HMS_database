<?php

namespace Database\Seeders;

use App\Models\LabTest;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class LabTestSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $labTests = [
            [
                'test_code' => 'CBC',
                'name' => 'Complete Blood Count',
                'description' => 'Comprehensive blood test analyzing red blood cells, white blood cells, and platelets',
                'procedure' => 'Blood sample collection and automated analysis',
                'cost' => 25.00,
                'turnaround_time' => 24,
                'unit' => 'Various',
                'normal_values' => 'Varies by component',
                'status' => 'active',
            ],
            [
                'test_code' => 'LFT',
                'name' => 'Liver Function Test',
                'description' => 'Tests to assess liver health and function',
                'procedure' => 'Blood sample analysis for liver enzymes and proteins',
                'cost' => 35.00,
                'turnaround_time' => 24,
                'unit' => 'IU/L, g/dL',
                'normal_values' => 'ALT: 7-56 IU/L, AST: 10-40 IU/L',
                'status' => 'active',
            ],
            [
                'test_code' => 'KFT',
                'name' => 'Kidney Function Test',
                'description' => 'Tests to evaluate kidney function and health',
                'procedure' => 'Blood and urine analysis for kidney markers',
                'cost' => 30.00,
                'turnaround_time' => 24,
                'unit' => 'mg/dL, mL/min',
                'normal_values' => 'Creatinine: 0.6-1.2 mg/dL',
                'status' => 'active',
            ],
            [
                'test_code' => 'TSH',
                'name' => 'Thyroid Stimulating Hormone',
                'description' => 'Test for thyroid function',
                'procedure' => 'Blood sample analysis for TSH levels',
                'cost' => 20.00,
                'turnaround_time' => 48,
                'unit' => 'mIU/L',
                'normal_values' => '0.27-4.2 mIU/L',
                'status' => 'active',
            ],
            [
                'test_code' => 'GLU',
                'name' => 'Blood Glucose',
                'description' => 'Test for blood sugar levels',
                'procedure' => 'Blood sample analysis',
                'cost' => 15.00,
                'turnaround_time' => 4,
                'unit' => 'mg/dL',
                'normal_values' => '70-99 mg/dL (fasting)',
                'status' => 'active',
            ],
            [
                'test_code' => 'CHO',
                'name' => 'Cholesterol Test',
                'description' => 'Comprehensive cholesterol profile',
                'procedure' => 'Blood sample analysis for lipid profile',
                'cost' => 40.00,
                'turnaround_time' => 24,
                'unit' => 'mg/dL',
                'normal_values' => 'Total Cholesterol: <200 mg/dL',
                'status' => 'active',
            ],
            [
                'test_code' => 'URI',
                'name' => 'Urinalysis',
                'description' => 'Comprehensive urine analysis',
                'procedure' => 'Urine sample analysis',
                'cost' => 12.00,
                'turnaround_time' => 4,
                'unit' => 'Various',
                'normal_values' => 'Normal ranges vary',
                'status' => 'active',
            ],
            [
                'test_code' => 'ECG',
                'name' => 'Electrocardiogram',
                'description' => 'Heart electrical activity test',
                'procedure' => 'ECG machine recording',
                'cost' => 50.00,
                'turnaround_time' => 1,
                'unit' => 'N/A',
                'normal_values' => 'Normal sinus rhythm',
                'status' => 'active',
            ],
        ];

        foreach ($labTests as $test) {
            LabTest::create($test);
        }
    }
}