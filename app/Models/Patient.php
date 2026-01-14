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
    protected $fillable = [
        'patient_id',
        'first_name',
        'last_name',
        'gender',
        'phone',
        'user_id',
    ];

    protected $casts = [
        'address' => 'array',
        'phone' => 'encrypted',
        'metadata' => 'array',
    ];

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
