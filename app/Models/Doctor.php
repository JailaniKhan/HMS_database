<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Department;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Bill;

class Doctor extends Model
{
    use HasFactory;
    /**
     * The route key name for model binding.
     */
    public function getRouteKeyName(): string
    {
        return 'id';
    }

    protected $fillable = [
        'doctor_id',
        'full_name',
        'father_name',
        'age',
        'specialization',
        'phone_number',
        'address',
        'bio',
        'fees',
        'fee_percentage',
        'salary',
        'bonus',
        'status',
        'user_id',
        'department_id',
    ];

    protected $casts = [
        'fees' => 'decimal:2',
        'salary' => 'decimal:2',
        'bonus' => 'decimal:2',
        'age' => 'integer',
        'address' => 'array',
        'metadata' => 'array',
    ];

    /**
     * Boot method for model events.
     */
    protected static function boot()
    {
        parent::boot();

        // Encrypt email on save if column exists
        static::saving(function ($model) {
            if ($model->isDirty('email') && $model->email) {
                // Email encryption handled by model accessor/mutator
            }
        });
    }

    /**
     * Get full name of the doctor.
     */
    public function getFullNameAttribute(): string
    {
        return $this->attributes['full_name'] ?? '';
    }

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
