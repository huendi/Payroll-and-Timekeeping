<?php

namespace App\Http\Controllers;

use App\Models\TaxBracket;
use Illuminate\Http\Request;

class TaxController extends Controller
{
    public function index()
    {
        $taxBrackets = TaxBracket::orderBy('from')->get();
        return response()->json($taxBrackets);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'brackets' => 'required|array',
            'brackets.*.id' => 'nullable|integer',
            'brackets.*.from' => 'required|numeric|min:0',
            'brackets.*.to' => 'nullable|numeric|min:0',
            'brackets.*.percentage' => 'required|numeric|min:0|max:100',
            'brackets.*.fixed_amount' => 'nullable|numeric|min:0',
        ]);

        try {
            foreach ($validated['brackets'] as $bracketData) {
                if (!empty($bracketData['id']) && $bracketData['id'] !== 0) {
                    // Update existing record
                    $bracket = TaxBracket::findOrFail($bracketData['id']);
                    $bracket->update([
                        'from' => $bracketData['from'],
                        'to' => $bracketData['to'] ?? null,
                        'percentage' => $bracketData['percentage'],
                        'fixed_amount' => $bracketData['fixed_amount'] ?? null,
                    ]);
                } else {
                    // Create new record
                    TaxBracket::create([
                        'from' => $bracketData['from'],
                        'to' => $bracketData['to'] ?? null,
                        'percentage' => $bracketData['percentage'],
                        'fixed_amount' => $bracketData['fixed_amount'] ?? null,
                    ]);
                }
            }

            return redirect()
                ->back()
                ->with('success', 'Tax brackets updated successfully');
        } catch (\Exception $e) {
            \Log::error('Error updating tax brackets: ' . $e->getMessage());

            return redirect()
                ->back()
                ->with('error', 'Failed to update tax brackets')
                ->withInput();
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from' => 'required|numeric|min:0',
            'to' => 'nullable|numeric|min:0',
            'percentage' => 'required|numeric|min:0|max:100',
            'fixed_amount' => 'nullable|numeric|min:0',
        ]);

        TaxBracket::create($validated);

        return redirect()
            ->route('deductions.index')
            ->with('success', 'Tax bracket created successfully');
    }

    public function destroy($id)
    {
        try {
            $taxBracket = TaxBracket::findOrFail($id);
            $taxBracket->delete();

            return response()->json(['success' => true, 'message' => 'Tax bracket deleted successfully']);
        } catch (\Exception $e) {
            \Log::error('Error deleting tax bracket: ' . $e->getMessage());
            
            return response()->json(['error' => 'Failed to delete tax bracket'], 500);
        }
    }
}
