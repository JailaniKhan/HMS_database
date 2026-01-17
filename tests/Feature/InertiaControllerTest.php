<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

// Test to verify that all Inertia controllers return proper responses
class InertiaControllerTest extends TestCase
{
    use RefreshDatabase;
    
    protected $user;
    
    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a user with admin role for testing
        $this->user = User::factory()->create([
            'role' => 'Super Admin'
        ]);
    }
    
    public function test_patient_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/patients');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
    
    public function test_doctor_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/doctors');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
    
    public function test_appointment_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/appointments');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
    
    public function test_bill_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/bills');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
    
    public function test_lab_test_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/lab-tests');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
    
    public function test_lab_test_result_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/lab-test-results');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
    
    public function test_medicine_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/medicines');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
    
    public function test_stock_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/stock');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
    
    public function test_sales_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/sales');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
    
    public function test_purchase_order_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/purchase-orders');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
    
    public function test_alert_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/alerts');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
    
    public function test_report_controller_returns_inertia_response(): void
    {
        $response = $this->actingAs($this->user)
            ->get('/reports');
        
        $response->assertStatus(200);
        $response->assertHeader('X-Inertia', 'true');
    }
}

