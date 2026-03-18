<?php

use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\GovernanceDashboardController;
use App\Http\Controllers\Api\InvestigatorCaseController;
use App\Http\Controllers\Api\PublicReportController;
use Illuminate\Support\Facades\Route;

Route::get('/catalog', [CatalogController::class, 'index']);

Route::post('/reports', [PublicReportController::class, 'store']);
Route::post('/tracking', [PublicReportController::class, 'track']);

Route::prefix('investigator')->group(function () {
    Route::get('/cases', [InvestigatorCaseController::class, 'index']);
    Route::patch('/cases/{caseFile}/assign', [InvestigatorCaseController::class, 'assign']);
    Route::patch('/cases/{caseFile}/status', [InvestigatorCaseController::class, 'updateStatus']);
});

Route::get('/governance/dashboard', [GovernanceDashboardController::class, 'index']);
