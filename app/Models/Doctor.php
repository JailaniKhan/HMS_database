<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Department;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Bill;

class Doctor extends Model
{
    protected $fillable = [
        'doctor_id',
        'first_name',
        'last_name',
        'specialization',
        'phone',
        'address',
        'bio',
        'fee',
        'status',
        'user_id',
        'department_id',
    ];

    protected $casts = [
        'fee' => 'decimal:2',
        'address' => 'array',
        'phone' => 'encrypted',
        'email' => 'encrypted',
        'metadata' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function bills()
    {
        return $this->hasMany(Bill::class);
    }
}
