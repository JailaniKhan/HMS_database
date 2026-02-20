<?php

use App\Models\User;
use App\Models\Medicine;
use App\Models\MedicineCategory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create(['role' => 'Super Admin']);
    $this->category = MedicineCategory::factory()->create();
    Sanctum::actingAs($this->user);
});

describe('GET /api/v1/pharmacy/medicines', function () {
    it('should return paginated medicines', function () {
        Medicine::factory()->count(30)->create();

        $response = $this->getJson('/api/v1/pharmacy/medicines');

        $response->assertStatus(200)->assertJsonStructure([
            'success',
            'message', 
            'data' => [
                'medicines' => [
                    'current_page',
                    'data',
                    'first_page_url',
                    'from',
                    'last_page',
                    'last_page_url',
                    'links',
                    'next_page_url',
                    'path',
                    'per_page',
                    'prev_page_url',
                    'to',
                    'total'
                ]
            ]
        ]);
    });

    it('should filter medicines by category', function () {
        Medicine::factory()->count(5)->create(['category_id' => $this->category->id]);

        $response = $this->getJson("/api/v1/pharmacy/medicines?category_id={$this->category->id}");

        $response->assertStatus(200);
        collect($response->json('data.medicines.data'))->each(fn($med) => expect($med['category_id'])->toBe($this->category->id));
    });
});

describe('POST /api/v1/pharmacy/medicines', function () {
    it('should create new medicine', function () {
        $medicineData = [
            'name' => 'Amoxicillin 500mg',
            'medicine_code' => 'MED-CODE-001',
            'medicine_id' => 'MED-TEST-001',
            'category_id' => $this->category->id,
            'cost_price' => 20.00,
            'sale_price' => 25.00,
            'stock_quantity' => 100,
            'reorder_level' => 10,
            'manufacturer' => 'Test Manufacturer',
            'expiry_date' => '2025-12-31',
            'batch_number' => 'BAT-TEST-001',
        ];

        $response = $this->postJson('/api/v1/pharmacy/medicines', $medicineData);

        $response->assertStatus(201);
        expect(Medicine::where('name', 'Amoxicillin 500mg')->exists())->toBeTrue();
    });

    it('should validate required fields', function () {
        $response = $this->postJson('/api/v1/pharmacy/medicines', []);

        $response->assertStatus(422)->assertJsonValidationErrors([
            'name', 'medicine_code', 'medicine_id', 'category_id', 
            'cost_price', 'sale_price', 'stock_quantity', 'reorder_level', 
            'manufacturer', 'expiry_date', 'batch_number'
        ]);
    });
});

describe('POST /api/v1/pharmacy/medicines/{id}/adjust-stock', function () {
    it('should update stock quantity', function () {
        $medicine = Medicine::factory()->create(['stock_quantity' => 100]);

        $response = $this->postJson("/api/v1/pharmacy/medicines/{$medicine->id}/adjust-stock", [
            'quantity' => 50,
            'type' => 'add',
            'reason' => 'Test stock addition',
        ]);

        $response->assertStatus(200);
        expect($medicine->fresh()->stock_quantity)->toBe(150);
    });

    it('should not deduct more than available stock', function () {
        $medicine = Medicine::factory()->create(['stock_quantity' => 50]);

        $response = $this->postJson("/api/v1/pharmacy/medicines/{$medicine->id}/adjust-stock", [
            'quantity' => 100,
            'type' => 'deduct',
            'reason' => 'Test stock deduction',
        ]);

        $response->assertStatus(422);
    });
});
