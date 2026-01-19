<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\LabTest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LabTestController extends Controller
{
    /**
     * Display a listing of the lab tests.
     */
    public function index(): Response
    {
        $user = Auth::user();

        // Debug logging
        \Log::debug('LabTestController index access attempt', [
            'user_id' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'has_view_laboratory_permission' => $user->hasPermission('view-laboratory'),
            'has_required_roles' => $user->hasAnyRole(['Hospital Admin', 'Laboratory Admin', 'Doctor']),
        ]);

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Laboratory Admin', 'Doctor'])) {
            \Log::warning('LabTestController index access denied - role check failed', [
                'user_id' => $user->id,
                'username' => $user->username,
                'role' => $user->role,
            ]);
            abort(403, 'Unauthorized access');
        }

        $labTests = LabTest::paginate(10);

        return Inertia::render('Laboratory/LabTests/Index', [
            'labTests' => $labTests
        ]);
    }

    /**
     * Show the form for creating a new lab test.
     */
    public function create(): Response
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        return Inertia::render('Laboratory/LabTests/Create');
    }

    /**
     * Store a newly created lab test in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:100',
            'normal_values' => 'nullable|string',
            'test_duration' => 'nullable|integer|min:0', // Duration in minutes
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        LabTest::create($validator->validated());

        return redirect()->route('laboratory.lab-tests.index')->with('success', 'Lab test created successfully.');
    }

    /**
     * Display the specified lab test.
     */
    public function show($id): Response
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Laboratory Admin', 'Doctor'])) {
            abort(403, 'Unauthorized access');
        }

        $labTest = LabTest::findOrFail($id);

        return Inertia::render('Laboratory/LabTests/Show', [
            'labTest' => $labTest
        ]);
    }

    /**
     * Show the form for editing the specified lab test.
     */
    public function edit($id): Response
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $labTest = LabTest::findOrFail($id);

        return Inertia::render('Laboratory/LabTests/Edit', [
            'labTest' => $labTest
        ]);
    }

    /**
     * Update the specified lab test in storage.
     */
    public function update(Request $request, $id): RedirectResponse
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $labTest = LabTest::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:100',
            'normal_values' => 'nullable|string',
            'test_duration' => 'nullable|integer|min:0',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        $labTest->update($validator->validated());

        return redirect()->route('laboratory.lab-tests.index')->with('success', 'Lab test updated successfully.');
    }

    /**
     * Remove the specified lab test from storage.
     */
    public function destroy($id): RedirectResponse
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        $labTest = LabTest::findOrFail($id);
        $labTest->delete();

        return redirect()->route('laboratory.lab-tests.index')->with('success', 'Lab test deleted successfully.');
    }

    /**
     * Search lab tests by name or category.
     */
    public function search(Request $request): Response
    {
        $user = Auth::user();

        // Check if user has appropriate role
        if (!$user->hasAnyRole(['Hospital Admin', 'Laboratory Admin', 'Doctor'])) {
            abort(403, 'Unauthorized access');
        }

        $query = $request->input('query');

        $labTests = LabTest::where('name', 'like', '%' . $query . '%')
                    ->orWhere('category', 'like', '%' . $query . '%')
                    ->orWhere('description', 'like', '%' . $query . '%')
                    ->paginate(10);

        return Inertia::render('Laboratory/LabTests/Index', [
            'labTests' => $labTests,
            'query' => $query
        ]);
    }
}
