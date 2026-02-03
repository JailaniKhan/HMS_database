<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Log;
use App\Services\RBACService;

class EnsureSegregationOfDuties
{
    protected $rbacService;

    public function __construct(RBACService $rbacService)
    {
        $this->rbacService = $rbacService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return $next($request);
        }

        // Skip for super admin
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        // Check segregation of duties violations
        $violations = $this->rbacService->checkSegregationViolations($user->id);
        
        if (!empty($violations)) {
            Log::alert('Segregation of duties violation detected', [
                'user_id' => $user->id,
                'violations' => $violations,
                'ip' => $request->ip(),
                'url' => $request->fullUrl(),
            ]);
            
            // Depending on severity, either log warning or block access
            foreach ($violations as $violation) {
                if ($violation['severity'] === 'critical') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Segregation of duties violation prevents access',
                        'violation' => $violation,
                    ], 403);
                }
            }
            
            // For non-critical violations, just log and continue
            Log::warning('Non-critical segregation violation', [
                'user_id' => $user->id,
                'violations' => $violations,
            ]);
        }

        return $next($request);
    }
}
