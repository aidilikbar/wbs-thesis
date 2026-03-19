<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterReporterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/auth/register',
        operationId: 'registerReporter',
        summary: 'Register a reporter account',
        description: 'Creates a reporter account and returns a bearer token session for immediate access.',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/ReporterRegistrationRequest')
        ),
        responses: [
            new OA\Response(response: 201, description: 'Reporter registered successfully.', content: new OA\JsonContent(ref: '#/components/schemas/AuthSessionResponse')),
            new OA\Response(response: 422, description: 'Validation failed.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function registerReporter(RegisterReporterRequest $request): JsonResponse
    {
        $user = User::query()->create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'phone' => $request->string('phone')->toString(),
            'role' => User::ROLE_REPORTER,
            'unit' => 'Reporter',
            'is_active' => true,
            'password' => $request->string('password')->toString(),
        ]);

        return response()->json([
            'message' => 'Reporter account registered successfully.',
            'data' => $this->sessionPayload($user),
        ], 201);
    }

    #[OA\Post(
        path: '/api/auth/login',
        operationId: 'login',
        summary: 'Login with an existing account',
        description: 'Authenticates a reporter or internal user and returns a bearer token session.',
        tags: ['Authentication'],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(ref: '#/components/schemas/LoginRequest')
        ),
        responses: [
            new OA\Response(response: 200, description: 'Login successful.', content: new OA\JsonContent(ref: '#/components/schemas/AuthSessionResponse')),
            new OA\Response(response: 422, description: 'Validation failed or credentials were invalid.', content: new OA\JsonContent(ref: '#/components/schemas/ValidationErrorResponse')),
        ]
    )]
    public function login(LoginRequest $request): JsonResponse
    {
        $email = $request->string('email')->toString();
        $password = $request->string('password')->toString();

        $user = User::query()
            ->where('email', $email)
            ->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 422);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'This account is inactive.',
            ], 403);
        }

        return response()->json([
            'message' => 'Login successful.',
            'data' => $this->sessionPayload($user),
        ]);
    }

    #[OA\Get(
        path: '/api/auth/me',
        operationId: 'getCurrentUser',
        summary: 'Get the current authenticated user',
        tags: ['Authentication'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Current user returned.', content: new OA\JsonContent(ref: '#/components/schemas/CurrentUserResponse')),
            new OA\Response(response: 401, description: 'Authentication required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
        ]
    )]
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'data' => [
                'user' => $this->userPayload($request->user()),
            ],
        ]);
    }

    #[OA\Post(
        path: '/api/auth/logout',
        operationId: 'logout',
        summary: 'Logout the current session',
        tags: ['Authentication'],
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(response: 200, description: 'Logout successful.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
            new OA\Response(response: 401, description: 'Authentication required.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
        ]
    )]
    public function logout(Request $request): JsonResponse
    {
        $request->user()?->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }

    private function sessionPayload(User $user): array
    {
        $user->tokens()->delete();

        return [
            'token' => $user->createToken('frontend-session', [$user->role])->plainTextToken,
            'user' => $this->userPayload($user),
        ];
    }

    private function userPayload(?User $user): array
    {
        return [
            'id' => $user?->id,
            'name' => $user?->name,
            'email' => $user?->email,
            'phone' => $user?->phone,
            'role' => $user?->role,
            'role_label' => $user?->role_label,
            'unit' => $user?->unit,
            'is_active' => $user?->is_active,
        ];
    }
}
