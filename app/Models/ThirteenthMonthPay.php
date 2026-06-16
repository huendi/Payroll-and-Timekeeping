<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ThirteenthMonthPay extends Model
{
    use HasFactory;

    protected $table = 'thirteenth_month_pays';

    protected $fillable = [
        'year',
        'from_month',
        'from_year',
        'to_month',
        'to_year',
        'status',
        'generated_at',
        'generated_by',
        'archived_at',
        'archived_by',
    ];

    protected $casts = [
        'generated_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(ThirteenthMonthPayItem::class);
    }

    public function generatedBy()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function archivedBy()
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function isGenerated()
    {
        return $this->generated_at !== null;
    }

    public function isArchived()
    {
        return $this->status === 'archived';
    }

    public function isActive()
    {
        return $this->status === 'active';
    }
}
