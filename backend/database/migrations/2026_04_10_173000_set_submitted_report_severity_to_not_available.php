<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function ($table) {
            $table->string('severity')->default('not_available')->change();
        });

        DB::table('reports')
            ->whereIn('status', ['submitted', 'verification_in_progress'])
            ->update(['severity' => 'not_available']);
    }

    public function down(): void
    {
        Schema::table('reports', function ($table) {
            $table->string('severity')->default('medium')->change();
        });

        DB::table('reports')
            ->where('severity', 'not_available')
            ->update(['severity' => 'medium']);
    }
};
