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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('auditable_type');
            $table->unsignedBigInteger('auditable_id');
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('case_file_id')->constrained()->cascadeOnDelete();
            $table->string('actor_role');
            $table->string('actor_name')->nullable();
            $table->string('action')->index();
            $table->json('context')->nullable();
            $table->timestamp('happened_at')->nullable()->index();

            $table->index(['auditable_type', 'auditable_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
