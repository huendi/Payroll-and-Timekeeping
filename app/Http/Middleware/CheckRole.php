<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $role
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!auth()->check()) {
            return redirect('/login');
        }

        $roles = explode('|', $role);

        if (!in_array(auth()->user()->role, $roles)) {
            return \Inertia\Inertia::render('errors/403')->toResponse($request)->setStatusCode(403);
        }

        return $next($request);
    }
}
