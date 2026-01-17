<?php

namespace App\Console\Commands;

use App\Jobs\GenerateMonthlyReport;
use Illuminate\Console\Command;

class GenerateReports extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'reports:generate
                          {--month= : Month to generate report for (1-12)}
                          {--year= : Year to generate report for}
                          {--type=comprehensive : Report type (comprehensive, financial, clinical)}
                          {--email= : Email address to send report to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate monthly reports in the background using queued jobs';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $month = $this->option('month') ?: now()->month;
        $year = $this->option('year') ?: now()->year;
        $type = $this->option('type');
        $email = $this->option('email');

        // Validate inputs
        if (!is_numeric($month) || $month < 1 || $month > 12) {
            $this->error('Invalid month. Must be between 1 and 12.');
            return 1;
        }

        if (!is_numeric($year) || $year < 2020 || $year > now()->year + 1) {
            $this->error('Invalid year.');
            return 1;
        }

        $this->info("🔄 Dispatching monthly report generation...");
        $this->line("   Period: {$month}/{$year}");
        $this->line("   Type: {$type}");

        // Dispatch the job
        GenerateMonthlyReport::dispatch(
            (int) $month,
            (int) $year,
            $type,
            null, // user_id
            $email
        );

        $this->info("✅ Report generation job dispatched successfully!");
        $this->line('');
        $this->comment('The report will be generated in the background.');
        $this->comment('Check the logs for progress and completion status.');
        $this->comment('Run "php artisan queue:work --queue=reports" to process the job.');

        return 0;
    }
}
