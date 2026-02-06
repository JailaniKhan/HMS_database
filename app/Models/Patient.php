<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\Sale;
use App\Models\LabTestResult;

class Patient extends Model
{
    /**
     * Get the route key for the model.
     */
    public function getRouteKeyName(): string
    {
        return 'patient_id';
    }

    protected $fillable = [
        'patient_id',
        'first_name',
        'father_name',
        'gender',
        'phone',
        'user_id',
        'age',
        'blood_group',
        'address',
    ];

    protected $casts = [
        'address' => 'array',
        'phone' => 'encrypted',
        'metadata' => 'array',
        'age' => 'integer',
        // Encrypt sensitive medical information
        'allergies' => 'encrypted',
        'medical_history' => 'encrypted',
        'emergency_contact_phone' => 'encrypted',
    ];

    /**
     * Get full name of the patient.
     */
    public function getFullNameAttribute(): string
    {
        return trim("{$this->first_name} {$this->father_name}");
    }

    /**
     * Scope to search patients by name.
     */
    public function scopeSearchByName($query, string $name)
    {
        // Sanitize the search term to prevent SQL injection
        $sanitizedName = '%' . addcslashes($name, '%_\\') . '%';
        
        return $query->where(function ($q) use ($sanitizedName) {
            $q->where('first_name', 'like', $sanitizedName)
              ->orWhere('father_name', 'like', $sanitizedName);
        });
    }

    /**
     * Get medical records for this patient.
     */
    public function medicalRecords()
    {
        return $this->hasMany(MedicalRecord::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function bills()
    {
        return $this->hasMany(Bill::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    public function labTestResults()
    {
        return $this->hasMany(LabTestResult::class);
    }
}
