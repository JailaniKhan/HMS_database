<?php

namespace App\Http\Controllers\Department;

use App\Http\Controllers\Controller;
use App\Models\Department;
use App\Models\DepartmentService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Validator;

class DepartmentServiceController extends Controller
{
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
