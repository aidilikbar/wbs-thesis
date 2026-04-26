<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Sanctum::getAccessTokenFromRequestUsing(function (Request $request): string {
            return (string) (
                $request->bearerToken()
                ?: trim((string) $request->cookie(config('wbs.auth.session_cookie', 'kpk_wbs_session')))
            );
        });

        RateLimiter::for('public-login', function (Request $request): Limit {
            return Limit::perMinute(5)->by(sprintf(
                'login|%s|%s',
                $request->ip(),
                strtolower((string) $request->input('email', 'guest'))
            ));
        });

        RateLimiter::for('public-register', function (Request $request): Limit {
            return Limit::perMinute(3)->by(sprintf(
                'register|%s',
                $request->ip()
            ));
        });

        RateLimiter::for('public-tracking', function (Request $request): Limit {
            return Limit::perMinute(15)->by(sprintf(
                'tracking|%s',
                $request->ip()
            ));
        });
    }
}
