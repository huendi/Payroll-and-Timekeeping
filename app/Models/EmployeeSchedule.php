<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EmployeeSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'employee_id',
        'schedule_id',
        'schedule_file_id',
        'date',
        'time_in',
        'time_out',
        'type',
        'weeks',
        'days_data',
        'is_archived',
        'archived_at',
        'archived_by',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'time_in' => 'datetime:H:i',
            'time_out' => 'datetime:H:i',
            'days_data' => 'array',
        ];
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function schedule()
    {
        return $this->belongsTo(Schedule::class);
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
