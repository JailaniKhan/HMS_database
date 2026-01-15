<?php

namespace App\Http\Controllers\Patient;

use App\Http\Controllers\Controller;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class PatientController extends Controller
{
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
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'required|in:male,female,other',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);


        DB::beginTransaction();
        try {
            
            // Create a user for the patient
            $username = strtolower($request->first_name . '.' . $request->last_name . '.' . time());
           
            $user = User::create([
                'name' => $request->first_name . ' ' . $request->last_name,
                'username' => $username,
                'password' => 'password', // Default password - will be automatically hashed by model cast
                'role' => 'patient',
            ]);
            

            // Generate a unique patient ID
            $year = date('Y');
            $lastPatient = Patient::where('patient_id', 'LIKE', 'P' . $year . '%')
                ->orderByRaw('CAST(SUBSTRING(patient_id, ' . (strlen($year) + 2) . ') AS UNSIGNED) DESC')
                ->first();
            
            if ($lastPatient) {
                $lastNumber = (int) substr($lastPatient->patient_id, strlen('P' . $year));
                $nextNumber = $lastNumber + 1;
            } else {
                $nextNumber = 1;
            }
            
            $patientId = 'P' . $year . str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
            
            
            // Create patient record
            $patient = Patient::create([
                'patient_id' => $patientId,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'gender' => $request->gender,
                'phone' => $request->phone,
                'address' => $request->address,
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
        return Inertia::render('Patient/Show', [
            'patient' => $patient
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
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'gender' => 'required|in: male,female,other',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
        ]);

        $patient = Patient::findOrFail($id);
        $user = $patient->user;

        // Update user information
        $user->update([
            'name' => $request->first_name . ' ' . $request->last_name,
        ]);

        // Update patient information
        $patient->update([
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'gender' => $request->gender,
            'phone' => $request->phone,
            'address' => $request->address,
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
