<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeDeduction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'employee_id',
        'deduction_type',
        'custom_type',
        'amount',
        'term',
        'cut_off',
        'remaining_balance',
        'payments_made',
        'is_active',
        'start_date',
        'notes',
        'is_archived',
        'archived_at',
        'archived_by',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'remaining_balance' => 'decimal:2',
            'is_active' => 'boolean',
            'is_archived' => 'boolean',
            'start_date' => 'date',
            'archived_at' => 'datetime',
        ];
    }

    /**
     * Get the employee that owns the deduction.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the payments for this deduction.
     */
    public function payments()
    {
        return $this->hasMany(DeductionPayment::class, 'employee_deduction_id');
    }

    /**
     * Get the display name for the deduction type.
     */
    public function getDeductionTypeDisplayAttribute(): string
    {
        if ($this->deduction_type === 'other') {
            return $this->custom_type ?? 'Other';
        }

        return match ($this->deduction_type) {
            'company_loan' => 'Company Loan',
            'cash_advance' => 'Cash Advance',
            'sss_loan' => 'SSS Loan',
            'hdmf_loan' => 'HDMF Loan',
            default => $this->deduction_type,
        };
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
