<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Models\LabTest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LabTestController extends Controller
{
    /**
     * Display the laboratory dashboard.
     */
    public function dashboard(): Response
    {
        $user = Auth::user();

        if (!$user->isSuperAdmin() && !$user->hasPermission('view-laboratory')) {
            abort(403, 'Unauthorized access');
        }

        // Get statistics for dashboard
        $totalTests = LabTest::count();
        $activeTests = LabTest::where('status', 'active')->count();
        $inactiveTests = LabTest::where('status', 'inactive')->count();

        // Get recent lab test requests
        $recentRequests = \App\Models\LabTestRequest::with(['patient', 'doctor'])
            ->latest()
            ->take(5)
            ->get();

        // Get recent results
        $recentResults = \App\Models\LabTestResult::with(['patient', 'test'])
            ->latest()
            ->take(5)
            ->get();

        // Get pending requests count
        $pendingRequests = \App\Models\LabTestRequest::where('status', 'pending')->count();
        $inProgressRequests = \App\Models\LabTestRequest::where('status', 'in_progress')->count();
        $completedRequests = \App\Models\LabTestRequest::where('status', 'completed')->count();

        // Get critical/abnormal results count
        $criticalResults = \App\Models\LabTestResult::where('status', 'critical')->count();
        $abnormalResults = \App\Models\LabTestResult::where('status', 'abnormal')->count();

        // Build activities array from recent requests and results
        $activities = [];
        foreach ($recentRequests as $request) {
            $activities[] = [
                'id' => 'req_' . $request->id,
                'type' => 'request',
                'title' => 'New Test Request',
                'description' => $request->test_name . ' for ' . ($request->patient->first_name ?? 'Unknown'),
                'timestamp' => $request->created_at->toISOString(),
                'status' => $request->status,
                'priority' => $request->test_type,
            ];
        }
        foreach ($recentResults as $result) {
            $activities[] = [
                'id' => 'res_' . $result->id,
                'type' => 'result',
                'title' => 'Test Result Added',
                'description' => ($result->test->name ?? 'Unknown Test') . ' for ' . ($result->patient->first_name ?? 'Unknown'),
                'timestamp' => $result->created_at->toISOString(),
                'status' => $result->status,
            ];
        }
        // Sort activities by timestamp
        usort($activities, function($a, $b) {
            return strtotime($b['timestamp']) - strtotime($a['timestamp']);
        });
        $activities = array_slice($activities, 0, 10);

        // Get STAT requests count
        $statRequests = \App\Models\LabTestRequest::where('test_type', 'stat')
            ->whereIn('status', ['pending', 'in_progress'])
            ->count();

        return Inertia::render('Laboratory/Index', [
            'stats' => [
                'totalTests' => $totalTests,
                'activeTests' => $activeTests,
                'inactiveTests' => $inactiveTests,
                'pendingRequests' => $pendingRequests,
                'inProgressRequests' => $inProgressRequests,
                'completedRequests' => $completedRequests,
                'criticalResults' => $criticalResults,
                'abnormalResults' => $abnormalResults,
            ],
            'recentRequests' => $recentRequests,
            'recentResults' => $recentResults,
            'activities' => $activities,
            'criticalResults' => $criticalResults,
            'statRequests' => $statRequests,
        ]);
    }

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
            'has_required_roles' => $user->hasAnyRole(['Hospital Admin', 'Laboratory Admin']),
        ]);

// Check if user has appropriate permission (super admin bypass)
if (!$user->isSuperAdmin() && !$user->hasPermission('view-laboratory')) {
    \Log::warning('LabTestController index access denied - permission check failed', [
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

// Check if user has appropriate permission (super admin bypass)
if (!$user->isSuperAdmin() && !$user->hasPermission('create-lab-tests')) {
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

        // Check if user has appropriate role (super admin bypass)
        if (!$user->isSuperAdmin() && !$user->hasAnyRole(['Hospital Admin', 'Laboratory Admin'])) {
            abort(403, 'Unauthorized access');
        }

        // Log incoming request data for debugging
        Log::debug('LabTestController store - incoming request data', [
            'all_input' => $request->all(),
        ]);

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255',
            'description' => 'nullable|string',
            'cost' => 'required|numeric|min:0',
            'category' => 'required|string|max:100',
            'turnaround_time' => 'required|integer|min:1',
            'unit' => 'nullable|string|max:100',
            'normal_values' => 'nullable|string',
            'procedure' => 'nullable|string',
            'status' => 'required|string|in:active,inactive',
        ]);

        if ($validator->fails()) {
            Log::warning('LabTestController store - validation failed', [
                'errors' => $validator->errors()->toArray(),
            ]);
            return redirect()->back()->withErrors($validator)->withInput();
        }

        // Use the code from the request or generate one
        $testCode = $request->input('code') ?: $this->generateTestCode($request->input('name'));

        // Map frontend field names to database field names
        $validatedData = [
            'test_code' => $testCode,
            'name' => $request->input('name'),
            'description' => $request->input('description'),
            'cost' => $request->input('cost'),
            'procedure' => $request->input('procedure'),
            'turnaround_time' => $request->input('turnaround_time'),
            'unit' => $request->input('unit'),
            'normal_values' => $request->input('normal_values'),
            'status' => $request->input('status'),
        ];

        Log::debug('LabTestController store - data to be created', [
            'validatedData' => $validatedData,
        ]);

        try {
            $labTest = LabTest::create($validatedData);
            Log::info('LabTestController store - lab test created successfully', [
                'lab_test_id' => $labTest->id,
                'test_code' => $labTest->test_code,
            ]);
        } catch (\Exception $e) {
            Log::error('LabTestController store - failed to create lab test', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return redirect()->back()->with('error', 'Failed to create lab test: ' . $e->getMessage())->withInput();
        }

        return redirect()->route('laboratory.lab-tests.index')->with('success', 'Lab test created successfully.');
    }

    /**
     * Display the specified lab test.
     */
public function show(LabTest $labTest): Response
{
    $user = Auth::user();

// Check if user has appropriate permission (super admin bypass)
if (!$user->isSuperAdmin() && !$user->hasPermission('view-laboratory')) {
    abort(403, 'Unauthorized access');
}

    return Inertia::render('Laboratory/LabTests/Show', [
        'labTest' => $labTest
    ]);
}

    /**
     * Show the form for editing the specified lab test.
     */
public function edit(LabTest $labTest): Response
{
    $user = Auth::user();

// Check if user has appropriate permission
if (!$user->hasPermission('edit-lab-tests')) {
    abort(403, 'Unauthorized access');
}

    return Inertia::render('Laboratory/LabTests/Edit', [
        'labTest' => $labTest
    ]);
}

    /**
     * Update the specified lab test in storage.
     */
public function update(Request $request, LabTest $labTest): RedirectResponse
{
    $user = Auth::user();

// Check if user has appropriate permission
if (!$user->hasPermission('edit-lab-tests')) {
    abort(403, 'Unauthorized access');
}

    $validator = Validator::make($request->all(), [
        'name' => 'required|string|max:255',
        'description' => 'nullable|string',
        'cost' => 'required|numeric|min:0',
        'procedure' => 'nullable|string',
        'turnaround_time' => 'nullable|integer|min:0',
        'unit' => 'nullable|string|max:100',
        'normal_values' => 'nullable|string',
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
public function destroy(LabTest $labTest): RedirectResponse
{
    $user = Auth::user();

// Check if user has appropriate permission
if (!$user->hasPermission('delete-lab-tests')) {
    abort(403, 'Unauthorized access');
}

    $labTest->delete();

    return redirect()->route('laboratory.lab-tests.index')->with('success', 'Lab test deleted successfully.');
}

    /**
     * Generate a unique test code for the lab test.
     */
    private function generateTestCode(string $name): string
    {
        // Create an acronym from the test name
        $words = preg_split('/\s+/', $name);
        $acronym = '';
        
        foreach ($words as $word) {
            // Skip common words and only take letters
            $cleanWord = preg_replace('/[^a-zA-Z]/', '', $word);
            if (strlen($cleanWord) > 0) {
                $acronym .= strtoupper(substr($cleanWord, 0, 1));
            }
        }
        
        // Ensure we have at least 3 characters
        if (strlen($acronym) < 3) {
            // If acronym is too short, use first 3 letters of the name
            $cleanName = preg_replace('/[^a-zA-Z]/', '', $name);
            $acronym = strtoupper(substr($cleanName, 0, 3));
        }
        
        // Add a number suffix to ensure uniqueness
        $baseCode = $acronym;
        $counter = 1;
        
        do {
            $testCode = $baseCode . str_pad($counter, 3, '0', STR_PAD_LEFT);
            $exists = LabTest::where('test_code', $testCode)->exists();
            $counter++;
        } while ($exists && $counter <= 999);
        
        // If we can't find a unique code with 3 digits, use timestamp
        if ($counter > 999) {
            $testCode = $baseCode . now()->format('His');
        }
        
        return $testCode;
    }

    /**
     * Parse duration string to hours (e.g., "24 hours" -> 24, "1 week" -> 168).
     */
    private function parseDurationToHours(string $duration): int
    {
        $duration = strtolower(trim($duration));
        
        // Extract number from duration string
        if (preg_match('/(\d+)/', $duration, $matches)) {
            $number = (int)$matches[1];
            
            // Determine unit and convert to hours
            if (str_contains($duration, 'week') || str_contains($duration, 'weeks')) {
                return $number * 168; // 168 hours in a week
            } elseif (str_contains($duration, 'day') || str_contains($duration, 'days')) {
                return $number * 24; // 24 hours in a day
            } elseif (str_contains($duration, 'hour') || str_contains($duration, 'hours')) {
                return $number;
            } elseif (str_contains($duration, 'minute') || str_contains($duration, 'minutes')) {
                return ceil($number / 60); // Convert minutes to hours
            } elseif (str_contains($duration, 'month') || str_contains($duration, 'months')) {
                return $number * 720; // Approximate 30 days in a month
            }
        }
        
        // Default to 24 hours if parsing fails
        return 24;
    }

    /**
     * Extract unit from duration string (e.g., "24 hours" -> "hours").
     */
    private function extractUnitFromDuration(string $duration): string
    {
        $duration = strtolower(trim($duration));
        
        if (str_contains($duration, 'week') || str_contains($duration, 'weeks')) {
            return 'weeks';
        } elseif (str_contains($duration, 'day') || str_contains($duration, 'days')) {
            return 'days';
        } elseif (str_contains($duration, 'hour') || str_contains($duration, 'hours')) {
            return 'hours';
        } elseif (str_contains($duration, 'minute') || str_contains($duration, 'minutes')) {
            return 'minutes';
        } elseif (str_contains($duration, 'month') || str_contains($duration, 'months')) {
            return 'months';
        }
        
        // Default unit
        return 'hours';
    }

    /**
     * Update the status of the specified lab test.
     */
    public function updateStatus(Request $request, LabTest $labTest): RedirectResponse
    {
        $user = Auth::user();

        // Check if user has appropriate permission
        if (!$user->hasPermission('edit-lab-tests')) {
            abort(403, 'Unauthorized access');
        }

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:active,inactive',
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator);
        }

        $labTest->update(['status' => $request->input('status')]);

        $statusLabel = $request->input('status') === 'active' ? 'activated' : 'deactivated';
        return redirect()->back()->with('success', "Lab test {$statusLabel} successfully.");
    }

    /**
     * Search lab tests by name or category.
     */
    public function search(Request $request): Response
    {
        $user = Auth::user();

// Check if user has appropriate permission (super admin bypass)
if (!$user->isSuperAdmin() && !$user->hasPermission('view-laboratory')) {
    abort(403, 'Unauthorized access');
}

        $query = $request->input('query');

        $labTests = LabTest::where('name', 'like', '%' . $query . '%')
                    ->orWhere('description', 'like', '%' . $query . '%')
                    ->orWhere('procedure', 'like', '%' . $query . '%')
                    ->orWhere('unit', 'like', '%' . $query . '%')
                    ->paginate(10);

        return Inertia::render('Laboratory/LabTests/Index', [
            'labTests' => $labTests,
            'query' => $query
        ]);
    }

    /**
     * Duplicate the specified lab test.
     */
    public function duplicate(LabTest $labTest): RedirectResponse
    {
        $user = Auth::user();

        // Check if user has appropriate permission
        if (!$user->hasPermission('create-lab-tests')) {
            abort(403, 'Unauthorized access');
        }

        // Generate a new unique test code based on the original
        $newTestCode = $this->generateTestCode($labTest->name . ' Copy');

        // Create a duplicate of the lab test
        $duplicatedLabTest = LabTest::create([
            'test_code' => $newTestCode,
            'name' => $labTest->name . ' (Copy)',
            'description' => $labTest->description,
            'procedure' => $labTest->procedure,
            'cost' => $labTest->cost,
            'turnaround_time' => $labTest->turnaround_time,
            'unit' => $labTest->unit,
            'normal_values' => $labTest->normal_values,
            'status' => 'inactive', // Set as inactive by default
        ]);

        return redirect()->route('laboratory.lab-tests.edit', $duplicatedLabTest)
            ->with('success', 'Lab test duplicated successfully. You can now edit the copy.');
    }
}
