<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeLeaveCredit extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'leave_type',
        'total_days',
        'remaining_days',
        'is_archived',
        'archived_at',
        'archived_by',
    ];

    protected function casts(): array
    {
        return [
            'total_days' => 'decimal:1',
            'remaining_days' => 'decimal:1',
            'is_archived' => 'boolean',
            'archived_at' => 'datetime',
        ];
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
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
