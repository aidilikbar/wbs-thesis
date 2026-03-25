<?php

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('reports')
            ->select(['id', 'anonymity_level', 'reporter_name', 'reporter_email', 'reporter_phone'])
            ->orderBy('id')
            ->chunkById(100, function ($reports) {
                foreach ($reports as $report) {
                    $updates = [];

                    if ($report->anonymity_level === 'confidential') {
                        $updates['anonymity_level'] = 'anonymous';
                    }

                    foreach (['reporter_name', 'reporter_email', 'reporter_phone'] as $field) {
                        $value = $report->{$field};

                        if (is_string($value) && $value !== '' && ! $this->isEncrypted($value)) {
                            $updates[$field] = Crypt::encryptString($value);
                        }
                    }

                    if ($updates !== []) {
                        DB::table('reports')->where('id', $report->id)->update($updates);
                    }
                }
            });

        DB::table('case_files')
            ->where('confidentiality_level', 'confidential')
            ->update(['confidentiality_level' => 'anonymous']);
    }

    public function down(): void
    {
        DB::table('reports')
            ->select(['id', 'anonymity_level', 'reporter_name', 'reporter_email', 'reporter_phone'])
            ->orderBy('id')
            ->chunkById(100, function ($reports) {
                foreach ($reports as $report) {
                    $updates = [];

                    if ($report->anonymity_level === 'anonymous') {
                        $updates['anonymity_level'] = 'confidential';
                    }

                    foreach (['reporter_name', 'reporter_email', 'reporter_phone'] as $field) {
                        $value = $report->{$field};

                        if (is_string($value) && $value !== '' && $this->isEncrypted($value)) {
                            $updates[$field] = Crypt::decryptString($value);
                        }
                    }

                    if ($updates !== []) {
                        DB::table('reports')->where('id', $report->id)->update($updates);
                    }
                }
            });

        DB::table('case_files')
            ->where('confidentiality_level', 'anonymous')
            ->update(['confidentiality_level' => 'confidential']);
    }

    private function isEncrypted(string $value): bool
    {
        try {
            Crypt::decryptString($value);

            return true;
        } catch (DecryptException) {
            return false;
        }
    }
};
