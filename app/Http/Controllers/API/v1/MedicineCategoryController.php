<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\API\BaseApiController;
use App\Models\MedicineCategory;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class MedicineCategoryController extends BaseApiController
{
    /**
     * Check if user can access pharmacy
     */
    private function authorizePharmacyAccess(): void
    {
        if (!auth()->user()?->hasPermission('view-pharmacy')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Check if user can modify categories
     */
    private function authorizeCategoryModify(): void
    {
        if (!auth()->user()?->hasPermission('edit-medicines')) {
            abort(403, 'Unauthorized access');
        }
    }

    /**
     * Display a listing of categories.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizePharmacyAccess();

        $query = MedicineCategory::query();

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where('name', 'like', '%' . $search . '%')
                  ->orWhere('description', 'like', '%' . $search . '%');
        }

        $categories = $query->orderBy('name')->paginate(15);

        return $this->successResponse('Categories retrieved successfully', [
            'categories' => $categories
        ]);
    }

    /**
     * Store a newly created category.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorizeCategoryModify();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:medicine_categories,name',
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors());
        }

        $category = MedicineCategory::create($request->only(['name', 'description']));

        return $this->successResponse('Category created successfully', [
            'category' => $category
        ], 201);
    }

    /**
     * Display the specified category.
     */
    public function show(MedicineCategory $category): JsonResponse
    {
        $this->authorizePharmacyAccess();

        return $this->successResponse('Category retrieved successfully', [
            'category' => $category->load('medicines')
        ]);
    }

    /**
     * Update the specified category.
     */
    public function update(Request $request, MedicineCategory $category): JsonResponse
    {
        $this->authorizeCategoryModify();

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255|unique:medicine_categories,name,' . $category->id,
            'description' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse('Validation failed', 422, $validator->errors());
        }

        $category->update($request->only(['name', 'description']));

        return $this->successResponse('Category updated successfully', [
            'category' => $category
        ]);
    }

    /**
     * Remove the specified category.
     */
    public function destroy(MedicineCategory $category): JsonResponse
    {
        if (!auth()->user()?->hasPermission('delete-medicines')) {
            abort(403, 'Unauthorized access');
        }

        // Check if category has medicines
        if ($category->medicines()->count() > 0) {
            return $this->errorResponse('Cannot delete category with associated medicines', 422);
        }

        $category->delete();

        return $this->successResponse('Category deleted successfully');
    }
}