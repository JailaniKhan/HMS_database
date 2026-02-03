<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            HandleAppearance::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        $middleware->validateCsrfTokens(except: [
            'api/v1/admin/*',
            'admin/rbac/users/*/role',
        ]);
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        $middleware->alias([
            'check.permission' => \App\Http\Middleware\CheckPermission::class,
            'permission.monitoring' => \App\Http\Middleware\PermissionMonitoringMiddleware::class,
            'permission.ip.restriction' => \App\Http\Middleware\PermissionIpRestrictionMiddleware::class,
            'permission.rate.limit' => \App\Http\Middleware\PermissionRateLimitMiddleware::class,
            'permission.session' => \App\Http\Middleware\PermissionSessionMiddleware::class,
            'rate.limit' => \App\Http\Middleware\RateLimitMiddleware::class,
            'login.throttle' => \App\Http\Middleware\LoginThrottleMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->withSchedule(function ($schedule) {
        // Permission maintenance tasks
        $schedule->command('permission:maintenance --cleanup --health-check')
            ->dailyAt('02:00')
            ->description('Clean up expired permissions and perform health checks');

        // Health checks every 15 minutes
        $schedule->command('permission:maintenance --health-check')
            ->everyFifteenMinutes()
            ->description('Perform permission system health checks');

        // Weekly reports on Sundays
        $schedule->command('permission:maintenance --all')
            ->weeklyOn(0, '03:00')
            ->description('Full permission maintenance including reports');
    })
    ->create();
