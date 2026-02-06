<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\User;
use App\Models\Bill;
use App\Services\Billing\BillCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PatientController extends Controller
{
    protected $calculationService;

    /**
     * Blood group validation
     */
    private function validateBloodGroup(?string $bloodGroup): ?string
    {
        $validGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
        return in_array($bloodGroup, $validGroups) ? $bloodGroup : null;
    }

    /**
     * Sanitize input data to prevent XSS attacks
     */
    private function sanitizeInput(array $data): array
    {
        return [
            'first_name' => strip_tags($data['first_name'] ?? ''),
            'father_name' => strip_tags($data['father_name'] ?? ''),
            'phone' => preg_replace('/[^0-9+]/', '', $data['phone'] ?? ''),
            'address' => strip_tags($data['address'] ?? ''),
            'age' => (int) ($data['age'] ?? 0),
            'gender' => in_array($data['gender'] ?? '', ['male', 'female', 'other'])
                ? $data['gender']
                : null,
            'blood_group' => $this->validateBloodGroup($data['blood_group'] ?? null),
        ];
    }

    public function __construct(BillCalculationService $calculationService)
    {
        $this->calculationService = $calculationService;
    }

    /**
     * Check if the current user can access this patient's data
     */
    private function userCanAccessPatient(Patient $patient): bool
    {
        $user = auth()->user();
        
        if (!$user) {
            return false;
        }
        
        // Super admin can access all patients
        if ($user->isSuperAdmin()) {
            return true;
        }
        
        // Users with broad permissions can access all patients
        if ($user->hasPermission('view-all-patients')) {
            return true;
        }
        
        // Owner access (patients viewing their own data in portal)
        if ($patient->user_id === $user->id) {
            return true;
        }
        
        // Staff with patient access permission
        return $user->hasPermission('view-patients');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $patients = Patient::with('user')->paginate(10);
        return Inertia::render('Patient/Index', [
            'patients' => $patients
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Patient/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female,other',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'age' => 'nullable|integer|min:0|max:150',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);

        $sanitizedData = $this->sanitizeInput($validated);

        DB::beginTransaction();
        try {
            // Generate a simple sequential patient ID starting from P00001
            $maxNumber = Patient::where('patient_id', 'LIKE', 'P%')
                ->selectRaw('MAX(CAST(SUBSTRING(patient_id, 2) AS UNSIGNED)) as max_num')
                ->value('max_num') ?? 0;

            $nextNumber = $maxNumber + 1;
            $patientId = 'P' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);

            // Create patient record with sanitized data
            $patient = Patient::create([
                'patient_id' => $patientId,
                'first_name' => $sanitizedData['first_name'],
                'father_name' => $sanitizedData['father_name'],
                'gender' => $sanitizedData['gender'],
                'phone' => $sanitizedData['phone'],
                'address' => $sanitizedData['address'],
                'age' => $sanitizedData['age'],
                'blood_group' => $sanitizedData['blood_group'],
            ]);
            
            // Create user account for patient with secure password
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->father_name,
                'username' => $patientId,
                'password' => bcrypt(Str::password(16, true, true, true, true)),
                'role' => 'patient',
            ]);
            
            // Associate user with patient
            $patient->user()->associate($user);
            $patient->save();
            

            DB::commit();

            return redirect()->route('patients.index')->with('success', 'Patient created successfully.');
        } catch (\Exception $e) {
            DB::rollback();
           
            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to create patient: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Patient $patient): Response
    {
        // Use proper eager loading with counts
        $bills = Bill::where('patient_id', $patient->id)
            ->with(['items', 'payments', 'primaryInsurance.insuranceProvider'])
            ->withCount(['payments as completed_payments_sum' => function($query) {
                $query->where('status', 'completed');
            }])
            ->latest()
            ->get();
        
        // Process transactions efficiently using flatMap
        $recentTransactions = $bills->flatMap(function ($bill) {
            $transactions = [];
            
            // Add bill as transaction
            $transactions[] = [
                'type' => 'bill',
                'title' => "Bill #{$bill->bill_number}",
                'amount' => $bill->total_amount,
                'date' => $bill->bill_date,
                'status' => $bill->payment_status,
            ];
            
            // Add payments (limited to 3 per bill)
            foreach ($bill->payments->take(3) as $payment) {
                $transactions[] = [
                    'type' => 'payment',
                    'title' => "Payment for Bill #{$bill->bill_number}",
                    'amount' => $payment->amount,
                    'date' => $payment->payment_date,
                    'status' => $payment->status,
                ];
            }
            
            return $transactions;
        })->sortByDesc('date')->take(10)->values();
        
        // Calculate outstanding balance using subquery for efficiency
        $outstandingBalance = Bill::where('patient_id', $patient->id)
            ->whereNull('voided_at')
            ->whereIn('payment_status', ['pending', 'partial'])
            ->sum('balance_due');
        
        // Calculate billing statistics efficiently
        $billingStats = [
            'total_bills' => Bill::where('patient_id', $patient->id)->count(),
            'total_amount' => Bill::where('patient_id', $patient->id)
                ->whereNull('voided_at')
                ->sum('total_amount'),
            'total_paid' => Bill::where('patient_id', $patient->id)
                ->whereNull('voided_at')
                ->sum('amount_paid'),
            'outstanding_balance' => $outstandingBalance,
            'overdue_bills' => Bill::where('patient_id', $patient->id)
                ->whereNull('voided_at')
                ->where('due_date', '<', now())
                ->whereIn('payment_status', ['pending', 'partial'])
                ->count(),
        ];
        
        return Inertia::render('Patient/Show', [
            'patient' => $patient,
            'billing' => [
                'bills' => $bills,
                'stats' => $billingStats,
                'recent_transactions' => $recentTransactions,
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Patient $patient): Response
    {
    
        
        // IDOR Protection - verify access before showing data
        if (!$this->userCanAccessPatient($patient)) {
            abort(403, 'Unauthorized access to patient record');
        }
        
        return Inertia::render('Patient/Edit', [
            'patient' => $patient
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Patient $patient)
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female,other',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'age' => 'nullable|integer|min:0|max:150',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);

        $sanitizedData = $this->sanitizeInput($validated);

        // Update user information if user exists
        if ($patient->user) {
            $patient->user->update([
                'name' => $sanitizedData['first_name'] ?: 'Patient',
            ]);
        }

        // Update patient information with sanitized data
        $patient->update([
            'first_name' => $sanitizedData['first_name'],
            'father_name' => $sanitizedData['father_name'],
            'gender' => $sanitizedData['gender'],
            'phone' => $sanitizedData['phone'],
            'address' => $sanitizedData['address'],
            'age' => $sanitizedData['age'],
            'blood_group' => $sanitizedData['blood_group'],
        ]);

        // Return Inertia response for SPA behavior - redirect back to edit page with success message
        return redirect()->back()->with('success', 'Patient updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Patient $patient): RedirectResponse
    {
        DB::beginTransaction();
        try {
            $patient->delete();
            $patient->user->delete(); // This will cascade due to foreign key constraint

            DB::commit();
            return redirect()->route('patients.index')->with('success', 'Patient deleted successfully.');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withErrors(['error' => 'Failed to delete patient: ' . $e->getMessage()]);
        }
    }
}
