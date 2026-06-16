<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Employee extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'department',
        'employee_number',
        'position',
        'start_date',
        'status',
        'last_name',
        'first_name',
        'middle_name',
        'address',
        'zip_code',
        'contact',
        'email',
        'phone',
        'birthplace',
        'birthdate',
        'age',
        'gender',
        'civil_status',
        'religion',
        'nationality',
        'sss',
        'philhealth',
        'pagibig',
        'tin',
        'bank_name',
        'bank_account',
        'basic_rate',
        'rate_type',
        'allowance',
        'photo',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'birthdate' => 'date',
            'basic_rate' => 'decimal:2',
            'allowance' => 'decimal:2',
        ];
    }

    /**
     * Get the employee's full name.
     */
    public function getFullNameAttribute(): string
    {
        $name = trim("{$this->first_name} {$this->middle_name} {$this->last_name}");
        return $name;
    }

    /**
     * Get the leave credits for the employee.
     */
    public function leaveCredits()
    {
        return $this->hasMany(EmployeeLeaveCredit::class);
    }

    /**
     * Get the leave history for the employee.
     */
    public function leaveHistory()
    {
        return $this->hasMany(EmployeeLeaveHistory::class);
    }

    /**
     * Get the deductions for the employee.
     */
    public function deductions()
    {
        return $this->hasMany(EmployeeDeduction::class);
    }

    /**
     * Get the schedules for the employee.
     */
    public function schedules()
    {
        return $this->hasMany(EmployeeSchedule::class);
    }

    public function payslips()
    {
        return $this->hasMany(Payslip::class);
    }

    /**
     * Get the attendance records for the employee.
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    /**
     * Get the payslips for the employee.
     */
    public function payrolls()
    {
        return $this->hasMany(Payslip::class);
    }

    /**
     * Get the 13th month pay items for the employee.
     */
    public function thirteenthMonthPayItems()
    {
        return $this->hasMany(ThirteenthMonthPayItem::class);
    }
}
