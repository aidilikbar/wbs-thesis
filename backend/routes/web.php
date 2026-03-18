<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'application' => 'KPK Whistleblowing System Backend',
        'purpose' => 'Governance-oriented whistleblowing system prototype API.',
        'modules' => [
            'public_reporting' => '/api/reports',
            'case_tracking' => '/api/tracking',
            'investigator_portal' => '/api/investigator/cases',
            'governance_dashboard' => '/api/governance/dashboard',
            'service_health' => '/up',
        ],
    ]);
});
