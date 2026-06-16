<?php

namespace App\Http\Controllers;

use App\Models\DeductionSetting;
use App\Models\SSSBracket;
use App\Models\TaxBracket;
use App\Models\PHICBracket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DeductionSettingController extends Controller
{
    /**
     * Display deduction settings.
     */
    public function index(): Response
    {
        $deductionTypes = [
            'late_absences' => 'Late and Absences',
            'loan_advances' => 'Loans and Advances',
            'phic' => 'PHIC Contribution',
            'hdmf' => 'HDMF Contribution',
            'sss_contribution' => 'SSS Contribution',
            'sss_loan' => 'SSS Loan',
            'hdmf_loan' => 'HDMF Loan',
            'income_tax' => 'Income Tax',
        ];

        $settings = [];

        foreach ($deductionTypes as $type => $label) {
            $setting = DeductionSetting::where('deduction_type', $type)->first();
            
            if (!$setting) {
                $setting = DeductionSetting::create([
                    'deduction_type' => $type,
                    'settings' => $this->getDefaultSettings($type),
                ]);
            }

            $settings[$type] = $setting;
        }

        $sssBrackets = SSSBracket::orderBy('to')->get();
        $taxBrackets = TaxBracket::orderBy('from')->get();
        $phicBrackets = PHICBracket::orderBy('from')->get();

        return Inertia::render('deduction-settings/index', [
            'settings' => $settings,
            'deductionTypes' => $deductionTypes,
            'sssBrackets' => $sssBrackets,
            'taxBrackets' => $taxBrackets,
            'phicBrackets' => $phicBrackets,
        ]);
    }

    /**
     * Update deduction setting.
     */
    public function update(Request $request, DeductionSetting $setting): RedirectResponse
    {
        if ($setting->deduction_type === 'late_absences') {
            $validated = $request->validate([
                'days' => ['required', 'numeric', 'min:0'],
            ]);

            $setting->settings = [
                'days' => $validated['days'],
            ];
        } elseif ($setting->deduction_type === 'phic') {
            // For PHIC, we now use brackets, but we might still keep shares in settings
            // or we can move shares to the bracket table? Usually shares are global (50/50)
            // Let's keep shares here for now, but rate/min/max are now redundant if using brackets.
            // We'll just validate shares.
            $validated = $request->validate([
                'employer_share' => ['required', 'numeric', 'min:0', 'max:100'],
                'employee_share' => ['required', 'numeric', 'min:0', 'max:100'],
            ]);

            if (($validated['employer_share'] + $validated['employee_share']) !== 100) {
                return redirect()->back()->withErrors([
                    'employer_share' => 'Employer + Employee share must equal 100%',
                ]);
            }

            $setting->settings = $validated;
        } elseif ($setting->deduction_type === 'hdmf') {
            $validated = $request->validate([
                'employee' => ['required', 'numeric', 'min:0'],
                'employer' => ['required', 'numeric', 'min:0'],
            ]);

            $setting->settings = $validated;
        }

        $setting->save();

        return redirect()->back()->with('success', 'Deduction setting updated successfully.');
    }

    /**
     * Update PHIC brackets.
     */
    public function updatePHICBrackets(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'brackets' => ['required', 'array'],
            'brackets.*.from' => ['required', 'numeric', 'min:0'],
            'brackets.*.to' => ['nullable', 'numeric', 'min:0'],
            'brackets.*.percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'brackets.*.fixed_amount' => ['nullable', 'numeric', 'min:0'],
            'brackets.*.id' => ['nullable', 'integer'],
        ]);

        // Delete existing brackets and create new ones
        PHICBracket::truncate();
        
        foreach ($validated['brackets'] as $bracket) {
            // Remove id field if it exists
            unset($bracket['id']);
            PHICBracket::create($bracket);
        }

        return redirect()->back()->with('success', 'PHIC brackets updated successfully.');
    }

    /**
     * Update SSS brackets.
     */
    public function updateSSS(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'brackets' => ['required', 'array'],
            'brackets.*.from' => ['required', 'numeric', 'min:0'],
            'brackets.*.to' => ['required', 'numeric', 'min:0'],
            'brackets.*.er' => ['required', 'numeric', 'min:0'],
            'brackets.*.ee' => ['required', 'numeric', 'min:0'],
            'brackets.*.total' => ['required', 'numeric', 'min:0'],
            'brackets.*.others' => ['nullable', 'string'],
            'brackets.*.id' => ['nullable', 'integer'],
        ]);

        // Delete existing brackets and create new ones
        SSSBracket::truncate();
        
        foreach ($validated['brackets'] as $bracket) {
            // Remove id field if it exists
            unset($bracket['id']);
            SSSBracket::create($bracket);
        }

        return redirect()->back()->with('success', 'SSS brackets updated successfully.');
    }

    /**
     * Update Tax brackets.
     */
    public function updateTax(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'brackets' => ['required', 'array'],
            'brackets.*.from' => ['required', 'numeric', 'min:0'],
            'brackets.*.to' => ['nullable', 'numeric', 'min:0'],
            'brackets.*.percentage' => ['required', 'numeric', 'min:0', 'max:100'],
            'brackets.*.fixed_amount' => ['nullable', 'numeric', 'min:0'],
            'brackets.*.id' => ['nullable', 'integer'],
        ]);

        // Delete existing brackets and create new ones
        TaxBracket::truncate();
        
        foreach ($validated['brackets'] as $bracket) {
            // Remove id field if it exists
            unset($bracket['id']);
            TaxBracket::create($bracket);
        }

        return redirect()->back()->with('success', 'Tax brackets updated successfully.');
    }

    /**
     * Get default settings for a deduction type.
     */
    private function getDefaultSettings(string $type): array
    {
        return match ($type) {
            'late_absences' => ['days' => 22],
            'phic' => [
                'rate' => 5,
                'min_salary' => 10000,
                'max_salary' => 100000,
                'employer_share' => 50,
                'employee_share' => 50,
            ],
            'hdmf' => [
                'employee' => 200,
                'employer' => 200,
            ],
            default => [],
        };
    }
}
