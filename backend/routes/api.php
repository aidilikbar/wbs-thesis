<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\GovernanceDashboardController;
use App\Http\Controllers\Api\PublicReportController;
use App\Http\Controllers\Api\ReporterReportController;
use App\Http\Controllers\Api\WorkflowCaseController;
use Illuminate\Support\Facades\Route;

Route::get('/catalog', [CatalogController::class, 'index']);
Route::post('/auth/register', [AuthController::class, 'registerReporter']);
Route::post('/auth/login', [AuthController::class, 'login']);

Route::post('/tracking', [PublicReportController::class, 'track']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::prefix('reporter')->group(function () {
        Route::get('/reports', [ReporterReportController::class, 'index']);
        Route::post('/reports', [ReporterReportController::class, 'store']);
    });

    Route::prefix('workflow')->group(function () {
        Route::get('/cases', [WorkflowCaseController::class, 'index']);
        Route::get('/assignees', [WorkflowCaseController::class, 'assignees']);
        Route::patch('/cases/{caseFile}/delegate-verification', [WorkflowCaseController::class, 'delegateVerification']);
        Route::patch('/cases/{caseFile}/submit-verification', [WorkflowCaseController::class, 'submitVerification']);
        Route::patch('/cases/{caseFile}/review-verification', [WorkflowCaseController::class, 'reviewVerification']);
        Route::patch('/cases/{caseFile}/delegate-investigation', [WorkflowCaseController::class, 'delegateInvestigation']);
        Route::patch('/cases/{caseFile}/submit-investigation', [WorkflowCaseController::class, 'submitInvestigation']);
        Route::patch('/cases/{caseFile}/review-investigation', [WorkflowCaseController::class, 'reviewInvestigation']);
        Route::patch('/cases/{caseFile}/director-review', [WorkflowCaseController::class, 'directorReview']);
    });

    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::post('/users', [AdminUserController::class, 'store']);
    });

    Route::get('/governance/dashboard', [GovernanceDashboardController::class, 'index']);
});
