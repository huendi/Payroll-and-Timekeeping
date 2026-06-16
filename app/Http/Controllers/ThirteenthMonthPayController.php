<?php

namespace App\Http\Controllers;

use App\Models\ThirteenthMonthPay;
use App\Models\ThirteenthMonthPayItem;
use App\Models\Payslip;
use App\Models\Payroll;
use App\Models\PayrollItem;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class ThirteenthMonthPayController extends Controller
{
    public function index()
    {
        $thirteenthMonthPays = ThirteenthMonthPay::with(['items.employee', 'generatedBy'])
            ->where('status', 'active')
            ->orderBy('year', 'desc')
            ->paginate(20);

        return Inertia::render('thirteenth-month-pay/index', [
            'thirteenthMonthPays' => $thirteenthMonthPays,
        ]);
    }

    public function archiveList()
    {
        $thirteenthMonthPays = ThirteenthMonthPay::with(['items.employee', 'generatedBy'])
            ->where('status', 'archived')
            ->orderBy('archived_at', 'desc')
            ->paginate(20);

        return Inertia::render('thirteenth-month-pay/archive', [
            'thirteenthMonthPays' => $thirteenthMonthPays,
        ]);
    }

    public function show(ThirteenthMonthPay $thirteenthMonthPay)
    {
        $thirteenthMonthPay->load(['items.employee', 'generatedBy']);

        $items = $thirteenthMonthPay->items()
            ->with('employee')
            ->orderBy('employee_id')
            ->paginate(20);

        return Inertia::render('thirteenth-month-pay/show', [
            'thirteenthMonthPay' => $thirteenthMonthPay,
            'items' => $items,
        ]);
    }

    public function archive(ThirteenthMonthPay $thirteenthMonthPay)
    {
        try {
            if ($thirteenthMonthPay->isArchived()) {
                return back()->with('warning', "13th Month Pay for {$thirteenthMonthPay->year} is already archived.");
            }

            $thirteenthMonthPay->update([
                'status' => 'archived',
                'archived_at' => now(),
                'archived_by' => auth()->id() ?? null,
            ]);

            return back()->with('success', "13th Month Pay for {$thirteenthMonthPay->year} has been archived successfully.");

        } catch (\Exception $e) {
            Log::error('13th Month Pay archiving failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to archive 13th Month Pay: ' . $e->getMessage());
        }
    }

    public function destroy(ThirteenthMonthPay $thirteenthMonthPay)
    {
        try {
            // Only allow deletion of archived records
            if (!$thirteenthMonthPay->isArchived()) {
                return back()->with('error', 'Only archived 13th Month Pay records can be deleted. Please archive first.');
            }

            DB::beginTransaction();

            // Delete all items first (cascade will handle this, but explicit for clarity)
            $thirteenthMonthPay->items()->delete();

            // Delete the 13th month pay record
            $thirteenthMonthPay->delete();

            DB::commit();

            return redirect()->route('thirteenth-month-pay.index')
                ->with('success', "13th Month Pay for {$thirteenthMonthPay->year} has been permanently deleted.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('13th Month Pay deletion failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to delete 13th Month Pay: ' . $e->getMessage());
        }
    }

    public function generatePage()
    {
        $employees = Employee::orderBy('first_name')
            ->get()
            ->map(function ($employee) {
                $employee->has_payslips = $employee->payslips()->exists();
                return $employee;
            });

        return Inertia::render('thirteenth-month-pay/generate', [
            'employees' => $employees,
        ]);
    }

    public function generate(Request $request)
    {
        try {
            $validated = $request->validate([
                'employee_ids' => ['required', 'array', 'min:1'],
                'employee_ids.*' => ['integer', 'exists:employees,id'],
                'from_month' => ['required', 'integer', 'min:1', 'max:12'],
                'from_year' => ['required', 'integer', 'min:2000', 'max:' . date('Y')],
                'to_month' => ['required', 'integer', 'min:1', 'max:12'],
                'to_year' => ['required', 'integer', 'min:2000', 'max:' . date('Y')],
            ]);

            $employeeIds = $validated['employee_ids'];
            $fromMonth = $validated['from_month'];
            $fromYear = $validated['from_year'];
            $toMonth = $validated['to_month'];
            $toYear = $validated['to_year'];

            DB::beginTransaction();

            // Create the 13th month pay record
            $thirteenthMonthPay = ThirteenthMonthPay::create([
                'year' => $toYear,
                'from_month' => $fromMonth,
                'from_year' => $fromYear,
                'to_month' => $toMonth,
                'to_year' => $toYear,
                'generated_at' => now(),
                'generated_by' => auth()->id() ?? null,
            ]);

            // Get all approved payrolls for the selected employees within the date range
            $payrolls = Payroll::where('status', 'approved')
                ->whereHas('items', function ($query) use ($employeeIds) {
                    $query->whereIn('employee_id', $employeeIds);
                })
                ->where(function ($query) use ($fromMonth, $fromYear, $toMonth, $toYear) {
                    // Handle date range filtering
                    $query->where(function ($q) use ($fromMonth, $fromYear, $toMonth, $toYear) {
                        // If same year
                        if ($fromYear === $toYear) {
                            $q->where('year', $fromYear)
                                ->whereBetween('month', [$fromMonth, $toMonth]);
                        } else {
                            // From date
                            $q->where(function ($subQ) use ($fromMonth, $fromYear) {
                                $subQ->where('year', $fromYear)
                                    ->where('month', '>=', $fromMonth);
                            })
                            // To date
                            ->orWhere(function ($subQ) use ($toMonth, $toYear) {
                                $subQ->where('year', $toYear)
                                    ->where('month', '<=', $toMonth);
                            })
                            // In between years
                            ->orWhere(function ($subQ) use ($fromYear, $toYear) {
                                $subQ->where('year', '>', $fromYear)
                                    ->where('year', '<', $toYear);
                            });
                        }
                    });
                })
                ->with('items')
                ->get();

            // Group by employee and calculate totals from draft snapshots
            $employeeData = [];
            foreach ($payrolls as $payroll) {
                if (!empty($payroll->draft_snapshot)) {
                    $snapshot = is_array($payroll->draft_snapshot) ? $payroll->draft_snapshot : json_decode($payroll->draft_snapshot, true);
                    
                    if (isset($snapshot['rows'])) {
                        foreach ($snapshot['rows'] as $row) {
                            $empId = $row['employee']['id'] ?? $row['employee_id'] ?? null;
                            if (!$empId || !in_array($empId, $employeeIds)) continue;

                            if (!isset($employeeData[$empId])) {
                                $employeeData[$empId] = [
                                    'gross_pay_total' => 0,
                                    'sss_deduction_total' => 0,
                                    'overtime_pay_total' => 0,
                                ];
                            }
                            
                            $payrollData = $row['payroll'] ?? [];
                            $grossPay = floatval($payrollData['totalPay'] ?? 0);
                            $sssDed = floatval($payrollData['sssDeduction'] ?? 0);
                            
                            // Sum ONLY the OT fields (not premium or additional)
                            $otFields = [
                                'otRegular',
                                'otRestday',
                                'otHolidayRegular',
                                'otHolidaySpecial',
                                'otHolidayRDRegular',
                                'otHolidayRDSpecial',
                                'otOrdinaryWorking',
                                'nightDiffHolidayOT',
                                'nightDiffOTRegular',
                                'nightDiffOTRestday',
                                'nightDiffHolidayRDOT',
                                'nightDiffHolidayRDSpecial',
                                'nightDiffHolidayRDSpecialOT',
                            ];
                            
                            $overtimePay = 0;
                            foreach ($otFields as $field) {
                                $overtimePay += floatval($payrollData[$field] ?? 0);
                            }
                            
                            $employeeData[$empId]['gross_pay_total'] += $grossPay;
                            $employeeData[$empId]['sss_deduction_total'] += $sssDed;
                            $employeeData[$empId]['overtime_pay_total'] += $overtimePay;
                        }
                    }
                }
            }
            
            // Remove any existing items for this 13th month pay before creating new ones (prevents duplicates)
            ThirteenthMonthPayItem::where('thirteenth_month_pay_id', $thirteenthMonthPay->id)->delete();

            $itemsCreated = 0;

            // Create 13th month pay items for each employee
            foreach ($employeeData as $empId => $data) {
                // 13th month pay = (Total Gross Pay - Total OT Pay) / 12
                // OT is excluded from 13th month pay calculation
                $baseGrossPay = $data['gross_pay_total'] - $data['overtime_pay_total'];
                $thirteenthMonthPayAmount = $baseGrossPay / 12;

                ThirteenthMonthPayItem::create([
                    'thirteenth_month_pay_id' => $thirteenthMonthPay->id,
                    'employee_id' => $empId,
                    'gross_pay_total' => $data['gross_pay_total'],
                    'overtime_pay_total' => $data['overtime_pay_total'],
                    'thirteenth_month_pay' => $thirteenthMonthPayAmount,
                ]);

                $itemsCreated++;
            }

            DB::commit();

            return redirect()->route('thirteenth-month-pay.index')
                ->with('success', "13th Month Pay generated successfully! {$itemsCreated} employees processed.");

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('13th Month Pay generation failed: ' . $e->getMessage());
            return back()->with('error', 'Failed to generate 13th Month Pay: ' . $e->getMessage());
        }
    }
}
