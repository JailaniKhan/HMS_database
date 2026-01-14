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
        'head_doctor',
        'phone',
        'email',
        'metadata',
    ];

    protected $casts = [
        'phone' => 'encrypted',
        'email' => 'encrypted',
        'metadata' => 'array',
    ];

    public function doctors()
    {
        return $this->hasMany(Doctor::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }
}
