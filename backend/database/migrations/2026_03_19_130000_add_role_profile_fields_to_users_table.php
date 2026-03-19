<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('phone')->nullable()->after('email');
            $table->string('role')->default(User::ROLE_REPORTER)->after('phone')->index();
            $table->string('unit')->nullable()->after('role');
            $table->boolean('is_active')->default(true)->after('unit');
        });

        DB::table('users')
            ->whereNull('role')
            ->update(['role' => User::ROLE_REPORTER, 'is_active' => true]);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone', 'role', 'unit', 'is_active']);
        });
    }
};
