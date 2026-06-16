<?php

namespace App\Http\Controllers;

use App\Models\PremiumCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PremiumCategoryController extends Controller
{
    /**
     * Display a listing of premium categories.
     */
    public function index(): Response
    {
        $categories = PremiumCategory::with('premiumTypes')
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('premium/index', [
            'categories' => $categories,
        ]);
    }

    /**
     * Store a newly created premium category.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:premium_categories'],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        PremiumCategory::create($validated);

        return redirect()->back()
            ->with('success', 'Premium category created successfully.');
    }

    /**
     * Update the specified premium category.
     */
    public function update(Request $request, PremiumCategory $category): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:premium_categories,name,' . $category->id],
            'description' => ['nullable', 'string'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'is_active' => ['boolean'],
        ]);

        $category->update($validated);

        return redirect()->back()
            ->with('success', 'Premium category updated successfully.');
    }

    /**
     * Remove the specified premium category.
     */
    public function destroy(PremiumCategory $category): RedirectResponse
    {
        $category->delete();

        return redirect()->back()
            ->with('success', 'Premium category deleted successfully.');
    }
}
