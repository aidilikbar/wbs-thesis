<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('case_files', function (Blueprint $table) {
            $table->string('current_role')
                ->default(User::ROLE_SUPERVISOR_OF_VERIFICATOR)
                ->after('stage')
                ->index();
            $table->foreignId('verification_supervisor_id')
                ->nullable()
                ->after('assigned_to')
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('verificator_id')
                ->nullable()
                ->after('verification_supervisor_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('investigation_supervisor_id')
                ->nullable()
                ->after('verificator_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('investigator_id')
                ->nullable()
                ->after('investigation_supervisor_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->foreignId('director_id')
                ->nullable()
                ->after('investigator_id')
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('completed_at')->nullable()->after('last_activity_at');
        });
    }

    public function down(): void
    {
        Schema::table('case_files', function (Blueprint $table) {
            $table->dropConstrainedForeignId('verification_supervisor_id');
            $table->dropConstrainedForeignId('verificator_id');
            $table->dropConstrainedForeignId('investigation_supervisor_id');
            $table->dropConstrainedForeignId('investigator_id');
            $table->dropConstrainedForeignId('director_id');
            $table->dropColumn(['current_role', 'completed_at']);
        });
    }
};
