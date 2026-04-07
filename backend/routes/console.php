<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('openapi:sync-server-url', function () {
    $documentation = (string) config('l5-swagger.default', 'default');
    $docsDirectory = rtrim((string) config('l5-swagger.defaults.paths.docs'), '/');
    $jsonFilename = (string) config("l5-swagger.documentations.{$documentation}.paths.docs_json", 'api-docs.json');
    $jsonPath = "{$docsDirectory}/{$jsonFilename}";

    if (! File::exists($jsonPath)) {
        $this->error("OpenAPI JSON not found at {$jsonPath}. Run php artisan l5-swagger:generate first.");

        return self::FAILURE;
    }

    $decoded = json_decode(File::get($jsonPath), true);

    if (! is_array($decoded)) {
        $this->error("OpenAPI JSON at {$jsonPath} is invalid.");

        return self::FAILURE;
    }

    $appUrl = rtrim((string) config('app.url'), '/');
    $servers = [];

    if ($appUrl !== '') {
        $servers[] = [
            'url' => $appUrl,
            'description' => 'Configured application URL',
        ];
    }

    if ($appUrl !== 'http://127.0.0.1:8000') {
        $servers[] = [
            'url' => 'http://127.0.0.1:8000',
            'description' => 'Local development backend',
        ];
    }

    $decoded['servers'] = $servers;

    File::put(
        $jsonPath,
        json_encode($decoded, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE).PHP_EOL
    );

    $this->info("Updated OpenAPI servers in {$jsonPath}");

    return self::SUCCESS;
})->purpose('Rewrite generated OpenAPI server URLs from APP_URL');
