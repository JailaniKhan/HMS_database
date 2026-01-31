<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\LabTestResult;
use App\Models\LabTest;
use App\Models\Patient;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LabTestResultController extends Controller
{
    /**
     * Display a listing of the lab test results.
     */
    public function index(): Response
    {
        $user = Auth::user();
        
        // Check if user has appropriate permission
        if (!$user->isSuperAdmin() && !$user->hasPermission('view-laboratory')) {
            abort(403, 'Unauthorized access');
        }
        
        $labTestResults = LabTestResult::with('test', 'patient')->latest()->paginate(10);
        
        // Get filter options
        $patients = Patient::select('id', 'patient_id', 'first_name', 'last_name')->get();
        $labTests = LabTest::select('id', 'test_code', 'name')->get();
        
        // Calculate stats
        $stats = [
            'total' => LabTestResult::count(),
            'pending' => LabTestResult::where('status', 'pending')->count(),
            'completed' => LabTestResult::where('status', 'completed')->count(),
            'verified' => LabTestResult::where('status', 'verified')->count(),
            'abnormal' => LabTestResult::where('status', 'abnormal')->count(),
            'critical' => LabTestResult::where('status', 'critical')->count(),
        ];
        
        return Inertia::render('Laboratory/LabTestResults/Index', [
            'labTestResults' => $labTestResults,
            'filters' => (object)[],
            'patients' => $patients,
            'labTests' => $labTests,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new lab test result.
     */
    public function create(): Response
    {
        $user = Auth::user();
        
// Check if user has appropriate permission
if (!$user->hasPermission('create-lab-test-results')) {
    abort(403, 'Unauthorized access');
}
        
        $labTests = LabTest::all();
        $patients = Patient::all();
        
        return Inertia::render('Laboratory/LabTestResults/Create', [
            'labTests' => $labTests,
            'patients' => $patients
        ]);
    }

    /**
     * Store a newly created lab test result in storage.
     */
    public function store(Request $request)
    {
        $user = Auth::user();
        
// Check if user has appropriate permission
if (!$user->hasPermission('create-lab-test-results')) {
    abort(403, 'Unauthorized access');
}
        
        $validator = Validator::make($request->all(), [
            'lab_test_id' => 'required|exists:lab_tests,id',
            'patient_id' => 'required|exists:patients,id',
            'test_date' => 'required|date',
            'result_values' => 'required|string',
            'status' => 'required|in:completed,pending,cancelled',
            'notes' => 'nullable|string',
        ]);
        
        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }
        
        LabTestResult::create([
            'lab_test_id' => $request->lab_test_id,
            'patient_id' => $request->patient_id,
            'test_date' => $request->test_date,
            'result_values' => $request->result_values,
            'status' => $request->status,
            'notes' => $request->notes,
            'performed_by' => $user->id,
        ]);
        
        return redirect()->route('laboratory.lab-test-results.index')->with('success', 'Lab test result created successfully.');
    }

    /**
     * Display the specified lab test result.
     */
public function show(LabTestResult $labTestResult): Response
{
    $user = Auth::user();
    
// Check if user has appropriate permission
if (!$user->hasPermission('view-laboratory')) {
    abort(403, 'Unauthorized access');
}
    
    return Inertia::render('Laboratory/LabTestResults/Show', [
        'labTestResult' => $labTestResult
    ]);
}

    /**
     * Show the form for editing the specified lab test result.
     */
public function edit(LabTestResult $labTestResult): Response
{
    $user = Auth::user();
    
// Check if user has appropriate permission
if (!$user->hasPermission('edit-lab-test-results')) {
    abort(403, 'Unauthorized access');
}
    
    $labTests = LabTest::all();
    $patients = Patient::all();
    
    return Inertia::render('Laboratory/LabTestResults/Edit', [
        'labTestResult' => $labTestResult,
        'labTests' => $labTests,
        'patients' => $patients
    ]);
}

    /**
     * Update the specified lab test result in storage.
     */
public function update(Request $request, LabTestResult $labTestResult): RedirectResponse
{
    $user = Auth::user();
    
// Check if user has appropriate permission
if (!$user->hasPermission('edit-lab-test-results')) {
    abort(403, 'Unauthorized access');
}
    
    $validator = Validator::make($request->all(), [
        'lab_test_id' => 'required|exists:lab_tests,id',
        'patient_id' => 'required|exists:patients,id',
        'performed_at' => 'required|date',
        'results' => 'required|string',
        'status' => 'required|in:pending,completed,verified',
        'notes' => 'nullable|string',
        'abnormal_flags' => 'nullable|string',
    ]);
    
    if ($validator->fails()) {
        return redirect()->back()->withErrors($validator)->withInput();
    }
    
    $labTestResult->update([
        'lab_test_id' => $request->lab_test_id,
        'patient_id' => $request->patient_id,
        'performed_at' => $request->performed_at,
        'results' => $request->results,
        'status' => $request->status,
        'notes' => $request->notes,
        'abnormal_flags' => $request->abnormal_flags,
    ]);
    
    return redirect()->route('laboratory.lab-test-results.index')->with('success', 'Lab test result updated successfully.');
}

    /**
     * Remove the specified lab test result from storage.
     */
public function destroy(LabTestResult $labTestResult): RedirectResponse
{
    $user = Auth::user();
    
// Check if user has appropriate permission
if (!$user->hasPermission('delete-lab-test-results')) {
    abort(403, 'Unauthorized access');
}
    
    $labTestResult->delete();
    
    return redirect()->route('laboratory.lab-test-results.index')->with('success', 'Lab test result deleted successfully.');
}

    /**
     * Search lab test results by patient or test name.
     */
    public function search(Request $request): Response
    {
        $user = Auth::user();
        
// Check if user has appropriate permission
if (!$user->hasPermission('view-laboratory')) {
    abort(403, 'Unauthorized access');
}
        
        $query = $request->input('query');
        $status = $request->input('status');
        
        $labTestResultsQuery = LabTestResult::with('labTest', 'patient');
        
        if ($query) {
            $labTestResultsQuery->whereHas('patient', function($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                  ->orWhere('phone', 'like', '%' . $query . '%');
            })
            ->orWhereHas('labTest', function($q) use ($query) {
                $q->where('name', 'like', '%' . $query . '%')
                  ->orWhere('category', 'like', '%' . $query . '%');
            });
        }
        
        if ($status) {
            $labTestResultsQuery->where('status', $status);
        }
        
        $labTestResults = $labTestResultsQuery->latest()->paginate(10);
        $statuses = ['completed', 'pending', 'cancelled'];
        
        return Inertia::render('Laboratory/LabTestResults/Index', [
            'labTestResults' => $labTestResults,
            'query' => $query,
            'status' => $status,
            'statuses' => $statuses
        ]);
    }
}