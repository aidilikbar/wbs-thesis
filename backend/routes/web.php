<?php

use App\Http\Controllers\ApiDocumentationController;
use App\Http\Middleware\RestrictApiDocumentation;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'application' => 'KPK Whistleblowing System Backend',
        'purpose' => 'Governance-oriented whistleblowing system API.',
        'modules' => [
            'public_reporting' => '/api/reporter/reports',
            'case_tracking' => '/api/tracking',
            'workflow_portal' => '/api/workflow/cases',
            'governance_dashboard' => '/api/governance/dashboard',
            'service_health' => '/up',
        ],
    ]);
});

Route::get('/api/documentation', ApiDocumentationController::class)
    ->middleware(RestrictApiDocumentation::class);
