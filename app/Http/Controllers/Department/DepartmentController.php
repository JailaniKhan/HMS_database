<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Validator;

class DepartmentController extends Controller
{
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