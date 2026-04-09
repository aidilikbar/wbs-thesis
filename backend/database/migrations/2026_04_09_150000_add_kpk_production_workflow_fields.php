<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::getDriverName();

        Schema::table('reports', function (Blueprint $table) {
            $table->json('reported_parties')->nullable()->after('accused_party');
        });

        Schema::table('case_files', function (Blueprint $table) {
            $table->json('screening_payload')->nullable()->after('notes');
            $table->json('verification_payload')->nullable()->after('screening_payload');
            $table->json('verification_approval_payload')->nullable()->after('verification_payload');
            $table->json('review_distribution_payload')->nullable()->after('verification_approval_payload');
            $table->json('review_payload')->nullable()->after('review_distribution_payload');
            $table->json('review_approval_payload')->nullable()->after('review_payload');
            $table->json('director_approval_payload')->nullable()->after('review_approval_payload');
        });

        DB::table('reports')
            ->whereNotNull('accused_party')
            ->where(function ($query) use ($driver) {
                $query
                    ->whereNull('reported_parties');

                if ($driver === 'pgsql') {
                    $query->orWhereRaw("reported_parties::jsonb = '[]'::jsonb");
                } else {
                    $query->orWhere('reported_parties', json_encode([]));
                }
            })
            ->orderBy('id')
            ->lazy()
            ->each(function ($report) {
                $accusedParty = trim((string) $report->accused_party);

                if ($accusedParty === '') {
                    return;
                }

                DB::table('reports')
                    ->where('id', $report->id)
                    ->update([
                        'reported_parties' => json_encode([[
                            'full_name' => $accusedParty,
                            'position' => 'Not specified',
                            'classification' => 'other',
                        ]], JSON_THROW_ON_ERROR),
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('case_files', function (Blueprint $table) {
            $table->dropColumn([
                'screening_payload',
                'verification_payload',
                'verification_approval_payload',
                'review_distribution_payload',
                'review_payload',
                'review_approval_payload',
                'director_approval_payload',
            ]);
        });

        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn('reported_parties');
        });
    }
};
