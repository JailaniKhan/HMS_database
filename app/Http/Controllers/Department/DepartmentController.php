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

        // Calculate yearly revenue (always from all appointments in the current year)
        // grand_total is a PHP accessor, not a DB column, so we compute it via raw SQL:
        // For appointments WITH services: sum of appointment_services.final_cost
        // For appointments WITHOUT services: fee - discount
        $yearlyAppointments = Appointment::with('services')
            ->whereYear('appointment_date', now()->year)
            ->get();
        $yearlyRevenue = $yearlyAppointments->sum(function ($appt) {
            if ($appt->services->isNotEmpty()) {
                return (float) $appt->services->sum('pivot.final_cost');
            }
            return max(0, (float) ($appt->fee ?? 0) - (float) ($appt->discount ?? 0));
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
                'yearly_revenue' => (float) $yearlyRevenue,
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
            'today' => \Carbon\Carbon::createFromDate($year, $month, $day)->startOfDay(),
            'monthly' => \Carbon\Carbon::createFromDate($year, $month, 1)->startOfMonth(),
            'yearly' => \Carbon\Carbon::createFromDate($year, 1, 1)->startOfYear(),
            default => \Carbon\Carbon::createFromDate($year, $month, $day)->startOfDay(),
        };

        $end = match ($view) {
            'today' => \Carbon\Carbon::createFromDate($year, $month, $day)->endOfDay(),
            'monthly' => \Carbon\Carbon::createFromDate($year, $month, 1)->endOfMonth(),
            'yearly' => \Carbon\Carbon::createFromDate($year, 1, 1)->endOfYear(),
            default => \Carbon\Carbon::createFromDate($year, $month, $day)->endOfDay(),
        };

        return [
            'start' => $start,
            'end' => $end,
        ];
    }

    /**
     * Transform appointments with services for display - grouped by appointment with expandable services.
     */
    private function transformAppointmentsWithServices($appointments): array
    {
        $result = [];

        foreach ($appointments as $appointment) {
            // Collect all services for this appointment
            $services = [];
            
            if ($appointment->services->isNotEmpty()) {
                foreach ($appointment->services as $service) {
                    $services[] = [
                        'id' => $service->id,
                        'name' => $service->name,
                        'custom_cost' => (float) $service->pivot->custom_cost,
                        'discount_percentage' => (float) $service->pivot->discount_percentage,
                        'final_cost' => (float) $service->pivot->final_cost,
                    ];
                }
            }
            
            // If no services, add a default consultation fee
            if (empty($services)) {
                $services[] = [
                    'id' => null,
                    'name' => 'Consultation Fee',
                    'custom_cost' => (float) $appointment->fee,
                    'discount_percentage' => 0,
                    'final_cost' => (float) $appointment->grand_total,
                ];
            }
            
            // Build the appointment row with all services
            $result[] = [
                'id' => $appointment->id,
                'appointment_id' => $appointment->appointment_id,
                'appointment_date' => $appointment->appointment_date->format('Y-m-d H:i:s'),
                'status' => $appointment->status,
                'patient' => $appointment->patient ? [
                    'id' => $appointment->patient->id,
                    'name' => $appointment->patient->full_name,
                ] : null,
                'doctor' => $appointment->doctor ? [
                    'id' => $appointment->doctor->id,
                    'name' => 'Dr. ' . $appointment->doctor->full_name,
                ] : null,
                'department' => $appointment->department ? [
                    'id' => $appointment->department->id,
                    'name' => $appointment->department->name,
                ] : null,
                'services' => $services,
                'services_count' => count($services),
                'grand_total' => (float) $appointment->grand_total,
                'fee' => (float) $appointment->fee,
                'discount' => (float) $appointment->discount,
            ];
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
     * Uses Carbon date arithmetic to properly handle month/year rollovers.
     */
    private function getNavigationBounds(string $view, int $year, int $month, int $day, bool $isSuperAdmin): array
    {
        $current = now();
        $canGoNext = false;
        $canGoPrev = true;

        $nextParams = [];
        $prevParams = [];

        switch ($view) {
            case 'today':
                $date = \Carbon\Carbon::createFromDate($year, $month, $day);
                $nextDate = $date->copy()->addDay();
                $prevDate = $date->copy()->subDay();
                $nextParams = ['year' => $nextDate->year, 'month' => $nextDate->month, 'day' => $nextDate->day];
                $prevParams = ['year' => $prevDate->year, 'month' => $prevDate->month, 'day' => $prevDate->day];
                // Can go next only if the current date is before today
                $canGoNext = $date->startOfDay()->lt($current->copy()->startOfDay());
                $canGoPrev = true;
                break;

            case 'monthly':
                $date = \Carbon\Carbon::createFromDate($year, $month, 1);
                $nextDate = $date->copy()->addMonth();
                $prevDate = $date->copy()->subMonth();
                $nextParams = ['year' => $nextDate->year, 'month' => $nextDate->month];
                $prevParams = ['year' => $prevDate->year, 'month' => $prevDate->month];
                // Can go next only if the current month is before this month
                $canGoNext = $date->startOfMonth()->lt($current->copy()->startOfMonth());
                $canGoPrev = true;
                break;

            case 'yearly':
                $nextParams = ['year' => $year + 1];
                $prevParams = ['year' => $year - 1];
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
        $department = Department::with(['headDoctor', 'doctors', 'appointments', 'services.doctor'])->findOrFail($id);

        $department->services->each->append(['final_cost', 'doctor_amount']);

        $doctors = Doctor::select('id', 'doctor_id', 'full_name', 'specialization')
            ->orderBy('full_name')
            ->get()
            ->map(fn($doctor) => [
                'id' => $doctor->id,
                'full_name' => $doctor->full_name,
                'specialization' => $doctor->specialization,
            ]);

        return Inertia::render('Department/Show', [
            'department' => $department,
            'doctors' => $doctors,
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