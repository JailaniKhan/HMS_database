<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\User;
use App\Models\Bill;
use App\Services\Billing\BillCalculationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PatientController extends Controller
{
    protected $calculationService;

    public function __construct(BillCalculationService $calculationService)
    {
        $this->calculationService = $calculationService;
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
        $request->validate([
            'first_name' => 'nullable|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female,other',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'age' => 'nullable|integer|min:0|max:150',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);


        DB::beginTransaction();
        try {
            
            // Create a user for the patient
            $username = strtolower(($request->first_name ?: 'patient') . '.' . time());
           
            $user = User::create([
                'name' => $request->first_name ?: 'Patient',
                'username' => $username,
                'password' => 'password', // Default password - will be automatically hashed by model cast
                'role' => 'patient',
            ]);
            

            // Generate a simple sequential patient ID starting from P00001
            $maxNumber = DB::selectOne("
                SELECT MAX(CAST(SUBSTRING(patient_id, 2) AS UNSIGNED)) as max_num
                FROM patients
                WHERE patient_id LIKE 'P%'
            ")-max_num ?? 0;

            $nextNumber = $maxNumber + 1;
            $patientId = 'P' . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
            
            
            // Create patient record
            $patient = Patient::create([
                'patient_id' => $patientId,
                'first_name' => $request->first_name,
                'father_name' => $request->father_name,
                'gender' => $request->gender,
                'phone' => $request->phone,
                'address' => $request->address,
                'age' => $request->age,
                'blood_group' => $request->blood_group,
                'user_id' => $user->id,
            ]);
            

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
    public function show(string $id): Response
    {
        $patient = Patient::with('user')->findOrFail($id);
        
        // Load billing history
        $bills = Bill::where('patient_id', $patient->id)
            ->with(['items', 'payments', 'primaryInsurance.insuranceProvider'])
            ->latest()
            ->get();
        
        // Calculate outstanding balance
        $outstandingBalance = Bill::where('patient_id', $patient->id)
            ->whereNull('voided_at')
            ->whereIn('payment_status', ['pending', 'partial'])
            ->sum('balance_due');
        
        // Calculate billing statistics
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
        
        // Get recent transactions
        $recentTransactions = collect();
        
        // Add bills as transactions
        foreach ($bills->take(5) as $bill) {
            $recentTransactions->push([
                'type' => 'bill',
                'title' => "Bill #{$bill->bill_number}",
                'amount' => $bill->total_amount,
                'date' => $bill->bill_date,
                'status' => $bill->payment_status,
            ]);
        }
        
        // Add payments as transactions
        foreach ($bills as $bill) {
            foreach ($bill->payments->take(3) as $payment) {
                $recentTransactions->push([
                    'type' => 'payment',
                    'title' => "Payment for Bill #{$bill->bill_number}",
                    'amount' => $payment->amount,
                    'date' => $payment->payment_date,
                    'status' => $payment->status,
                ]);
            }
        }
        
        // Sort transactions by date
        $recentTransactions = $recentTransactions
            ->sortByDesc('date')
            ->take(10)
            ->values();
        
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
    public function edit(string $id): Response
    {
        $patient = Patient::with('user')->findOrFail($id);
        return Inertia::render('Patient/Edit', [
            'patient' => $patient
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $request->validate([
            'first_name' => 'nullable|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'gender' => 'nullable|in:male,female,other',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'age' => 'nullable|integer|min:0|max:150',
            'blood_group' => 'nullable|string|in:A+,A-,B+,B-,AB+,AB-,O+,O-',
        ]);

        $patient = Patient::findOrFail($id);
        $user = $patient->user;

        // Update user information
        $user->update([
            'name' => $request->first_name ?: 'Patient',
        ]);

        // Update patient information
        $patient->update([
            'first_name' => $request->first_name,
            'father_name' => $request->father_name,
            'gender' => $request->gender,
            'phone' => $request->phone,
            'address' => $request->address,
            'age' => $request->age,
            'blood_group' => $request->blood_group,
        ]);

        return redirect()->route('patients.index')->with('success', 'Patient updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): RedirectResponse
    {
        $patient = Patient::findOrFail($id);
        $user = $patient->user;

        DB::beginTransaction();
        try {
            $patient->delete();
            $user->delete(); // This will cascade due to foreign key constraint

            DB::commit();
            return redirect()->route('patients.index')->with('success', 'Patient deleted successfully.');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withErrors(['error' => 'Failed to delete patient: ' . $e->getMessage()]);
        }
    }
}
