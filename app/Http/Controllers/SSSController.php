<?php

namespace App\Http\Controllers;

use App\Models\SSSBracket;
use Illuminate\Http\Request;

class SSSController extends Controller
{
    public function index()
    {
        $sssBrackets = SSSBracket::orderBy('to')->get();
        return response()->json($sssBrackets);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'from' => 'required|numeric|min:0',
            'to' => 'required|numeric|min:0|gte:from',
            'er' => 'required|numeric|min:0',
            'ee' => 'required|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'others' => 'nullable|string|max:255'
        ]);

        SSSBracket::create($validated);

        return redirect()->route('deductions.index')
                         ->with('success', 'SSS bracket created successfully');
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'brackets' => 'required|array',
            'brackets.*.id' => 'nullable|integer',
            'brackets.*.from' => 'required|numeric|min:0',
            'brackets.*.to' => 'required|numeric|min:0',
            'brackets.*.er' => 'required|numeric|min:0',
            'brackets.*.ee' => 'required|numeric|min:0',
            'brackets.*.total' => 'required|numeric|min:0',
            'brackets.*.others' => 'nullable|string|max:255',
        ]);

        try {
            foreach ($validated['brackets'] as $bracketData) {
                if (!empty($bracketData['id']) && $bracketData['id'] !== 0) {
                    // Update existing record
                    $bracket = SSSBracket::findOrFail($bracketData['id']);
                    $bracket->update([
                        'from'   => $bracketData['from'],
                        'to'     => $bracketData['to'],
                        'er'     => $bracketData['er'],
                        'ee'     => $bracketData['ee'],
                        'total'  => $bracketData['total'],
                        'others' => $bracketData['others'] ?? null,
                    ]);
                } else {
                    // Create new record
                    SSSBracket::create([
                        'from'   => $bracketData['from'],
                        'to'     => $bracketData['to'],
                        'er'     => $bracketData['er'],
                        'ee'     => $bracketData['ee'],
                        'total'  => $bracketData['total'],
                        'others' => $bracketData['others'] ?? null,
                    ]);
                }
            }

            return redirect()
                ->back()
                ->with('success', 'SSS brackets updated successfully');
        } catch (\Exception $e) {
            \Log::error('Error updating SSS brackets: ' . $e->getMessage());

            return redirect()
                ->back()
                ->with('error', 'Failed to update SSS brackets')
                ->withInput();
        }
    }

    public function destroy($id)
    {
        try {
            $sssBracket = SSSBracket::findOrFail($id);
            $sssBracket->delete();
    
            return response()->json([
                'success' => true, 
                'message' => 'SSS bracket deleted successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error deleting SSS bracket: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => 'Failed to delete SSS bracket'
            ], 500);
        }
    }
}
