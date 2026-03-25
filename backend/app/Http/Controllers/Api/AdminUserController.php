<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\CaseFile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use OpenApi\Attributes as OA;

class AdminUserController extends Controller
{
    #[OA\Get(
        path: '/api/admin/users',
        operationId: 'listProvisionedUsers',
        summary: 'List users with pagination',
        description: 'Returns the user directory. This endpoint is restricted to the system administrator.',
        tags: ['Administration'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 1)),
            new OA\Parameter(name: 'per_page', in: 'query', required: false, schema: new OA\Schema(type: 'integer', default: 10)),
            new OA\Parameter(name: 'search', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'role', in: 'query', required: false, schema: new OA\Schema(type: 'string')),
            new OA\Parameter(name: 'status', in: 'query', required: false, schema: new OA\Schema(type: 'string', enum: ['active', 'inactive'])),
        ],
        responses: [
            new OA\Response(response: 200, description: 'Paginated user directory returned.', content: new OA\JsonContent(ref: '#/components/schemas/UserDirectoryResponse')),
            new OA\Response(response: 403, description: 'System administrator access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        $this->authorizeSystemAdministrator($request);

        $perPage = min(max($request->integer('per_page', 10), 1), 50);
        $search = trim($request->string('search')->toString());
        $role = $request->string('role')->toString();
        $status = $request->string('status')->toString();

        $users = User::query()
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($nested) use ($search) {
                    $like = "%{$search}%";

                    $nested
                        ->where('name', 'like', $like)
                        ->orWhere('email', 'like', $like)
                        ->orWhere('phone', 'like', $like)
                        ->orWhere('unit', 'like', $like);
                });
            })
            ->when(
                array_key_exists($role, config('wbs.roles', [])),
                fn ($query) => $query->where('role', $role)
            )
            ->when(
                $status === 'active',
                fn ($query) => $query->where('is_active', true)
            )
            ->when(
                $status === 'inactive',
                fn ($query) => $query->where('is_active', false)
            )
            ->orderByDesc('is_active')
            ->orderBy('role')
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'data' => [
                'items' => $users->getCollection()->map(fn (User $user) => $this->transformUser($user)),
                'meta' => [
                    'current_page' => $users->currentPage(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'total' => $users->total(),
                    'from' => $users->firstItem(),
                    'to' => $users->lastItem(),
                ],
            ],
        ]);
    }

    #[OA\Get(
        path: '/api/admin/users/{user}',
        operationId: 'showUser',
        summary: 'Get a single user',
        description: 'Returns a single directory record for the selected user. This endpoint is restricted to the system administrator.',
        tags: ['Administration'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'User record returned.', content: new OA\JsonContent(ref: '#/components/schemas/UserRecordResponse')),
            new OA\Response(response: 403, description: 'System administrator access required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 404, description: 'User not found.', content: new OA\JsonContent(ref: '#/components/schemas/NotFoundResponse')),
        ]
    )]
    public function show(Request $request, User $user): JsonResponse
    {
        $this->authorizeSystemAdministrator($request);

        return response()->json([
            'data' => $this->transformUser($user),
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

    #[OA\Patch(
        path: '/api/admin/users/{user}',
        operationId: 'updateUser',
        summary: 'Edit an existing user',
        description: 'Updates editable profile fields, status, and optional password for an existing user.',
        tags: ['Administration'],
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(required: true, content: new OA\JsonContent(ref: '#/components/schemas/UpdateUserRequest')),
        parameters: [
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'User updated.', content: new OA\JsonContent(ref: '#/components/schemas/UserMutationResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $administrator = $this->authorizeSystemAdministrator($request);
        $nextIsActive = $request->boolean('is_active');

        $this->guardStatusMutation($administrator, $user, $nextIsActive);

        $payload = [
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'phone' => $request->string('phone')->toString(),
            'unit' => $user->hasRole(User::ROLE_REPORTER)
                ? 'Reporter'
                : ($request->string('unit')->toString() ?: null),
            'is_active' => $nextIsActive,
        ];

        if ($request->filled('password')) {
            $payload['password'] = $request->string('password')->toString();
        }

        $user->forceFill($payload)->save();

        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        return response()->json([
            'message' => 'User updated successfully.',
            'data' => $this->transformUser($user->fresh()),
        ]);
    }

    #[OA\Patch(
        path: '/api/admin/users/{user}/deactivate',
        operationId: 'deactivateUser',
        summary: 'Deactivate a user',
        description: 'Marks a user account as inactive and revokes existing API tokens.',
        tags: ['Administration'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'User deactivated.', content: new OA\JsonContent(ref: '#/components/schemas/UserMutationResponse')),
            new OA\Response(response: 422, description: 'Mutation blocked.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function deactivate(Request $request, User $user): JsonResponse
    {
        $administrator = $this->authorizeSystemAdministrator($request);

        $this->guardStatusMutation($administrator, $user, false);

        $user->forceFill(['is_active' => false])->save();
        $user->tokens()->delete();

        return response()->json([
            'message' => 'User deactivated successfully.',
            'data' => $this->transformUser($user->fresh()),
        ]);
    }

    #[OA\Delete(
        path: '/api/admin/users/{user}',
        operationId: 'deleteUser',
        summary: 'Delete a user',
        description: 'Deletes a user account when it is safe to remove it from the directory.',
        tags: ['Administration'],
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(name: 'user', in: 'path', required: true, schema: new OA\Schema(type: 'integer')),
        ],
        responses: [
            new OA\Response(response: 200, description: 'User deleted.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 422, description: 'Mutation blocked.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function destroy(Request $request, User $user): JsonResponse
    {
        $administrator = $this->authorizeSystemAdministrator($request);

        abort_if(
            $administrator->is($user),
            422,
            'You cannot delete your own account.'
        );

        abort_if(
            $user->hasRole(User::ROLE_SYSTEM_ADMINISTRATOR)
                && $this->activeSystemAdministratorCount($user->id) === 0,
            422,
            'At least one active system administrator must remain.'
        );

        abort_if(
            $this->hasActiveWorkflowResponsibilities($user),
            422,
            'User is assigned to active workflow cases. Reassign or complete those cases before deletion.'
        );

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => 'User deleted successfully.',
        ]);
    }

    private function authorizeSystemAdministrator(Request $request): User
    {
        $user = $request->user();

        abort_unless(
            $user?->hasRole(User::ROLE_SYSTEM_ADMINISTRATOR),
            403,
            'Only the system administrator may manage internal users.'
        );

        return $user;
    }

    private function guardStatusMutation(User $administrator, User $target, bool $nextIsActive): void
    {
        if ($target->is_active && ! $nextIsActive && $administrator->is($target)) {
            abort(422, 'You cannot deactivate your own account.');
        }

        if (
            $target->is_active
            && ! $nextIsActive
            && $target->hasRole(User::ROLE_SYSTEM_ADMINISTRATOR)
            && $this->activeSystemAdministratorCount($target->id) === 0
        ) {
            abort(422, 'At least one active system administrator must remain.');
        }

        if (
            $target->is_active
            && ! $nextIsActive
            && $this->hasActiveWorkflowResponsibilities($target)
        ) {
            abort(422, 'User is assigned to active workflow cases. Reassign or complete those cases before deactivation.');
        }
    }

    private function activeSystemAdministratorCount(?int $excludingUserId = null): int
    {
        return User::query()
            ->where('role', User::ROLE_SYSTEM_ADMINISTRATOR)
            ->where('is_active', true)
            ->when($excludingUserId, fn ($query) => $query->whereKeyNot($excludingUserId))
            ->count();
    }

    private function hasActiveWorkflowResponsibilities(User $user): bool
    {
        if (! $user->isInternalUser()) {
            return false;
        }

        return CaseFile::query()
            ->where('stage', '!=', 'completed')
            ->where(function ($query) use ($user) {
                $query
                    ->where('verification_supervisor_id', $user->id)
                    ->orWhere('verificator_id', $user->id)
                    ->orWhere('investigation_supervisor_id', $user->id)
                    ->orWhere('investigator_id', $user->id)
                    ->orWhere('director_id', $user->id);
            })
            ->exists();
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
