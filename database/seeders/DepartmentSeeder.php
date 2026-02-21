<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $departments = [
            ['name' => 'Cardiology', 'description' => 'Heart and cardiovascular system'],
            ['name' => 'Neurology', 'description' => 'Brain and nervous system'],
            ['name' => 'Orthopedics', 'description' => 'Bones, joints, and muscles'],
            ['name' => 'Pediatrics', 'description' => 'Children\'s health'],
            ['name' => 'Dermatology', 'description' => 'Skin, hair, and nails'],
            ['name' => 'General Medicine', 'description' => 'General health and wellness'],
            ['name' => 'Surgery', 'description' => 'Surgical procedures'],
            ['name' => 'Ophthalmology', 'description' => 'Eye care'],
            ['name' => 'Psychiatry', 'description' => 'Mental health'],
            ['name' => 'Radiology', 'description' => 'Medical imaging'],
            ['name' => 'Emergency Medicine', 'description' => 'Emergency care'],
            ['name' => 'Oncology', 'description' => 'Cancer treatment'],
            ['name' => 'Gynecology', 'description' => 'Women\'s health'],
            ['name' => 'ENT', 'description' => 'Ear, Nose, and Throat'],
            ['name' => 'Laboratory', 'description' => 'Laboratory services and testing'],
        ];

        foreach ($departments as $department) {
            Department::create($department);
        }
    }
}
