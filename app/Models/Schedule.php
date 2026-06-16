<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'year',
        'first_half_start',
        'first_half_end',
        'second_half_start',
        'second_half_end',
        'regular_start',
        'regular_end',
        'night_start',
        'night_end',
    ];

    protected function casts(): array
    {
        return [
            'year' => 'integer',
            'first_half_start' => 'integer',
            'first_half_end' => 'integer',
            'second_half_start' => 'integer',
            'second_half_end' => 'integer',
            'regular_start' => 'datetime:H:i',
            'regular_end' => 'datetime:H:i',
            'night_start' => 'datetime:H:i',
            'night_end' => 'datetime:H:i',
        ];
    }
}
