<?php

namespace App\Http\Controllers;

use App\Models\LeaveType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeaveTypeController extends Controller
{
    /**
     * Get all leave types.
     */
    public function index(): JsonResponse
    {
        $leaveTypes = LeaveType::orderBy('name')->get();
        return response()->json($leaveTypes);
    }

    /**
     * Store a new leave type.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:leave_types,name'],
        ]);

        $leaveType = LeaveType::create($validated);

        return response()->json($leaveType, 201);
    }
}
