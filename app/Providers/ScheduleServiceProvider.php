<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Console\Scheduling\Schedule;

class ScheduleServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        if ($this->app->runningInConsole()) {
            $this->scheduleCommands();
        }
    }

    /**
     * Define the application's command schedule.
     */
    protected function scheduleCommands(): void
    {
        $schedule = $this->app->make(Schedule::class);

        // Archive old records monthly
        $schedule->command('archive:old-records')
            ->monthly()
            ->sundays()
            ->at('02:00')
            ->withoutOverlapping()
            ->runInBackground();

        // Database health check weekly
        $schedule->command('db:health-check')
            ->weekly()
            ->sundays()
            ->at('03:00')
            ->withoutOverlapping()
            ->runInBackground();

        // Clear expired cache daily
        $schedule->command('cache:clear-expired')
            ->daily()
            ->at('04:00');
    }
}