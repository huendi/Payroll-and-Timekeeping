<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaxBracket extends Model
{
    use HasFactory;

    protected $table = 'tax_brackets';

    protected $fillable = [
        'from',
        'to',
        'percentage',
        'fixed_amount',
    ];

    protected function casts(): array
    {
        return [
            'from' => 'decimal:2',
            'to' => 'decimal:2',
            'percentage' => 'decimal:2',
            'fixed_amount' => 'decimal:2',
        ];
    }
}
