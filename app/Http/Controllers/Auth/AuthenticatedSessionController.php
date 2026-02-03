<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Sanctum\PersonalAccessToken;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse|JsonResponse
    {
        $request->authenticate();

        $request->session()->regenerate();
        
        $user = Auth::user();
        
        // For API compatibility, also create a Sanctum token for the user
        // This allows the React frontend to make authenticated API requests
        if ($request->wantsJson() || $request->is('api/*')) {
            // Create a Sanctum token for API access
            $token = $user->createToken('web-session', ['*']);
            return response()->json([
                'success' => true,
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'role' => $user->role,
                ],
                'token' => $token->plainTextToken,
            ]);
        }
        
        // Redirect based on user permissions and role
        if ($user->isSuperAdmin()) {
            // Super admin (Hospital Admin) goes to main dashboard
            return redirect()->intended(route('dashboard.redirect', absolute: false));
        } elseif ($user->hasPermission('view-pharmacy')) {
            // Sub-admin with pharmacy permissions
            return redirect()->intended('/pharmacy/medicines');
        } elseif ($user->hasPermission('view-laboratory')) {
            // Sub-admin with laboratory permissions
            return redirect()->intended('/laboratory/lab-tests');
        } elseif ($user->hasPermission('view-appointments')) {
            // Sub-admin with appointments permissions
            return redirect()->intended('/appointments');
        } elseif ($user->hasPermission('view-billing')) {
            // Sub-admin with billing permissions
            return redirect()->intended('/billing');
        } elseif ($user->hasPermission('view-dashboard')) {
            // Any user with dashboard permission
            return redirect()->intended(route('dashboard.redirect', absolute: false));
        } else {
            // Default fallback for users without specific permissions
            return redirect()->intended(route('dashboard.redirect', absolute: false));
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();

        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}