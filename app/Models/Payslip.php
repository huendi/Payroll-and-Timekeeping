<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payslip extends Model
{
    use HasFactory;

    protected $fillable = [
        'payroll_id',
        'employee_id',
        'basic_pay',
        'allowance',
        'other_pay',
        'incentives',
        'adjustments',
        'overtime_pay',
        'night_diff_pay',
        'holiday_pay',
        'restday_pay',
        'gross_pay',
        'sss_deduction',
        'phic_deduction',
        'hdmf_deduction',
        'tax_deduction',
        'late_deduction',
        'absence_deduction',
        'loan_deductions',
        'total_deductions',
        'net_pay',
        'hours_worked',
        'days_worked',
        'late_minutes',
        'absent_days',
        'leave_days_used',
        'leave_breakdown',
        'overtime_hours',
        'night_diff_hours',
        'remarks',
        'payroll_period',
        'month',
        'year',
        'generated_at',
        'is_archived',
        'archived_at',
        'archived_by',
    ];

    protected $casts = [
        'basic_pay' => 'decimal:2',
        'allowance' => 'decimal:2',
        'other_pay' => 'decimal:2',
        'incentives' => 'decimal:2',
        'adjustments' => 'decimal:2',
        'overtime_pay' => 'decimal:2',
        'night_diff_pay' => 'decimal:2',
        'holiday_pay' => 'decimal:2',
        'restday_pay' => 'decimal:2',
        'gross_pay' => 'decimal:2',
        'sss_deduction' => 'decimal:2',
        'phic_deduction' => 'decimal:2',
        'hdmf_deduction' => 'decimal:2',
        'tax_deduction' => 'decimal:2',
        'late_deduction' => 'decimal:2',
        'absence_deduction' => 'decimal:2',
        'loan_deductions' => 'array',
        'total_deductions' => 'decimal:2',
        'net_pay' => 'decimal:2',
        'hours_worked' => 'decimal:2',
        'absent_days' => 'decimal:2',
        'leave_days_used' => 'decimal:2',
        'leave_breakdown' => 'array',
        'overtime_hours' => 'decimal:2',
        'night_diff_hours' => 'decimal:2',
        'generated_at' => 'datetime',
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

    // Accessors
    public function getPeriodLabelAttribute()
    {
        return "{$this->payroll_period} - {$this->month} {$this->year}";
    }

    public function getFormattedLoanDeductionsAttribute()
    {
        if (!$this->loan_deductions) {
            return [];
        }

        $formatted = [];
        foreach ($this->loan_deductions as $type => $amount) {
            $formatted[] = [
                'type' => $type,
                'amount' => number_format($amount, 2),
            ];
        }
        return $formatted;
    }

    public function getTotalEarningsAttribute()
    {
        return $this->basic_pay
            + $this->allowance
            + $this->other_pay
            + ($this->incentives ?? 0)
            + ($this->adjustments ?? 0)
            + $this->overtime_pay
            + $this->night_diff_pay
            + $this->holiday_pay
            + $this->restday_pay;
    }

    // Scopes
    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeForPeriod($query, $period, $month, $year)
    {
        return $query->where('payroll_period', $period)
            ->where('month', $month)
            ->where('year', $year);
    }

    public function scopeRecent($query, $limit = 10)
    {
        return $query->orderBy('generated_at', 'desc')->limit($limit);
    }

    // Archive methods
    public function isArchived(): bool
    {
        return $this->is_archived;
    }

    public function archive($userId = null): void
    {
        $this->update([
            'is_archived' => true,
            'archived_at' => now(),
            'archived_by' => $userId ?? auth()->id(),
        ]);
    }

    public function restore(): void
    {
        $this->update([
            'is_archived' => false,
            'archived_at' => null,
            'archived_by' => null,
        ]);
    }

    public function scopeArchived($query)
    {
        return $query->where('is_archived', true);
    }

    public function scopeNotArchived($query)
    {
        return $query->where('is_archived', false);
    }
}
