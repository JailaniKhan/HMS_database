<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\DepartmentService;
use Illuminate\Database\Seeder;

class DepartmentServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Add services for all departments
        $departments = Department::all();
        
        foreach ($departments as $department) {
            // Add default consultation service for every department
            DepartmentService::create([
                'department_id' => $department->id,
                'name' => 'Consultation',
                'description' => 'General ' . $department->name . ' consultation',
                'base_cost' => 500,
                'fee_percentage' => 0,
                'discount_percentage' => 0,
                'is_active' => true,
            ]);
            
            // Add department-specific services based on department name
            $this->addDepartmentSpecificServices($department);
        }
    }
    
    private function addDepartmentSpecificServices(Department $department): void
    {
        $services = match($department->name) {
            'Cardiology' => [
                ['name' => 'ECG', 'base_cost' => 500, 'description' => 'Electrocardiogram test'],
                ['name' => 'Echocardiogram', 'base_cost' => 2000, 'description' => 'Ultrasound of the heart'],
                ['name' => 'Stress Test', 'base_cost' => 1500, 'description' => 'Cardiac stress testing'],
                ['name' => 'Holter Monitoring', 'base_cost' => 1200, 'description' => '24-hour heart monitoring'],
            ],
            'Neurology' => [
                ['name' => 'EEG', 'base_cost' => 1800, 'description' => 'Electroencephalogram'],
                ['name' => 'EMG', 'base_cost' => 1500, 'description' => 'Electromyography'],
                ['name' => 'Nerve Conduction Study', 'base_cost' => 2000, 'description' => 'Nerve function test'],
                ['name' => 'Brain MRI', 'base_cost' => 8000, 'description' => 'Magnetic resonance imaging'],
            ],
            'Orthopedics' => [
                ['name' => 'X-Ray', 'base_cost' => 400, 'description' => 'Bone imaging'],
                ['name' => 'Cast Application', 'base_cost' => 800, 'description' => 'Plaster cast for fractures'],
                ['name' => 'Joint Injection', 'base_cost' => 1200, 'description' => 'Therapeutic joint injection'],
                ['name' => 'Fracture Reduction', 'base_cost' => 2500, 'description' => 'Fracture alignment'],
            ],
            'Pediatrics' => [
                ['name' => 'Vaccination', 'base_cost' => 300, 'description' => 'Childhood immunization'],
                ['name' => 'Growth Assessment', 'base_cost' => 600, 'description' => 'Developmental checkup'],
                ['name' => 'Newborn Screening', 'base_cost' => 800, 'description' => 'Comprehensive newborn tests'],
                ['name' => 'Pediatric Consultation', 'base_cost' => 700, 'description' => 'Child health consultation'],
            ],
            'General Medicine' => [
                ['name' => 'General Checkup', 'base_cost' => 600, 'description' => 'Complete health checkup'],
                ['name' => 'Blood Pressure Check', 'base_cost' => 100, 'description' => 'BP monitoring'],
                ['name' => 'Blood Sugar Test', 'base_cost' => 150, 'description' => 'Glucose level check'],
                ['name' => 'Physical Examination', 'base_cost' => 500, 'description' => 'Complete physical exam'],
            ],
            'Surgery' => [
                ['name' => 'Minor Surgery', 'base_cost' => 3000, 'description' => 'Small surgical procedures'],
                ['name' => 'Suture Removal', 'base_cost' => 200, 'description' => 'Stitch removal'],
                ['name' => 'Wound Dressing', 'base_cost' => 150, 'description' => 'Wound care and dressing'],
                ['name' => 'Pre-op Assessment', 'base_cost' => 1000, 'description' => 'Pre-operative evaluation'],
            ],
            'Radiology' => [
                ['name' => 'X-Ray', 'base_cost' => 400, 'description' => 'X-ray imaging'],
                ['name' => 'CT Scan', 'base_cost' => 3500, 'description' => 'Computed tomography'],
                ['name' => 'MRI', 'base_cost' => 8000, 'description' => 'Magnetic resonance imaging'],
                ['name' => 'Ultrasound', 'base_cost' => 1200, 'description' => 'Ultrasound imaging'],
            ],
            'Emergency Medicine' => [
                ['name' => 'Emergency Consultation', 'base_cost' => 800, 'description' => 'Urgent care consultation'],
                ['name' => 'Wound Suturing', 'base_cost' => 500, 'description' => 'Emergency wound closure'],
                ['name' => 'Fracture Management', 'base_cost' => 1500, 'description' => 'Emergency fracture care'],
                ['name' => 'Emergency Procedure', 'base_cost' => 2000, 'description' => 'Emergency medical procedure'],
            ],
            'Dermatology' => [
                ['name' => 'Skin Examination', 'base_cost' => 600, 'description' => 'Complete skin check'],
                ['name' => 'Biopsy', 'base_cost' => 1500, 'description' => 'Skin tissue sampling'],
                ['name' => 'Cryotherapy', 'base_cost' => 800, 'description' => 'Freezing treatment'],
                ['name' => 'Laser Treatment', 'base_cost' => 3000, 'description' => 'Laser skin therapy'],
            ],
            'Ophthalmology' => [
                ['name' => 'Eye Examination', 'base_cost' => 700, 'description' => 'Complete eye checkup'],
                ['name' => 'Vision Test', 'base_cost' => 300, 'description' => 'Visual acuity testing'],
                ['name' => 'Eye Pressure Test', 'base_cost' => 400, 'description' => 'Glaucoma screening'],
                ['name' => 'Retinal Scan', 'base_cost' => 1200, 'description' => 'Digital retinal imaging'],
            ],
            'ENT' => [
                ['name' => 'Ear Examination', 'base_cost' => 500, 'description' => 'Complete ear check'],
                ['name' => 'Hearing Test', 'base_cost' => 600, 'description' => 'Audiometry testing'],
                ['name' => 'Nasal Endoscopy', 'base_cost' => 1000, 'description' => 'Nasal cavity examination'],
                ['name' => 'Tonsil Examination', 'base_cost' => 400, 'description' => 'Throat and tonsil check'],
            ],
            'Gynecology' => [
                ['name' => 'Gynecological Exam', 'base_cost' => 800, 'description' => 'Complete women\'s health check'],
                ['name' => 'Pap Smear', 'base_cost' => 600, 'description' => 'Cervical cancer screening'],
                ['name' => 'Ultrasound', 'base_cost' => 1200, 'description' => 'Pelvic ultrasound'],
                ['name' => 'Prenatal Checkup', 'base_cost' => 1000, 'description' => 'Pregnancy monitoring'],
            ],
            'Psychiatry' => [
                ['name' => 'Psychiatric Evaluation', 'base_cost' => 1500, 'description' => 'Mental health assessment'],
                ['name' => 'Counseling Session', 'base_cost' => 1000, 'description' => 'Therapy session'],
                ['name' => 'Cognitive Testing', 'base_cost' => 800, 'description' => 'Cognitive function assessment'],
                ['name' => 'Medication Review', 'base_cost' => 600, 'description' => 'Psychiatric medication review'],
            ],
            'Oncology' => [
                ['name' => 'Cancer Screening', 'base_cost' => 1500, 'description' => 'Comprehensive cancer screening'],
                ['name' => 'Chemotherapy Session', 'base_cost' => 5000, 'description' => 'Chemotherapy treatment'],
                ['name' => 'Radiation Therapy', 'base_cost' => 8000, 'description' => 'Radiation treatment session'],
                ['name' => 'Tumor Marker Test', 'base_cost' => 1200, 'description' => 'Cancer marker blood test'],
            ],
            default => [
                ['name' => 'Follow-up Visit', 'base_cost' => 400, 'description' => 'Follow-up consultation'],
                ['name' => 'Medical Report', 'base_cost' => 200, 'description' => 'Medical documentation'],
            ],
        };
        
        foreach ($services as $service) {
            DepartmentService::create([
                'department_id' => $department->id,
                'name' => $service['name'],
                'description' => $service['description'],
                'base_cost' => $service['base_cost'],
                'fee_percentage' => 0,
                'discount_percentage' => 0,
                'is_active' => true,
            ]);
        }
    }
}