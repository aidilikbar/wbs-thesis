<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterReporterRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;
use OpenApi\Attributes as OA;

class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/auth/register',
        operationId: 'registerReporter',
        summary: 'Register a reporter account',
        description: 'Creates a reporter account and starts an authenticated frontend session.',
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

        return $this->authenticatedResponse(
            user: $user,
            message: 'Reporter account registered successfully.',
            status: 201,
        );
    }

    #[OA\Post(
        path: '/api/auth/login',
        operationId: 'login',
        summary: 'Login with an existing account',
        description: 'Authenticates a reporter or internal user and starts an authenticated frontend session.',
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

        return $this->authenticatedResponse(
            user: $user,
            message: 'Login successful.',
        );
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
        responses: [
            new OA\Response(response: 200, description: 'Logout successful.', content: new OA\JsonContent(ref: '#/components/schemas/MessageResponse')),
        ]
    )]
    public function logout(Request $request): JsonResponse
    {
        $this->revokeFrontendSession($request);

        return $this->expireSessionCookie(response()->json([
            'message' => 'Logout successful.',
        ]));
    }

    private function authenticatedResponse(
        User $user,
        string $message,
        int $status = 200,
    ): JsonResponse
    {
        $token = $this->issueFrontendSessionToken($user);

        return $this->attachSessionCookie(
            response()->json([
                'message' => $message,
                'data' => [
                    'user' => $this->userPayload($user),
                ],
            ], $status),
            $token,
        );
    }

    private function issueFrontendSessionToken(User $user): string
    {
        $user->tokens()->delete();

        return $user->createToken('frontend-session', [$user->role])->plainTextToken;
    }

    private function revokeFrontendSession(Request $request): void
    {
        $request->user()?->currentAccessToken()?->delete();

        $cookieToken = trim((string) $request->cookie($this->frontendSessionCookieName()));

        if ($cookieToken !== '') {
            PersonalAccessToken::findToken($cookieToken)?->delete();
        }
    }

    private function attachSessionCookie(JsonResponse $response, string $token): JsonResponse
    {
        return $response->cookie(
            $this->frontendSessionCookieName(),
            $token,
            $this->frontendSessionCookieLifetime(),
            '/',
            $this->frontendSessionCookieDomain(),
            $this->frontendSessionCookieSecure(),
            true,
            false,
            $this->frontendSessionCookieSameSite(),
        );
    }

    private function expireSessionCookie(JsonResponse $response): JsonResponse
    {
        return $response->cookie(
            $this->frontendSessionCookieName(),
            '',
            -2628000,
            '/',
            $this->frontendSessionCookieDomain(),
            $this->frontendSessionCookieSecure(),
            true,
            false,
            $this->frontendSessionCookieSameSite(),
        );
    }

    private function frontendSessionCookieName(): string
    {
        return (string) config('wbs.auth.session_cookie', 'kpk_wbs_session');
    }

    private function frontendSessionCookieLifetime(): int
    {
        return (int) config('wbs.auth.cookie_lifetime_minutes', 120);
    }

    private function frontendSessionCookieDomain(): ?string
    {
        $domain = config('wbs.auth.cookie_domain');

        return is_string($domain) && $domain !== '' ? $domain : null;
    }

    private function frontendSessionCookieSecure(): bool
    {
        return (bool) config('wbs.auth.cookie_secure', false);
    }

    private function frontendSessionCookieSameSite(): ?string
    {
        $sameSite = config('wbs.auth.cookie_same_site');

        return is_string($sameSite) && $sameSite !== '' ? $sameSite : null;
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
            'unit' => $user?->operationalUnit(),
            'is_active' => $user?->is_active,
        ];
    }
}
