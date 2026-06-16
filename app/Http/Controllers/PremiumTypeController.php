<?php

namespace App\Http\Controllers;

use App\Models\PremiumCategory;
use App\Models\PremiumType;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class PremiumTypeController extends Controller
{
    /**
     * Store a newly created premium type.
     */
    public function store(Request $request, PremiumCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'regular_rate' => ['required', 'numeric', 'min:0'],
            'special_rate' => ['nullable', 'numeric', 'min:0'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        $validated['category_id'] = $category->id;

        PremiumType::create($validated);

        return redirect()->back()
            ->with('success', 'Premium type created successfully.');
    }

    /**
     * Update the specified premium type.
     */
    public function update(Request $request, PremiumCategory $category, PremiumType $type): RedirectResponse
    {
        $validated = $request->validate([
            'regular_rate' => ['required', 'numeric', 'min:0'],
        ]);

        $type->update($validated);

        return redirect()->back()
            ->with('success', 'Premium type updated successfully.');
    }

    /**
     * Remove the specified premium type.
     */
    public function destroy(PremiumCategory $category, PremiumType $type): RedirectResponse
    {
        $type->delete();

        return redirect()->back()
            ->with('success', 'Premium type deleted successfully.');
    }
}
