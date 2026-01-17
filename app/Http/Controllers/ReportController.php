<?php

namespace App\Http\Controllers;

use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\LabTestResult;
use App\Models\Sale;
use App\Services\StatsService;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    protected StatsService $statsService;

    public function __construct(StatsService $statsService)
    {
        $this->statsService = $statsService;
    }
    /**
     * Generate patient report
     */
    public function patientReport()
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Super Admin', 'Sub Super Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $patients = Patient::with('appointments')->get();
        
        $pdf = Pdf::loadView('reports.patient-report', compact('patients'));
        return $pdf->download('patient-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate doctor report
     */
    public function doctorReport()
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Super Admin', 'Sub Super Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $doctors = Doctor::with('appointments')->get();
        
        $pdf = Pdf::loadView('reports.doctor-report', compact('doctors'));
        return $pdf->download('doctor-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate appointment report
     */
    public function appointmentReport()
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Super Admin', 'Sub Super Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $appointments = Appointment::with('patient', 'doctor')->get();
        
        $pdf = Pdf::loadView('reports.appointment-report', compact('appointments'));
        return $pdf->download('appointment-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate billing report
     */
    public function billingReport()
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Super Admin', 'Sub Super Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $bills = Bill::with('patient', 'items')->get();
        
        $pdf = Pdf::loadView('reports.billing-report', compact('bills'));
        return $pdf->download('billing-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate pharmacy sales report
     */
    public function pharmacySalesReport()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Super Admin', 'Sub Super Admin', 'Pharmacy Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $sales = Sale::with('items.medicine', 'user')->get();
        
        $pdf = Pdf::loadView('reports.pharmacy-sales-report', compact('sales'));
        return $pdf->download('pharmacy-sales-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Generate lab test report
     */
    public function labTestReport()
    {
        $user = Auth::user();
        
        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Super Admin', 'Sub Super Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }
        
        $labTestResults = LabTestResult::with('labTest', 'patient')->get();
        
        $pdf = Pdf::loadView('reports.lab-test-report', compact('labTestResults'));
        return $pdf->download('lab-test-report-' . now()->format('Y-m-d') . '.pdf');
    }

    /**
     * Show report dashboard
     */
    public function index(): Response
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Super Admin', 'Sub Super Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        return Inertia::render('Reports/Index');
    }

    /**
     * Get dashboard statistics
     */
    public function dashboardStats()
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Super Admin', 'Sub Super Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        // Get today's date
        $today = now()->toDateString();
        
        // Calculate stats
        $total_patients = Patient::count();
        $total_doctors = Doctor::count();
        $appointments_today = Appointment::whereDate('appointment_date', $today)->count();
        $revenue_today = Appointment::whereDate('appointment_date', $today)->sum('fee');
        
        // Get recent activities
        $recent_activities = [
            [
                'id' => 1,
                'title' => 'New Patient Registered',
                'description' => 'John Doe registered as a new patient',
                'time' => now()->subMinutes(10)->format('H:i A'),
                'type' => 'patient',
            ],
            [
                'id' => 2,
                'title' => 'Appointment Booked',
                'description' => 'Appointment scheduled for Jane Smith',
                'time' => now()->subMinutes(25)->format('H:i A'),
                'type' => 'appointment',
            ],
            [
                'id' => 3,
                'title' => 'Bill Generated',
                'description' => 'Bill #INV-001 generated for consultation',
                'time' => now()->subHour()->format('H:i A'),
                'type' => 'bill',
            ],
            [
                'id' => 4,
                'title' => 'New Doctor Added',
                'description' => 'Dr. Sarah Johnson joined the team',
                'time' => now()->subHours(2)->format('H:i A'),
                'type' => 'doctor',
            ],
        ];
        
        // Mock monthly data (in a real app, you'd calculate this from your database)
        $monthly_data = [
            ['month' => 'Jan', 'visits' => 120],
            ['month' => 'Feb', 'visits' => 190],
            ['month' => 'Mar', 'visits' => 150],
            ['month' => 'Apr', 'visits' => 210],
            ['month' => 'May', 'visits' => 180],
            ['month' => 'Jun', 'visits' => 240],
        ];
        
        // Mock department data (in a real app, you'd calculate this from your database)
        $department_data = [
            ['name' => 'Cardiology', 'value' => 25],
            ['name' => 'Neurology', 'value' => 20],
            ['name' => 'Orthopedics', 'value' => 15],
            ['name' => 'Pediatrics', 'value' => 18],
            ['name' => 'General', 'value' => 22],
        ];
        
        return Inertia::render('Dashboard', [
            'total_patients' => $total_patients,
            'total_doctors' => $total_doctors,
            'appointments_today' => $appointments_today,
            'revenue_today' => floatval($revenue_today),
            'recent_activities' => $recent_activities,
            'monthly_data' => $monthly_data,
            'department_data' => $department_data,
        ]);
    }

    /**
     * Get daily patient statistics
     */
    public function dailyStats()
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Super Admin', 'Sub Super Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $stats = $this->statsService->getDailyPatientStats();
        
        return Inertia::render('Reports/DailyStats', [
            'stats' => $stats
        ]);
    }

    /**
     * Get doctor workload statistics
     */
    public function doctorWorkload()
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Super Admin', 'Sub Super Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $workload = $this->statsService->getDoctorWorkloadStats();
        
        return Inertia::render('Reports/DoctorWorkload', [
            'workload' => $workload
        ]);
    }

    /**
     * Get weekly patient trend
     */
    public function weeklyTrend()
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Super Admin', 'Sub Super Admin', 'Reception Admin', 'Pharmacy Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $trend = $this->statsService->getWeeklyPatientTrend();
        
        return Inertia::render('Reports/WeeklyTrend', [
            'trend' => $trend
        ]);
    }
}