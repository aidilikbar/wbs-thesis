<?php

use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CaseMessageController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\GovernanceDashboardController;
use App\Http\Controllers\Api\PublicReportController;
use App\Http\Controllers\Api\ReportAttachmentController;
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
        Route::get('/reports/{report}', [ReporterReportController::class, 'show']);
        Route::patch('/reports/{report}', [ReporterReportController::class, 'update']);
        Route::get('/reports/{report}/messages', [CaseMessageController::class, 'reporterIndex']);
        Route::post('/reports/{report}/messages', [CaseMessageController::class, 'reporterStore']);
        Route::get('/reports/{report}/messages/{message}/attachments/{attachment}/download', [CaseMessageController::class, 'reporterDownload']);
        Route::post('/reports/{report}/attachments', [ReportAttachmentController::class, 'reporterStore']);
        Route::delete('/reports/{report}/attachments/{attachment}', [ReportAttachmentController::class, 'reporterDestroy']);
        Route::get('/reports/{report}/attachments/{attachment}/download', [ReportAttachmentController::class, 'reporterDownload']);
    });

    Route::prefix('workflow')->group(function () {
        Route::get('/cases', [WorkflowCaseController::class, 'index']);
        Route::get('/cases/{caseFile}', [WorkflowCaseController::class, 'show']);
        Route::get('/cases/{caseFile}/messages', [CaseMessageController::class, 'workflowIndex']);
        Route::post('/cases/{caseFile}/messages', [CaseMessageController::class, 'workflowStore']);
        Route::get('/cases/{caseFile}/messages/{message}/attachments/{attachment}/download', [CaseMessageController::class, 'workflowDownload']);
        Route::get('/assignees', [WorkflowCaseController::class, 'assignees']);
        Route::patch('/cases/{caseFile}/delegate-verification', [WorkflowCaseController::class, 'delegateVerification']);
        Route::patch('/cases/{caseFile}/submit-verification', [WorkflowCaseController::class, 'submitVerification']);
        Route::patch('/cases/{caseFile}/review-verification', [WorkflowCaseController::class, 'reviewVerification']);
        Route::patch('/cases/{caseFile}/delegate-investigation', [WorkflowCaseController::class, 'delegateInvestigation']);
        Route::patch('/cases/{caseFile}/submit-investigation', [WorkflowCaseController::class, 'submitInvestigation']);
        Route::patch('/cases/{caseFile}/review-investigation', [WorkflowCaseController::class, 'reviewInvestigation']);
        Route::patch('/cases/{caseFile}/director-review', [WorkflowCaseController::class, 'directorReview']);
        Route::get('/cases/{caseFile}/attachments/{attachment}/download', [ReportAttachmentController::class, 'workflowDownload']);
    });

    Route::prefix('admin')->group(function () {
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::post('/users', [AdminUserController::class, 'store']);
        Route::get('/users/{user}', [AdminUserController::class, 'show']);
        Route::patch('/users/{user}', [AdminUserController::class, 'update']);
        Route::patch('/users/{user}/deactivate', [AdminUserController::class, 'deactivate']);
        Route::delete('/users/{user}', [AdminUserController::class, 'destroy']);
    });

    Route::get('/governance/dashboard', [GovernanceDashboardController::class, 'index']);
});
