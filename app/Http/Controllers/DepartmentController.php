<?php

namespace App\Http\Controllers;

use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * Get all departments.
     */
    public function index(): JsonResponse
    {
        $departments = Department::orderBy('name')->get();
        return response()->json($departments);
    }

    /**
     * Store a newly created department.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:departments'],
        ]);

        $department = Department::create($validated);

        return response()->json($department, 201);
    }
}
