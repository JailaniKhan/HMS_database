<?php

namespace App\Http\Controllers\API\v1;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class DoctorController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = $request->input('per_page', 10);
        $doctors = Doctor::with('department')->paginate($perPage);
        
        return response()->json([
            'data' => $doctors->items(),
            'pagination' => [
                'current_page' => $doctors->currentPage(),
                'last_page' => $doctors->lastPage(),
                'per_page' => $doctors->perPage(),
                'total' => $doctors->total(),
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:doctors,email',
            'phone' => 'required|string|max:20',
            'specialization' => 'required|string|max:255',
            'license_number' => 'required|string|max:255|unique:doctors,license_number',
            'department_id' => 'required|exists:departments,id',
        ]);

        $doctor = Doctor::create($request->all());

        return response()->json([
            'message' => 'Doctor created successfully',
            'data' => $doctor
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id): JsonResponse
    {
        $doctor = Doctor::with('department')->findOrFail($id);

        return response()->json([
            'data' => $doctor
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $doctor = Doctor::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|unique:doctors,email,' . $id,
            'phone' => 'sometimes|required|string|max:20',
            'specialization' => 'sometimes|required|string|max:255',
            'license_number' => 'sometimes|required|string|max:255|unique:doctors,license_number,' . $id,
            'department_id' => 'sometimes|required|exists:departments,id',
        ]);

        $doctor->update($request->all());

        return response()->json([
            'message' => 'Doctor updated successfully',
            'data' => $doctor
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id): JsonResponse
    {
        $doctor = Doctor::findOrFail($id);
        $doctor->delete();

        return response()->json([
            'message' => 'Doctor deleted successfully'
        ]);
    }
}