<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ThirteenthMonthPayItem extends Model
{
    use HasFactory;

    protected $table = 'thirteenth_month_pay_items';

    protected $fillable = [
        'thirteenth_month_pay_id',
        'employee_id',
        'gross_pay_total',
        'overtime_pay_total',
        'thirteenth_month_pay',
    ];

    protected $casts = [
        'gross_pay_total' => 'decimal:2',
        'overtime_pay_total' => 'decimal:2',
        'thirteenth_month_pay' => 'decimal:2',
    ];

    public function thirteenthMonthPay()
    {
        return $this->belongsTo(ThirteenthMonthPay::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }
}
