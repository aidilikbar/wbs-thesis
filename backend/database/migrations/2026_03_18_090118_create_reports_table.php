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
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('public_reference')->nullable()->unique();
            $table->string('tracking_token', 20)->unique();
            $table->string('title');
            $table->string('category')->index();
            $table->longText('description');
            $table->date('incident_date')->nullable();
            $table->string('incident_location')->nullable();
            $table->string('accused_party')->nullable();
            $table->text('evidence_summary')->nullable();
            $table->string('anonymity_level')->default('confidential');
            $table->string('reporter_name')->nullable();
            $table->string('reporter_email')->nullable();
            $table->string('reporter_phone')->nullable();
            $table->boolean('requested_follow_up')->default(true);
            $table->boolean('witness_available')->default(false);
            $table->json('governance_tags')->nullable();
            $table->string('severity')->default('medium')->index();
            $table->string('status')->default('submitted')->index();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('last_public_update_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
