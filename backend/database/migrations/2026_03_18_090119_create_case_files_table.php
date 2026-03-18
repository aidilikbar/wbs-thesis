<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('case_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('case_number')->unique();
            $table->string('stage')->default('intake')->index();
            $table->string('disposition')->default('new');
            $table->string('assigned_unit')->nullable();
            $table->string('assigned_to')->nullable();
            $table->timestamp('triaged_at')->nullable();
            $table->timestamp('sla_due_at')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->string('confidentiality_level')->default('confidential');
            $table->boolean('escalation_required')->default(false);
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('case_files');
    }
};
