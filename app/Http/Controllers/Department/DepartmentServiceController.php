<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        // Check permission
        if (!auth()->user()?->hasPermission('view-departments')) {
            abort(403, 'Unauthorized access');
        }

        $search = $request->input('search', '');
        $departmentFilter = $request->input('department', '');
        $statusFilter = $request->input('status', '');
        $perPage = $request->input('per_page', 10);

        $query = DepartmentService::with('department');

        // Apply search filter
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply department filter
        if ($departmentFilter) {
            $query->where('department_id', $departmentFilter);
        }

        // Apply status filter
        if ($statusFilter !== '') {
            $query->where('is_active', $statusFilter === 'active');
        }

        $services = $query->orderBy('created_at', 'desc')
            ->paginate($perPage)
            ->appends($request->query());

        // Get all departments for filter dropdown
        $departments = Department::orderBy('name')->get();

        return Inertia::render('DepartmentService/Index', [
            'services' => $services,
            'departments' => $departments,
            'filters' => [
                'search' => $search,
                'department' => $departmentFilter,
                'status' => $statusFilter,
                'per_page' => $perPage,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request, Department $department): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'base_cost' => 'required|numeric|min:0',
            'fee_percentage' => 'nullable|numeric|min:0|max:100',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $department->services()->create($validator->validated());

        return redirect()->back()
            ->with('success', 'Service added to department successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, DepartmentService $service): RedirectResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'base_cost' => 'required|numeric|min:0',
            'fee_percentage' => 'nullable|numeric|min:0|max:100',
            'discount_percentage' => 'nullable|numeric|min:0|max:100',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return redirect()->back()
                ->withErrors($validator)
                ->withInput();
        }

        $service->update($validator->validated());

        return redirect()->back()
            ->with('success', 'Department service updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(DepartmentService $service): RedirectResponse
    {
        $service->delete();

        return redirect()->back()
            ->with('success', 'Service removed from department successfully.');
    }
}
