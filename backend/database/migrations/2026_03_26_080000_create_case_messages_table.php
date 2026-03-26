<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('case_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained()->cascadeOnDelete();
            $table->foreignId('case_file_id')->constrained()->cascadeOnDelete();
            $table->foreignId('sender_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_role', 80);
            $table->string('stage', 80);
            $table->text('body')->nullable();
            $table->timestamps();

            $table->index(['case_file_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_messages');
    }
};
