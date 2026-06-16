<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PayrollItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_id',
        'employee_id',
        'hours_worked',
        'days_worked',
        'late_minutes',
        'absent_days',
        'leave_days_used',
        'leave_breakdown',
        'overtime_hours',
        'night_diff_hours',
        'basic_pay',
        'allowance_pay',
        'regular_allowance',
        'restday_allowance',
        'other_pay',
        'overtime_pay',
        'night_diff_pay',
        'holiday_pay',
        'restday_pay',
        'restday_premium',
        'gross_pay',
        'sss_deduction',
        'phic_deduction',
        'hdmf_deduction',
        'tax_deduction',
        'late_deduction',
        'absence_deduction',
        'loan_deduction', // Total of all employee deductions (company loan, cash advance, sss loan, hdmf loan, etc.)
        'total_deductions',
        'net_pay',
        'remarks',
        // Hours and days breakdown
        'regular_hours',
        'restday_hours',
        'total_days',
        // Night Differential Breakdown
        'night_diff_ordinary_working',
        'night_diff_holiday',
        'night_diff_holiday_restday',
        'night_diff_restday',
        'night_diff_holiday_ot',
        'night_diff_holiday_restday_ot',
        // Overtime Pay Breakdown
        'ot_holiday',
        'ot_holiday_restday',
        'ot_regular',
        'ot_restday',
        'ot_ordinary_working',
        // Additional Premium Pay (1st 8 hrs)
        'premium_restday',
        'premium_holiday_regular',
        'premium_holiday_special',
        'premium_holiday_rd_regular',
        'premium_holiday_rd_special',
    ];

    protected $casts = [
        'hours_worked' => 'decimal:2',
        'absent_days' => 'decimal:2',
        'leave_days_used' => 'decimal:2',
        'leave_breakdown' => 'array',
        'overtime_hours' => 'decimal:2',
        'night_diff_hours' => 'decimal:2',
        'basic_pay' => 'decimal:2',
        'allowance_pay' => 'decimal:2',
        'other_pay' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'night_diff_pay' => 'decimal:2',
        'holiday_pay' => 'decimal:2',
        'restday_pay' => 'decimal:2',
        'restday_premium' => 'decimal:2',
        'gross_pay' => 'decimal:2',
        'sss_deduction' => 'decimal:2',
        'phic_deduction' => 'decimal:2',
        'hdmf_deduction' => 'decimal:2',
        'tax_deduction' => 'decimal:2',
        'late_deduction' => 'decimal:2',
        'absence_deduction' => 'decimal:2',
        'loan_deduction' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        // Night Differential Breakdown
        'night_diff_ordinary_working' => 'decimal:2',
        'night_diff_holiday' => 'decimal:2',
        'night_diff_holiday_restday' => 'decimal:2',
        'night_diff_restday' => 'decimal:2',
        'night_diff_holiday_ot' => 'decimal:2',
        'night_diff_holiday_restday_ot' => 'decimal:2',
        // Overtime Pay Breakdown
        'ot_holiday' => 'decimal:2',
        'ot_holiday_restday' => 'decimal:2',
        'ot_regular' => 'decimal:2',
        'ot_restday' => 'decimal:2',
        'ot_ordinary_working' => 'decimal:2',
        // Additional Premium Pay (1st 8 hrs)
        'premium_restday' => 'decimal:2',
        'premium_holiday_regular' => 'decimal:2',
        'premium_holiday_special' => 'decimal:2',
        'premium_holiday_rd_regular' => 'decimal:2',
        'premium_holiday_rd_special' => 'decimal:2',
    ];

    // Relationships
    public function payroll()
    {
        return $this->belongsTo(Payroll::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    // Computed attributes
    public function getTotalEarningsAttribute()
    {
        return $this->basic_pay + $this->allowance_pay + $this->other_pay + 
               $this->overtime_pay + $this->night_diff_pay + 
               $this->holiday_pay + $this->restday_pay;
    }

    public function getFormattedLoanDeductionsAttribute()
    {
        if (!$this->loan_deduction || $this->loan_deduction == 0) {
            return [];
        }

        return [[
            'type' => 'Total Loans',
            'amount' => number_format($this->loan_deduction, 2),
        ]];
    }
}
