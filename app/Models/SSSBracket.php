<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SSSBracket extends Model
{
    use HasFactory;

    protected $table = 'sss_brackets';

    protected $fillable = [
        'from',
        'to',
        'er',
        'ee',
        'total',
        'others',
    ];

    protected function casts(): array
    {
        return [
            'from' => 'decimal:2',
            'to' => 'decimal:2',
            'er' => 'decimal:2',
            'ee' => 'decimal:2',
            'total' => 'decimal:2',
        ];
    }
}
