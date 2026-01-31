<?php

namespace App\Http\Controllers\Laboratory;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLabTestRequest;
use App\Http\Requests\UpdateLabTestRequest;
use App\Models\LabTestRequest;
use App\Models\Patient;
use App\Models\Doctor;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class LabTestRequestController extends Controller
{
    protected AuditLogService $auditLogService;

    public function __construct(AuditLogService $auditLogService)
    {
        $this->auditLogService = $auditLogService;
    }

    /**
     * Display a listing of the lab test requests.
     */
    public function index(Request $request): Response
    {
        $user = Auth::user();

        if (!$user->hasPermission('view-lab-test-requests')) {
            abort(403, 'Unauthorized access');
        }

        $query = LabTestRequest::with(['patient', 'doctor', 'createdBy']);

        // Apply filters
        if ($request->has('status') && $request->status) {
            $query->byStatus($request->status);
        }

        if ($request->has('patient_id') && $request->patient_id) {
            $query->byPatient($request->patient_id);
        }

        if ($request->has('doctor_id') && $request->doctor_id) {
            $query->byDoctor($request->doctor_id);
        }

        if ($request->has('test_type') && $request->test_type) {
            $query->where('test_type', $request->test_type);
        }

        if ($request->has('date_from') && $request->date_from) {
            $query->where('scheduled_at', '>=', $request->date_from);
        }

        if ($request->has('date_to') && $request->date_to) {
            $query->where('scheduled_at', '<=', $request->date_to);
        }

        // Search functionality
        if ($request->has('query') && $request->query) {
            $searchTerm = $request->query;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('request_id', 'like', "%{$searchTerm}%")
                  ->orWhere('test_name', 'like', "%{$searchTerm}%")
                  ->orWhereHas('patient', function ($subQ) use ($searchTerm) {
                      $subQ->where('first_name', 'like', "%{$searchTerm}%")
                           ->orWhere('father_name', 'like', "%{$searchTerm}%")
                           ->orWhere('patient_id', 'like', "%{$searchTerm}%");
                  })
                  ->orWhereHas('doctor', function ($subQ) use ($searchTerm) {
                      $subQ->where('full_name', 'like', "%{$searchTerm}%")
                           ->orWhere('doctor_id', 'like', "%{$searchTerm}%");
                  });
            });
        }

        $labTestRequests = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Laboratory/LabTestRequests/Index', [
            'labTestRequests' => $labTestRequests,
            'filters' => $request->only(['status', 'patient_id', 'doctor_id', 'test_type', 'date_from', 'date_to', 'query']),
        ]);
    }

    /**
     * Show the form for creating a new lab test request.
     */
    public function create(): Response
    {
        $user = Auth::user();

        if (!$user->isSuperAdmin() && !$user->hasPermission('create-lab-test-requests')) {
            abort(403, 'Unauthorized access');
        }

        $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name')->get();
        $doctors = Doctor::select('id', 'doctor_id', 'full_name')->get();

        return Inertia::render('Laboratory/LabTestRequests/Create', [
            'patients' => $patients,
            'doctors' => $doctors,
        ]);
    }

    /**
     * Store a newly created lab test request in storage.
     */
    public function store(StoreLabTestRequest $request): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('create-lab-test-requests')) {
            abort(403, 'Unauthorized access');
        }

        $validated = $request->validated();
        $validated['created_by'] = $user->id;
        $validated['status'] = LabTestRequest::STATUS_PENDING;

        $labTestRequest = LabTestRequest::create($validated);

        // Log the creation
        $this->auditLogService->logCreation(
            'Lab Test Request',
            "Request ID: {$labTestRequest->request_id} - {$labTestRequest->test_name}"
        );

        return redirect()->route('laboratory.lab-test-requests.index')
            ->with('success', 'Lab test request created successfully.');
    }

    /**
     * Display the specified lab test request.
     */
    public function show(LabTestRequest $labTestRequest): Response
    {
        $user = Auth::user();

        if (!$user->hasPermission('view-lab-test-requests')) {
            abort(403, 'Unauthorized access');
        }

        $labTestRequest->load(['patient', 'doctor', 'createdBy', 'results']);

        return Inertia::render('Laboratory/LabTestRequests/Show', [
            'labTestRequest' => $labTestRequest,
        ]);
    }

    /**
     * Show the form for editing the specified lab test request.
     */
    public function edit(LabTestRequest $labTestRequest)
    {
        $user = Auth::user();

        if (!$user->hasPermission('edit-lab-test-requests')) {
            abort(403, 'Unauthorized access');
        }

        // Only allow editing if not completed
        if ($labTestRequest->isCompleted()) {
            return redirect()->route('laboratory.lab-test-requests.show', $labTestRequest)
                ->with('error', 'Cannot edit a completed lab test request.');
        }

        $patients = Patient::select('id', 'patient_id', 'first_name', 'father_name')->get();
        $doctors = Doctor::select('id', 'doctor_id', 'full_name')->get();

        return Inertia::render('Laboratory/LabTestRequests/Edit', [
            'labTestRequest' => $labTestRequest,
            'patients' => $patients,
            'doctors' => $doctors,
        ]);
    }

    /**
     * Update the specified lab test request in storage.
     */
    public function update(UpdateLabTestRequest $request, LabTestRequest $labTestRequest): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('edit-lab-test-requests')) {
            abort(403, 'Unauthorized access');
        }

        $validated = $request->validated();

        // Handle status transition
        if (isset($validated['status']) && $validated['status'] !== $labTestRequest->status) {
            $labTestRequest->transitionTo($validated['status']);
            unset($validated['status']); // Remove status as it's already handled
        }

        $labTestRequest->update($validated);

        // Log the update
        $this->auditLogService->logUpdate(
            'Lab Test Request',
            "Request ID: {$labTestRequest->request_id}"
        );

        return redirect()->route('laboratory.lab-test-requests.index')
            ->with('success', 'Lab test request updated successfully.');
    }

    /**
     * Remove the specified lab test request from storage (soft delete).
     */
    public function destroy(LabTestRequest $labTestRequest): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('delete-lab-test-requests')) {
            abort(403, 'Unauthorized access');
        }

        // Soft delete
        $labTestRequest->delete();

        // Log the deletion
        $this->auditLogService->logDeletion(
            'Lab Test Request',
            "Request ID: {$labTestRequest->request_id}"
        );

        return redirect()->route('laboratory.lab-test-requests.index')
            ->with('success', 'Lab test request deleted successfully.');
    }

    /**
     * Restore a cancelled lab test request.
     */
    public function restore(LabTestRequest $labTestRequest): RedirectResponse
    {
        $user = Auth::user();

        if (!$user->hasPermission('edit-lab-test-requests')) {
            abort(403, 'Unauthorized access');
        }

        if (!$labTestRequest->isCancelled()) {
            return redirect()->route('laboratory.lab-test-requests.show', $labTestRequest)
                ->with('error', 'Only cancelled requests can be restored.');
        }

        $labTestRequest->restoreRequest();

        // Log the restoration
        $this->auditLogService->logActivity(
            'Restore Lab Test Request',
            'Lab Test Request',
            "Restored request ID: {$labTestRequest->request_id}",
            'info'
        );

        return redirect()->route('laboratory.lab-test-requests.index')
            ->with('success', 'Lab test request restored successfully.');
    }

    /**
     * Search lab test requests with multiple filter support.
     */
    public function search(Request $request): Response
    {
        $user = Auth::user();

        if (!$user->hasPermission('view-lab-test-requests')) {
            abort(403, 'Unauthorized access');
        }

        $query = LabTestRequest::with(['patient', 'doctor']);

        // Multiple filter support
        if ($request->has('filters')) {
            $filters = $request->input('filters');

            if (!empty($filters['status'])) {
                $query->byStatus($filters['status']);
            }

            if (!empty($filters['patient_id'])) {
                $query->byPatient($filters['patient_id']);
            }

            if (!empty($filters['doctor_id'])) {
                $query->byDoctor($filters['doctor_id']);
            }

            if (!empty($filters['test_type'])) {
                $query->where('test_type', $filters['test_type']);
            }

            if (!empty($filters['date_from']) && !empty($filters['date_to'])) {
                $query->byDateRange($filters['date_from'], $filters['date_to']);
            }
        }

        // Text search
        if ($request->has('query') && $request->query) {
            $searchTerm = $request->query;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('request_id', 'like', "%{$searchTerm}%")
                  ->orWhere('test_name', 'like', "%{$searchTerm}%")
                  ->orWhereHas('patient', function ($subQ) use ($searchTerm) {
                      $subQ->where('first_name', 'like', "%{$searchTerm}%")
                           ->orWhere('father_name', 'like', "%{$searchTerm}%");
                  })
                  ->orWhereHas('doctor', function ($subQ) use ($searchTerm) {
                      $subQ->where('full_name', 'like', "%{$searchTerm}%");
                  });
            });
        }

        $labTestRequests = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Laboratory/LabTestRequests/Index', [
            'labTestRequests' => $labTestRequests,
            'filters' => $request->input('filters', []),
            'query' => $request->input('query', ''),
        ]);
    }

    /**
     * Update status via dedicated endpoint.
     */
    public function updateStatus(Request $request, LabTestRequest $labTestRequest): RedirectResponse
    {
        $user = Auth::user();

        $request->validate([
            'status' => 'required|in:pending,in_progress,completed,cancelled',
        ]);

        $newStatus = $request->input('status');

        // Check permissions based on status
        if (in_array($newStatus, ['in_progress', 'completed'])) {
            if (!$user->hasPermission('process-lab-test-requests')) {
                abort(403, 'You do not have permission to process lab test requests');
            }
        }

        if ($newStatus === 'cancelled') {
            if (!$user->hasPermission('delete-lab-test-requests')) {
                abort(403, 'You do not have permission to cancel lab test requests');
            }
        }

        if (!$labTestRequest->canTransitionTo($newStatus)) {
            return redirect()->back()
                ->with('error', "Cannot transition from {$labTestRequest->status} to {$newStatus}");
        }

        $labTestRequest->transitionTo($newStatus);

        // Log the status change
        $this->auditLogService->logActivity(
            'Update Lab Test Request Status',
            'Lab Test Request',
            "Changed status of request {$labTestRequest->request_id} to {$newStatus}",
            'info'
        );

        return redirect()->back()
            ->with('success', 'Status updated successfully.');
    }
}
