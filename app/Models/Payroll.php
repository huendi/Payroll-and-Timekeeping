<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payroll extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'payroll_period',
        'month',
        'year',
        'apply_deductions',
        'schedule_id',
        'total_employees',
        'total_gross',
        'total_deductions',
        'total_net',
        'status',
        'excel_file_path',
        'draft_snapshot',
        'uploaded_by',
        'approved_by',
        'approved_at',
        'rejection_reason',
        'is_archived',
        'archived_at',
        'archived_by',
    ];

    protected $casts = [
        'apply_deductions' => 'boolean',
        'total_gross' => 'decimal:2',
        'total_deductions' => 'decimal:2',
        'total_net' => 'decimal:2',
        'approved_at' => 'datetime',
        'draft_snapshot' => 'array',
    ];

    // Relationships
    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
    }

    public function uploadedBy()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function approvedBy()
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function items()
    {
        return $this->hasMany(PayrollItem::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function payslips()
    {
        return $this->hasMany(Payslip::class);
    }

    // Status helper methods
    public function isDraft()
    {
        return $this->status === 'draft';
    }

    public function isPending()
    {
        return $this->status === 'pending';
    }

    public function isApproved()
    {
        return $this->status === 'approved';
    }

    public function isRejected()
    {
        return $this->status === 'rejected';
    }

    // Scope for filtering
    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeForPeriod($query, $period, $month, $year)
    {
        return $query->where('payroll_period', $period)
            ->where('month', $month)
            ->where('year', $year);
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
