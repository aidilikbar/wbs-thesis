<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\SystemSettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use OpenApi\Attributes as OA;

class AdminOperationalKpiController extends Controller
{
    public function __construct(
        private readonly SystemSettingService $systemSettingService,
    ) {
    }

    #[OA\Get(
        path: '/api/admin/settings/operational-kpis',
        operationId: 'getOperationalKpiSettings',
        summary: 'Get operational KPI settings',
        description: 'Returns the persisted operational KPI settings used by the oversight dashboard. This endpoint is restricted to the system administrator.',
        tags: ['Administration'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Operational KPI settings returned.', content: new OA\JsonContent(ref: '#/components/schemas/OperationalKpiSettingsResponse')),
            new OA\Response(response: 403, description: 'System administrator access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
        ]
    )]
    public function show(Request $request): JsonResponse
    {
        $this->authorizeSystemAdministrator($request);

        return response()->json([
            'data' => $this->systemSettingService->getOperationalKpiSettings(),
        ]);
    }

    #[OA\Patch(
        path: '/api/admin/settings/operational-kpis',
        operationId: 'updateOperationalKpiSettings',
        summary: 'Update operational KPI settings',
        description: 'Updates the working-hour and step-budget configuration used by the oversight dashboard. This endpoint is restricted to the system administrator.',
        tags: ['Administration'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/OperationalKpiSettingsRequest')),
        responses: [
            new OA\Response(response: 200, description: 'Operational KPI settings updated.', content: new OA\JsonContent(ref: '#/components/schemas/OperationalKpiSettingsMutationResponse')),
            new OA\Response(response: 403, description: 'System administrator access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function update(Request $request): JsonResponse
    {
        $administrator = $this->authorizeSystemAdministrator($request);

        $validated = $request->validate([
            'timezone' => ['nullable', 'string', 'max:64'],
            'workday_start' => ['required', 'date_format:H:i'],
            'workday_end' => ['required', 'date_format:H:i'],
            'weekend_days' => ['nullable', 'array'],
            'weekend_days.*' => ['integer', 'between:1,7', 'distinct'],
            'non_working_dates' => ['nullable', 'array'],
            'non_working_dates.*' => ['date_format:Y-m-d'],
            'verification_screening_hours' => ['required', 'numeric', 'min:0.1'],
            'verification_work_hours' => ['required', 'numeric', 'min:0.1'],
            'verification_approval_hours' => ['required', 'numeric', 'min:0.1'],
            'investigation_delegation_hours' => ['required', 'numeric', 'min:0.1'],
            'investigation_work_hours' => ['required', 'numeric', 'min:0.1'],
            'investigation_approval_hours' => ['required', 'numeric', 'min:0.1'],
            'director_approval_hours' => ['required', 'numeric', 'min:0.1'],
        ]);

        if ((string) $validated['workday_end'] <= (string) $validated['workday_start']) {
            throw ValidationException::withMessages([
                'workday_end' => 'The workday end time must be after the workday start time.',
            ]);
        }

        $settings = $this->systemSettingService->updateOperationalKpiSettings($validated, $administrator);

        return response()->json([
            'message' => 'Operational KPI settings updated successfully.',
            'data' => $settings,
        ]);
    }

    private function authorizeSystemAdministrator(Request $request): User
    {
        /** @var User|null $user */
        $user = $request->user();

        abort_unless(
            $user?->hasRole(User::ROLE_SYSTEM_ADMINISTRATOR),
            403,
            'Only the system administrator may manage operational KPI settings.'
        );

        return $user;
    }
}
