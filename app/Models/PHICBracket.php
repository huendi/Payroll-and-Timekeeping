<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PHICBracket extends Model
{
    protected $table = 'phic_brackets';

    protected $fillable = [
        'from',
        'to',
        'percentage',
        'fixed_amount',
    ];
}
