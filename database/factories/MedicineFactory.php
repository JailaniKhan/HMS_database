<?php

namespace Database\Factories;

use App\Models\MedicineCategory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Medicine>
 */
class MedicineFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'medicine_code' => 'MED-' . $this->faker->unique()->numberBetween(1000, 9999),
            'medicine_id' => 'MED-' . $this->faker->unique()->numberBetween(1000, 9999),
            'name' => $this->faker->word() . ' ' . $this->faker->randomElement(['500mg', '250mg', '100mg', '10ml']),
            'description' => $this->faker->optional()->sentence(),
            'manufacturer' => $this->faker->company(),
            'chemical_name' => $this->faker->optional()->word(),
            'category' => $this->faker->randomElement(['Pain Relief', 'Antibiotic', 'Cardiovascular', 'Diabetes']),
            'form' => $this->faker->randomElement(['Tablet', 'Capsule', 'Syrup', 'Injection', 'Cream', 'Drops']),
            'strength' => $this->faker->randomNumber(2) . $this->faker->randomElement(['mg', 'ml', 'g', 'units']),
            'cost_price' => $this->faker->randomFloat(2, 1, 100),
            'sale_price' => $this->faker->randomFloat(2, 5, 500),
            'unit_price' => $this->faker->randomFloat(2, 5, 500),
            'quantity' => $this->faker->numberBetween(0, 1000),
            'stock_quantity' => $this->faker->numberBetween(0, 1000),
            'reorder_level' => $this->faker->numberBetween(10, 50),
            'batch_number' => 'BAT-' . $this->faker->numberBetween(1000, 9999),
            'expiry_date' => $this->faker->dateTimeBetween('now', '+2 years')->format('Y-m-d'),
            'status' => 'active',
            'side_effects' => $this->faker->optional()->sentence(),
            'instructions' => $this->faker->optional()->sentence(),
            'category_id' => MedicineCategory::factory(),
        ];
    }
    
    /**
     * Indicate that the medicine is out of stock.
     */
    public function outOfStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 0,
        ]);
    }
    
    /**
     * Indicate that the medicine is low stock.
     */
    public function lowStock(): static
    {
        return $this->state(fn (array $attributes) => [
            'stock_quantity' => 5,
            'reorder_level' => 10,
        ]);
    }
}
