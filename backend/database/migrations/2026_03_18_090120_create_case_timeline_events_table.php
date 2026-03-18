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
        Schema::create('case_timeline_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('case_file_id')->constrained()->cascadeOnDelete();
            $table->string('visibility')->default('public')->index();
            $table->string('stage')->index();
            $table->string('headline');
            $table->text('detail')->nullable();
            $table->string('actor_role');
            $table->string('actor_name')->nullable();
            $table->timestamp('occurred_at')->nullable()->index();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('case_timeline_events');
    }
};
