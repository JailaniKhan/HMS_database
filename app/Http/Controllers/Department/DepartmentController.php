<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Department;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class DepartmentController extends Controller
{
    /**
     * Check if the current user is a super admin.
     */
    private function isSuperAdmin(): bool
    {
        return auth()->user()?->isSuperAdmin() ?? false;
    }

    /**
     * Display a listing of all appointment services with filtering and navigation.
     * Super admins can view all services across all time periods.
     * Sub-admins can only view today's services.
     */
    public function servicesDashboard(Request $request): Response
    {
        // Check permission
        if (!auth()->user()?->hasPermission('view-appointments')) {
            abort(403, 'Unauthorized access');
        }

        $user = auth()->user();
        $isSuperAdmin = $this->isSuperAdmin();

        // Get filter parameters
        $view = $request->input('view', 'today'); // today, monthly, yearly
        $year = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);
        $day = (int) $request->input('day', now()->day);

        // Build date range based on view type
        $dateRange = $this->getDateRange($view, $year, $month, $day);

        // For sub-admins, restrict to today only
        if (!$isSuperAdmin && $view !== 'today') {
            $view = 'today';
            $dateRange = $this->getDateRange('today', now()->year, now()->month, now()->day);
        }

        // Get appointments with their services
        $query = Appointment::with(['patient', 'doctor', 'department', 'services'])
            ->whereBetween('appointment_date', [$dateRange['start'], $dateRange['end']])
            ->orderBy('appointment_date', 'desc');

        $appointments = $query->get();

        // Calculate totals and transform data
        $servicesData = $this->transformAppointmentsWithServices($appointments);

        // Calculate totals by status
        $statusTotals = $this->calculateStatusTotals($appointments);

        // Calculate total revenue
        $totalRevenue = $appointments->sum(function ($appointment) {
            return (float) $appointment->grand_total;
        });

        // Get departments for filter
        $departments = Department::orderBy('name')->get();

        // Determine navigation bounds
        $navigation = $this->getNavigationBounds($view, $year, $month, $day, $isSuperAdmin);

        return Inertia::render('Department/Services', [
            'services' => $servicesData,
            'filters' => [
                'view' => $view,
                'year' => $year,
                'month' => $month,
                'day' => $day,
            ],
            'summary' => [
                'total_revenue' => $totalRevenue,
                'total_appointments' => $appointments->count(),
                'completed_count' => $statusTotals['completed'] ?? 0,
                'cancelled_count' => $statusTotals['cancelled'] ?? 0,
                'scheduled_count' => $statusTotals['scheduled'] ?? 0,
                'no_show_count' => $statusTotals['no_show'] ?? 0,
                'rescheduled_count' => $statusTotals['rescheduled'] ?? 0,
            ],
            'departments' => $departments,
            'navigation' => $navigation,
            'is_super_admin' => $isSuperAdmin,
            'period_label' => $this->getPeriodLabel($view, $year, $month, $day),
        ]);
    }

    /**
     * Get date range based on view type.
     */
    private function getDateRange(string $view, int $year, int $month, int $day): array
    {
        $start = match ($view) {
            'today' => now()->startOfDay(),
            'monthly' => now()->year($year)->month($month)->startOfMonth(),
            'yearly' => now()->year($year)->startOfYear(),
            default => now()->startOfDay(),
        };

        $end = match ($view) {
            'today' => now()->endOfDay(),
            'monthly' => now()->year($year)->month($month)->endOfMonth(),
            'yearly' => now()->year($year)->endOfYear(),
            default => now()->endOfDay(),
        };

        return [
            'start' => $start,
            'end' => $end,
        ];
    }

    /**
     * Transform appointments with services for display.
     */
    private function transformAppointmentsWithServices($appointments): array
    {
        $result = [];

        foreach ($appointments as $appointment) {
            // If appointment has services, expand them
            if ($appointment->services->isNotEmpty()) {
                foreach ($appointment->services as $service) {
                    $result[] = [
                        'id' => $appointment->id . '_' . $service->id,
                        'appointment_id' => $appointment->appointment_id,
                        'appointment_date' => $appointment->appointment_date->format('Y-m-d H:i:s'),
                        'status' => $appointment->status,
                        'patient' => $appointment->patient ? [
                            'id' => $appointment->patient->id,
                            'name' => $appointment->patient->name,
                        ] : null,
                        'doctor' => $appointment->doctor ? [
                            'id' => $appointment->doctor->id,
                            'name' => 'Dr. ' . $appointment->doctor->full_name,
                        ] : null,
                        'department' => $appointment->department ? [
                            'id' => $appointment->department->id,
                            'name' => $appointment->department->name,
                        ] : ($service->department ? [
                            'id' => $service->department->id,
                            'name' => $service->department->name,
                        ] : null),
                        'service' => [
                            'id' => $service->id,
                            'name' => $service->name,
                            'custom_cost' => $service->pivot->custom_cost,
                            'discount_percentage' => $service->pivot->discount_percentage,
                            'final_cost' => $service->pivot->final_cost,
                        ],
                        'grand_total' => $service->pivot->final_cost,
                        'fee' => $appointment->fee,
                        'discount' => $appointment->discount,
                    ];
                }
            } else {
                // No services, show the appointment itself as a service
                $result[] = [
                    'id' => $appointment->id . '_main',
                    'appointment_id' => $appointment->appointment_id,
                    'appointment_date' => $appointment->appointment_date->format('Y-m-d H:i:s'),
                    'status' => $appointment->status,
                    'patient' => $appointment->patient ? [
                        'id' => $appointment->patient->id,
                        'name' => $appointment->patient->name,
                    ] : null,
                    'doctor' => $appointment->doctor ? [
                        'id' => $appointment->doctor->id,
                        'name' => 'Dr. ' . $appointment->doctor->full_name,
                    ] : null,
                    'department' => $appointment->department ? [
                        'id' => $appointment->department->id,
                        'name' => $appointment->department->name,
                    ] : null,
                    'service' => [
                        'id' => null,
                        'name' => 'Consultation Fee',
                        'custom_cost' => $appointment->fee,
                        'discount_percentage' => 0,
                        'final_cost' => $appointment->grand_total,
                    ],
                    'grand_total' => $appointment->grand_total,
                    'fee' => $appointment->fee,
                    'discount' => $appointment->discount,
                ];
            }
        }

        return $result;
    }

    /**
     * Calculate totals by appointment status.
     */
    private function calculateStatusTotals($appointments): array
    {
        $totals = [];
        foreach ($appointments->groupBy('status') as $status => $group) {
            $totals[$status] = $group->count();
        }
        return $totals;
    }

    /**
     * Get navigation bounds for time period navigation.
     */
    private function getNavigationBounds(string $view, int $year, int $month, int $day, bool $isSuperAdmin): array
    {
        $current = now();
        $canGoNext = true;
        $canGoPrev = true;

        $nextParams = [];
        $prevParams = [];

        switch ($view) {
            case 'today':
                $nextParams = ['view' => 'today', 'year' => $year, 'month' => $month, 'day' => $day + 1];
                $prevParams = ['view' => 'today', 'year' => $year, 'month' => $month, 'day' => $day - 1];
                $checkDate = now()->year($year)->month($month)->day($day);
                $canGoNext = $checkDate->isBefore($current->startOfDay());
                $canGoPrev = true; // Can always go back
                break;
            case 'monthly':
                $nextParams = ['view' => 'monthly', 'year' => $year, 'month' => $month + 1];
                $prevParams = ['view' => 'monthly', 'year' => $year, 'month' => $month - 1];
                $checkDate = now()->year($year)->month($month);
                $canGoNext = $checkDate->isBefore($current->startOfMonth());
                $canGoPrev = true;
                break;
            case 'yearly':
                $nextParams = ['view' => 'yearly', 'year' => $year + 1];
                $prevParams = ['view' => 'yearly', 'year' => $year - 1];
                $canGoNext = $year < $current->year;
                $canGoPrev = true;
                break;
        }

        // Sub-admins can only view today
        if (!$isSuperAdmin) {
            $canGoNext = false;
            $canGoPrev = false;
        }

        return [
            'can_go_next' => $canGoNext,
            'can_go_prev' => $canGoPrev,
            'next_params' => $nextParams,
            'prev_params' => $prevParams,
        ];
    }

    /**
     * Get human-readable period label.
     */
    private function getPeriodLabel(string $view, int $year, int $month, int $day): string
    {
        return match ($view) {
            'today' => now()->year($year)->month($month)->day($day)->format('F j, Y'),
            'monthly' => now()->year($year)->month($month)->format('F Y'),
            'yearly' => $year . ' Year',
            default => '',
        };
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $departments = Department::with(['headDoctor'])->withCount(['doctors', 'appointments', 'services'])
            ->paginate(10);

        return Inertia::render('Department/Index', [
            'departments' => $departments
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $doctors = Doctor::select('id', 'doctor_id', 'full_name', 'specialization')
            ->orderBy('full_name')
            ->get()
            ->map(function ($doctor) {
                // Split full_name into first_name and last_name for frontend compatibility
                $nameParts = explode(' ', $doctor->full_name, 2);
                return [
                    'id' => $doctor->id,
                    'doctor_id' => $doctor->doctor_id,
                    'first_name' => $nameParts[0] ?? '',
                    'last_name' => $nameParts[1] ?? '',
                    'specialization' => $doctor->specialization,
                ];
            });

        return Inertia::render('Department/Create', [
            'doctors' => $doctors
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:departments,name',
            'description' => 'nullable|string',
            'head_doctor_id' => 'nullable|exists:doctors,id',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        Department::create($validator->validated());

        return redirect()->route('departments.index')
            ->with('success', 'Department created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): Response
    {
        $department = Department::with(['headDoctor', 'doctors', 'appointments', 'services'])->findOrFail($id);

        $department->services->each->append('final_cost');

        return Inertia::render('Department/Show', [
            'department' => $department
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id): Response
    {
        $department = Department::findOrFail($id);
        
        $doctors = Doctor::select('id', 'doctor_id', 'full_name', 'specialization')
            ->orderBy('full_name')
            ->get()
            ->map(function ($doctor) {
                // Split full_name into first_name and last_name for frontend compatibility
                $nameParts = explode(' ', $doctor->full_name, 2);
                return [
                    'id' => $doctor->id,
                    'doctor_id' => $doctor->doctor_id,
                    'first_name' => $nameParts[0] ?? '',
                    'last_name' => $nameParts[1] ?? '',
                    'specialization' => $doctor->specialization,
                ];
            });

        return Inertia::render('Department/Edit', [
            'department' => $department,
            'doctors' => $doctors
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $department = Department::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:departments,name,' . $id,
            'description' => 'nullable|string',
            'head_doctor_id' => 'nullable|exists:doctors,id',
            'phone' => 'nullable|string|max:20',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $department->update($validator->validated());

        return redirect()->route('departments.index')
            ->with('success', 'Department updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $department = Department::findOrFail($id);

        // Check if department has related records before deletion
        if ($department->doctors()->count() > 0 || $department->appointments()->count() > 0) {
            return redirect()->back()
                ->with('error', 'Cannot delete department with associated doctors or appointments.');
        }

        $department->delete();

        return redirect()->route('departments.index')
            ->with('success', 'Department deleted successfully.');
    }
}