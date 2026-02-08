<?php

namespace App\Http\Controllers\Doctor;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\User;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class DoctorController extends Controller
{
    /**
     * Check if the current user can access doctor management
     */
    private function authorizeDoctorAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-doctors')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if the current user can modify doctor records
     */
    private function authorizeDoctorModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-doctors')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Sanitize input data to prevent XSS
     */
    private function sanitizeInput(array $data): array
    {
        return [
            'full_name' => htmlspecialchars(strip_tags($data['full_name'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'father_name' => htmlspecialchars(strip_tags($data['father_name'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'specialization' => htmlspecialchars(strip_tags($data['specialization'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'bio' => htmlspecialchars(strip_tags($data['bio'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'address' => htmlspecialchars(strip_tags($data['address'] ?? ''), ENT_QUOTES, 'UTF-8'),
            'phone_number' => preg_replace('/[^0-9+\-\s\(\)]/', '', $data['phone_number'] ?? ''),
            'age' => filter_var($data['age'] ?? null, FILTER_VALIDATE_INT),
            'fees' => filter_var($data['fees'] ?? 0, FILTER_VALIDATE_FLOAT),
            'salary' => filter_var($data['salary'] ?? 0, FILTER_VALIDATE_FLOAT),
            'bonus' => filter_var($data['bonus'] ?? 0, FILTER_VALIDATE_FLOAT),
            'department_id' => filter_var($data['department_id'] ?? null, FILTER_VALIDATE_INT),
        ];
    }

    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $this->authorizeDoctorAccess();
        
        $doctors = Doctor::with('user', 'department')->paginate(10);
        return Inertia::render('Doctor/Index', [
            'doctors' => $doctors
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $this->authorizeDoctorModify();
        
        $departments = Department::all();
        return Inertia::render('Doctor/Create', [
            'departments' => $departments
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorizeDoctorModify();
        
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'age' => 'nullable|integer|min:18|max:100',
            'specialization' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address' => 'nullable|string',
            'bio' => 'nullable|string',
            'fees' => 'required|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'salary' => 'nullable|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'bonus' => 'nullable|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'department_id' => 'required|exists:departments,id',
        ]);

        // Sanitize input data
        $sanitized = $this->sanitizeInput($validated);

        DB::beginTransaction();
        try {
            // Generate a unique username from the doctor's name
            $baseUsername = strtolower(str_replace(' ', '.', $sanitized['full_name']));
            $username = $baseUsername;
            $counter = 1;
            
            // Ensure username is unique
            while (User::where('username', $username)->exists()) {
                $username = $baseUsername . $counter;
                $counter++;
            }
            
            // Create a user for the doctor
            $user = User::create([
                'name' => $sanitized['full_name'],
                'username' => $username,
                'password' => bcrypt(\Illuminate\Support\Str::random(12)),
                'role' => 'doctor',
            ]);

            // Create doctor record with sanitized data
            $doctor = Doctor::create([
                'doctor_id' => 'D' . date('Y') . str_pad(
                    Doctor::whereYear('created_at', date('Y'))->count() + 1,
                    5, '0', STR_PAD_LEFT
                ),
                'full_name' => $sanitized['full_name'],
                'father_name' => $sanitized['father_name'],
                'age' => $sanitized['age'],
                'specialization' => $sanitized['specialization'],
                'phone_number' => $sanitized['phone_number'],
                'address' => $sanitized['address'],
                'bio' => $sanitized['bio'],
                'fees' => $sanitized['fees'],
                'salary' => $sanitized['salary'],
                'bonus' => $sanitized['bonus'],
                'user_id' => $user->id,
                'department_id' => $sanitized['department_id'],
            ]);

            DB::commit();

            return redirect()->route('doctors.index')->with('success', 'Doctor created successfully.');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withInput()->withErrors(['error' => 'Failed to create doctor: ' . $e->getMessage()]);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Doctor $doctor): Response
    {
        $this->authorizeDoctorAccess();
        
        $doctor->load('user', 'department');
        return Inertia::render('Doctor/Show', [
            'doctor' => $doctor
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Doctor $doctor): Response
    {
        $this->authorizeDoctorModify();
        
        $doctor->load('user', 'department');
        $departments = Department::all();
        return Inertia::render('Doctor/Edit', [
            'doctor' => $doctor,
            'departments' => $departments
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Doctor $doctor): RedirectResponse
    {
        $this->authorizeDoctorModify();
        
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'father_name' => 'nullable|string|max:255',
            'age' => 'nullable|integer|min:18|max:100',
            'specialization' => 'required|string|max:255',
            'phone_number' => 'required|string|max:20',
            'address' => 'nullable|string',
            'bio' => 'nullable|string',
            'fees' => 'required|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'salary' => 'nullable|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'bonus' => 'nullable|numeric|min:0|regex:/^\d+(\.\d{1,2})?$/',
            'department_id' => 'required|exists:departments,id',
        ]);

        // Sanitize input data
        $sanitized = $this->sanitizeInput($validated);

        $user = $doctor->user;

        // Update user information
        $user->update([
            'name' => $sanitized['full_name'],
        ]);

        // Update doctor information with sanitized data
        $doctor->update([
            'full_name' => $sanitized['full_name'],
            'father_name' => $sanitized['father_name'],
            'age' => $sanitized['age'],
            'specialization' => $sanitized['specialization'],
            'phone_number' => $sanitized['phone_number'],
            'address' => $sanitized['address'],
            'bio' => $sanitized['bio'],
            'fees' => $sanitized['fees'],
            'salary' => $sanitized['salary'],
            'bonus' => $sanitized['bonus'],
            'department_id' => $sanitized['department_id'],
        ]);

        return redirect()->route('doctors.index')->with('success', 'Doctor updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Doctor $doctor): RedirectResponse
    {
        $this->authorizeDoctorModify();
        
        // Prevent deletion if user lacks delete permission specifically
        if (!auth()->user()?->hasPermission('delete-doctors')) {
            abort(403, 'Unauthorized access');
        }
        
        $user = $doctor->user;

        DB::beginTransaction();
        try {
            $doctor->delete();
            $user->delete(); // This will cascade due to foreign key constraint

            DB::commit();
            return redirect()->route('doctors.index')->with('success', 'Doctor deleted successfully.');
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withErrors(['error' => 'Failed to delete doctor: ' . $e->getMessage()]);
        }
    }
}
