<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'payroll_id',
        'date',
        'clock_in',
        'clock_out',
        'scheduled_in',
        'scheduled_out',
        'hours_worked',
        'late_minutes',
        'overtime_hours',
        'overtime_type',
        'is_ot_paid',
        'night_diff_hours',
        'is_holiday',
        'holiday_type',
        'is_restday',
        'remarks',
    ];

    protected $casts = [
        'date' => 'date',
        'hours_worked' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
        'night_diff_hours' => 'decimal:2',
        'is_ot_paid' => 'boolean',
        'is_holiday' => 'boolean',
        'is_restday' => 'boolean',
    ];

    protected $appends = [
        'formatted_clock_in',
        'formatted_clock_out',
        'formatted_date',
    ];

    // Relationships
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function payroll()
    {
        return $this->belongsTo(Payroll::class);
    }

    // Accessors
    public function getIsLateAttribute()
    {
        return $this->late_minutes > 0;
    }

    public function getHasOvertimeAttribute()
    {
        return $this->overtime_hours > 0;
    }

    public function getFormattedClockInAttribute()
    {
        return $this->clock_in ? Carbon::parse($this->clock_in)->format('h:i A') : '-';
    }

    public function getFormattedClockOutAttribute()
    {
        return $this->clock_out ? Carbon::parse($this->clock_out)->format('h:i A') : '-';
    }

    public function getFormattedDateAttribute()
    {
        return $this->date ? $this->date->format('M d, Y') : '-';
    }

    public function getStatusAttribute()
    {
        if ($this->is_holiday) {
            return 'Holiday';
        }
        if ($this->is_restday) {
            return 'Rest Day';
        }
        if (!$this->clock_in && !$this->clock_out) {
            return 'Absent';
        }
        if ($this->is_late) {
            return 'Late';
        }
        return 'Present';
    }

    // Scopes
    public function scopeForEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    public function scopeForPayroll($query, $payrollId)
    {
        return $query->where('payroll_id', $payrollId);
    }

    public function scopeForDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    public function scopeWithOvertime($query)
    {
        return $query->where('overtime_hours', '>', 0);
    }

    public function scopeLate($query)
    {
        return $query->where('late_minutes', '>', 0);
    }

    public function scopeHolidays($query)
    {
        return $query->where('is_holiday', true);
    }

    public function scopeRestDays($query)
    {
        return $query->where('is_restday', true);
    }
}
