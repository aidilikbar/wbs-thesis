<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestrictApiDocumentation
{
    public function handle(Request $request, Closure $next): Response
    {
        if (
            app()->environment(['local', 'testing'])
            || (bool) config('wbs.api_documentation.enabled', false)
        ) {
            return $next($request);
        }

        abort(404);
    }
}
