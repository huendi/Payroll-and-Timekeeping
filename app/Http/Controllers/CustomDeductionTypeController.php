<?php

namespace App\Http\Controllers;

use App\Models\CustomDeductionType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomDeductionTypeController extends Controller
{
    /**
     * Get all custom deduction types.
     */
    public function index(): JsonResponse
    {
        $types = CustomDeductionType::orderBy('name')->get();
        return response()->json($types);
    }

    /**
     * Store a new custom deduction type.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:custom_deduction_types,name'],
            'description' => ['nullable', 'string'],
        ]);

        $type = CustomDeductionType::create($validated);

        return response()->json($type, 201);
    }
}
