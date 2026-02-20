<?php

namespace Database\Factories;

use App\Models\MedicineCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

class MedicineCategoryFactory extends Factory
{
    protected $model = MedicineCategory::class;

    public function definition(): array
    {
        return [
            'name' => $this->faker->randomElement([
                'Analgesics',
                'Antibiotics',
                'Antihypertensives',
                'Antidiabetics',
                'Antidepressants',
                'Antihistamines',
                'Cardiovascular',
                'Dermatological',
                'Gastrointestinal',
                'Hormonal',
                'Neurological',
                'Respiratory',
                'Vitamins & Supplements',
            ]),
            'description' => $this->faker->optional()->sentence(),
        ];
    }
}