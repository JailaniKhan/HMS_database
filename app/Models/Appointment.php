<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Department;
use App\Models\DepartmentService;

class Appointment extends Model
{
    use HasFactory;
    protected $fillable = [
        'appointment_id',
        'daily_sequence',
        'patient_id',
        'doctor_id',
        'department_id',
        'appointment_date',
        'status',
        'reason',
        'notes',
        'fee',
        'discount',
    ];

    protected $casts = [
        'appointment_date' => 'datetime',
        'fee' => 'decimal:2',
        'discount' => 'decimal:2',
    ];

    // Include accessors in toArray() by default
    protected $appends = ['grand_total'];

    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the services associated with this appointment.
     */
    public function services()
    {
        return $this->belongsToMany(DepartmentService::class, 'appointment_services')
            ->withPivot(['custom_cost', 'discount_percentage', 'final_cost'])
            ->withTimestamps();
    }

    /**
     * Calculate the grand total from all services OR from fee - discount.
     */
    public function getGrandTotalAttribute(): float
    {
        // If services exist, sum their final costs
        if ($this->services->isNotEmpty()) {
            return (float) $this->services->sum('pivot.final_cost');
        }
        
        // Otherwise, calculate from fee - discount
        return max(0, ($this->fee ?? 0) - ($this->discount ?? 0));
    }

    /**
     * Calculate total discount from all services.
     */
    public function getTotalDiscountAttribute(): float
    {
        return $this->services->sum(function ($service) {
            $discountAmount = $service->pivot->custom_cost * ($service->pivot->discount_percentage / 100);
            return round($discountAmount, 2);
        });
    }

    // Scopes for optimized queries
    public function scopeUpcoming($query)
    {
        return $query->where('appointment_date', '>', now());
    }

    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    public function scopeForDoctor($query, $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    public function scopeForPatient($query, $patientId)
    {
        return $query->where('patient_id', $patientId);
    }
}
