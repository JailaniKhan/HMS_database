<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Auth;

class LabTestRequest extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Status constants
     */
    public const STATUS_PENDING = 'pending';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    /**
     * Test type constants
     */
    public const TYPE_ROUTINE = 'routine';
    public const TYPE_URGENT = 'urgent';
    public const TYPE_STAT = 'stat';

    /**
     * Valid status transitions
     */
    protected array $validStatusTransitions = [
        self::STATUS_PENDING => [self::STATUS_IN_PROGRESS, self::STATUS_CANCELLED],
        self::STATUS_IN_PROGRESS => [self::STATUS_COMPLETED, self::STATUS_CANCELLED],
        self::STATUS_COMPLETED => [],
        self::STATUS_CANCELLED => [self::STATUS_PENDING],
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'request_id',
        'patient_id',
        'doctor_id',
        'department_id',
        'test_name',
        'test_type',
        'status',
        'scheduled_at',
        'completed_at',
        'notes',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'scheduled_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Boot the model.
     */
    protected static function boot(): void
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->request_id)) {
                $model->request_id = 'LTR-' . strtoupper(uniqid());
            }
        });
    }

    /**
     * Get the patient associated with this lab test request.
     */
    public function patient()
    {
        return $this->belongsTo(Patient::class);
    }

    /**
     * Get the doctor who requested this lab test.
     */
    public function doctor()
    {
        return $this->belongsTo(Doctor::class);
    }

    /**
     * Get the department associated with this lab test request.
     */
    public function department()
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the user who created this lab test request.
     */
    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the results associated with this lab test request.
     */
    public function results()
    {
        return $this->hasMany(LabTestResult::class, 'lab_test_request_id');
    }

    /**
     * Scope to filter by status.
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope to filter by patient.
     */
    public function scopeByPatient($query, int $patientId)
    {
        return $query->where('patient_id', $patientId);
    }

    /**
     * Scope to filter by doctor.
     */
    public function scopeByDoctor($query, int $doctorId)
    {
        return $query->where('doctor_id', $doctorId);
    }

    /**
     * Scope to filter by department.
     */
    public function scopeByDepartment($query, int $departmentId)
    {
        return $query->where('department_id', $departmentId);
    }

    /**
     * Scope to filter by department and status.
     */
    public function scopeByDepartmentAndStatus($query, int $departmentId, string $status)
    {
        return $query->where('department_id', $departmentId)->where('status', $status);
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeByDateRange($query, string $startDate, string $endDate)
    {
        return $query->whereBetween('scheduled_at', [$startDate, $endDate]);
    }

    /**
     * Check if status transition is valid.
     */
    public function canTransitionTo(string $newStatus): bool
    {
        $currentStatus = $this->status;
        return in_array($newStatus, $this->validStatusTransitions[$currentStatus] ?? []);
    }

    /**
     * Transition to a new status with authorization check.
     */
    public function transitionTo(string $newStatus): bool
    {
        if (!$this->canTransitionTo($newStatus)) {
            throw new \InvalidArgumentException("Invalid status transition from {$this->status} to {$newStatus}");
        }

        $user = Auth::user();
        
        // Authorization checks for specific transitions
        if ($newStatus === self::STATUS_IN_PROGRESS && !$user->hasPermission('process-lab-test-requests')) {
            abort(403, 'You do not have permission to process lab test requests');
        }

        if ($newStatus === self::STATUS_COMPLETED && !$user->hasPermission('process-lab-test-requests')) {
            abort(403, 'You do not have permission to complete lab test requests');
        }

        if ($newStatus === self::STATUS_CANCELLED && !$user->hasPermission('delete-lab-test-requests')) {
            abort(403, 'You do not have permission to cancel lab test requests');
        }

        $this->status = $newStatus;
        
        if ($newStatus === self::STATUS_COMPLETED) {
            $this->completed_at = now();
        }

        return $this->save();
    }

    /**
     * Start processing the lab test request.
     */
    public function startProcessing(): bool
    {
        return $this->transitionTo(self::STATUS_IN_PROGRESS);
    }

    /**
     * Complete the lab test request.
     */
    public function complete(): bool
    {
        return $this->transitionTo(self::STATUS_COMPLETED);
    }

    /**
     * Cancel the lab test request.
     */
    public function cancel(): bool
    {
        return $this->transitionTo(self::STATUS_CANCELLED);
    }

    /**
     * Restore a cancelled lab test request.
     */
    public function restoreRequest(): bool
    {
        if ($this->status !== self::STATUS_CANCELLED) {
            throw new \InvalidArgumentException('Only cancelled requests can be restored');
        }

        $user = Auth::user();
        if (!$user->hasPermission('edit-lab-test-requests')) {
            abort(403, 'You do not have permission to restore lab test requests');
        }

        $this->status = self::STATUS_PENDING;
        $this->completed_at = null;
        return $this->save();
    }

    /**
     * Check if the request is pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Check if the request is in progress.
     */
    public function isInProgress(): bool
    {
        return $this->status === self::STATUS_IN_PROGRESS;
    }

    /**
     * Check if the request is completed.
     */
    public function isCompleted(): bool
    {
        return $this->status === self::STATUS_COMPLETED;
    }

    /**
     * Check if the request is cancelled.
     */
    public function isCancelled(): bool
    {
        return $this->status === self::STATUS_CANCELLED;
    }

    /**
     * Get status badge color.
     */
    public function getStatusColor(): string
    {
        return match ($this->status) {
            self::STATUS_PENDING => 'yellow',
            self::STATUS_IN_PROGRESS => 'blue',
            self::STATUS_COMPLETED => 'green',
            self::STATUS_CANCELLED => 'red',
            default => 'gray',
        };
    }

    /**
     * Get test type badge color.
     */
    public function getTestTypeColor(): string
    {
        return match ($this->test_type) {
            self::TYPE_ROUTINE => 'blue',
            self::TYPE_URGENT => 'orange',
            self::TYPE_STAT => 'red',
            default => 'gray',
        };
    }
}
