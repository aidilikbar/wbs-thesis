<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GovernanceControl extends Model
{
    protected $fillable = [
        'code',
        'name',
        'description',
        'owner_role',
        'status',
        'target_metric',
        'current_metric',
        'notes',
    ];
}
