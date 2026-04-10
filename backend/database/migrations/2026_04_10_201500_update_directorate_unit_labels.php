<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const LEGACY_UNIT = 'Directorate';
    private const CANONICAL_UNIT = 'Directorate of Public Reports and Complaints';

    public function up(): void
    {
        DB::table('users')
            ->where('role', User::ROLE_DIRECTOR)
            ->where(function ($query) {
                $query
                    ->whereNull('unit')
                    ->orWhere('unit', self::LEGACY_UNIT);
            })
            ->update(['unit' => self::CANONICAL_UNIT]);

        DB::table('case_files')
            ->where('assigned_unit', self::LEGACY_UNIT)
            ->update(['assigned_unit' => self::CANONICAL_UNIT]);
    }

    public function down(): void
    {
        DB::table('users')
            ->where('role', User::ROLE_DIRECTOR)
            ->where('unit', self::CANONICAL_UNIT)
            ->update(['unit' => self::LEGACY_UNIT]);

        DB::table('case_files')
            ->where('assigned_unit', self::CANONICAL_UNIT)
            ->update(['assigned_unit' => self::LEGACY_UNIT]);
    }
};
