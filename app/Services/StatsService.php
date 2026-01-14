<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Patient;
use App\Models\Doctor;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class StatsService
{
    /**
     * Get daily patient statistics
     */
    public function getDailyPatientStats(?string $date = null): array
    {
        $date = $date ? Carbon::parse($date) : Carbon::today();
        
        $startOfDay = $date->startOfDay();
        $endOfDay = $date->endOfDay();

        // Count appointments for the day
        $dailyAppointments = Appointment::whereBetween('appointment_date', [$startOfDay, $endOfDay])
            ->count();

        // Count new patients registered today
        $newPatients = Patient::whereDate('created_at', $date)
            ->count();

        // Count appointments by status
        $appointmentsByStatus = Appointment::whereDate('appointment_date', $date)
            ->selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return [
            'date' => $date->toDateString(),
            'daily_appointments' => $dailyAppointments,
            'new_patients' => $newPatients,
            'appointments_by_status' => $appointmentsByStatus,
            'total_appointments' => Appointment::count(),
            'total_patients' => Patient::count(),
        ];
    }

    /**
     * Get monthly patient statistics
     */
    public function getMonthlyPatientStats(?string $month = null): array
    {
        $date = $month ? Carbon::parse($month) : Carbon::now();
        $startOfMonth = $date->startOfMonth();
        $endOfMonth = $date->endOfMonth();

        $monthlyAppointments = Appointment::whereBetween('appointment_date', [$startOfMonth, $endOfMonth])
            ->count();

        $newPatients = Patient::whereBetween('created_at', [$startOfMonth, $endOfMonth])
            ->count();

        return [
            'month' => $date->format('Y-m'),
            'monthly_appointments' => $monthlyAppointments,
            'new_patients' => $newPatients,
            'average_daily_appointments' => $monthlyAppointments > 0 ? round($monthlyAppointments / $date->daysInMonth, 2) : 0,
        ];
    }

    /**
     * Get doctor workload statistics
     */
    public function getDoctorWorkloadStats(?string $date = null): array
    {
        $date = $date ? Carbon::parse($date) : Carbon::today();
        $startOfDay = $date->startOfDay();
        $endOfDay = $date->endOfDay();

        $workload = Appointment::whereBetween('appointment_date', [$startOfDay, $endOfDay])
            ->join('doctors', 'appointments.doctor_id', '=', 'doctors.id')
            ->selectRaw('doctors.name, doctors.specialization, COUNT(*) as appointment_count')
            ->groupBy('doctors.id', 'doctors.name', 'doctors.specialization')
            ->orderByDesc('appointment_count')
            ->get();

        return [
            'date' => $date->toDateString(),
            'workload' => $workload,
        ];
    }

    /**
     * Get weekly patient trend
     */
    public function getWeeklyPatientTrend(): array
    {
        $weekData = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = Carbon::now()->subDays($i);
            $dayStart = $day->startOfDay();
            $dayEnd = $day->endOfDay();

            $appointments = Appointment::whereBetween('appointment_date', [$dayStart, $dayEnd])
                ->count();

            $newPatients = Patient::whereDate('created_at', $day)
                ->count();

            $weekData[] = [
                'date' => $day->toDateString(),
                'day_name' => $day->shortDayName,
                'appointments' => $appointments,
                'new_patients' => $newPatients,
            ];
        }

        return $weekData;
    }

    /**
     * Get growth metrics for monitoring database scaling needs
     */
    public function getGrowthMetrics(): array
    {
        $currentMonth = Carbon::now()->month;
        $currentYear = Carbon::now()->year;

        return [
            'patients_this_month' => Patient::whereYear('created_at', $currentYear)
                ->whereMonth('created_at', $currentMonth)
                ->count(),
            'appointments_this_month' => Appointment::whereYear('appointment_date', $currentYear)
                ->whereMonth('appointment_date', $currentMonth)
                ->count(),
            'avg_appointments_per_patient' => round(Appointment::count() / max(Patient::count(), 1), 2),
            'database_size_mb' => $this->getDatabaseSize(),
            'largest_tables' => $this->getLargestTables(),
            'growth_rate_last_3_months' => $this->calculateGrowthRate(3),
        ];
    }

    /**
     * Get database size in MB
     */
    private function getDatabaseSize(): float
    {
        $result = DB::select("
            SELECT ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) as size_mb
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
        ");

        return $result[0]->size_mb ?? 0;
    }

    /**
     * Get largest tables
     */
    private function getLargestTables(): array
    {
        return DB::select("
            SELECT table_name, table_rows,
                   ROUND((data_length + index_length) / 1024 / 1024, 2) as size_mb
            FROM information_schema.tables
            WHERE table_schema = DATABASE()
            ORDER BY (data_length + index_length) DESC
            LIMIT 5
        ");
    }

    /**
     * Calculate growth rate over last N months
     */
    private function calculateGrowthRate(int $months): float
    {
        $current = Patient::where('created_at', '>=', Carbon::now()->subMonths($months))->count();
        $previous = Patient::whereBetween('created_at', [
            Carbon::now()->subMonths($months * 2),
            Carbon::now()->subMonths($months)
        ])->count();

        if ($previous == 0) return 0;

        return round((($current - $previous) / $previous) * 100, 2);
    }
}