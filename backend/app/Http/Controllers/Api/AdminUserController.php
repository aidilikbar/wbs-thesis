<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateUserRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AdminUserController extends Controller
{
    #[OA\Get(
        path: '/api/admin/users',
        operationId: 'listInternalUsers',
        summary: 'List provisioned users',
        description: 'Returns the user directory. This endpoint is restricted to the system administrator.',
        tags: ['Administration'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'User directory returned.', content: new OA\JsonContent(ref: '#/components/schemas/UserListResponse')),
            new OA\Response(response: 403, description: 'System administrator access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $this->authorizeSystemAdministrator($request);

        $users = User::query()
            ->orderBy('role')
            ->orderBy('name')
            ->get()
            ->map(fn (User $user) => $this->transformUser($user));

        return response()->json([
            'data' => $users,
        ]);
    }

    #[OA\Post(
        path: '/api/admin/users',
        operationId: 'createInternalUser',
        summary: 'Create an internal user',
        description: 'Creates an internal role account. Reporter registration is not allowed through this endpoint.',
        tags: ['Administration'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/CreateUserRequest')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Internal user created.', content: new OA\JsonContent(ref: '#/components/schemas/UserMutationResponse')),
            new OA\Response(response: 403, description: 'System administrator access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function store(CreateUserRequest $request): JsonResponse
    {
        $this->authorizeSystemAdministrator($request);

        $user = User::query()->create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'phone' => $request->string('phone')->toString(),
            'role' => $request->string('role')->toString(),
            'unit' => $request->string('unit')->toString() ?: null,
            'is_active' => true,
            'password' => $request->string('password')->toString(),
        ]);

        return response()->json([
            'message' => 'Internal user created successfully.',
            'data' => $this->transformUser($user),
        ], 201);
    }

    private function authorizeSystemAdministrator(Request $request): void
    {
        abort_unless(
            $request->user()?->hasRole(User::ROLE_SYSTEM_ADMINISTRATOR),
            403,
            'Only the system administrator may manage internal users.'
        );
    }

    private function transformUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'role_label' => $user->role_label,
            'unit' => $user->unit,
            'is_active' => $user->is_active,
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}
