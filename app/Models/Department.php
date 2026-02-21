<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'head_doctor_id',
        'phone',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    protected $appends = ['head_doctor_name'];

    public function getHeadDoctorNameAttribute()
    {
        return $this->headDoctor?->full_name;
    }

    public function headDoctor()
    {
        return $this->belongsTo(Doctor::class, 'head_doctor_id');
    }

    public function services()
    {
        return $this->hasMany(DepartmentService::class);
    }

    public function doctors()
    {
        return $this->hasMany(Doctor::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    /**
     * Get the lab test requests for this department.
     */
    public function labTestRequests()
    {
        return $this->hasMany(LabTestRequest::class);
    }

    /**
     * Get the pending lab test requests for this department.
     */
    public function pendingLabTestRequests()
    {
        return $this->hasMany(LabTestRequest::class)->where('status', 'pending');
    }
}
