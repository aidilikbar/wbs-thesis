<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Testing\TestResponse;

abstract class TestCase extends BaseTestCase
{
    protected function withFrontendSession(TestResponse $response): static
    {
        return $this
            ->withCredentials()
            ->withUnencryptedCookie(
                (string) config('wbs.auth.session_cookie', 'kpk_wbs_session'),
                $this->frontendSessionCookieValue($response),
            );
    }

    protected function frontendSessionCookieValue(TestResponse $response): string
    {
        $cookieName = (string) config('wbs.auth.session_cookie', 'kpk_wbs_session');

        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === $cookieName) {
                return $cookie->getValue();
            }
        }

        $this->fail("Frontend session cookie [{$cookieName}] was not set.");
    }
}
