<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DeductionPayment extends Model
{
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'employee_deduction_id',
        'payslip_id',
        'amount',
        'balance_after',
        'payment_date',
    ];

    /**
     * Get the deduction that owns this payment.
     */
    public function deduction()
    {
        return $this->belongsTo(EmployeeDeduction::class, 'employee_deduction_id');
    }

    /**
     * Get the payslip associated with this payment.
     */
    public function payslip()
    {
        return $this->belongsTo(Payslip::class);
    }
}
