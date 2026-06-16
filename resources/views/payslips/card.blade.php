<div id="payslip-card" style="width: 384px; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px;">
    <!-- Header -->
    <div style="border-bottom: 1px solid #e5e7eb; padding: 16px 24px;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <img src="/favicon.svg" style="width: 40px; height: 40px; object-fit: contain;" />
            <div>
                <div style="font-size: 18px; font-weight: 600; color: #111827;">TechnoPark Hotel</div>
                <div style="font-size: 13px; color: #9ca3af;">{{ $payslip->month }} {{ $payslip->payroll_period === '1st Half' ? '1-15' : '16-End' }}, {{ $payslip->year }}</div>
            </div>
        </div>
    </div>

    <div style="padding: 16px 24px;">
        <!-- Employee Information -->
        <div style="margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 8px; margin-bottom: 8px; font-size: 13px;">
                <span style="color: #6b7280;">Employee ID</span>
                <span style="font-weight: 600; color: #111827;">{{ $payslip->employee->employee_number }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 8px; margin-bottom: 8px; font-size: 13px;">
                <span style="color: #6b7280;">Name</span>
                <span style="font-weight: 600; color: #111827;">{{ $payslip->employee->first_name }} {{ $payslip->employee->last_name }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 8px; margin-bottom: 8px; font-size: 13px;">
                <span style="color: #6b7280;">Payroll Period</span>
                <span style="font-weight: 600; color: #111827;">{{ $payslip->payroll_period }}</span>
            </div>
        </div>

        <!-- Earnings Section -->
        <div style="margin-bottom: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <div style="font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 8px;">Earnings</div>
            @if($payslip->employee->rate_type === 'daily')
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151; width: 33%; text-align: left;">Basic Pay</span>
                <span style="color: #9ca3af; font-size: 11px; width: 33%; text-align: center;">{{ number_format($payslip->days_worked, 0) }} days</span>
                <span style="font-weight: 600; color: #111827; width: 33%; text-align: right;">₱{{ number_format($payslip->basic_pay, 2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151; width: 33%; text-align: left;">Allowance</span>
                <span style="color: #9ca3af; font-size: 11px; width: 33%; text-align: center;">{{ number_format($payslip->days_worked, 0) }} days</span>
                <span style="font-weight: 600; color: #111827; width: 33%; text-align: right;">₱{{ number_format($payslip->allowance, 2) }}</span>
            </div>
            @else
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151;">Basic Pay</span>
                <span style="font-weight: 600; color: #111827;">₱{{ number_format($payslip->basic_pay, 2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151;">Allowance</span>
                <span style="font-weight: 600; color: #111827;">₱{{ number_format($payslip->allowance, 2) }}</span>
            </div>
            @endif
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151; width: 33%; text-align: left;">Overtime Pay</span>
                <span style="color: #9ca3af; font-size: 11px; width: 33%; text-align: center;">{{ $payslip->overtime_hours > 0 ? ($payslip->overtime_hours * 1) . ' hrs' : '-' }}</span>
                <span style="font-weight: 600; color: #111827; width: 33%; text-align: right;">₱{{ number_format($payslip->overtime_pay, 2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151; width: 33%; text-align: left;">Holiday & Restday Pay</span>
                <span style="color: #9ca3af; font-size: 11px; width: 33%; text-align: center;">{{ ($payslip->holiday_restday_hours ?? 0) > 0 ? (($payslip->holiday_restday_hours ?? 0) * 1) . ' hrs' : '-' }}</span>
                <span style="font-weight: 600; color: #111827; width: 33%; text-align: right;">₱{{ number_format(floatval($payslip->holiday_pay) + floatval($payslip->restday_pay), 2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151; width: 33%; text-align: left;">Night Shift Differential</span>
                <span style="color: #9ca3af; font-size: 11px; width: 33%; text-align: center;">{{ $payslip->night_diff_hours > 0 ? ($payslip->night_diff_hours * 1) . ' hrs' : '-' }}</span>
                <span style="font-weight: 600; color: #111827; width: 33%; text-align: right;">₱{{ number_format($payslip->night_diff_pay, 2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151;">Incentives</span>
                <span style="font-weight: 600; color: #111827;">{{ $payslip->incentives ? '₱' . number_format($payslip->incentives, 2) : '-' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151;">Adjustments</span>
                <span style="font-weight: 600; color: #111827;">{{ $payslip->adjustments ? '₱' . number_format($payslip->adjustments, 2) : '-' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #111827; border-bottom: none; padding-top: 8px; margin-top: 8px; font-weight: 600; font-size: 13px;">
                <span style="color: #111827;">Total Earnings</span>
                <span style="color: #3b82f6;">₱{{ number_format($totalPayWithIncentives, 2) }}</span>
            </div>
        </div>

        <!-- Deductions Section -->
        <div style="margin-bottom: 16px; border-top: 1px solid #e5e7eb; padding-top: 12px;">
            <div style="font-size: 13px; font-weight: 600; color: #111827; margin-bottom: 8px;">Deductions</div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151; width: 33%; text-align: left;">Late and Absences</span>
                @php
                    $totalLateAbsMinutes = $payslip->late_and_abs_minutes ?? (($payslip->late_minutes ?? 0) + (($payslip->absent_days ?? 0) * 480));
                @endphp
                <span style="color: #9ca3af; font-size: 11px; width: 33%; text-align: center;">{{ $totalLateAbsMinutes > 0 ? number_format($totalLateAbsMinutes, 0) . ' mins' : '-' }}</span>
                <span style="font-weight: 600; color: #111827; width: 33%; text-align: right;">₱{{ number_format(floatval($payslip->late_deduction) + floatval($payslip->absence_deduction), 2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151;">Loans and Advances</span>
                <span style="font-weight: 600; color: #111827;">{{ $loanTotal !== null && $loanTotal !== 0 ? '₱' . number_format($loanTotal, 2) : '-' }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151;">SSS Contribution</span>
                <span style="font-weight: 600; color: #111827;">₱{{ number_format($payslip->sss_deduction, 2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151;">PHIC Contribution</span>
                <span style="font-weight: 600; color: #111827;">₱{{ number_format($payslip->phic_deduction, 2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151;">HDMF Contribution</span>
                <span style="font-weight: 600; color: #111827;">₱{{ number_format($payslip->hdmf_deduction, 2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #d1d5db; padding-bottom: 6px; margin-bottom: 6px; font-size: 13px;">
                <span style="color: #374151;">Tax</span>
                <span style="font-weight: 600; color: #111827;">₱{{ number_format($payslip->tax_deduction, 2) }}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #111827; border-bottom: none; padding-top: 8px; margin-top: 8px; font-weight: 600; color: #111827; font-size: 13px;">
                <span>Total Deductions</span>
                <span style="color: #ef4444;">₱{{ number_format($payslip->total_deductions, 2) }}</span>
            </div>
        </div>
    </div>

    <!-- Net Pay Section -->
    <div style="background: #dbeafe; border-radius: 0 0 8px 8px; padding: 16px 24px; margin: 0; border-top: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 13px; font-weight: 700; color: #111827;">NET PAY</span>
            <span style="font-size: 20px; font-weight: 700; color: #3b82f6;">₱{{ number_format($payslip->net_pay, 2) }}</span>
        </div>
    </div>
</div>
